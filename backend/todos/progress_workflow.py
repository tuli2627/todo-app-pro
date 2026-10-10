import json
import math
from collections import defaultdict
from datetime import timedelta
from decimal import Decimal, InvalidOperation
from django.db import IntegrityError
from django.db.models import Q

from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import connection, transaction
from django.utils import timezone
from django.utils.dateparse import parse_date
from rest_framework import status
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from auth.models import T001UserMaster
from auth.workflow_auth import WorkflowJWTAuthentication
from .models import (
    FieldProgressReport,
    M001State,
    M002Circle,
    M003Division,
    M004Range,
    SilviculturistAssessment,
    WorkflowTechnicalRecommendation,
)
from .workflow import (
    MODULES,
    SILVICULTURIST_MODULES,
    _actor_id,
    _scope_for,
    _technical_review_history_complete,
)


REPORT_SITE_MODULES = ("spa", "seed-orchard", "nursery", "research-institute", "processing-unit")
GPS_RADIUS_METERS = 100
MAX_GPS_ACCURACY_METERS = 200
MAX_PHOTO_BYTES = 8 * 1024 * 1024

SITE_SPECIES_QUERIES = {
    "spa": (
        """
        SELECT site.SPA_ID, species.Species_Name
        FROM dbo.T005_SPA AS site
        JOIN dbo.M007_Species AS species
          ON TRY_CONVERT(bigint, site.SPA_Species) = species.Species_ID
          OR LTRIM(RTRIM(site.SPA_Species)) = species.Species_Name
        WHERE site.SPA_ID IN ({placeholders})
          AND species.Species_Active = 'Y'
        """,
        1,
    ),
    "seed-orchard": (
        """
        SELECT site.SO_ID, species.Species_Name
        FROM dbo.T006_SO AS site
        JOIN dbo.M007_Species AS species
          ON site.SO_Species_ID = species.Species_ID
        WHERE site.SO_ID IN ({placeholders})
          AND species.Species_Active = 'Y'
        """,
        1,
    ),
    "nursery": (
        """
        SELECT related.Nursery_ID, species.Species_Name
        FROM (
            SELECT ND_Nursery_ID AS Nursery_ID, ND_Species_ID AS Species_ID
            FROM dbo.T010_Nursery_Distribution
            WHERE ND_Nursery_ID IN ({placeholders}) AND ND_Active IN ('Y', '1')
            UNION
            SELECT PP_Nursery_ID AS Nursery_ID, PP_Species_ID AS Species_ID
            FROM dbo.T013_Plant_Produced
            WHERE PP_Nursery_ID IN ({placeholders}) AND PP_Active IN ('Y', '1')
        ) AS related
        JOIN dbo.M007_Species AS species ON species.Species_ID = related.Species_ID
        WHERE species.Species_Active = 'Y'
        """,
        2,
    ),
    "processing-unit": (
        """
        SELECT related.PTU_ID, species.Species_Name
        FROM (
            SELECT PU_PTU_ID AS PTU_ID, PU_Species_ID AS Species_ID
            FROM dbo.T009_PU
            WHERE PU_PTU_ID IN ({placeholders}) AND PU_Active IN ('Y', '1')
            UNION
            SELECT ND_PU_ID AS PTU_ID, ND_Species_ID AS Species_ID
            FROM dbo.T010_Nursery_Distribution
            WHERE ND_PU_ID IN ({placeholders}) AND ND_Active IN ('Y', '1')
        ) AS related
        JOIN dbo.M007_Species AS species ON species.Species_ID = related.Species_ID
        WHERE species.Species_Active = 'Y'
        """,
        2,
    ),
}


def _current_period(today=None):
    today = today or timezone.localdate()
    if today.month <= 6:
        return today.replace(month=1, day=1), today.replace(month=6, day=30)
    return today.replace(month=7, day=1), today.replace(month=12, day=31)


def _previous_period(start):
    if start.month == 1:
        return start.replace(year=start.year - 1, month=7, day=1), start.replace(
            year=start.year - 1, month=12, day=31
        )
    return start.replace(month=1, day=1), start.replace(month=6, day=30)


def _requested_period(request, *, allow_previous=True):
    current = _current_period()
    previous = _previous_period(current[0])
    start_value = request.data.get("period_start") or request.query_params.get("period_start")
    end_value = request.data.get("period_end") or request.query_params.get("period_end")
    if not start_value and not end_value:
        return current
    start = parse_date(str(start_value or ""))
    end = parse_date(str(end_value or ""))
    allowed = [current, previous] if allow_previous else [current]
    if not start or not end or start > end or (start, end) not in allowed:
        raise ValidationError({"period": "Select the current or immediately preceding six-month period."})
    return start, end


def _comparison_data(report, previous):
    if previous is None:
        return {"available": False}
    metrics = (
        "planted_last_3_months",
        "plants_alive",
        "plants_dead",
        "seedlings_produced",
        "seedlings_available",
        "seedlings_distributed",
    )
    previous_species = json.loads(previous.species_details)
    previous_by_name = {
        str(item.get("species", "")).strip().casefold(): item
        for item in previous_species
        if isinstance(item, dict)
    }
    species_changes = []
    for item in json.loads(report.species_details):
        if not isinstance(item, dict):
            continue
        old = previous_by_name.get(str(item.get("species", "")).strip().casefold())
        changes = {}
        if old:
            for field in ("plant_count", "alive", "dead", "height_cm", "girth_cm", "growth_since_last_cm"):
                try:
                    delta = Decimal(str(item[field])) - Decimal(str(old[field]))
                except (KeyError, InvalidOperation, TypeError, ValueError):
                    continue
                changes[field] = int(delta) if delta == delta.to_integral_value() else float(delta)
        species_changes.append({
            "species": item.get("species", ""),
            "previous_available": old is not None,
            "changes": changes,
        })
    return {
        "available": True,
        "period_start": previous.period_start,
        "period_end": previous.period_end,
        "previous_report_id": previous.id,
        "changes": {
            field: getattr(report, field) - getattr(previous, field)
            for field in metrics
        },
        "previous_species_details": json.loads(previous.species_details),
        "species_changes": species_changes,
    }


def _distance_meters(latitude_a, longitude_a, latitude_b, longitude_b):
    radius = 6_371_000
    lat_a, lat_b = math.radians(float(latitude_a)), math.radians(float(latitude_b))
    delta_lat = lat_b - lat_a
    delta_lon = math.radians(float(longitude_b) - float(longitude_a))
    value = (
        math.sin(delta_lat / 2) ** 2
        + math.cos(lat_a) * math.cos(lat_b) * math.sin(delta_lon / 2) ** 2
    )
    value = min(1, max(0, value))
    return radius * 2 * math.atan2(math.sqrt(value), math.sqrt(1 - value))


def _decimal(value, field, *, minimum=None, maximum=None):
    try:
        result = Decimal(str(value))
    except (InvalidOperation, TypeError, ValueError):
        raise ValidationError({field: "Enter a valid number."})
    if not result.is_finite():
        raise ValidationError({field: "Enter a finite number."})
    if minimum is not None and result < minimum:
        raise ValidationError({field: f"Value must be at least {minimum}."})
    if maximum is not None and result > maximum:
        raise ValidationError({field: f"Value must be no more than {maximum}."})
    return result


def _report_photo(request, *, required):
    photo = request.FILES.get("field_photo")
    if photo is None:
        if required:
            raise ValidationError({"field_photo": "Capture and attach a current site photo."})
        return None
    if photo.size <= 0 or photo.size > MAX_PHOTO_BYTES:
        raise ValidationError({"field_photo": "The photo must be between 1 byte and 8 MB."})
    photo.seek(0)
    signature = photo.read(12)
    photo.seek(0)
    image_signatures = (
        signature.startswith(b"\xff\xd8\xff"),
        signature.startswith(b"\x89PNG\r\n\x1a\n"),
        signature.startswith(b"RIFF") and signature[8:12] == b"WEBP",
    )
    if not any(image_signatures):
        raise ValidationError({"field_photo": "Use a JPEG, PNG, or WebP image."})
    return photo


def _int_or_none(value):
    if isinstance(value, bool):
        return None
    try:
        return int(value) if value is not None else None
    except (TypeError, ValueError):
        return None


def _range_division_id(user):
    division_id = _int_or_none(user.scope.get("division_id"))
    if division_id:
        return division_id
    range_id = _int_or_none(user.scope.get("range_id"))
    if not range_id:
        return None
    return M004Range.objects.filter(range_id=range_id).values_list(
        "range_division_id", flat=True
    ).first()


def _location_names(scope):
    result = {
        "state_name": "",
        "circle_name": "",
        "division_name": "",
        "range_name": "",
    }
    if scope["state_id"]:
        result["state_name"] = M001State.objects.filter(
            state_id=scope["state_id"]
        ).values_list("state_name", flat=True).first() or ""
    if scope["circle_id"]:
        result["circle_name"] = M002Circle.objects.filter(
            circle_id=scope["circle_id"]
        ).values_list("circle_name", flat=True).first() or ""
    if scope["division_id"]:
        result["division_name"] = M003Division.objects.filter(
            division_id=scope["division_id"]
        ).values_list("division_name", flat=True).first() or ""
    if scope["range_id"]:
        result["range_name"] = M004Range.objects.filter(
            range_id=scope["range_id"]
        ).values_list("range_name", flat=True).first() or ""
    return result


def _site_record(user, module, record_id):
    definition = MODULES[module]
    where, params = _scope_for(user, definition)
    columns = definition["columns"]
    with connection.cursor() as cursor:
        cursor.execute(
            f"SELECT {', '.join(columns)} FROM dbo.{definition['table']} "
            f"WHERE {where} AND {definition['primary_key']} = %s",
            [*params, record_id],
        )
        row = cursor.fetchone()
    if row is None:
        raise PermissionDenied("The selected site is not in your current jurisdiction.")
    record = dict(zip(columns, row))
    active = record.get(definition["active_column"])
    if active not in (None, "Y", "1", 1, True):
        raise ValidationError("Progress reports can only be submitted for active sites.")
    latitude_column = f"{definition['prefix']}_Latitude"
    longitude_column = f"{definition['prefix']}_Longitude"
    try:
        latitude = Decimal(str(record[latitude_column]))
        longitude = Decimal(str(record[longitude_column]))
    except (KeyError, InvalidOperation, TypeError, ValueError):
        raise ValidationError("This site has no valid registered GPS coordinates.")
    if not (-90 <= latitude <= 90 and -180 <= longitude <= 180):
        raise ValidationError("This site has no valid registered GPS coordinates.")
    name_column = next(
        (column for column in columns if column.endswith("_Name")),
        None,
    )
    record_id_column = definition["primary_key"]
    names = _location_names({
        "state_id": record.get(definition["state_column"]),
        "circle_id": record.get(definition["circle_column"]),
        "division_id": record.get(definition["division_column"]),
        "range_id": record.get(definition["range_column"]),
    })
    return {
        "name": record.get(name_column) if name_column else None,
        "record_id": record[record_id_column],
        "latitude": latitude,
        "longitude": longitude,
        "scope": {
            key: record.get(definition[f"{key.split('_')[0]}_column"])
            if definition.get(f"{key.split('_')[0]}_column") in columns
            else None
            for key in ("state_id", "circle_id", "division_id", "range_id")
        },
        "names": names,
    }


def _validate_photo_coordinates(request, site, *, required=True):
    latitude = _decimal(
        request.data.get("captured_latitude"),
        "captured_latitude",
        minimum=Decimal("-90"),
        maximum=Decimal("90"),
    )
    longitude = _decimal(
        request.data.get("captured_longitude"),
        "captured_longitude",
        minimum=Decimal("-180"),
        maximum=Decimal("180"),
    )
    accuracy = _decimal(
        request.data.get("gps_accuracy_m"),
        "gps_accuracy_m",
        minimum=Decimal("0"),
        maximum=Decimal(str(MAX_GPS_ACCURACY_METERS)),
    )
    distance = _distance_meters(
        site["latitude"], site["longitude"], latitude, longitude
    )
    photo = _report_photo(request, required=required)
    return latitude, longitude, accuracy, Decimal(str(round(distance, 2))), photo


def _json_text(value, field_name, *, expected):
    if isinstance(value, str):
        try:
            value = json.loads(value)
        except json.JSONDecodeError as error:
            raise ValidationError({field_name: "Enter valid JSON data."}) from error
    if not isinstance(value, expected):
        raise ValidationError({field_name: "Submit the expected structured data."})
    return json.dumps(value, ensure_ascii=False)


def _file_url(request, field_file):
    if not field_file:
        return None
    url = field_file.url
    return request.build_absolute_uri(url) if request else url


def _report_dict(report, request=None, *, include_assessments=False):
    assessments = sorted(
        report.technical_assessments.all(),
        key=lambda assessment: (assessment.created_at, assessment.id),
    )
    result = {
        "id": report.id,
        "period_start": report.period_start,
        "period_end": report.period_end,
        "site_module": report.site_module,
        "site_record_id": report.site_record_id,
        "site_name": report.site_name,
        "scope": {
            "state_id": report.state_id,
            "state_name": report.state_name,
            "circle_id": report.circle_id,
            "circle_name": report.circle_name,
            "division_id": report.division_id,
            "division_name": report.division_name,
            "range_id": report.range_id,
            "range_name": report.range_name,
        },
        "submitted_by": {
            "id": report.submitted_by,
            "name": report.submitted_by_name,
            "role": report.reporter_role,
        },
        "site_location": {
            "latitude": report.site_latitude,
            "longitude": report.site_longitude,
            "captured_latitude": report.captured_latitude,
            "captured_longitude": report.captured_longitude,
            "gps_accuracy_m": report.gps_accuracy_m,
            "distance_m": report.site_distance_m,
        },
        "inspection_date": report.inspection_date,
        "species_details": json.loads(report.species_details),
        "planted_last_3_months": report.planted_last_3_months,
        "plants_alive": report.plants_alive,
        "plants_dead": report.plants_dead,
        "seedlings_produced": report.seedlings_produced,
        "seedlings_available": report.seedlings_available,
        "seedlings_distributed": report.seedlings_distributed,
        "seed_source": report.seed_source,
        "seed_quantity_kg": report.seed_quantity_kg,
        "seed_collection_date": report.seed_collection_date,
        "issues": json.loads(report.issues) if report.issues else [],
        "field_photo": _file_url(request, report.field_photo),
        "created_at": report.created_at,
        "latest_assessment": None,
    }
    if include_assessments:
        result["assessments"] = [_assessment_dict(item, request) for item in assessments]
    latest = assessments[-1] if assessments else None
    if latest:
        result["latest_assessment"] = {
            "id": latest.id,
            "assessed_by": latest.assessed_by_name,
            "category": latest.category,
            "created_at": latest.created_at,
        }
    return result


def _assessment_dict(assessment, request=None):
    return {
        "id": assessment.id,
        "assessed_by": assessment.assessed_by_name,
        "category": assessment.category,
        "reasons": assessment.reasons,
        "recommendations": assessment.recommendations,
        "scientific_assessment": assessment.scientific_assessment,
        "field_inspection": assessment.field_inspection,
        "captured_latitude": assessment.captured_latitude,
        "captured_longitude": assessment.captured_longitude,
        "gps_accuracy_m": assessment.gps_accuracy_m,
        "distance_m": assessment.site_distance_m,
        "field_photo": _file_url(request, assessment.field_photo),
        "created_at": assessment.created_at,
    }


def _validated_assessment_data(request, user, site):
    category = request.data.get("category")
    if not isinstance(category, str) or category not in {
        "satisfactory", "needs_improvement", "critical"
    }:
        raise ValidationError({"category": "Select a valid technical assessment category."})
    reasons = request.data.get("reasons")
    recommendations = request.data.get("recommendations")
    scientific_assessment = request.data.get("scientific_assessment", "")
    if not isinstance(reasons, str) or not reasons.strip():
        raise ValidationError({"reasons": "Explain the technical assessment."})
    if not isinstance(recommendations, str) or not recommendations.strip():
        raise ValidationError({"recommendations": "Provide scientific recommendations."})
    if not isinstance(scientific_assessment, str):
        raise ValidationError({"scientific_assessment": "Enter text for scientific findings."})
    if any(len(value) > 8000 for value in (reasons, recommendations, scientific_assessment)):
        raise ValidationError("Technical report fields cannot exceed 8,000 characters.")
    field_inspection = str(request.data.get("field_inspection", "")).lower() in {
        "true", "1", "yes"
    }
    proof = {}
    if field_inspection:
        if site.get("latitude") is None or site.get("longitude") is None:
            raise ValidationError({
                "field_inspection": "This site has no registered coordinates for GPS verification."
            })
        latitude, longitude, accuracy, distance, photo = _validate_photo_coordinates(
            request,
            {"latitude": site["latitude"], "longitude": site["longitude"]},
        )
        proof = {
            "captured_latitude": latitude,
            "captured_longitude": longitude,
            "gps_accuracy_m": accuracy,
            "site_distance_m": distance,
            "field_photo": photo,
        }
    actor_id = _actor_id(user)
    if not actor_id or not T001UserMaster.objects.filter(id=actor_id, level_id=5).exists():
        raise PermissionDenied("Your Silviculturist account is not linked to a valid workflow identity.")
    return {
        "assessed_by": actor_id,
        "assessed_by_name": user.name or str(user),
        "category": category,
        "reasons": reasons.strip(),
        "recommendations": recommendations.strip(),
        "scientific_assessment": scientific_assessment.strip(),
        "field_inspection": field_inspection,
        **proof,
    }


def _visible_reports(user):
    reports = FieldProgressReport.objects.all()
    scope = user.scope
    if user.role != "national":
        state_id = _int_or_none(scope.get("state_id"))
        if not state_id:
            raise PermissionDenied("Your account has no valid state mapping.")
        reports = reports.filter(state_id=state_id)
    if user.role == "circle":
        circle_id = _int_or_none(scope.get("circle_id"))
        if not circle_id:
            raise PermissionDenied("Your account has no valid circle mapping.")
        reports = reports.filter(circle_id=circle_id)
    elif user.role == "dfo":
        division_id = _int_or_none(scope.get("division_id"))
        if not division_id:
            raise PermissionDenied("Your account has no valid division mapping.")
        reports = reports.filter(division_id=division_id)
    elif user.role == "ro":
        range_id = _int_or_none(scope.get("range_id"))
        if not range_id:
            raise PermissionDenied("Your account has no valid range mapping.")
        reports = reports.filter(state_id=state_id)
        division_id = _range_division_id(user)
        if division_id:
            reports = reports.filter(division_id=division_id)
        else:
            raise PermissionDenied("Your account has no valid division mapping.")
        reports = reports.filter(
            Q(range_id=range_id)
            | Q(range_id__isnull=True, submitted_by=_actor_id(user))
        )
    elif user.role == "silviculturist":
        if not state_id:
            raise PermissionDenied("Your account has no valid state mapping.")
        if scope.get("division_id"):
            reports = reports.filter(division_id=_int_or_none(scope.get("division_id")))
        elif scope.get("circle_id"):
            reports = reports.filter(circle_id=_int_or_none(scope.get("circle_id")))
    return reports


def _site_species_by_module(module, record_ids):
    query_config = SITE_SPECIES_QUERIES.get(module)
    if not query_config or not record_ids:
        return {}
    query_template, parameter_repeats = query_config
    species_by_site = defaultdict(set)
    for offset in range(0, len(record_ids), 900):
        batch = record_ids[offset:offset + 900]
        placeholders = ", ".join(["%s"] * len(batch))
        query = query_template.format(placeholders=placeholders)
        params = batch * parameter_repeats
        with connection.cursor() as cursor:
            cursor.execute(query, params)
            for record_id, species_name in cursor.fetchall():
                if species_name and str(species_name).strip():
                    species_by_site[record_id].add(str(species_name).strip())
    return {
        record_id: sorted(names, key=str.casefold)
        for record_id, names in species_by_site.items()
    }


def _scoped_sites(
    user,
    *,
    include_technical_review=False,
    include_species=False,
    approved_only=False,
):
    sites = []
    for module in REPORT_SITE_MODULES:
        definition = MODULES[module]
        where, params = _scope_for(user, definition)
        id_column = definition["primary_key"]
        name_column = next(
            (column for column in definition["columns"] if column.endswith("_Name")),
            None,
        )
        selected = [id_column]
        selected.append(name_column or id_column)
        for column in (
            definition["state_column"],
            definition["circle_column"],
            definition["division_column"],
            definition["range_column"],
            f"{definition['prefix']}_Latitude",
            f"{definition['prefix']}_Longitude",
        ):
            selected.append(column if column in definition["columns"] else None)
        approval_column = (
            definition["approval_column"]
            if include_technical_review and module in SILVICULTURIST_MODULES
            else None
        )
        selected.append(
            approval_column if approval_column in definition["columns"] else None
        )
        if include_technical_review:
            status_column = definition["status_column"]
            selected.append(
                status_column if status_column in definition["columns"] else None
            )
        expressions = [column if column else "NULL" for column in selected]
        active_filter = (
            f" AND {definition['active_column']} IN ('Y', '1')"
            if definition["active_column"] in definition["columns"]
            else ""
        )
        approval_filter = (
            f" AND {definition['status_column']} = 'A'"
            if approved_only
            else ""
        )
        with connection.cursor() as cursor:
            cursor.execute(
                f"SELECT {', '.join(expressions)} FROM dbo.{definition['table']} "
                f"WHERE {where}{active_filter}{approval_filter}",
                params,
            )
            rows = cursor.fetchall()
        for row in rows:
            site = {
                "module": module,
                "record_id": row[0],
                "name": row[1] or f"{module} #{row[0]}",
                "state_id": row[2],
                "circle_id": row[3],
                "division_id": row[4],
                "range_id": row[5],
                "latitude": row[6],
                "longitude": row[7],
            }
            if include_technical_review:
                site["_technical_approval_id"] = row[8]
                site["_workflow_status"] = row[9]
            sites.append(site)
        if include_species:
            species_by_site = _site_species_by_module(
                module,
                [site["record_id"] for site in sites if site["module"] == module],
            )
            for site in sites:
                if site["module"] == module:
                    site["species"] = species_by_site.get(site["record_id"], [])
    lookups = (
        ("state", M001State, "state_id", "state_name"),
        ("circle", M002Circle, "circle_id", "circle_name"),
        ("division", M003Division, "division_id", "division_name"),
        ("range", M004Range, "range_id", "range_name"),
    )
    for prefix, model, id_field, name_field in lookups:
        ids = {site[f"{prefix}_id"] for site in sites if site[f"{prefix}_id"] is not None}
        names = dict(model.objects.filter(**{f"{id_field}__in": ids}).values_list(id_field, name_field)) if ids else {}
        for site in sites:
            site[f"{prefix}_name"] = names.get(site[f"{prefix}_id"], "")
    if include_technical_review:
        _add_technical_review_status(sites)
    return sites


def _add_technical_review_status(sites):
    grouped_sites = defaultdict(list)
    for site in sites:
        module = site["module"]
        site["technical_review_required"] = module in SILVICULTURIST_MODULES
        site["technical_review_complete"] = not site["technical_review_required"]
        if site["technical_review_required"]:
            grouped_sites[module].append(site)

    for module, module_sites in grouped_sites.items():
        history_by_record = defaultdict(list)
        record_ids = [site["record_id"] for site in module_sites]
        for offset in range(0, len(record_ids), 900):
            recommendations = WorkflowTechnicalRecommendation.objects.filter(
                module=module,
                record_id__in=record_ids[offset:offset + 900],
            ).order_by("record_id", "id").values(
                "record_id", "requested_fields", "addressed_at"
            )
            for recommendation in recommendations:
                history_by_record[recommendation["record_id"]].append(recommendation)

        for site in module_sites:
            history = history_by_record.get(site["record_id"], [])
            is_legacy_approved_record = bool(
                site.get("_workflow_status") == "A"
                and site.get("_technical_approval_id") is not None
                and not history
            )
            site["technical_review_exempt"] = is_legacy_approved_record
            site["technical_review_required"] = not is_legacy_approved_record
            site["technical_review_complete"] = bool(
                is_legacy_approved_record
                or (
                    site.get("_technical_approval_id") is not None
                    and _technical_review_history_complete(history)
                )
            )

    for site in sites:
        site.pop("_technical_approval_id", None)
        site.pop("_workflow_status", None)


def _pending_technical_reviews(user):
    return [
        site
        for site in _scoped_sites(user, include_technical_review=True)
        if site["technical_review_required"] and not site["technical_review_complete"]
    ]


def _site_assessment_keys(sites, start, end):
    assessed = set()
    for module in REPORT_SITE_MODULES:
        record_ids = [
            site["record_id"] for site in sites if site["module"] == module
        ]
        for offset in range(0, len(record_ids), 900):
            assessed.update(
                (module, record_id)
                for record_id in SilviculturistAssessment.objects.filter(
                    report__isnull=True,
                    site_module=module,
                    site_record_id__in=record_ids[offset:offset + 900],
                    created_at__date__gte=start,
                    created_at__date__lte=end,
                ).values_list("site_record_id", flat=True)
            )
    return assessed


def _period_completion(user, start, end):
    sites = (
        _scoped_sites(user, include_technical_review=True)
        if user.role in {"ro", "silviculturist"}
        else []
    )
    reports = _visible_reports(user).filter(period_start=start, period_end=end)
    if user.role == "ro":
        reports = reports.filter(reporter_role="ro")
    reports_by_site = {}
    for report in reports.order_by("-created_at", "-id"):
        reports_by_site.setdefault((report.site_module, report.site_record_id), report)
    report_keys = set(reports_by_site)
    assessment_report_ids = set(
        SilviculturistAssessment.objects.filter(
            report__in=reports,
        ).values_list("report_id", flat=True)
    )
    assessed_site_keys = _site_assessment_keys(sites, start, end)
    assessed_site_keys.update(
        key for key, report in reports_by_site.items()
        if report.id in assessment_report_ids
    )
    completed_ro = completed_silvi = 0
    missing = []
    for site in sites:
        report = reports_by_site.get((site["module"], site["record_id"]))
        if user.role == "ro":
            present = (site["module"], site["record_id"]) in report_keys
            completed_ro += int(present)
            if not present:
                missing.append({"task": "ro_report", **site})
        elif user.role == "silviculturist":
            completed_ro += int(report is not None)
            key = (site["module"], site["record_id"])
            if report is None:
                missing.append({"task": "ro_report", **site})
                continue
            if site.get("technical_review_exempt"):
                continue
            if key in assessed_site_keys:
                completed_silvi += 1
            else:
                missing.append({
                    "task": "technical_assessment",
                    **site,
                    **({"report_id": report.id} if report else {}),
                })
    return {
        "required_sites": len(sites),
        "ro_completed": completed_ro,
        "silviculturist_completed": completed_silvi,
        "missing": missing,
    }


def _hierarchy_completion(user, start, end):
    sites = _scoped_sites(user, include_technical_review=True)
    reports = _visible_reports(user).filter(period_start=start, period_end=end)
    report_by_site = {}
    for report in reports.order_by("-created_at", "-id"):
        report_by_site.setdefault((report.site_module, report.site_record_id), report)
    assessed_ids = set(
        SilviculturistAssessment.objects.filter(report__in=reports)
        .values_list("report_id", flat=True)
    )
    assessed_site_keys = _site_assessment_keys(sites, start, end)
    assessed_site_keys.update(
        key for key, report in report_by_site.items()
        if report.id in assessed_ids
    )
    ro_completed = len(report_by_site)
    required_assessment_sites = [
        site for site in sites if not site.get("technical_review_exempt")
    ]
    silvi_completed = sum(
        (site["module"], site["record_id"]) in assessed_site_keys
        for site in required_assessment_sites
    )
    missing_ro = []
    pending_assessment = []
    for site in sites:
        report = report_by_site.get((site["module"], site["record_id"]))
        if report is None:
            missing_ro.append(site)
        if (
            not site.get("technical_review_exempt")
            and (site["module"], site["record_id"]) not in assessed_site_keys
        ):
            pending_assessment.append({
                **site,
                **({"report_id": report.id} if report else {}),
            })
    return {
        "required_sites": len(sites),
        "ro_completed": ro_completed,
        "silviculturist_completed": silvi_completed,
        "missing": [
            *({"task": "ro_report", **site} for site in missing_ro),
            *({"task": "technical_assessment", **site} for site in pending_assessment),
        ],
    }


def _progress_rankings(user):
    since = timezone.localdate() - timedelta(days=90)
    reports = _visible_reports(user).filter(
        inspection_date__gte=since,
        inspection_date__lte=timezone.localdate(),
    )
    aggregates = {
        "state": defaultdict(lambda: {"planted": 0, "alive": 0, "dead": 0}),
        "circle": defaultdict(lambda: {"planted": 0, "alive": 0, "dead": 0}),
        "division": defaultdict(lambda: {"planted": 0, "alive": 0, "dead": 0}),
    }
    names = {
        "state": ("state_id", "state_name"),
        "circle": ("circle_id", "circle_name"),
        "division": ("division_id", "division_name"),
    }
    for report in reports.iterator():
        for level, (id_field, name_field) in names.items():
            office_id = getattr(report, id_field)
            if office_id is None:
                continue
            aggregate = aggregates[level][(office_id, getattr(report, name_field))]
            aggregate["planted"] += report.planted_last_3_months
            aggregate["alive"] += report.plants_alive
            aggregate["dead"] += report.plants_dead

    output = {}
    for level, values in aggregates.items():
        rows = []
        max_planted = max((item["planted"] for item in values.values()), default=0)
        for (office_id, name), item in values.items():
            denominator = item["alive"] + item["dead"]
            survival = (item["alive"] / denominator * 100) if denominator else 0
            volume_score = (item["planted"] / max_planted * 100) if max_planted else 0
            rows.append({
                "office_id": office_id,
                "office_name": name or str(office_id),
                "planted_last_3_months": item["planted"],
                "survival_percent": round(survival, 2),
                "combined_score": round((volume_score + survival) / 2, 2),
            })
        rows.sort(key=lambda row: (-row["combined_score"], -row["planted_last_3_months"], row["office_name"]))
        for rank, row in enumerate(rows, 1):
            row["rank"] = rank
        output[level] = rows
    return output


@api_view(["GET"])
@authentication_classes([WorkflowJWTAuthentication])
@permission_classes([IsAuthenticated])
def workflow_progress_dashboard(request):
    current_start, current_end = _current_period()
    previous_start, previous_end = _previous_period(current_start)
    previous_completion = (
        _hierarchy_completion(request.user, previous_start, previous_end)
        if request.user.role not in {"ro", "silviculturist"}
        else _period_completion(request.user, previous_start, previous_end)
    )
    previous_overdue = timezone.localdate() > previous_end and bool(previous_completion["missing"])
    if previous_overdue:
        start, end = previous_start, previous_end
        completion = previous_completion
    else:
        start, end = current_start, current_end
        completion = (
            _hierarchy_completion(request.user, start, end)
            if request.user.role not in {"ro", "silviculturist"}
            else _period_completion(request.user, start, end)
        )
    due = timezone.localdate() > end
    return Response({
        "period": {"start": start, "end": end, "due": due},
        "completion": completion,
        "overdue": due and bool(completion["missing"]),
        "missing": completion["missing"] if due else [],
        "rankings": _progress_rankings(request.user),
    })


@api_view(["GET"])
@authentication_classes([WorkflowJWTAuthentication])
@permission_classes([IsAuthenticated])
def workflow_progress_sites(request):
    if request.user.role != "ro":
        raise PermissionDenied("Only Range Officers can submit six-month field reports.")
    range_id = _int_or_none(request.user.scope.get("range_id"))
    if not range_id:
        raise PermissionDenied("Your account has no valid range mapping.")
    start, end = _requested_period(request)
    reports = FieldProgressReport.objects.filter(
        period_start=start,
        period_end=end,
        reporter_role="ro",
        state_id=_int_or_none(request.user.scope.get("state_id")),
        division_id=_range_division_id(request.user),
    ).filter(
        Q(range_id=range_id)
        | Q(range_id__isnull=True, submitted_by=_actor_id(request.user))
    )
    submitted = set(reports.values_list("site_module", "site_record_id"))
    sites = []
    scoped_sites = _scoped_sites(
        request.user,
        include_technical_review=True,
        include_species=True,
    )
    pending_technical_reviews = [
        site for site in scoped_sites
        if site["technical_review_required"] and not site["technical_review_complete"]
    ]
    sites = [
        {
            **site,
            "missing_coordinates": site["latitude"] is None or site["longitude"] is None,
            "already_reported": (site["module"], site["record_id"]) in submitted,
        }
        for site in scoped_sites
    ]
    return Response({
        "period": {"start": start, "end": end},
        "sites": sites,
        "count": len(sites),
        "technical_review": {
            "required": sum(site["technical_review_required"] for site in sites),
            "complete": sum(
                site["technical_review_complete"] for site in sites
                if site["technical_review_required"]
            ),
            "pending": len(pending_technical_reviews),
        },
    })


@api_view(["GET", "POST"])
@authentication_classes([WorkflowJWTAuthentication])
@permission_classes([IsAuthenticated])
def workflow_progress_reports(request):
    if request.method == "GET":
        reports = _visible_reports(request.user).select_related().prefetch_related(
            "technical_assessments"
        )
        start, end = _requested_period(request)
        reports = reports.filter(period_start=start, period_end=end)
        limit = min(max(_int_or_none(request.query_params.get("limit")) or 50, 1), 200)
        offset = min(max(_int_or_none(request.query_params.get("offset")) or 0, 0), 1_000_000)
        count = reports.count()
        page = list(reports.order_by("-created_at", "-id")[offset:offset + limit])
        return Response({
            "reports": [_report_dict(report, request) for report in page],
            "count": count,
            "next_offset": offset + len(page) if offset + len(page) < count else None,
            "previous_offset": max(0, offset - limit) if offset else None,
        })

    if request.user.role != "ro":
        raise PermissionDenied("Only Range Officers can submit field progress reports.")
    pending_reviews = _pending_technical_reviews(request.user)
    if pending_reviews:
        pending_names = [site["name"] for site in pending_reviews[:20]]
        remaining = len(pending_reviews) - len(pending_names)
        if remaining:
            pending_names.append(f"and {remaining} more")
        raise ValidationError({
            "technical_reviews": (
                "Complete Silviculturist technical reviews for every active site "
                f"in your Range before submitting a progress report. Pending: "
                f"{', '.join(pending_names)}."
            )
        })
    module = request.data.get("site_module")
    if module not in REPORT_SITE_MODULES:
        raise ValidationError({"site_module": "Select a supported registered site type."})
    record_id = _int_or_none(request.data.get("site_record_id"))
    if not record_id or record_id <= 0:
        raise ValidationError({"site_record_id": "Select a valid registered site."})
    site = _site_record(request.user, module, record_id)
    latitude, longitude, accuracy, distance, photo = _validate_photo_coordinates(
        request, site
    )
    inspection_date = parse_date(str(request.data.get("inspection_date") or ""))
    start, end = _requested_period(request)
    today = timezone.localdate()
    if not inspection_date or inspection_date < start or inspection_date > min(end, today):
        raise ValidationError({
            "inspection_date": "Select an inspection date in the current reporting period."
        })
    species_details = _json_text(
        request.data.get("species_details"), "species_details", expected=list
    )
    species_rows = json.loads(species_details)
    if not species_rows:
        raise ValidationError({"species_details": "Add at least one species assessment."})
    for index, item in enumerate(species_rows):
        if (
            not isinstance(item, dict)
            or not isinstance(item.get("species"), str)
            or not item["species"].strip()
        ):
            raise ValidationError({"species_details": f"Species row {index + 1} needs a species name."})
        for field in ("plant_count", "alive", "dead"):
            raw_count = item.get(field)
            if isinstance(raw_count, bool) or isinstance(raw_count, float) and not raw_count.is_integer():
                raise ValidationError({"species_details": f"Species row {index + 1} needs a whole-number {field} count."})
            try:
                value = int(raw_count)
            except (TypeError, ValueError):
                raise ValidationError({"species_details": f"Species row {index + 1} needs a valid {field} count."})
            if value < 0 or value > 2_147_483_647:
                raise ValidationError({"species_details": f"Species row {index + 1} counts must be between 0 and 2,147,483,647."})
        for field in ("planting_year", "age_years", "height_cm", "girth_cm", "growth_since_last_cm"):
            if item.get(field) not in (None, ""):
                _decimal(
                    item[field],
                    f"species_details[{index}].{field}",
                    minimum=Decimal(0),
                    maximum=Decimal("999999999.999"),
                )

    def count_value(name):
        raw = request.data.get(name, 0)
        if isinstance(raw, bool) or isinstance(raw, float) and not raw.is_integer():
            raise ValidationError({name: "Enter a whole number."})
        try:
            number = int(raw or 0)
        except (TypeError, ValueError):
            raise ValidationError({name: "Enter a whole number."})
        if number < 0 or number > 2_147_483_647:
            raise ValidationError({name: "Value must be between 0 and 2,147,483,647."})
        return number

    scope = site["scope"]
    names = site["names"]
    reporter_name = request.user.name or str(request.user)
    issues = _json_text(request.data.get("issues", []), "issues", expected=list)
    for issue in json.loads(issues):
        if not isinstance(issue, dict) or not str(issue.get("type", "")).strip():
            raise ValidationError({"issues": "Each issue needs a problem type."})
    collection_date = None
    if request.data.get("seed_collection_date"):
        collection_date = parse_date(str(request.data.get("seed_collection_date")))
        if collection_date is None or collection_date > inspection_date:
            raise ValidationError({
                "seed_collection_date": "Enter a valid date no later than the inspection date."
            })
    try:
        with transaction.atomic():
            if FieldProgressReport.objects.filter(
                period_start=start,
                site_module=module,
                site_record_id=record_id,
            ).exists():
                raise ValidationError({
                    "site_record_id": "A field report for this site and period has already been submitted."
                })
            report = FieldProgressReport.objects.create(
                period_start=start,
                period_end=end,
                site_module=module,
                site_record_id=record_id,
                site_name=site["name"] or f"{module} #{record_id}",
                state_id=scope["state_id"],
                state_name=names["state_name"],
                circle_id=scope["circle_id"],
                circle_name=names["circle_name"],
                division_id=scope["division_id"],
                division_name=names["division_name"],
                range_id=scope["range_id"],
                range_name=names["range_name"],
                submitted_by=_actor_id(request.user),
                submitted_by_name=reporter_name,
                site_latitude=site["latitude"],
                site_longitude=site["longitude"],
                captured_latitude=latitude,
                captured_longitude=longitude,
                gps_accuracy_m=accuracy,
                site_distance_m=distance,
                inspection_date=inspection_date,
                species_details=species_details,
                planted_last_3_months=count_value("planted_last_3_months"),
                plants_alive=count_value("plants_alive"),
                plants_dead=count_value("plants_dead"),
                seedlings_produced=count_value("seedlings_produced"),
                seedlings_available=count_value("seedlings_available"),
                seedlings_distributed=count_value("seedlings_distributed"),
                seed_source=str(request.data.get("seed_source", "")).strip()[:500],
                seed_quantity_kg=(
                    _decimal(
                        request.data.get("seed_quantity_kg"),
                        "seed_quantity_kg",
                        minimum=Decimal(0),
                        maximum=Decimal("999999999.999"),
                    )
                    if request.data.get("seed_quantity_kg") not in (None, "")
                    else None
                ),
                seed_collection_date=collection_date,
                issues=issues,
                field_photo=photo,
            )
    except DjangoValidationError as error:
        raise ValidationError({"report": error.messages}) from error
    except IntegrityError as error:
        raise ValidationError({
            "site_record_id": "A field report for this site and period has already been submitted."
        }) from error
    return Response(
        {"id": report.id, "success": True, "period_start": start, "period_end": end},
        status=status.HTTP_201_CREATED,
    )


@api_view(["GET"])
@authentication_classes([WorkflowJWTAuthentication])
@permission_classes([IsAuthenticated])
def workflow_progress_report_detail(request, report_id):
    report = _visible_reports(request.user).filter(id=report_id).prefetch_related(
        "technical_assessments"
    ).first()
    if report is None:
        return Response({"error": "Progress report not found in your jurisdiction."}, status=404)
    previous_start, previous_end = _previous_period(report.period_start)
    previous = _visible_reports(request.user).filter(
        site_module=report.site_module,
        site_record_id=report.site_record_id,
        period_start=previous_start,
        period_end=previous_end,
    ).first()
    result = _report_dict(report, request, include_assessments=True)
    result["previous_comparison"] = _comparison_data(report, previous)
    return Response({"report": result})


@api_view(["POST"])
@authentication_classes([WorkflowJWTAuthentication])
@permission_classes([IsAuthenticated])
def workflow_technical_assessment(request, report_id):
    if request.user.role != "silviculturist":
        raise PermissionDenied("Only Silviculturists can record technical assessments.")
    report = _visible_reports(request.user).filter(id=report_id).first()
    if report is None:
        return Response({"error": "Progress report not found in your jurisdiction."}, status=404)
    assessment = SilviculturistAssessment.objects.create(
        report=report,
        **_validated_assessment_data(
            request,
            request.user,
            {
                "latitude": report.site_latitude,
                "longitude": report.site_longitude,
            },
        ),
    )
    return Response({"id": assessment.id, "success": True}, status=status.HTTP_201_CREATED)


@api_view(["GET", "POST"])
@authentication_classes([WorkflowJWTAuthentication])
@permission_classes([IsAuthenticated])
def workflow_site_technical_assessments(request):
    if request.user.role not in {"national", "state", "circle", "dfo", "ro", "silviculturist"}:
        raise PermissionDenied("Your role cannot access approved-site assessments.")
    if request.method == "POST" and request.user.role != "silviculturist":
        raise PermissionDenied("Only Silviculturists can record technical assessments.")

    if request.method == "GET":
        sites = [
            site for site in _scoped_sites(
                request.user,
                include_technical_review=True,
                approved_only=True,
            )
            if not site.get("technical_review_exempt")
            and site.get("technical_review_complete")
        ]
        for module in REPORT_SITE_MODULES:
            module_sites = [site for site in sites if site["module"] == module]
            record_ids = [site["record_id"] for site in module_sites]
            history_by_site = defaultdict(list)
            for offset in range(0, len(record_ids), 900):
                assessments = SilviculturistAssessment.objects.filter(
                    report__isnull=True,
                    site_module=module,
                    site_record_id__in=record_ids[offset:offset + 900],
                ).order_by("created_at", "id")
                for assessment in assessments:
                    history_by_site[assessment.site_record_id].append(
                        _assessment_dict(assessment, request)
                    )
            for site in module_sites:
                site["assessments"] = history_by_site.get(site["record_id"], [])
        return Response({"sites": sites, "count": len(sites)})

    module = request.data.get("site_module")
    if module not in REPORT_SITE_MODULES:
        raise ValidationError({"site_module": "Select a supported registered site type."})
    record_id = _int_or_none(request.data.get("site_record_id"))
    if not record_id or record_id <= 0:
        raise ValidationError({"site_record_id": "Select a valid registered site."})
    site = next(
        (
            item for item in _scoped_sites(
                request.user,
                include_technical_review=True,
                approved_only=True,
            )
            if item["module"] == module
            and item["record_id"] == record_id
            and not item.get("technical_review_exempt")
            and item.get("technical_review_complete")
        ),
        None,
    )
    if site is None:
        return Response(
            {"error": "Approved site not found in your Silviculturist jurisdiction."},
            status=status.HTTP_404_NOT_FOUND,
        )
    assessment = SilviculturistAssessment.objects.create(
        report=None,
        site_module=module,
        site_record_id=record_id,
        site_name=site["name"],
        **_validated_assessment_data(request, request.user, site),
    )
    return Response(
        {"id": assessment.id, "success": True},
        status=status.HTTP_201_CREATED,
    )

from django.db import connection
from django.db.models import Count, Q, Sum
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from auth.workflow_auth import WorkflowJWTAuthentication
from .progress_workflow import (
    _current_period,
    _previous_period,
    _report_dict,
    _visible_reports,
)
from .models import (
    FieldProgressReport,
    M002District,
    SilviculturistAssessment,
    T007Nursery,
)
from .serializers import NurseryDetailSerializer


OFFICE_LEVELS = {
    "state": ("state_id", "state_name"),
    "circle": ("circle_id", "circle_name"),
    "division": ("division_id", "division_name"),
    "range": ("range_id", "range_name"),
}


def _reporting_periods(today=None):
    current_start, current_end = _current_period(today)
    previous = _previous_period(current_start)
    return previous, (current_start, current_end)


@api_view(["GET"])
@authentication_classes([WorkflowJWTAuthentication])
@permission_classes([AllowAny])
def public_nurseries(request):
    queryset = T007Nursery.objects.filter(nursery_active__in=("Y", "1")).select_related(
        "nursery_state"
    )
    if (
        getattr(request.user, "is_authenticated", False)
        and request.user.role != "national"
    ):
        try:
            state_id = int(request.user.scope.get("state_id"))
        except (TypeError, ValueError):
            raise PermissionDenied("Your workflow account has no valid state mapping.")
        queryset = queryset.filter(nursery_state_id=state_id)

    state_id = request.query_params.get("state_id")
    if state_id:
        try:
            queryset = queryset.filter(nursery_state_id=int(state_id))
        except (TypeError, ValueError):
            raise ValidationError({"state_id": "Enter a valid state ID."})

    nursery_id = request.query_params.get("nursery_id")
    if nursery_id:
        try:
            queryset = queryset.filter(nursery_id=int(nursery_id))
        except (TypeError, ValueError):
            raise ValidationError({"nursery_id": "Enter a valid nursery ID."})

    search = request.query_params.get("q", "").strip()
    if search:
        queryset = queryset.filter(
            Q(nursery_name__icontains=search)
            | Q(nursery_location__icontains=search)
            | Q(nursery_address__icontains=search)
            | Q(nursery_state__state_name__icontains=search)
        )

    count = queryset.count()
    try:
        limit = min(max(int(request.query_params.get("limit", 24)), 1), 100)
        offset = min(max(int(request.query_params.get("offset", 0)), 0), 1_000_000)
    except (TypeError, ValueError):
        raise ValidationError({"pagination": "Limit and offset must be integers."})

    page = list(queryset.order_by("nursery_name")[offset:offset + limit])
    results = NurseryDetailSerializer(
        page, many=True, context={"request": request}
    ).data

    district_ids = {item.nursery_district_id for item in page if item.nursery_district_id}
    districts = dict(
        M002District.objects.filter(district_id__in=district_ids).values_list(
            "district_id", "district_name"
        )
    ) if district_ids else {}
    for result, nursery in zip(results, page):
        result["state"] = nursery.nursery_state.state_name
        result["district"] = districts.get(nursery.nursery_district_id, "")
        result["propagation_type"] = nursery.nursery_propagation_type or ""

    return Response({
        "count": count,
        "next_offset": offset + len(page) if offset + len(page) < count else None,
        "results": results,
    })


@api_view(["GET"])
@permission_classes([AllowAny])
def public_dashboard_summary(request):
    active_nurseries = T007Nursery.objects.filter(nursery_active__in=("Y", "1"))
    onboarded_states = active_nurseries.values("nursery_state_id").distinct().count()

    with connection.cursor() as cursor:
        cursor.execute(
            """
            SELECT COUNT(DISTINCT ND_Species_ID),
                   COALESCE(SUM(TRY_CONVERT(bigint, ND_Available_No)), 0)
            FROM dbo.T010_Nursery_Distribution
            WHERE ND_Active IN ('Y', '1')
            """
        )
        species_count, seedlings_available = cursor.fetchone()
        cursor.execute(
            """
            SELECT
                (SELECT COUNT(*) FROM dbo.T005_SPA WHERE SPA_Active IN ('Y', '1')),
                (SELECT COUNT(*) FROM dbo.T006_SO WHERE SO_Active IN ('Y', '1')),
                (SELECT COUNT(*) FROM dbo.T008_RI WHERE RI_Active IN ('Y', '1')),
                (SELECT COUNT(*) FROM dbo.T011_PTU WHERE PTU_Active IN ('Y', '1'))
            """
        )
        spa_count, seed_orchard_count, institute_count, processing_count = cursor.fetchone()

    return Response({
        "states_onboarded": onboarded_states,
        "nurseries": active_nurseries.count(),
        "species_available": species_count or 0,
        "seedlings_available": seedlings_available or 0,
        "spa_cpt": spa_count or 0,
        "seed_orchards": seed_orchard_count or 0,
        "research_institutes": institute_count or 0,
        "processing_units": processing_count or 0,
    })


def _rank_offices(reports, level):
    id_field, name_field = OFFICE_LEVELS[level]
    rows = list(
        reports.exclude(**{f"{id_field}__isnull": True})
        .values(id_field, name_field)
        .annotate(
            report_count=Count("id"),
            planted=Sum("planted_last_3_months"),
            alive=Sum("plants_alive"),
            dead=Sum("plants_dead"),
            seedlings_available=Sum("seedlings_available"),
        )
    )
    assessment_counts = dict(
        SilviculturistAssessment.objects.filter(report__in=reports)
        .values(f"report__{id_field}")
        .annotate(assessment_count=Count("id"))
        .values_list(f"report__{id_field}", "assessment_count")
    )
    max_planted = max((row["planted"] or 0 for row in rows), default=0)
    for row in rows:
        alive = row["alive"] or 0
        dead = row["dead"] or 0
        planted = row["planted"] or 0
        denominator = alive + dead
        survival = alive / denominator * 100 if denominator else 0
        volume_score = planted / max_planted * 100 if max_planted else 0
        row.update({
            "assessments": assessment_counts.get(row[id_field], 0),
            "office_id": row.pop(id_field),
            "office_name": row.pop(name_field) or "",
            "planted_last_3_months": planted,
            "plants_alive": alive,
            "plants_dead": dead,
            "seedlings_available": row["seedlings_available"] or 0,
            "survival_percent": round(survival, 2),
            "combined_score": round((volume_score + survival) / 2, 2),
        })
    rows.sort(
        key=lambda row: (
            -row["combined_score"],
            -row["planted_last_3_months"],
            row["office_name"].casefold(),
        )
    )
    for index, row in enumerate(rows, start=1):
        row["rank"] = index
    return rows


def _rank_silviculturists(reports):
    rows = list(
        SilviculturistAssessment.objects.filter(report__in=reports)
        .values("assessed_by", "assessed_by_name")
        .annotate(
            reviews=Count("id"),
            satisfactory=Count("id", filter=Q(category="satisfactory")),
            critical=Count("id", filter=Q(category="critical")),
        )
    )
    rows.sort(
        key=lambda row: (
            -row["reviews"],
            -row["satisfactory"],
            row["assessed_by_name"].casefold(),
        )
    )
    return [
        {
            "office_id": row["assessed_by"],
            "office_name": row["assessed_by_name"],
            "rank": rank,
            "reviews": row["reviews"],
            "satisfactory": row["satisfactory"],
            "critical": row["critical"],
        }
        for rank, row in enumerate(rows, start=1)
    ]


@api_view(["GET"])
@authentication_classes([WorkflowJWTAuthentication])
@permission_classes([AllowAny])
def public_progress_dashboard(request):
    end = timezone.localdate()
    periods = _reporting_periods(end)
    reporting_periods = Q()
    for period_start, period_end in periods:
        reporting_periods |= Q(period_start=period_start, period_end=period_end)
    previous_start = periods[0][0]
    current_end = periods[1][1]
    reports = FieldProgressReport.objects.filter(
        reporting_periods,
    ).prefetch_related("technical_assessments")
    authenticated = bool(getattr(request.user, "is_authenticated", False))
    if authenticated:
        reports = _visible_reports(request.user).filter(
            reporting_periods,
        ).prefetch_related("technical_assessments")

    state_id = request.query_params.get("state_id")
    if state_id:
        try:
            reports = reports.filter(state_id=int(state_id))
        except (TypeError, ValueError):
            raise ValidationError({"state_id": "Enter a valid state ID."})

    report_id = request.query_params.get("report_id")
    if report_id:
        try:
            reports = reports.filter(id=int(report_id))
        except (TypeError, ValueError):
            raise ValidationError({"report_id": "Enter a valid report ID."})

    jurisdiction_reports = reports
    level = request.query_params.get("level", "").strip().lower()
    office_id = request.query_params.get("office_id")
    if level and level not in OFFICE_LEVELS:
        raise ValidationError({"level": "Choose state, circle, division, or range."})
    if office_id:
        if not level:
            raise ValidationError({"level": "A level is required with office_id."})
        try:
            reports = reports.filter(**{OFFICE_LEVELS[level][0]: int(office_id)})
        except (TypeError, ValueError):
            raise ValidationError({"office_id": "Enter a valid office ID."})

    rankings = {
        name: _rank_offices(jurisdiction_reports, name)
        for name in OFFICE_LEVELS
    }
    rankings["silviculturist"] = (
        _rank_silviculturists(jurisdiction_reports) if authenticated else []
    )
    child_level = {
        "state": "circle",
        "circle": "division",
        "division": "range",
    }.get(level, "state")
    offices = _rank_offices(reports, child_level)
    selected_office = None
    if level and office_id:
        selected_office = next(
            (
                row for row in rankings[level]
                if str(row["office_id"]) == str(office_id)
            ),
            None,
        )
    summary = reports.aggregate(
        reports=Count("id"),
        planted=Sum("planted_last_3_months"),
        alive=Sum("plants_alive"),
        dead=Sum("plants_dead"),
        seedlings_available=Sum("seedlings_available"),
    )
    summary["assessed"] = SilviculturistAssessment.objects.filter(
        report__in=reports
    ).count()
    summary["pending_assessments"] = reports.filter(
        technical_assessments__isnull=True
    ).distinct().count()
    summary = {key: value or 0 for key, value in summary.items()}

    try:
        limit = min(max(int(request.query_params.get("limit", 50)), 1), 100)
        offset = min(max(int(request.query_params.get("offset", 0)), 0), 1_000_000)
    except (TypeError, ValueError):
        raise ValidationError({"pagination": "Limit and offset must be integers."})

    count = reports.count() if authenticated else 0
    report_rows = (
        list(reports.order_by("-inspection_date", "-id")[offset:offset + limit])
        if authenticated else []
    )
    report_data = []
    for report in report_rows:
        detailed_report = _report_dict(report, request, include_assessments=True)
        detailed_report["assessment"] = detailed_report["latest_assessment"]
        report_data.append(detailed_report)

    return Response({
        "period": {"start": previous_start, "end": current_end},
        "summary": summary,
        "rankings": {level: rows[:5] for level, rows in rankings.items()},
        "offices": offices,
        "selected_office": selected_office,
        "reports": report_data,
        "count": count,
        "next_offset": offset + len(report_data) if offset + len(report_data) < count else None,
        "details_restricted": not authenticated,
    }, status=status.HTTP_200_OK)

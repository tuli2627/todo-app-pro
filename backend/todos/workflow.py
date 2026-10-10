import json
import math
import re
import uuid
from decimal import Decimal, InvalidOperation
from pathlib import Path

from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from django.contrib.auth.hashers import make_password
from django.db import connection, transaction
from django.db.models import Q
from django.http import QueryDict
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from auth.workflow_auth import WorkflowJWTAuthentication
from auth.models import CampaSilviculturistUser, T001UserMaster
from .models import (
    M001State,
    M002Circle,
    M002District,
    M003Division,
    M003SubDistrict,
    M004Block,
    M004Range,
    M005Section,
    M006Compartment,
    WorkflowTechnicalRecommendation,
)


def _field(name, label, kind="text", required=True, options=None, upload=None):
    result = {
        "name": name,
        "label": f"workflow.fields.{label}",
        "type": kind,
        "required": required,
    }
    if options:
        result["options"] = options
    if upload:
        result["upload"] = upload
    return result


LOCATION_FIELDS = [
    _field("state_id", "state", "select", options="states"),
    _field("district_id", "district", "select", options="districts"),
    _field("subdistrict_id", "subDistrict", "select", options="subdistricts"),
    _field("block_id", "block", "select", options="blocks"),
    _field("circle_id", "circle", "select", options="circles"),
    _field("division_id", "division", "select", options="divisions"),
    _field("range_id", "range", "select", options="ranges"),
]
FOREST_FIELDS = LOCATION_FIELDS + [
    _field("section_id", "section", "select", options="sections"),
    _field("compart_id", "compartment", "select", options="compartments"),
]
PHOTO_FIELD = _field("photo", "photoWithCoordinates", "file", upload="photo")
KML_FIELD = _field("kml", "kmlFile", "file", required=False, upload="kml")
COORDINATE_FIELDS = [
    _field("latitude", "latitude", "number"),
    _field("longitude", "longitude", "number"),
]
ATTACHMENT_FIELDS = [PHOTO_FIELD, KML_FIELD, *COORDINATE_FIELDS]


def _definition(table, prefix, primary_key, fields, *, range_scope=False):
    columns = [primary_key]
    columns.extend(
        f"{prefix}_{suffix}" for suffix in
        ("State_ID", "District_ID", "Division_ID", "Circle_ID", "Range_ID")
        if f"{prefix}_{suffix}" in fields
    )
    columns.extend(fields)
    return {
        "table": table,
        "prefix": prefix,
        "primary_key": primary_key,
        "fields": fields,
        "columns": tuple(dict.fromkeys(columns)),
        "state_column": f"{prefix}_State_ID",
        "district_column": f"{prefix}_District_ID",
        "circle_column": f"{prefix}_Circle_ID",
        "division_column": f"{prefix}_Division_ID",
        "range_column": f"{prefix}_Range_ID",
        "entry_column": f"{prefix}_EntryBy",
        "status_column": f"{prefix}_Status",
        "active_column": f"{prefix}_Active",
        "approval_column": f"{prefix}_ApprovedBy",
        "range_scope": range_scope,
    }


MODULES = {
    "spa": _definition(
        "T005_SPA", "SPA", "SPA_ID",
        [
            "SPA_UniqueCode", "SPA_State_ID", "SPA_District_ID",
            "SPA_Division_ID", "SPA_Range_ID", "SPA_Section_ID",
            "SPA_Compart_ID", "SPA_Propagation_Type", "SPA_Species",
            "SPA_Name", "SPA_PHOTO", "SPA_Latitude", "SPA_Longitude",
            "SPA_Active", "SPA_EntryBy", "SPA_EntryOn", "SPA_Status", "SPA_ApprovedBy",
            "SPA_ApprovedOn", "SPA_KMLURL", "SPA_SubDistrict_ID",
            "SPA_Block_ID", "SPA_Circle_ID",
        ], range_scope=True,
    ),
    "seed-orchard": _definition(
        "T006_SO", "SO", "SO_ID",
        [
            "SO_UniqueCode", "SO_State_ID", "SO_District_ID",
            "SO_Division_ID", "SO_Range_ID", "SO_Section_ID",
            "SO_Propagation_Type", "SO_Species_ID", "SO_Name",
            "SO_Year_ID", "SO_Location", "SO_Distance", "SO_PHOTO",
            "SO_Latitude", "SO_Longitude", "SO_KMLURL", "SO_Active",
            "SO_EntryBy", "SO_EntryOn", "SO_Status", "SO_ApprovedBy", "SO_ApprovedOn",
            "SO_SubDistrict_ID", "SO_Block_ID", "SO_Circle_ID",
        ], range_scope=True,
    ),
    "nursery": _definition(
        "T007_Nursery", "Nursery", "Nursery_ID",
        [
            "Nursery_UniqueCode", "Nursery_State_ID", "Nursery_District_ID",
            "Nursery_Division_ID", "Nursery_Range_ID",
            "Nursery_Propagation_Type", "Nursery_Name", "Nursery_MaintainBy",
            "Nursery_Year_ID", "Nursery_Location", "Nursery_Distance",
            "Nursery_PHOTO", "Nursery_Latitude", "Nursery_Longitude",
            "Nursery_Active", "Nursery_EntryBy", "Nursery_EntryOn", "Nursery_Status",
            "Nursery_ApprovedBy", "Nursery_ApprovedOn", "Nursery_KMLURL",
            "Nursery_SubDistrict_ID", "Nursery_Block_ID",
            "Nursery_Contact_Person_Name", "Nursery_Contact_Person_Designation",
            "Nursery_Contact_Person_Phone", "Nursery_Address",
            "Nursery_Website", "Nursery_Circle_ID",
        ], range_scope=True,
    ),
    "research-institute": _definition(
        "T008_RI", "RI", "RI_ID",
        [
            "RI_UniqueCode", "RI_State_ID", "RI_District_ID",
            "RI_Division_ID", "RI_Propagation_Type", "RI_Type", "RI_Name",
            "RI_Location", "RI_Distance", "RI_PHOTO", "RI_Latitude",
            "RI_Longitude", "RI_Active", "RI_EntryBy", "RI_EntryOn", "RI_Status",
            "RI_ApprovedBy", "RI_ApprovedOn", "RI_KMLURL",
            "RI_SubDistrict_ID", "RI_Block_ID", "RI_Circle_ID",
        ],
    ),
    "processing-unit": _definition(
        "T011_PTU", "PTU", "PTU_ID",
        [
            "PTU_UniqueCode", "PTU_State_ID", "PTU_District_ID",
            "PTU_Division_ID", "PTU_Name", "PTU_Location", "PTU_Distance",
            "PTU_PHOTO", "PTU_Latitude", "PTU_Longitude", "PTU_Active",
            "PTU_EntryBy", "PTU_EntryOn", "PTU_Status", "PTU_ApprovedBy", "PTU_ApprovedOn",
            "PTU_KMLURL", "PTU_SubDistrict_ID", "PTU_Block_ID",
            "PTU_Circle_ID",
        ],
    ),
    "seed-collection": _definition(
        "T012_SCS", "SCS", "SCS_ID",
        [
            "SCS_UniqueCode", "SCS_State_ID", "SCS_District_ID",
            "SCS_Division_ID", "SCS_Seed_Source_Type", "SCS_Seed_Source_ID",
            "SCS_Species_ID", "SCS_Quantity_Collect", "SCS_Date_Collect",
            "SCS_PTUNUR_ID", "SCS_PHOTO", "SCS_Latitude", "SCS_Longitude",
            "SCS_Active", "SCS_EntryBy", "SCS_EntryOn", "SCS_Status", "SCS_ApprovedBy",
            "SCS_ApprovedOn", "SCS_TreatmentReq", "SCS_Mode_Collection",
        ],
    ),
    "seed-processing": _definition(
        "T009_PU", "PU", "PU_ID",
        [
            "PU_UniqueCode", "PU_State_ID", "PU_District_ID",
            "PU_Division_ID", "PU_PTU_ID", "PU_Species_ID", "PU_SCS_ID",
            "PU_Quantity_Unviable", "PU_Quantity_Viable", "PU_Treatment_Type",
            "PU_Treatment_Date", "PU_Quantity_Process", "PU_Bag_Packs_No",
            "PU_Quantity_Per_Bag", "PU_Processing_Date",
            "PU_Distribution_Type", "PU_Distribution_ID", "PU_Active",
            "PU_EntryBy", "PU_EntryOn", "PU_Status", "PU_ApprovedBy", "PU_ApprovedOn",
        ],
    ),
    "nursery-distribution": _definition(
        "T010_Nursery_Distribution", "ND", "ND_ID",
        [
            "ND_UniqueCode", "ND_State_ID", "ND_District_ID",
            "ND_Division_ID", "ND_Nursery_ID", "ND_PU_ID", "ND_Species_ID",
            "ND_Germinated_No", "ND_Available_No", "ND_Sold_Gov_No",
            "ND_Sold_Pri_No", "ND_Sold_Ind_No", "ND_Active", "ND_EntryBy",
            "ND_EntryOn", "ND_Status", "ND_ApprovedBy", "ND_ApprovedOn",
        ],
    ),
    "plant-production": _definition(
        "T013_Plant_Produced", "PP", "PP_ID",
        [
            "PP_State_ID", "PP_District_ID", "PP_Division_ID",
            "PP_Nursery_ID", "PP_PUSCS_ID", "PP_Species_ID", "PP_Bed_No",
            "PP_Bed_Date_In", "PP_Germinated_No", "PP_Bed_Date_Out",
            "PP_Transplant_No", "PP_Bed_Date_Transplant", "PP_Available_No",
            "PP_Active", "PP_EntryBy", "PP_EntryOn", "PP_Status", "PP_ApprovedBy",
            "PP_ApprovedOn", "PP_ComeFrom",
        ],
    ),
    "plant-disposal": _definition(
        "T014_Plant_Disposal", "PD", "PD_ID",
        [
            "PD_UniqueCode", "PD_State_ID", "PD_District_ID",
            "PD_Division_ID", "PD_Nursery_ID", "PD_PP_ID", "PD_SoldTo",
            "PD_Name", "PD_Staff_Name", "PD_Staff_Contact", "PD_Plant_Age",
            "PD_Plant_Height", "PD_Plant_No", "PD_Disposal_Date",
            "PD_PlantationSite_Name", "PD_KML_URL", "PD_Amount",
            "PD_Active", "PD_EntryBy", "PD_EntryOn", "PD_Status", "PD_ApprovedBy",
            "PD_ApprovedOn",
        ],
    ),
}


def _module_fields(slug):
    definitions = {
        "spa": FOREST_FIELDS + [
            _field("propagation_type", "propagationType", "select", options="propagation"),
            _field("species_id", "species", "select", options="species"),
            _field("name", "spaName"),
        ] + ATTACHMENT_FIELDS,
        "seed-orchard": LOCATION_FIELDS + [
            _field("section_id", "section", "select", options="sections"),
            _field("propagation_type", "propagationType", "select", options="propagation"),
            _field("species_id", "species", "select", options="species"),
            _field("name", "orchardName"),
            _field("year_id", "establishmentYear", "select", options="years"),
            _field("location", "address"),
            _field("distance", "distanceKm", "number"),
        ] + ATTACHMENT_FIELDS,
        "nursery": LOCATION_FIELDS + [
            _field("propagation_type", "propagationType", "select", options="propagation"),
            _field("name", "nurseryName"),
            _field("maintain_by", "maintainedBy", "select", options="maintainBy"),
            _field("year_id", "establishmentYear", "select", options="years"),
            _field("location", "address"),
            _field("distance", "distanceKm", "number"),
            _field("contact_person_name", "contactName"),
            _field("contact_person_designation", "contactDesignation"),
            _field("contact_person_phone", "contactPhone"),
            _field("address", "fullAddress"),
            _field("website", "website", required=False),
        ] + ATTACHMENT_FIELDS,
        "research-institute": LOCATION_FIELDS[:-1] + [
            _field("propagation_type", "propagationType", "select", options="propagation"),
            _field("type", "instituteType", "select", options="type"),
            _field("name", "instituteName"),
            _field("location", "address"),
            _field("distance", "distanceKm", "number"),
        ] + ATTACHMENT_FIELDS,
        "processing-unit": LOCATION_FIELDS[:-1] + [
            _field("name", "processingUnitName"),
            _field("location", "address"),
            _field("distance", "distanceKm", "number"),
        ] + ATTACHMENT_FIELDS,
        "seed-collection": [
            *LOCATION_FIELDS[:2],
            LOCATION_FIELDS[5],
            _field("source_type", "sourceType", "select", options="sourceType"),
            _field("source_id", "sourceName", "select", options="sources"),
            _field("species_id", "species", "select", options="species"),
            _field("quantity_collect", "quantityKg", "number"),
            _field("date_collect", "collectionDate", "date"),
            _field("ptunur_id", "destination", "select", options="destinations"),
            _field("treatment_required", "treatmentRequired", "select", options="yesNo"),
            _field("mode_collection", "collectionMode", required=False),
        ] + [PHOTO_FIELD, *COORDINATE_FIELDS],
        "seed-processing": [
            *LOCATION_FIELDS[:2],
            LOCATION_FIELDS[5],
            _field("ptu_id", "processingUnit", "select", options="processingUnits"),
            _field("species_id", "species", "select", options="species"),
            _field("scs_id", "seedCollection", "select", options="seedCollections"),
            _field("quantity_unviable", "unviableKg", "number"),
            _field("quantity_viable", "viableKg", "number"),
            _field("treatment_type", "treatmentType", "select", options="treatmentType"),
            _field("treatment_date", "treatmentDate", "date"),
            _field("quantity_process", "quantityProcessed", "number"),
            _field("bag_packs_no", "numberOfBags", "number"),
            _field("quantity_per_bag", "quantityPerBag", "number"),
            _field("processing_date", "processingDate", "date"),
            _field("distribution_type", "distributionType", "select", options="distributionType"),
            _field("distribution_id", "distributionDestination", "select", options="destinations"),
        ],
        "nursery-distribution": [
            *LOCATION_FIELDS[:2],
            LOCATION_FIELDS[5],
            _field("nursery_id", "nursery", "select", options="nurseries"),
            _field("pu_id", "processingUnit", "select", options="processingUnits"),
            _field("species_id", "species", "select", options="species"),
            _field("germinated_no", "germinatedPlants", "number"),
            _field("available_no", "availablePlants", "number"),
            _field("sold_gov_no", "soldGovernment", "number", False),
            _field("sold_pri_no", "soldPrivate", "number", False),
            _field("sold_ind_no", "soldIndividual", "number", False),
        ],
        "plant-production": [
            *LOCATION_FIELDS[:2],
            LOCATION_FIELDS[5],
            _field("nursery_id", "nursery", "select", options="nurseries"),
            _field("puscs_id", "sourceBatch", "select", options="seedBatches"),
            _field("species_id", "species", "select", options="species"),
            _field("bed_no", "bedNumber", "number"),
            _field("bed_date_in", "bedDateIn", "date"),
            _field("germinated_no", "germinatedPlants", "number"),
            _field("bed_date_out", "bedDateOut", "date"),
            _field("transplant_no", "transplantedPlants", "number"),
            _field("bed_date_transplant", "transplantDate", "date"),
            _field("available_no", "availablePlants", "number"),
            _field("come_from", "sourceType", "select", options="sourceType"),
        ],
        "plant-disposal": [
            *LOCATION_FIELDS[:2],
            LOCATION_FIELDS[5],
            _field("nursery_id", "nursery", "select", options="nurseries"),
            _field("pp_id", "plantProduction", "select", options="plantProduction"),
            _field("sold_to", "soldTo", "select", options="type"),
            _field("name", "recipientName"),
            _field("staff_name", "staffName"),
            _field("staff_contact", "staffContact"),
            _field("plant_age", "plantAge", "number"),
            _field("plant_height", "plantHeight", "number"),
            _field("plant_no", "plantQuantity", "number"),
            _field("disposal_date", "disposalDate", "date"),
            _field("plantationsite_name", "plantationSite"),
            _field("amount", "amount", "number", False),
            _field("kml_url", "kmlFile", "file", upload="kml"),
        ],
    }
    table_fields = {
        "spa": "SPA",
        "seed-orchard": "SO",
        "nursery": "Nursery",
        "research-institute": "RI",
        "processing-unit": "PTU",
        "seed-collection": "SCS",
        "seed-processing": "PU",
        "nursery-distribution": "ND",
        "plant-production": "PP",
        "plant-disposal": "PD",
    }
    fields = definitions[slug]
    prefix = table_fields[slug]
    field_columns = {}
    for field in fields:
        if field.get("upload") == "photo":
            field_columns[field["name"]] = f"{prefix}_PHOTO"
            continue
        if field.get("upload") == "kml":
            field_columns[field["name"]] = (
                "PD_KML_URL" if slug == "plant-disposal" else f"{prefix}_KMLURL"
            )
            continue
        suffix = {
            "state_id": "State_ID", "district_id": "District_ID",
            "subdistrict_id": "SubDistrict_ID", "block_id": "Block_ID",
            "circle_id": "Circle_ID", "division_id": "Division_ID",
            "range_id": "Range_ID", "section_id": "Section_ID",
            "compart_id": "Compart_ID", "propagation_type": "Propagation_Type",
            "species_id": "Species_ID", "name": "Name", "year_id": "Year_ID",
            "location": "Location", "distance": "Distance",
            "maintain_by": "MaintainBy", "contact_person_name": "Contact_Person_Name",
            "contact_person_designation": "Contact_Person_Designation",
            "contact_person_phone": "Contact_Person_Phone", "address": "Address",
            "website": "Website", "type": "Type", "source_type": "Seed_Source_Type",
            "source_id": "Seed_Source_ID", "quantity_collect": "Quantity_Collect",
            "date_collect": "Date_Collect", "ptunur_id": "PTUNUR_ID",
            "treatment_required": "TreatmentReq", "mode_collection": "Mode_Collection",
            "ptu_id": "PTU_ID", "scs_id": "SCS_ID",
            "quantity_unviable": "Quantity_Unviable",
            "quantity_viable": "Quantity_Viable", "treatment_type": "Treatment_Type",
            "treatment_date": "Treatment_Date", "quantity_process": "Quantity_Process",
            "bag_packs_no": "Bag_Packs_No", "quantity_per_bag": "Quantity_Per_Bag",
            "processing_date": "Processing_Date", "distribution_type": "Distribution_Type",
            "distribution_id": "Distribution_ID", "nursery_id": "Nursery_ID",
            "pu_id": "PU_ID", "germinated_no": "Germinated_No",
            "available_no": "Available_No", "sold_gov_no": "Sold_Gov_No",
            "sold_pri_no": "Sold_Pri_No", "sold_ind_no": "Sold_Ind_No",
            "puscs_id": "PUSCS_ID", "bed_no": "Bed_No", "bed_date_in": "Bed_Date_In",
            "bed_date_out": "Bed_Date_Out", "transplant_no": "Transplant_No",
            "bed_date_transplant": "Bed_Date_Transplant", "come_from": "ComeFrom",
            "pp_id": "PP_ID", "sold_to": "SoldTo", "staff_name": "Staff_Name",
            "staff_contact": "Staff_Contact", "plant_age": "Plant_Age",
            "plant_height": "Plant_Height", "plant_no": "Plant_No",
            "disposal_date": "Disposal_Date",
            "plantationsite_name": "PlantationSite_Name", "amount": "Amount",
            "latitude": "Latitude", "longitude": "Longitude",
        }
        if field["name"] == "species_id" and slug == "spa":
            field_columns[field["name"]] = "SPA_Species"
        else:
            field_columns[field["name"]] = (
                "PD_Name" if slug == "plant-disposal" and field["name"] == "name"
                else f"{prefix}_{suffix[field['name']]}"
            )
    return fields, field_columns


for _slug, _definition_value in MODULES.items():
    _fields, _columns = _module_fields(_slug)
    _definition_value["form_fields"] = _fields
    _definition_value["field_columns"] = _columns


def _int(value):
    try:
        return int(value)
    except (TypeError, ValueError):
        return None


def _actor_id(user):
    return _int(user.id)


def _scope_for(user, definition):
    role = user.role
    scope = user.scope
    state_id = _int(scope.get("state_id"))
    district_id = _int(scope.get("district_id"))
    circle_id = _int(scope.get("circle_id"))
    division_id = _int(scope.get("division_id"))
    range_id = _int(scope.get("range_id"))
    if role != "national" and not state_id:
        raise PermissionDenied("Your account has no valid state mapping.")

    filters = []
    params = []
    state_column = definition["state_column"]
    if role != "national":
        filters.append(f"{state_column} = %s")
        params.append(state_id)
    if role == "circle":
        if not circle_id:
            raise PermissionDenied(
                "Your session has no mapped PARIVESH Circle office. Log in again after selecting "
                "your Circle office; contact the administrator if PARIVESH does not return one."
            )
        circle_column = definition["circle_column"]
        if circle_column in definition["columns"]:
            filters.append(f"{circle_column} = %s")
            params.append(circle_id)
        else:
            division_ids = list(
                M003Division.objects.filter(
                    division_circle_id=circle_id,
                    division_active="Y",
                ).values_list("division_id", flat=True)
            )
            if not division_ids:
                return "1 = 0", []
            filters.append(
                f"{definition['division_column']} IN ({', '.join(['%s'] * len(division_ids))})"
            )
            params.extend(division_ids)
    elif role == "dfo":
        if not division_id:
            raise PermissionDenied("Your PARIVESH division could not be mapped to the directory.")
        filters.append(f"{definition['division_column']} = %s")
        params.append(division_id)
    elif role == "silviculturist":
        if definition["state_column"] in definition["columns"]:
            filters.append(f"{state_column} = %s")
            params.append(state_id)
        if circle_id:
            if definition["circle_column"] in definition["columns"]:
                filters.append(f"{definition['circle_column']} = %s")
                params.append(circle_id)
            elif definition["division_column"] in definition["columns"]:
                division_ids = list(
                    M003Division.objects.filter(
                        division_circle_id=circle_id,
                        division_active="Y",
                    ).values_list("division_id", flat=True)
                )
                if not division_ids:
                    return "1 = 0", []
                filters.append(
                    f"{definition['division_column']} IN "
                    f"({', '.join(['%s'] * len(division_ids))})"
                )
                params.extend(division_ids)
        elif division_id and definition["division_column"] in definition["columns"]:
            filters.append(f"{definition['division_column']} = %s")
            params.append(division_id)
    elif role == "ro":
        if definition["range_scope"] and range_id:
            filters.append(f"{definition['range_column']} = %s")
            params.append(range_id)
        elif definition["division_column"] in definition["columns"]:
            if not division_id and range_id:
                range_record = M004Range.objects.filter(
                    range_id=range_id,
                    range_active="Y",
                ).values("range_division_id").first()
                division_id = (
                    _int(range_record["range_division_id"])
                    if range_record
                    else None
                )
            if not division_id:
                raise PermissionDenied(
                    "Your Range could not be mapped to a Division for these records."
                )
            filters.append(f"{definition['division_column']} = %s")
            params.append(division_id)
        else:
            filters.append(f"{definition['entry_column']} = %s")
            params.append(_actor_id(user))
    return " AND ".join(filters) or "1 = 1", params


DISPLAY_LOOKUPS = {
    "State_ID": ("M001_State", "State_ID", "State_Name"),
    "District_ID": ("M002_District", "District_ID", "District_Name"),
    "SubDistrict_ID": ("M003_SubDistrict", "SubDistrict_ID", "SubDistrict_Name"),
    "Block_ID": ("M004_Block", "Block_Code", "Block_Name"),
    "Circle_ID": ("M002_Circle", "Circle_ID", "Circle_Name"),
    "Division_ID": ("M003_Division", "Division_ID", "Division_Name"),
    "Range_ID": ("M004_Range", "Range_ID", "Range_Name"),
    "Section_ID": ("M005_Section", "Section_ID", "Section_Name"),
    "Compart_ID": ("M006_Compart", "Compart_ID", "Compart_Name"),
    "Species_ID": ("M007_Species", "Species_ID", "Species_Name"),
}
WORKFLOW_ROLE_BY_LEVEL = {
    1: "national",
    2: "state",
    3: "circle",
    4: "dfo",
    5: "ro",
}
WORKFLOW_REVIEWER_LEVEL = {
    role: level
    for level, role in WORKFLOW_ROLE_BY_LEVEL.items()
    if role in {"national", "state", "circle", "dfo"}
}
SILVICULTURIST_MODULES = {
    "spa", "seed-orchard", "nursery", "processing-unit",
    "seed-collection", "seed-processing", "nursery-distribution",
    "plant-production", "plant-disposal",
}


def _add_display_values(records):
    values_by_column = {}
    for suffix, (table, id_column, name_column) in DISPLAY_LOOKUPS.items():
        field_ids = {
            _int(value)
            for record in records
            for column, value in record.items()
            if column.endswith(suffix) and value is not None and _int(value) is not None
        }
        if not field_ids:
            continue
        placeholders = ", ".join(["%s"] * len(field_ids))
        with connection.cursor() as cursor:
            cursor.execute(
                f"SELECT {id_column}, {name_column} FROM dbo.{table} "
                f"WHERE {id_column} IN ({placeholders})",
                sorted(field_ids),
            )
            values_by_column[suffix] = dict(cursor.fetchall())
    for record in records:
        record["display_values"] = {
            column: values_by_column[suffix].get(_int(value))
            for column, value in record.items()
            for suffix in DISPLAY_LOOKUPS
            if column.endswith(suffix)
            and value is not None
            and suffix in values_by_column
            and values_by_column[suffix].get(_int(value)) is not None
        }
    return records


def _workflow_actor_details(actor_ids):
    ids = {_int(value) for value in actor_ids if _int(value) is not None}
    if not ids:
        return {}
    users = list(T001UserMaster.objects.filter(id__in=ids).values(
        "id", "fname", "lname", "emailid", "level_id"
    ))
    silviculturist_emails = {
        email.lower()
        for email in CampaSilviculturistUser.objects.filter(
            emailid__in=[user["emailid"] for user in users if user["emailid"]]
        ).values_list("emailid", flat=True)
    }
    return {
        user["id"]: {
            "id": user["id"],
            "name": " ".join(filter(None, (user["fname"], user["lname"]))) or user["emailid"],
            "role": (
                "silviculturist"
                if user["emailid"] and user["emailid"].lower() in silviculturist_emails
                else WORKFLOW_ROLE_BY_LEVEL.get(user["level_id"])
            ),
        }
        for user in users
    }


def _add_record_creator_metadata(records, definition, actor_id):
    entry_column = definition["entry_column"]
    creators = _workflow_actor_details(record.get(entry_column) for record in records)
    for record in records:
        entry_by = _int(record.get(entry_column))
        creator = creators.get(entry_by)
        record["created_by"] = creator["name"] if creator else None
        record["can_delete"] = (
            record.get(definition["status_column"]) == "P"
            and actor_id is not None
            and entry_by == actor_id
        )
    return records


TECHNICAL_REVIEW_EXCLUDED_FIELDS = {
    "state_id", "district_id", "subdistrict_id", "block_id", "circle_id",
    "division_id", "range_id", "section_id", "compart_id",
}
TECHNICAL_LOOKUP_ID_KEYS = {
    "states": "state_id",
    "districts": "district_id",
    "subdistricts": "subdistrict_id",
    "blocks": "block_code",
    "circles": "circle_id",
    "divisions": "division_id",
    "ranges": "range_id",
    "sections": "section_id",
    "compartments": "compart_id",
}


def _technical_review_fields(definition):
    return [
        {
            "name": field["name"],
            "column": definition["field_columns"][field["name"]],
            "label": field["label"],
            "type": field["type"],
            "options": field.get("options"),
            "required": field["required"],
        }
        for field in definition["form_fields"]
        if field["name"] not in TECHNICAL_REVIEW_EXCLUDED_FIELDS
        and not field.get("upload")
        and definition["field_columns"].get(field["name"]) in definition["fields"]
    ]


def _technical_recommendation_dict(item):
    try:
        requested_fields = json.loads(item.requested_fields)
    except json.JSONDecodeError:
        requested_fields = []
    try:
        correction_values = json.loads(item.correction_values)
    except json.JSONDecodeError:
        correction_values = {}
    return {
        "id": item.id,
        "reviewed_by": item.reviewer_name,
        "requested_fields": requested_fields,
        "recommendation": item.recommendation,
        "created_at": item.created_at,
        "addressed_by": item.addressed_by_name or None,
        "addressed_at": item.addressed_at,
        "correction_values": correction_values,
    }


def _technical_review_history_complete(history):
    if not history:
        return False
    try:
        requested_fields = [
            json.loads(item["requested_fields"])
            for item in history
        ]
    except (KeyError, TypeError, json.JSONDecodeError):
        return False
    if any(not isinstance(fields, list) for fields in requested_fields):
        return False
    return requested_fields[-1] == [] and all(
        not fields or history[index]["addressed_at"] is not None
        for index, fields in enumerate(requested_fields[:-1])
    )


def _silviculturist_review_filter(module, definition):
    return (
        f"({definition['approval_column']} IS NULL OR EXISTS ("
        "SELECT 1 FROM dbo.workflow_technical_recommendation AS recommendation "
        f"WHERE recommendation.module = %s AND recommendation.record_id = {definition['primary_key']} "
        "AND (recommendation.addressed_at IS NOT NULL OR recommendation.requested_fields = '[]') "
        "AND recommendation.id = ("
        "SELECT MAX(latest_recommendation.id) "
        "FROM dbo.workflow_technical_recommendation AS latest_recommendation "
        "WHERE latest_recommendation.module = %s "
        f"AND latest_recommendation.record_id = {definition['primary_key']})))",
        [module, module],
    )


def _record_workflow_details(record, definition):
    prefix = definition["prefix"]
    entry_by = record.get(f"{prefix}_EntryBy")
    approved_by = record.get(f"{prefix}_ApprovedBy")
    actors = _workflow_actor_details((entry_by, approved_by))
    status_value = record.get(definition["status_column"])
    submitted_by = actors.get(_int(entry_by)) if entry_by is not None else None
    reviewed_by = actors.get(_int(approved_by)) if approved_by is not None else None
    history = []
    if submitted_by or record.get(f"{prefix}_EntryOn"):
        history.append({
            "action": "submitted",
            "actor": submitted_by or {"id": entry_by, "name": None, "role": None},
            "at": record.get(f"{prefix}_EntryOn"),
        })
    if status_value == "P" and reviewed_by and reviewed_by["role"] == "silviculturist":
        history.append({
            "action": "technical_reviewed",
            "actor": reviewed_by,
            "at": record.get(f"{prefix}_ApprovedOn"),
        })
    elif status_value in {"A", "R"} and (reviewed_by or record.get(f"{prefix}_ApprovedOn")):
        history.append({
            "action": "approved" if status_value == "A" else "returned",
            "actor": reviewed_by or {"id": approved_by, "name": None, "role": None},
            "at": record.get(f"{prefix}_ApprovedOn"),
        })
    return {
        "status": status_value,
        "status_recorded": status_value in {"P", "A", "R"},
        "technical_reviewed": bool(
            status_value == "P" and reviewed_by and reviewed_by["role"] == "silviculturist"
        ),
        "technical_reviewed_by": (
            reviewed_by
            if status_value == "P" and reviewed_by and reviewed_by["role"] == "silviculturist"
            else None
        ),
        "submitted_by": submitted_by or (
            {"id": entry_by, "name": None, "role": None} if entry_by is not None else None
        ),
        "reviewed_by": reviewed_by or (
            {"id": approved_by, "name": None, "role": None} if approved_by is not None else None
        ),
        "history": history,
        "history_note": "This table stores the submitter and latest reviewer only; earlier reviews are not recorded.",
        "review_rule": (
            "Pending records appear in the review queue for authorized National, "
            "State, Circle, or DFO users whose jurisdiction includes the record."
            if status_value == "P" else None
        ),
    }


def _add_related_nursery_location(record):
    nursery_id = next(
        (
            _int(value)
            for column, value in record.items()
            if column.endswith("_Nursery_ID") and _int(value) is not None
        ),
        None,
    )
    if not nursery_id:
        return
    with connection.cursor() as cursor:
        cursor.execute(
            "SELECT Nursery_Latitude, Nursery_Longitude, Nursery_Name, "
            "Nursery_Address, Nursery_Location, Nursery_State_ID, Nursery_District_ID, "
            "Nursery_Circle_ID, Nursery_Division_ID, Nursery_Range_ID, Nursery_PHOTO "
            "FROM dbo.T007_Nursery WHERE Nursery_ID = %s",
            [nursery_id],
        )
        row = cursor.fetchone()
    if row is None:
        return
    record["related_nursery_location"] = {
        "latitude": row[0],
        "longitude": row[1],
        "name": row[2],
        "address": row[3] or row[4],
        "state_id": row[5],
        "district_id": row[6],
        "circle_id": row[7],
        "division_id": row[8],
        "range_id": row[9],
        "photo": row[10],
    }


def _locations(role, scope, data, definition):
    result = data.dict() if isinstance(data, QueryDict) else dict(data)
    fields = definition["field_columns"]
    fixed = {
        "state": ("state_id", "state_id"),
        "district": ("district_id", "district_id"),
        "circle": ("circle_id", "circle_id"),
        "division": ("division_id", "division_id"),
        "range": ("range_id", "range_id"),
    }
    for scope_name, (payload_name, claim_name) in fixed.items():
        column = fields.get(payload_name)
        scope_value = _int(scope.get(claim_name))
        if column and role != "national" and scope_value:
            submitted = _int(result.get(payload_name))
            if submitted is not None and submitted != scope_value:
                raise PermissionDenied("The selected location is outside your assigned office.")
            result[payload_name] = scope_value
    if role != "national" and not result.get("state_id"):
        raise PermissionDenied("A state must be assigned before submitting records.")
    range_id = _int(result.get("range_id")) if "range_id" in fields else None
    if range_id:
        range_record = M004Range.objects.filter(
            range_id=range_id,
            range_active="Y",
        ).values("range_division_id").first()
        if range_record is None:
            raise ValidationError({"range_id": "Select an active Forest Range."})
        division_id = range_record["range_division_id"]
        selected_division = _int(result.get("division_id"))
        assigned_division = _int(scope.get("division_id"))
        if selected_division and selected_division != division_id:
            raise PermissionDenied("The selected Range does not belong to the selected Division.")
        if assigned_division and assigned_division != division_id:
            raise PermissionDenied("The selected Range is outside your assigned Division.")
        division = M003Division.objects.filter(
            division_id=division_id,
            division_active="Y",
        ).values("division_circle_id").first()
        if division is None:
            raise ValidationError({"range_id": "The selected Range has no active Division mapping."})
        circle_id = _int(result.get("circle_id")) or _int(scope.get("circle_id"))
        if circle_id and circle_id != division["division_circle_id"]:
            raise PermissionDenied("The selected Range is outside your assigned Circle.")
        state_id = _int(result.get("state_id")) or _int(scope.get("state_id"))
        if state_id and not M002Circle.objects.filter(
            circle_id=division["division_circle_id"],
            circle_state_id=state_id,
            circle_active="Y",
        ).exists():
            raise PermissionDenied("The selected Range is outside your assigned State.")
    section_id = _int(result.get("section_id")) if "section_id" in fields else None
    if section_id:
        if not range_id or not M005Section.objects.filter(
            section_id=section_id,
            section_range_id=range_id,
            section_active="Y",
        ).exists():
            raise ValidationError({"section_id": "Select an active Beat in the selected Range."})
    compart_id = _int(result.get("compart_id")) if "compart_id" in fields else None
    if compart_id and (
        not section_id
        or not M006Compartment.objects.filter(
            compart_id=compart_id,
            compart_section_id=section_id,
            compart_active="Y",
        ).exists()
    ):
        raise ValidationError({"compart_id": "Select an active Sub-beat in the selected Beat."})
    return result


def _lookups(request):
    role = request.user.role
    scope = request.user.scope
    scoped_fields = (
        "state_id", "district_id", "circle_id", "division_id", "range_id"
    )
    selected = {
        name: _int(request.query_params.get(name)) or _int(scope.get(name))
        for name in scoped_fields
    }
    if role == "silviculturist" and not _int(scope.get("state_id")):
        raise PermissionDenied("Your Silviculturist account must be mapped to a state user in T001_UserMaster.")
    if role != "national":
        for name in scoped_fields:
            requested = _int(request.query_params.get(name))
            assigned = _int(scope.get(name))
            if requested and assigned and requested != assigned:
                raise PermissionDenied("The requested location is outside your assigned office.")
    state_id = selected["state_id"]
    district_id = selected["district_id"]
    circle_id = selected["circle_id"]
    division_id = selected["division_id"]
    range_id = selected["range_id"]
    result = {
        "states": list(
            M001State.objects.filter(
                state_active="Y",
                **({"state_id": state_id} if role != "national" else {}),
            ).order_by("state_name").values("state_id", "state_name")
        ),
        "districts": [],
        "subdistricts": [],
        "blocks": [],
        "circles": [],
        "divisions": [],
        "ranges": [],
        "sections": [],
        "compartments": [],
    }
    if state_id and _int(state_id):
        districts = M002District.objects.filter(district_state_id=state_id)
        circles = M002Circle.objects.filter(circle_state_id=state_id, circle_active="Y")
        if role != "national" and selected["district_id"]:
            districts = districts.filter(district_id=selected["district_id"])
        if role != "national" and selected["circle_id"]:
            circles = circles.filter(circle_id=selected["circle_id"])
        result["districts"] = list(districts.order_by("district_name").values("district_id", "district_name"))
        result["circles"] = list(circles.order_by("circle_name").values("circle_id", "circle_name"))
    if district_id and _int(district_id):
        result["subdistricts"] = list(M003SubDistrict.objects.filter(subdistrict_district_id=district_id, subdistrict_active="Y").order_by("subdistrict_name").values("subdistrict_id", "subdistrict_name"))
        result["blocks"] = list(M004Block.objects.filter(district_code=district_id, block_active="Y").order_by("block_name").values("block_code", "block_name"))
    if circle_id and _int(circle_id):
        divisions = M003Division.objects.filter(division_circle_id=circle_id, division_active="Y")
        if role != "national" and selected["division_id"]:
            divisions = divisions.filter(division_id=selected["division_id"])
        result["divisions"] = list(divisions.order_by("division_name").values("division_id", "division_name"))
    if division_id and _int(division_id):
        ranges = M004Range.objects.filter(range_division_id=division_id, range_active="Y")
        if role != "national" and selected["range_id"]:
            ranges = ranges.filter(range_id=selected["range_id"])
        result["ranges"] = list(ranges.order_by("range_name").values("range_id", "range_name"))
    if range_id and _int(range_id):
        result["sections"] = list(M005Section.objects.filter(section_range_id=range_id, section_active="Y").order_by("section_name").values("section_id", "section_name"))
    section_id = request.query_params.get("section_id")
    if section_id and _int(section_id):
        result["compartments"] = _compartments_for_section(
            range_id,
            _int(section_id),
        )
    with connection.cursor() as cursor:
        cursor.execute("SELECT Species_ID, Species_S_Name FROM dbo.M007_Species WHERE Species_Active = 'Y' ORDER BY Species_S_Name")
        result["species"] = [{"id": row[0], "name": row[1]} for row in cursor.fetchall()]
        cursor.execute("SELECT LM_Code, LM_Name FROM dbo.M022_List_Master WHERE LM_Category = 'MaintainBy' AND LM_Active = 'Y' ORDER BY LM_Name")
        result["maintainBy"] = [{"id": row[0], "name": row[1]} for row in cursor.fetchall()]
        cursor.execute("SELECT LM_ID, LM_Name FROM dbo.M022_List_Master WHERE LM_Category = 'Type' AND LM_Active = 'Y' ORDER BY LM_Name")
        result["type"] = [{"id": row[0], "name": row[1]} for row in cursor.fetchall()]
        cursor.execute("SELECT LM_Code, LM_Name FROM dbo.M022_List_Master WHERE LM_Category = 'Species_Height' AND LM_Active = 'Y' ORDER BY TRY_CONVERT(int, LM_Code)")
        result["heights"] = [{"id": row[0], "name": row[1]} for row in cursor.fetchall()]
        cursor.execute("SELECT FinYear_ID, FinYearFrom, FinYearTo FROM dbo.M000_FinYear WHERE Finyear_Active = 'Y' ORDER BY FinYear_ID DESC")
        result["years"] = [
            {"id": row[0], "name": f"{row[1]}-{row[2]}"}
            for row in cursor.fetchall()
        ]
    result["propagation"] = [
        {"id": "S", "name": "Seed"},
        {"id": "V", "name": "Vegetative"},
    ]
    result["sourceType"] = [
        {"id": "S", "name": "Seed Production Area"},
        {"id": "O", "name": "Seed Orchard"},
    ]
    result["yesNo"] = [{"id": "Y", "name": "Yes"}, {"id": "N", "name": "No"}]
    result["treatmentType"] = [{"id": "T", "name": "Treated"}, {"id": "U", "name": "Untreated"}]
    result["distributionType"] = [{"id": "N", "name": "Nursery"}, {"id": "S", "name": "Seed Orchard"}]

    if request.query_params.get("report_only") == "1":
        return result

    def records(module, id_column, name_column):
        definition = MODULES[module]
        where, params = _scope_for(request.user, definition)
        active = definition["active_column"]
        query = (
            f"SELECT TOP 500 {id_column}, {name_column} FROM dbo.{definition['table']} "
            f"WHERE {where} AND {active} IN ('Y', '1') "
            f"ORDER BY {definition['table']}.{name_column}"
        )
        with connection.cursor() as cursor:
            cursor.execute(query, params)
            return [{"id": row[0], "name": row[1]} for row in cursor.fetchall()]

    result["nurseries"] = records("nursery", "Nursery_ID", "Nursery_Name")
    result["processingUnits"] = records("processing-unit", "PTU_ID", "PTU_Name")
    result["seedCollections"] = records("seed-collection", "SCS_ID", "SCS_UniqueCode")
    result["seedBatches"] = records("seed-collection", "SCS_ID", "SCS_UniqueCode")
    result["plantProduction"] = records("plant-production", "PP_ID", "PP_ID")
    result["sources"] = [
        *[
            {**item, "type": "S"}
            for item in records("spa", "SPA_ID", "SPA_Name")
        ],
        *[
            {**item, "type": "O"}
            for item in records("seed-orchard", "SO_ID", "SO_Name")
        ],
    ]
    result["destinations"] = [
        *[
            {**item, "type": "N"}
            for item in result["nurseries"]
        ],
        *[
            {**item, "type": "P"}
            for item in result["processingUnits"]
        ],
    ]
    result["contactPeople"] = []
    result["ownContactPersonId"] = None
    if request.query_params.get("module") == "nursery":
        valid_ranges = M004Range.objects.filter(range_active="Y")
        if role == "ro":
            valid_ranges = valid_ranges.filter(range_id=_int(scope.get("range_id")))
        elif role == "dfo":
            valid_ranges = valid_ranges.filter(range_division_id=_int(scope.get("division_id")))
        elif role == "circle":
            division_ids = M003Division.objects.filter(
                division_circle_id=_int(scope.get("circle_id")),
                division_active="Y",
            ).values_list("division_id", flat=True)
            valid_ranges = valid_ranges.filter(range_division_id__in=division_ids)
        elif role == "state":
            circle_ids = M002Circle.objects.filter(
                circle_state_id=_int(scope.get("state_id")),
                circle_active="Y",
            ).values_list("circle_id", flat=True)
            division_ids = M003Division.objects.filter(
                division_circle_id__in=circle_ids,
                division_active="Y",
            ).values_list("division_id", flat=True)
            valid_ranges = valid_ranges.filter(range_division_id__in=division_ids)
        elif role == "silviculturist":
            valid_ranges = valid_ranges.none()
        if role != "national" or selected["range_id"]:
            if selected["range_id"]:
                valid_ranges = valid_ranges.filter(range_id=selected["range_id"])
            else:
                valid_ranges = valid_ranges.none()
        range_ids = list(valid_ranges.values_list("range_id", flat=True))
        if range_ids:
            with connection.cursor() as cursor:
                placeholders = ", ".join(["%s"] * len(range_ids))
                cursor.execute(
                    "SELECT u.UM_ID, u.UM_FName, u.UM_LName, "
                    "d.Designation_Name, u.UM_MobileNo, u.UM_AlternateMobileNo "
                    "FROM dbo.T001_UserMaster u "
                    "LEFT JOIN dbo.M015_Designation d "
                    "ON d.Designation_ID = u.UM_Designation_ID "
                    f"WHERE u.UM_Level_ID = 5 AND u.UM_Type = 'U' "
                    "AND u.UM_Approved = 'Y' AND u.UM_Active = 'Y' "
                    "AND ISNULL(u.UM_AC_Blocked, 'N') <> 'Y' "
                    f"AND u.UM_Range_ID IN ({placeholders}) "
                    "ORDER BY u.UM_FName, u.UM_LName",
                    range_ids,
                )
                result["contactPeople"] = [
                    {
                        "id": row[0],
                        "name": " ".join(filter(None, (row[1], row[2]))),
                        "designation": row[3] or "",
                        "phone": row[4] or "",
                        "alternate_phone": row[5] or "",
                    }
                    for row in cursor.fetchall()
                ]
            if role == "ro":
                own_id = _actor_id(request.user)
                if any(person["id"] == own_id for person in result["contactPeople"]):
                    result["ownContactPersonId"] = own_id
    return result


def _upload(request, field, slug):
    uploaded = request.FILES.get(field)
    if uploaded is None:
        return None
    extension = Path(uploaded.name).suffix.lower()
    if field == "photo":
        if extension not in {".jpg", ".jpeg"}:
            raise ValidationError("Photo uploads must be JPG or JPEG files.")
        if uploaded.size < 50 * 1024:
            raise ValidationError("Photo uploads must be at least 50 KB.")
        folder = {
            "spa": "SPA", "seed-orchard": "SO", "nursery": "NUR",
            "research-institute": "RI", "processing-unit": "PTU",
            "seed-collection": "SCS",
        }[slug]
    else:
        if extension != ".kml":
            raise ValidationError("Map attachments must be KML files.")
        if uploaded.size > 5 * 1024 * 1024:
            raise ValidationError("KML files must not exceed 5 MB.")
        folder = "KML"
        name = f"{uuid.uuid4().hex[:12]}.kml"
    if field == "photo":
        name = f"{uuid.uuid4().hex[:16]}{extension}"
        storage_path = f"Uploads/{folder}/{name}"
    else:
        storage_path = f"Uploads/{folder}/{name}"
    return default_storage.save(storage_path, ContentFile(uploaded.read()))


def _db_value(value, field):
    if value is None or value == "":
        if field["required"]:
            raise ValidationError(f"{field['name']} is required.")
        return None
    if field["type"] == "number":
        numeric_text = str(value).strip()
        if numeric_text.count(",") == 1 and "." not in numeric_text:
            numeric_text = numeric_text.replace(",", ".")
        is_coordinate = field["name"] in {"latitude", "longitude"}
        number_pattern = (
            r"-?(?:\d+(?:\.\d*)?|\.\d+)"
            if is_coordinate else r"(?:\d+(?:\.\d*)?|\.\d+)"
        )
        if not re.fullmatch(number_pattern, numeric_text):
            message = (
                f"{field['name']} must be a valid coordinate."
                if is_coordinate else f"{field['name']} must be a non-negative number."
            )
            raise ValidationError(message)
        try:
            number = Decimal(numeric_text)
        except (InvalidOperation, ValueError) as error:
            raise ValidationError(f"{field['name']} must be a non-negative number.") from error
        if not number.is_finite():
            raise ValidationError(f"{field['name']} must be a finite number.")
        if not math.isfinite(float(number)):
            raise ValidationError(f"{field['name']} must be a finite number.")
        if is_coordinate and max(0, -number.as_tuple().exponent) > 8:
            raise ValidationError(f"{field['name']} cannot have more than 8 decimal places.")
        if is_coordinate:
            lower_bound, upper_bound = (
                (Decimal("-90"), Decimal("90"))
                if field["name"] == "latitude"
                else (Decimal("-180"), Decimal("180"))
            )
            if number < lower_bound or number > upper_bound:
                raise ValidationError(f"{field['name']} is outside its valid coordinate range.")
        elif number < 0:
            raise ValidationError(f"{field['name']} cannot be negative.")
        return float(number)
    if field["type"] == "date":
        try:
            return timezone.datetime.strptime(str(value), "%Y-%m-%d").date()
        except ValueError as error:
            raise ValidationError(f"{field['name']} must be a valid date.") from error
    if field["type"] == "select" and str(value).isdigit():
        return int(value)
    return str(value).strip()


def _contact_number(value, field_name):
    if value in (None, ""):
        return None
    if not isinstance(value, str) or not re.fullmatch(r"\d{10}", value):
        raise ValidationError({field_name: "Enter a 10-digit mobile number without spaces or symbols."})
    return value


@api_view(["GET"])
@authentication_classes([WorkflowJWTAuthentication])
@permission_classes([IsAuthenticated])
def workflow_overview(request):
    counts = []
    for slug, definition in MODULES.items():
        if request.user.role == "silviculturist" and slug not in SILVICULTURIST_MODULES:
            continue
        where, params = _scope_for(request.user, definition)
        reviewer_level = WORKFLOW_REVIEWER_LEVEL.get(request.user.role)
        technical_reviewer = request.user.role == "silviculturist"
        if reviewer_level or technical_reviewer:
            query = (
                f"SELECT COUNT(1), SUM(CASE WHEN {definition['status_column']} IS NULL "
                f"OR {definition['status_column']} NOT IN ('P', 'A', 'R') "
                f"THEN 1 ELSE 0 END) FROM dbo.{definition['table']} WHERE {where}"
            )
        else:
            query = (
                f"SELECT COUNT(1), SUM(CASE WHEN {definition['status_column']} = 'P' "
                f"THEN 1 ELSE 0 END), SUM(CASE WHEN {definition['status_column']} IS NULL "
                f"OR {definition['status_column']} NOT IN ('P', 'A', 'R') "
                f"THEN 1 ELSE 0 END) FROM dbo.{definition['table']} WHERE {where}"
            )
        with connection.cursor() as cursor:
            cursor.execute(query, params)
            aggregate_counts = cursor.fetchone()
            if reviewer_level or technical_reviewer:
                total, legacy = aggregate_counts
                if technical_reviewer:
                    review_filter, review_params = _silviculturist_review_filter(
                        slug,
                        definition,
                    )
                    pending_query = (
                        f"SELECT COUNT(1) FROM dbo.{definition['table']} WHERE {where} "
                        f"AND {definition['status_column']} = 'P' "
                        f"AND {review_filter}"
                    )
                    pending_params = [*params, *review_params]
                else:
                    pending_query = (
                        f"SELECT COUNT(1) FROM dbo.{definition['table']} WHERE {where} "
                        f"AND {definition['status_column']} = 'P' AND "
                        f"{definition['entry_column']} IN (SELECT UM_ID FROM dbo.T001_UserMaster "
                        "WHERE UM_Level_ID > %s)"
                    )
                    pending_params = [*params, reviewer_level]
                cursor.execute(pending_query, pending_params)
                pending = cursor.fetchone()[0]
            else:
                total, pending, legacy = aggregate_counts
        counts.append({
            "module": slug,
            "total": total or 0,
            "pending": pending or 0,
            "legacy": legacy or 0,
        })
    return Response({"role": request.user.role, "name": request.user.name, "counts": counts})


@api_view(["GET"])
@authentication_classes([WorkflowJWTAuthentication])
@permission_classes([IsAuthenticated])
def workflow_lookups(request):
    return Response(_lookups(request))


@api_view(["GET", "POST"])
@authentication_classes([WorkflowJWTAuthentication])
@permission_classes([IsAuthenticated])
def workflow_records(request, module):
    definition = MODULES.get(module)
    if definition is None:
        return Response({"error": "Unknown workflow module."}, status=status.HTTP_404_NOT_FOUND)
    if request.user.role == "silviculturist" and module not in SILVICULTURIST_MODULES:
        raise PermissionDenied("This module is outside the Silviculturist technical-review scope.")
    where, params = _scope_for(request.user, definition)
    if request.method == "GET":
        state = request.query_params.get("status")
        if state in {"P", "A", "R"}:
            where += f" AND {definition['status_column']} = %s"
            params.append(state)
            if state == "P" and request.user.role == "silviculturist":
                review_filter, review_params = _silviculturist_review_filter(
                    module,
                    definition,
                )
                where += f" AND {review_filter}"
                params.extend(review_params)
        elif state == "legacy":
            where += (
                f" AND ({definition['status_column']} IS NULL "
                f"OR {definition['status_column']} NOT IN ('P', 'A', 'R'))"
            )
        elif state:
            raise ValidationError({"status": "Select a valid workflow status."})
        if state == "P" and request.user.role in WORKFLOW_REVIEWER_LEVEL:
            where += (
                f" AND {definition['entry_column']} IN (SELECT UM_ID "
                "FROM dbo.T001_UserMaster WHERE UM_Level_ID > %s)"
            )
            params.append(WORKFLOW_REVIEWER_LEVEL[request.user.role])
        location_columns = {
            "state_id": definition["state_column"],
            "district_id": definition["district_column"],
            "circle_id": definition["circle_column"],
            "division_id": definition["division_column"],
            "range_id": definition["range_column"],
        }
        for query_name, column in location_columns.items():
            value = request.query_params.get(query_name)
            if value:
                selected_id = _positive_id(value, query_name)
                if column not in definition["columns"]:
                    raise ValidationError({query_name: "This module has no such location field."})
                where += f" AND {column} = %s"
                params.append(selected_id)
        search = request.query_params.get("search", "").strip()
        if search:
            if len(search) > 100:
                raise ValidationError({"search": "Search text cannot exceed 100 characters."})
            searchable_columns = [
                column for column in definition["columns"]
                if re.search(r"(Name|UniqueCode|Location|Address|Species)$", column, re.IGNORECASE)
            ]
            if searchable_columns:
                where += " AND (" + " OR ".join(
                    f"CAST({column} AS NVARCHAR(1000)) LIKE %s"
                    for column in searchable_columns
                ) + ")"
                params.extend([f"%{search}%"] * len(searchable_columns))
        limit = min(max(_int(request.query_params.get("limit")) or 100, 1), 500)
        offset = min(max(_int(request.query_params.get("offset")) or 0, 0), 1_000_000)
        columns = definition["columns"]
        query = (
            f"SELECT {', '.join(columns)} FROM dbo.{definition['table']} "
            f"WHERE {where} ORDER BY {definition['primary_key']} DESC "
            "OFFSET %s ROWS FETCH NEXT %s ROWS ONLY"
        )
        with connection.cursor() as cursor:
            cursor.execute(query, [*params, offset, limit])
            records = [
                dict(zip(columns, row))
                for row in cursor.fetchall()
            ]
            cursor.execute(
                f"SELECT COUNT(1) FROM dbo.{definition['table']} WHERE {where}",
                params,
            )
            count = cursor.fetchone()[0]
        _add_display_values(records)
        _add_record_creator_metadata(
            records,
            definition,
            _actor_id(request.user),
        )
        return Response({
            "module": module,
            "fields": definition["form_fields"],
            "location_filters": [
                name for name, column in (
                    ("state_id", definition["state_column"]),
                    ("district_id", definition["district_column"]),
                    ("circle_id", definition["circle_column"]),
                    ("division_id", definition["division_column"]),
                    ("range_id", definition["range_column"]),
                )
                if column in definition["columns"]
            ],
            "records": records,
            "count": count,
            "next_offset": offset + len(records) if offset + len(records) < count else None,
            "previous_offset": max(0, offset - limit) if offset else None,
        })

    if request.user.role == "silviculturist":
        raise PermissionDenied("Silviculturists provide technical checks; they cannot create field records.")
    if request.user.role == "ro" and _actor_id(request.user) is None:
        raise PermissionDenied("Your account does not have a valid database user ID.")
    values = _locations(request.user.role, request.user.scope, request.data, definition)
    columns = definition["field_columns"]
    insert = {}
    for field in definition["form_fields"]:
        field_name = field["name"]
        if field.get("upload"):
            stored_path = _upload(request, field_name, module)
            if stored_path:
                insert[columns[field_name]] = stored_path
            elif field["required"]:
                raise ValidationError(f"{field_name} is required.")
            continue
        if field_name in {"contact_person_phone", "staff_contact"}:
            value = _contact_number(values.get(field_name), field_name)
            if value is None and field["required"]:
                raise ValidationError(f"{field_name} is required.")
        else:
            value = _db_value(values.get(field_name), field)
        if value is not None or field["required"]:
            insert[columns[field_name]] = value

    prefix = definition["prefix"]
    if f"{prefix}_UniqueCode" in definition["fields"]:
        insert[f"{prefix}_UniqueCode"] = f"{prefix}-{uuid.uuid4().hex[:24].upper()}"
    national_submission = request.user.role == "national"
    insert[definition["active_column"]] = "Y" if national_submission else "N"
    insert[definition["entry_column"]] = _actor_id(request.user)
    insert[f"{prefix}_EntryOn"] = timezone.now()
    if definition["status_column"] in definition["fields"]:
        insert[definition["status_column"]] = "A" if national_submission else "P"
    if national_submission:
        insert[definition["approval_column"]] = _actor_id(request.user)
        insert[f"{prefix}_ApprovedOn"] = timezone.now()

    if insert[definition["entry_column"]] is None:
        raise PermissionDenied("Your account does not have a valid database user ID.")
    with transaction.atomic():
        with connection.cursor() as cursor:
            primary_key = definition["primary_key"]
            table = definition["table"]
            insert[primary_key] = _next_master_id(
                cursor,
                f"[{table}]",
                f"[{primary_key}]",
            )
            names = tuple(insert)
            statement = (
                f"INSERT INTO dbo.[{table}] ({', '.join(f'[{name}]' for name in names)}) "
                f"OUTPUT INSERTED.[{primary_key}] "
                f"VALUES ({', '.join(['%s'] * len(names))})"
            )
            cursor.execute(statement, list(insert.values()))
            new_id = cursor.fetchone()[0]
    return Response(
        {"id": new_id, "status": "A" if national_submission else "P"},
        status=status.HTTP_201_CREATED,
    )


def _save_requested_corrections(request, module, record_id, definition, where, params):
    if request.user.role != "ro":
        raise PermissionDenied("Only the submitting Range Officer can update recommended fields.")
    actor_id = _actor_id(request.user)
    if actor_id is None:
        raise PermissionDenied("Your account has no numeric workflow user ID.")

    changes = request.data.get("changes")
    if not isinstance(changes, dict):
        raise ValidationError({"changes": "Submit the requested field corrections."})
    specs = {
        field["name"]: field
        for field in _technical_review_fields(definition)
    }

    with transaction.atomic(), connection.cursor() as cursor:
        cursor.execute(
            f"SELECT {definition['status_column']}, {definition['entry_column']} "
            f"FROM dbo.{definition['table']} WITH (UPDLOCK, ROWLOCK) "
            f"WHERE {where} AND {definition['primary_key']} = %s",
            [*params, record_id],
        )
        record = cursor.fetchone()
        if (
            record is None
            or record[0] != "P"
            or _int(record[1]) != actor_id
        ):
            return Response(
                {"error": "Only your own pending record can receive corrections."},
                status=status.HTTP_404_NOT_FOUND,
            )

        recommendation = WorkflowTechnicalRecommendation.objects.filter(
            module=module,
            record_id=record_id,
            addressed_at__isnull=True,
        ).order_by("-created_at", "-id").first()
        if recommendation is None:
            return Response(
                {"error": "There are no pending Silviculturist recommendations for this record."},
                status=status.HTTP_409_CONFLICT,
            )
        try:
            requested_fields = json.loads(recommendation.requested_fields)
        except json.JSONDecodeError as error:
            raise ValidationError("The stored technical recommendation has invalid field data.") from error
        if not requested_fields or set(changes) != set(requested_fields):
            raise ValidationError({
                "changes": "Update exactly the fields requested by the Silviculturist."
            })

        lookup_data = (
            _lookups(request)
            if any(specs.get(name, {}).get("options") for name in requested_fields)
            else {}
        )
        updates = []
        correction_values = {}
        for name in requested_fields:
            field = specs.get(name)
            if field is None:
                raise ValidationError({"changes": f"Field {name} cannot be corrected through this form."})
            value = changes[name]
            if name in {"contact_person_phone", "staff_contact"}:
                value = _contact_number(value, name)
                if value is None and field["required"]:
                    raise ValidationError({name: f"{name} is required."})
            else:
                value = _db_value(value, field)
            if field.get("options") and value is not None:
                id_key = TECHNICAL_LOOKUP_ID_KEYS.get(field["options"], "id")
                allowed_values = {
                    str(option.get(id_key, option.get("id")))
                    for option in lookup_data.get(field["options"], [])
                }
                if str(value) not in allowed_values:
                    raise ValidationError({
                        name: "Select an active value available in your assigned jurisdiction."
                    })
            updates.append((definition["field_columns"][name], value))
            correction_values[name] = changes[name]

        assignments = ", ".join(f"{column} = %s" for column, _ in updates)
        cursor.execute(
            f"UPDATE dbo.{definition['table']} SET {assignments} "
            f"WHERE {where} AND {definition['primary_key']} = %s "
            f"AND {definition['entry_column']} = %s "
            f"AND {definition['status_column']} = 'P'",
            [*[value for _, value in updates], *params, record_id, actor_id],
        )
        if cursor.rowcount != 1:
            return Response(
                {"error": "The record could not be updated in its current workflow state."},
                status=status.HTTP_409_CONFLICT,
            )
        recommendation.addressed_by = actor_id
        recommendation.addressed_by_name = request.user.name or str(request.user)
        recommendation.addressed_at = timezone.now()
        recommendation.correction_values = json.dumps(correction_values, ensure_ascii=False)
        recommendation.save(update_fields=(
            "addressed_by",
            "addressed_by_name",
            "addressed_at",
            "correction_values",
        ))
    return Response({"id": record_id, "corrected_fields": requested_fields})


@api_view(["GET", "DELETE", "PATCH"])
@authentication_classes([WorkflowJWTAuthentication])
@permission_classes([IsAuthenticated])
def workflow_record_detail(request, module, record_id):
    definition = MODULES.get(module)
    if definition is None:
        return Response({"error": "Unknown workflow module."}, status=status.HTTP_404_NOT_FOUND)
    if request.user.role == "silviculturist" and module not in SILVICULTURIST_MODULES:
        raise PermissionDenied("This module is outside the Silviculturist technical-review scope.")
    where, params = _scope_for(request.user, definition)
    if request.method == "PATCH":
        return _save_requested_corrections(
            request,
            module,
            record_id,
            definition,
            where,
            params,
        )
    if request.method == "DELETE":
        actor_id = _actor_id(request.user)
        if actor_id is None:
            raise PermissionDenied("Your account has no numeric workflow user ID.")
        with transaction.atomic(), connection.cursor() as cursor:
            cursor.execute(
                f"DELETE FROM dbo.{definition['table']} WHERE {where} "
                f"AND {definition['primary_key']} = %s "
                f"AND {definition['entry_column']} = %s "
                f"AND {definition['status_column']} = 'P'",
                [*params, record_id, actor_id],
            )
            deleted = cursor.rowcount
        if deleted != 1:
            return Response(
                {"error": "Only your own pending records can be deleted."},
                status=status.HTTP_404_NOT_FOUND,
            )
        return Response(status=status.HTTP_204_NO_CONTENT)

    columns = definition["columns"]
    with connection.cursor() as cursor:
        cursor.execute(
            f"SELECT {', '.join(columns)} FROM dbo.{definition['table']} "
            f"WHERE {where} AND {definition['primary_key']} = %s",
            [*params, record_id],
        )
        row = cursor.fetchone()
    if row is None:
        return Response({"error": "Record was not found in your jurisdiction."}, status=status.HTTP_404_NOT_FOUND)
    record = dict(zip(columns, row))
    _add_display_values([record])
    _add_related_nursery_location(record)
    technical_reviews = WorkflowTechnicalRecommendation.objects.filter(
        module=module,
        record_id=record_id,
    ).order_by("created_at", "id")
    pending_recommendation = technical_reviews.filter(
        addressed_at__isnull=True
    ).order_by("-created_at", "-id").first()
    try:
        pending_fields = (
            json.loads(pending_recommendation.requested_fields)
            if pending_recommendation else []
        )
    except json.JSONDecodeError:
        pending_fields = []
    return Response({
        "module": module,
        "record": record,
        "workflow": _record_workflow_details(record, definition),
        "review_fields": _technical_review_fields(definition),
        "technical_reviews": [
            _technical_recommendation_dict(item)
            for item in technical_reviews
        ],
        "pending_recommendation": (
            {
                **_technical_recommendation_dict(pending_recommendation),
                "requested_fields": pending_fields,
            } if pending_recommendation else None
        ),
        "can_correct": bool(
            request.user.role == "ro"
            and pending_recommendation
            and pending_fields
            and record.get(definition["status_column"]) == "P"
            and _int(record.get(definition["entry_column"])) == _actor_id(request.user)
        ),
    })


@api_view(["POST"])
@authentication_classes([WorkflowJWTAuthentication])
@permission_classes([IsAuthenticated])
def workflow_decision(request, module, record_id):
    definition = MODULES.get(module)
    if definition is None:
        return Response({"error": "Unknown workflow module."}, status=status.HTTP_404_NOT_FOUND)
    if request.user.role in {"ro", "silviculturist"}:
        raise PermissionDenied("Your role cannot approve workflow records.")
    decision = request.data.get("decision")
    if decision not in {"approve", "reject"}:
        return Response({"error": "Decision must be approve or reject."}, status=status.HTTP_400_BAD_REQUEST)
    actor_id = _actor_id(request.user)
    if actor_id is None:
        raise PermissionDenied("Your account has no numeric T001_UserMaster ID to record this decision.")
    reviewer_level = WORKFLOW_REVIEWER_LEVEL.get(request.user.role)
    if reviewer_level is None:
        raise PermissionDenied("Your role cannot approve workflow records.")
    where, params = _scope_for(request.user, definition)
    if module in SILVICULTURIST_MODULES:
        with connection.cursor() as cursor:
            cursor.execute(
                f"SELECT 1 FROM dbo.{definition['table']} "
                f"WHERE {where} AND {definition['primary_key']} = %s "
                f"AND {definition['status_column']} = 'P' "
                f"AND EXISTS (SELECT 1 FROM dbo.T001_UserMaster AS submitter "
                f"WHERE submitter.UM_ID = {definition['entry_column']} "
                f"AND submitter.UM_Level_ID > %s)",
                [*params, record_id, reviewer_level],
            )
            eligible_record = cursor.fetchone()
        if eligible_record:
            review_history = list(
                WorkflowTechnicalRecommendation.objects.filter(
                    module=module,
                    record_id=record_id,
                ).order_by("id").values("requested_fields", "addressed_at")
            )
            if not _technical_review_history_complete(review_history):
                return Response(
                    {"error": "Silviculturist technical review must be complete before formal approval."},
                    status=status.HTTP_409_CONFLICT,
                )
    active = "Y" if decision == "approve" else "N"
    new_status = "A" if decision == "approve" else "R"
    with transaction.atomic(), connection.cursor() as cursor:
        cursor.execute(
            f"UPDATE target SET {definition['status_column']} = %s, "
            f"{definition['active_column']} = %s, {definition['approval_column']} = %s, "
            f"{definition['prefix']}_ApprovedOn = %s "
            f"FROM dbo.{definition['table']} AS target "
            f"WHERE {where} AND target.{definition['primary_key']} = %s "
            f"AND target.{definition['status_column']} = 'P' "
            f"AND EXISTS (SELECT 1 FROM dbo.T001_UserMaster AS submitter "
            f"WHERE submitter.UM_ID = target.{definition['entry_column']} "
            f"AND submitter.UM_Level_ID > %s)",
            [
                new_status, active, actor_id, timezone.now(),
                *params, record_id, reviewer_level,
            ],
        )
        changed = cursor.rowcount
    if changed != 1:
        with connection.cursor() as cursor:
            cursor.execute(
                f"SELECT 1 FROM dbo.{definition['table']} WHERE {where} "
                f"AND {definition['primary_key']} = %s "
                f"AND {definition['status_column']} = 'P'",
                [*params, record_id],
            )
            still_pending = cursor.fetchone()
        if still_pending:
                raise PermissionDenied("Only a superior office within your jurisdiction can review this record.")
        return Response(
            {"error": "Record was not found in your scope or is no longer pending."},
            status=status.HTTP_404_NOT_FOUND,
        )
    return Response({"id": record_id, "status": new_status})


@api_view(["POST"])
@authentication_classes([WorkflowJWTAuthentication])
@permission_classes([IsAuthenticated])
def workflow_technical_review(request, module, record_id):
    if request.user.role != "silviculturist":
        raise PermissionDenied("Only Silviculturists can record technical checks.")
    if module not in SILVICULTURIST_MODULES:
        raise PermissionDenied("This workflow does not require a Silviculturist technical check.")
    actor_id = _actor_id(request.user)
    if actor_id is None or not T001UserMaster.objects.filter(
        id=actor_id, level_id=5
    ).exists():
        raise PermissionDenied("Your Silviculturist account has no valid workflow identity.")
    recommendation_text = request.data.get("recommendation")
    if not isinstance(recommendation_text, str) or not recommendation_text.strip():
        raise ValidationError({"recommendation": "Enter technical findings or recommendations."})
    if len(recommendation_text) > 8000:
        raise ValidationError({"recommendation": "Recommendations cannot exceed 8,000 characters."})
    requested_fields = request.data.get("fields", [])
    if (
        not isinstance(requested_fields, list)
        or any(not isinstance(name, str) for name in requested_fields)
        or len(set(requested_fields)) != len(requested_fields)
    ):
        raise ValidationError({"fields": "Select a valid list of fields for RO correction."})
    available_fields = {
        field["name"] for field in _technical_review_fields(MODULES[module])
    }
    if not set(requested_fields).issubset(available_fields):
        raise ValidationError({"fields": "Only editable record fields may be recommended for correction."})

    definition = MODULES[module]
    where, params = _scope_for(request.user, definition)
    with transaction.atomic(), connection.cursor() as cursor:
        cursor.execute(
            f"SELECT {definition['status_column']}, {definition['approval_column']} "
            f"FROM dbo.{definition['table']} WITH (UPDLOCK, ROWLOCK) "
            f"WHERE {where} AND {definition['primary_key']} = %s",
            [*params, record_id],
        )
        record = cursor.fetchone()
        if record is None or record[0] != "P":
            return Response(
                {"error": "Record was not found in your scope or is no longer pending."},
                status=status.HTTP_404_NOT_FOUND,
            )
        latest_recommendation = WorkflowTechnicalRecommendation.objects.filter(
            module=module,
            record_id=record_id,
        ).order_by("-id").first()
        if latest_recommendation and latest_recommendation.addressed_at is None:
            try:
                latest_fields = json.loads(latest_recommendation.requested_fields)
            except json.JSONDecodeError as error:
                raise ValidationError(
                    {"fields": "The stored technical recommendation has invalid field data."}
                ) from error
            if not isinstance(latest_fields, list):
                raise ValidationError(
                    {"fields": "The stored technical recommendation has invalid field data."}
                )
            if latest_fields:
                return Response(
                    {"error": "The Range Officer must apply the requested corrections before re-review."},
                    status=status.HTTP_409_CONFLICT,
                )
        cursor.execute(
            f"UPDATE dbo.{definition['table']} SET {definition['approval_column']} = %s, "
            f"{definition['prefix']}_ApprovedOn = %s WHERE {where} "
            f"AND {definition['primary_key']} = %s AND {definition['status_column']} = 'P'",
            [actor_id, timezone.now(), *params, record_id],
        )
        changed = cursor.rowcount
    if changed != 1:
        return Response(
            {"error": "Record was not found in your scope or is no longer pending."},
            status=status.HTTP_404_NOT_FOUND,
        )
    WorkflowTechnicalRecommendation.objects.create(
        module=module,
        record_id=record_id,
        reviewed_by=actor_id,
        reviewer_name=request.user.name or str(request.user),
        requested_fields=json.dumps(requested_fields, ensure_ascii=False),
        recommendation=recommendation_text.strip(),
    )
    return Response(
        {"id": record_id, "technical_reviewed": True},
        status=status.HTTP_201_CREATED,
    )


def _managed_ro_users(user):
    if user.role == "national":
        return T001UserMaster.objects.filter(level_id=5, user_type="U")
    if user.role == "ro":
        raise PermissionDenied("Range Officers cannot manage user accounts.")
    scope = user.scope
    state_id = _int(scope.get("state_id"))
    if not state_id:
        raise PermissionDenied("Your account has no valid state mapping.")
    users = T001UserMaster.objects.filter(
        level_id=5,
        user_type="U",
        state_id=state_id,
    )
    if user.role == "state":
        return users
    if user.role == "circle":
        circle_id = _int(scope.get("circle_id"))
        if not circle_id:
            raise PermissionDenied(
                "Your session has no mapped PARIVESH Circle office. Log in again after selecting "
                "your Circle office; contact the administrator if PARIVESH does not return one."
            )
        division_ids = M003Division.objects.filter(
            division_circle_id=circle_id,
            division_active="Y",
        ).values_list("division_id", flat=True)
        range_ids = M004Range.objects.filter(
            range_division_id__in=division_ids,
            range_active="Y",
        ).values_list("range_id", flat=True)
        return users.filter(
            Q(circle_id=circle_id)
            | Q(division_id__in=division_ids)
            | Q(range_id__in=range_ids)
        )
    if user.role == "dfo":
        division_id = _int(scope.get("division_id"))
        if not division_id:
            raise PermissionDenied("Your PARIVESH division could not be mapped to the directory.")
        range_ids = M004Range.objects.filter(
            range_division_id=division_id,
            range_active="Y",
        ).values_list("range_id", flat=True)
        return users.filter(range_id__in=range_ids)
    raise PermissionDenied("Your role cannot manage user accounts.")


@api_view(["GET", "PATCH"])
@authentication_classes([WorkflowJWTAuthentication])
@permission_classes([IsAuthenticated])
def workflow_users(request):
    users = _managed_ro_users(request.user)
    if request.method == "GET":
        limit = min(max(_int(request.query_params.get("limit")) or 100, 1), 500)
        offset = min(max(_int(request.query_params.get("offset")) or 0, 0), 1_000_000)
        count = users.count()
        records = list(users.order_by("-id").values(
            "id", "fname", "lname", "emailid", "state_id", "district_id",
            "circle_id", "division_id", "range_id", "approved", "active",
            "account_blocked",
        )[offset:offset + limit])
        return Response({
            "users": records,
            "count": count,
            "next_offset": offset + len(records) if offset + len(records) < count else None,
            "previous_offset": max(0, offset - limit) if offset else None,
        })

    user_id = _int(request.data.get("user_id"))
    action = request.data.get("action")
    if not user_id or action not in {
        "approve", "activate", "deactivate", "block", "unblock",
    }:
        raise ValidationError("A valid user ID and account action are required.")
    target = users.filter(id=user_id)
    if not target.exists():
        raise PermissionDenied("The selected user is outside your assigned office.")
    if action == "approve":
        target.update(approved="Y", active="Y")
    elif action == "activate":
        if target.filter(approved="Y").exists() is False:
            raise ValidationError("Approve the registration before activating the account.")
        target.update(active="Y")
    elif action == "deactivate":
        target.update(active="N")
    elif action == "block":
        target.update(account_blocked="Y")
    else:
        target.update(account_blocked="N")
    return Response({"user_id": user_id, "action": action, "success": True})


ADMIN_LEVELS = {"national": 1, "state": 2, "circle": 3, "dfo": 4}
ADMIN_CHILD_LEVELS = {"national": 2, "state": 3, "circle": 4, "dfo": 5}


def _admin_actor(request):
    if request.user.role not in ADMIN_LEVELS:
        raise PermissionDenied("Your role cannot manage users or master data.")
    return request.user


def _require_admin_actor_id(user):
    actor_id = _actor_id(user)
    if actor_id is None:
        raise PermissionDenied(
            "Your account is not mapped to a numeric T001_UserMaster ID, so changes cannot be audited."
        )
    return actor_id


def _admin_users(user, level_id=None):
    users = T001UserMaster.objects.all()
    if level_id is not None:
        users = users.filter(level_id=level_id)
    users = users.exclude(
        emailid__in=CampaSilviculturistUser.objects.values_list("emailid", flat=True)
    )
    if user.role == "national":
        return users
    scope = user.scope
    state_id = _int(scope.get("state_id"))
    if not state_id:
        raise PermissionDenied("Your account has no valid state mapping.")
    users = users.filter(state_id=state_id)
    if user.role == "state":
        return users
    if user.role == "circle":
        circle_id = _int(scope.get("circle_id"))
        if not circle_id:
            raise PermissionDenied("Your account has no valid circle mapping.")
        division_ids = M003Division.objects.filter(
            division_circle_id=circle_id,
            division_active="Y",
        ).values_list("division_id", flat=True)
        range_ids = M004Range.objects.filter(
            range_division_id__in=division_ids,
            range_active="Y",
        ).values_list("range_id", flat=True)
        return users.filter(
            Q(division_id__in=division_ids)
            | Q(range_id__in=range_ids)
        )
    division_id = _int(scope.get("division_id"))
    if not division_id:
        raise PermissionDenied("Your account has no valid division mapping.")
    range_ids = M004Range.objects.filter(
        range_division_id=division_id,
        range_active="Y",
    ).values_list("range_id", flat=True)
    return users.filter(level_id=5, range_id__in=range_ids)


def _positive_id(value, field_name, *, required=True):
    if value in (None, "") and not required:
        return None
    if isinstance(value, bool):
        raise ValidationError(f"{field_name} must be a positive integer.")
    parsed = _int(value)
    if parsed is None or parsed <= 0:
        raise ValidationError(f"{field_name} must be a positive integer.")
    return parsed


def _next_master_id(cursor, table, column):
    cursor.execute(
        f"SELECT ISNULL(MAX({column}), 0) + 1 "
        f"FROM dbo.{table} WITH (TABLOCKX, HOLDLOCK)"
    )
    return cursor.fetchone()[0]


def _admin_scope_location(user, level_id, data):
    scope = user.scope
    if level_id != ADMIN_CHILD_LEVELS[user.role]:
        raise PermissionDenied("You may only create an account one level below your own.")

    state_id = _positive_id(data.get("state_id"), "state_id")
    circle_id = _positive_id(data.get("circle_id"), "circle_id", required=False)
    division_id = _positive_id(data.get("division_id"), "division_id", required=False)
    range_id = _positive_id(data.get("range_id"), "range_id", required=False)
    actor_state = _int(scope.get("state_id"))
    actor_circle = _int(scope.get("circle_id"))
    actor_division = _int(scope.get("division_id"))

    if user.role == "national":
        parent_filters = {}
    elif user.role == "state":
        if not actor_state or state_id != actor_state:
            raise PermissionDenied("The selected state is outside your assigned office.")
        parent_filters = {}
    elif user.role == "circle":
        if not actor_state or not actor_circle or state_id != actor_state:
            raise PermissionDenied("The selected state or circle is outside your assigned office.")
        if circle_id is not None and circle_id != actor_circle:
            raise PermissionDenied("The selected circle is outside your assigned office.")
        parent_filters = {"division": actor_circle}
        circle_id = actor_circle
    else:
        if not actor_state or not actor_division or state_id != actor_state:
            raise PermissionDenied("The selected state or division is outside your assigned office.")
        if division_id is not None and division_id != actor_division:
            raise PermissionDenied("The selected division is outside your assigned office.")
        parent_filters = {"range": actor_division}
        division_id = actor_division

    if user.role == "state":
        if not circle_id:
            raise ValidationError({"circle_id": "Select a circle for the new account."})
        if not M002Circle.objects.filter(
            circle_id=circle_id, circle_state_id=state_id, circle_active="Y"
        ).exists():
            raise ValidationError({"circle_id": "Select an active circle in the chosen state."})
    elif user.role == "circle":
        if not division_id or not M003Division.objects.filter(
            division_id=division_id,
            division_circle_id=parent_filters["division"],
            division_active="Y",
        ).exists():
            raise ValidationError({"division_id": "Select an active division in your circle."})
    elif user.role == "dfo":
        if not range_id or not M004Range.objects.filter(
            range_id=range_id,
            range_division_id=parent_filters["range"],
            range_active="Y",
        ).exists():
            raise ValidationError({"range_id": "Select an active range in your division."})

    return {
        "state_id": state_id,
        "circle_id": circle_id,
        "division_id": division_id,
        "range_id": range_id,
    }


def _compartments_for_section(range_id, section_id):
    if not range_id or not section_id:
        return []
    section = M005Section.objects.filter(
        section_id=section_id,
        section_range_id=range_id,
        section_active="Y",
    ).values("section_id").first()
    if section is None:
        return []
    return list(
        M006Compartment.objects.filter(
            compart_section_id=section["section_id"],
            compart_active="Y",
        )
        .order_by("compart_name")
        .values("compart_id", "compart_section_id", "compart_name")
    )


def _silviculturist_scope_location(user, data):
    scope = user.scope
    state_id = _positive_id(data.get("state_id"), "state_id")
    circle_id = _positive_id(data.get("circle_id"), "circle_id", required=False)
    division_id = _positive_id(data.get("division_id"), "division_id", required=False)
    actor_state = _int(scope.get("state_id"))
    actor_circle = _int(scope.get("circle_id"))
    actor_division = _int(scope.get("division_id"))

    if user.role == "national":
        pass
    elif user.role == "state":
        if not actor_state or state_id != actor_state:
            raise PermissionDenied("The selected state is outside your assigned office.")
    elif user.role == "circle":
        if not actor_state or not actor_circle or state_id != actor_state:
            raise PermissionDenied("The selected state or circle is outside your assigned office.")
        if circle_id is not None and circle_id != actor_circle:
            raise PermissionDenied("The selected circle is outside your assigned office.")
        circle_id = actor_circle
    elif user.role == "dfo":
        if not actor_state or not actor_division or state_id != actor_state:
            raise PermissionDenied("The selected state or division is outside your assigned office.")
        if division_id is not None and division_id != actor_division:
            raise PermissionDenied("The selected division is outside your assigned office.")
        division_id = actor_division
    else:
        raise PermissionDenied("Your role cannot create Silviculturist accounts.")

    if not M001State.objects.filter(state_id=state_id, state_active="Y").exists():
        raise ValidationError({"state_id": "Select an active state."})
    if circle_id is not None and not M002Circle.objects.filter(
        circle_id=circle_id, circle_state_id=state_id, circle_active="Y"
    ).exists():
        raise ValidationError({"circle_id": "Select an active circle in the chosen state."})
    if division_id is not None:
        division = M003Division.objects.filter(
            division_id=division_id,
            division_active="Y",
        ).values("division_circle_id").first()
        if division is None:
            raise ValidationError({"division_id": "Select an active division."})
        division_circle_id = division["division_circle_id"]
        if circle_id is not None and division_circle_id != circle_id:
            raise ValidationError({"division_id": "Select a division in the chosen circle."})
        if not M002Circle.objects.filter(
            circle_id=division_circle_id,
            circle_state_id=state_id,
            circle_active="Y",
        ).exists():
            raise ValidationError({"division_id": "Select a division in the chosen state."})
        circle_id = division_circle_id
    return {
        "state_id": state_id,
        "circle_id": circle_id,
        "division_id": division_id,
    }


def _silviculturist_accounts(user):
    accounts = T001UserMaster.objects.filter(
        level_id=5,
        user_type="U",
        emailid__in=CampaSilviculturistUser.objects.values_list("emailid", flat=True),
    )
    if user.role == "national":
        return accounts
    state_id = _int(user.scope.get("state_id"))
    if not state_id:
        raise PermissionDenied("Your account has no valid state mapping.")
    accounts = accounts.filter(state_id=state_id)
    if user.role == "state":
        return accounts
    if user.role == "circle":
        circle_id = _int(user.scope.get("circle_id"))
        if not circle_id:
            raise PermissionDenied("Your account has no valid circle mapping.")
        return accounts.filter(circle_id=circle_id)
    division_id = _int(user.scope.get("division_id"))
    if not division_id:
        raise PermissionDenied("Your account has no valid division mapping.")
    return accounts.filter(division_id=division_id)


@api_view(["GET", "POST", "PATCH"])
@authentication_classes([WorkflowJWTAuthentication])
@permission_classes([IsAuthenticated])
def workflow_admin_users(request):
    actor = _admin_actor(request)
    if request.method != "GET":
        _require_admin_actor_id(actor)
    if request.method == "GET":
        level_id = _int(request.query_params.get("level_id"))
        if level_id is not None and level_id not in range(1, 6):
            raise ValidationError({"level_id": "Select a valid user level."})
        user_type = request.query_params.get("user_type")
        if user_type and user_type not in {"A", "U"}:
            raise ValidationError({"user_type": "Select a valid account role."})
        users = _admin_users(actor, level_id)
        if user_type:
            users = users.filter(user_type=user_type)
        limit = min(max(_int(request.query_params.get("limit")) or 100, 1), 500)
        offset = min(max(_int(request.query_params.get("offset")) or 0, 0), 1_000_000)
        count = users.count()
        records = list(
            users.order_by("-id").values(
                "id", "level_id", "user_type", "fname", "lname", "emailid",
                "designation_id", "contact_number", "alternate_contact_number",
                "state_id", "district_id", "circle_id", "division_id", "range_id",
                "approved", "active", "account_blocked", "status",
            )[offset:offset + limit]
        )
        return Response({
            "users": records,
            "count": count,
            "next_offset": offset + len(records) if offset + len(records) < count else None,
            "previous_offset": max(0, offset - limit) if offset else None,
        })

    if request.method == "POST":
        level_id = _positive_id(request.data.get("level_id"), "level_id")
        user_type = request.data.get("user_type")
        if not isinstance(user_type, str) or user_type not in {"A", "U"}:
            raise ValidationError({"user_type": "Select Admin or User."})
        fname = request.data.get("fname")
        lname = request.data.get("lname")
        email = request.data.get("email")
        password = request.data.get("password")
        confirm_password = request.data.get("confirm_password")
        if not all(isinstance(value, str) and value.strip() for value in (fname, lname, email)):
            raise ValidationError("First name, last name, and email are required.")
        if len(fname.strip()) > 80 or len(lname.strip()) > 80 or len(email.strip()) > 200:
            raise ValidationError("Name or email exceeds the allowed length.")
        from django.core.validators import EmailValidator
        from django.core.exceptions import ValidationError as DjangoValidationError
        try:
            EmailValidator()(email.strip())
        except DjangoValidationError as error:
            raise ValidationError({"email": "Enter a valid email address."}) from error
        if not isinstance(password, str) or len(password) < 8 or len(password) > 1024:
            raise ValidationError({"password": "Password must be between 8 and 1024 characters."})
        if password != confirm_password:
            raise ValidationError({"confirm_password": "Passwords do not match."})
        designation_id = _positive_id(request.data.get("designation_id"), "designation_id")
        location = _admin_scope_location(actor, level_id, request.data)
        contact = _contact_number(request.data.get("contact_number"), "contact_number")
        alternate = _contact_number(
            request.data.get("alternate_contact_number"),
            "alternate_contact_number",
        )
        if not M001State.objects.filter(
            state_id=location["state_id"], state_active="Y"
        ).exists():
            raise ValidationError({"state_id": "Select an active state."})
        with transaction.atomic():
            with connection.cursor() as cursor:
                cursor.execute(
                    "SELECT Designation_ID FROM dbo.M015_Designation "
                    "WHERE Designation_ID = %s AND Designation_Active = 'Y'",
                    [designation_id],
                )
                if cursor.fetchone() is None:
                    raise ValidationError({"designation_id": "Select an active designation."})
                if T001UserMaster.objects.filter(emailid__iexact=email.strip()).exists():
                    raise ValidationError({"email": "This email address is already registered."})
                user_id = _next_master_id(cursor, "T001_UserMaster", "UM_ID")
                cursor.execute(
                    """
                    INSERT INTO dbo.T001_UserMaster (
                        UM_ID, UM_Project_ID, UM_Level_ID, UM_State_ID,
                        UM_District_ID, UM_Circle_ID, UM_Division_ID, UM_Range_ID,
                        UM_Type, UM_FName, UM_LName, UM_EmailID, UM_Password,
                        UM_Designation_ID, UM_MobileNo, UM_AlternateMobileNo,
                        Language_Code, UM_EntryBy, UM_EntryDate, UM_Approved,
                        UM_Active, UM_Password_Attempted, UM_Password_Set,
                        UM_AC_Blocked, UM_Nodal_officer, UM_Status
                    ) VALUES (
                        %s, 2001, %s, %s, NULL, %s, %s, %s, %s, %s, %s, %s,
                        %s, %s, %s, %s, 1, %s, %s, %s, %s, 0, 'Y', 'N', 0, 1
                    )
                    """,
                    [
                        user_id, level_id, location["state_id"], location["circle_id"],
                        location["division_id"], location["range_id"], user_type,
                        fname.strip(), lname.strip(), email.strip(),
                        make_password(password), designation_id, contact, alternate,
                        _actor_id(actor), timezone.now(),
                        "N" if level_id == 5 else "Y",
                        "N" if level_id == 5 else "Y",
                    ],
                )
        return Response({"id": user_id, "success": True}, status=status.HTTP_201_CREATED)

    user_id = _positive_id(request.data.get("user_id"), "user_id")
    action = request.data.get("action")
    scoped_users = _admin_users(actor)
    target = scoped_users.filter(id=user_id)
    target_user = target.values("level_id", "user_type", "approved").first()
    if target_user is None:
        raise PermissionDenied("The selected user is outside your assigned office.")
    if action == "reset_password":
        if actor.role != "state":
            raise PermissionDenied("Only State/Nodal officers may reset account passwords.")
        password = request.data.get("password")
        confirm_password = request.data.get("confirm_password")
        if not isinstance(password, str) or len(password) < 8 or len(password) > 1024:
            raise ValidationError({"password": "Password must be between 8 and 1024 characters."})
        if password != confirm_password:
            raise ValidationError({"confirm_password": "Passwords do not match."})
        with connection.cursor() as cursor:
            cursor.execute(
                """
                UPDATE dbo.T001_UserMaster
                SET UM_Password = %s, UM_Password_Set = 'Y',
                    UM_Password_Attempted = 0, UM_LastUpdateBy = %s,
                    UM_LastUpdateDate = %s
                WHERE UM_ID = %s
                """,
                [make_password(password), _actor_id(actor), timezone.now(), user_id],
            )
        return Response({"user_id": user_id, "action": action, "success": True})
    if not isinstance(action, str) or action not in {
        "approve", "activate", "deactivate", "block", "unblock",
    }:
        raise ValidationError("A valid user action is required.")
    if action == "approve":
        if target_user["level_id"] != 5:
            raise PermissionDenied("Only Range Officer and Silviculturist accounts require approval.")
        target.update(approved="Y", active="Y")
    elif action == "activate":
        if target_user["level_id"] != 5:
            raise PermissionDenied("Only Range Officer and Silviculturist accounts require activation.")
        if target_user["approved"] != "Y":
            raise ValidationError("Approve the account before activating it.")
        target.update(active="Y")
    elif action == "deactivate":
        if target_user["level_id"] != 5:
            raise PermissionDenied("Office-level accounts do not require activation management.")
        target.update(active="N")
    elif action == "block":
        target.update(account_blocked="Y")
    else:
        target.update(account_blocked="N")
    return Response({"user_id": user_id, "action": action, "success": True})


@api_view(["GET", "POST", "PATCH"])
@authentication_classes([WorkflowJWTAuthentication])
@permission_classes([IsAuthenticated])
def workflow_admin_silviculturists(request):
    actor = _admin_actor(request)
    if request.method != "GET":
        _require_admin_actor_id(actor)

    linked_emails = CampaSilviculturistUser.objects.values_list("emailid", flat=True)
    if request.method == "GET":
        users = _silviculturist_accounts(actor)
        count = users.count()
        limit = min(max(_int(request.query_params.get("limit")) or 100, 1), 500)
        offset = min(max(_int(request.query_params.get("offset")) or 0, 0), 1_000_000)
        records = list(users.order_by("-id").values(
            "id", "fname", "lname", "emailid", "contact_number",
            "state_id", "circle_id", "division_id",
        )[offset:offset + limit])
        state_names = dict(M001State.objects.filter(
            state_id__in={record["state_id"] for record in records}
        ).values_list("state_id", "state_name"))
        circle_names = dict(M002Circle.objects.filter(
            circle_id__in={record["circle_id"] for record in records if record["circle_id"]}
        ).values_list("circle_id", "circle_name"))
        division_names = dict(M003Division.objects.filter(
            division_id__in={record["division_id"] for record in records if record["division_id"]}
        ).values_list("division_id", "division_name"))
        account_states = {
            account["emailid"].lower(): account["is_active"]
            for account in CampaSilviculturistUser.objects.filter(
                emailid__in=[record["emailid"] for record in records]
            ).values("emailid", "is_active")
        }
        for record in records:
            record["active"] = account_states.get(record["emailid"].lower(), False)
            record["state_name"] = state_names.get(record["state_id"])
            record["circle_name"] = circle_names.get(record["circle_id"])
            record["division_name"] = division_names.get(record["division_id"])
        return Response({
            "users": records,
            "count": count,
            "next_offset": offset + len(records) if offset + len(records) < count else None,
            "previous_offset": max(0, offset - limit) if offset else None,
        })

    if request.method == "PATCH":
        user_id = _positive_id(request.data.get("user_id"), "user_id")
        action = request.data.get("action")
        if action not in {"activate", "deactivate"}:
            raise ValidationError({"action": "Select activate or deactivate."})
        target = _silviculturist_accounts(actor).filter(
            id=user_id, emailid__in=linked_emails
        ).values("emailid").first()
        if target is None:
            raise PermissionDenied("The selected Silviculturist is outside your assigned office.")
        updated = CampaSilviculturistUser.objects.filter(
            emailid__iexact=target["emailid"]
        ).update(is_active=(action == "activate"))
        if updated != 1:
            raise ValidationError("The Silviculturist account could not be updated.")
        return Response({"user_id": user_id, "action": action, "success": True})

    fname = request.data.get("fname")
    lname = request.data.get("lname")
    email = request.data.get("email")
    password = request.data.get("password")
    confirm_password = request.data.get("confirm_password")
    if not all(isinstance(value, str) and value.strip() for value in (fname, lname, email)):
        raise ValidationError("First name, last name, and email are required.")
    if len(fname.strip()) > 80 or len(lname.strip()) > 80 or len(email.strip()) > 200:
        raise ValidationError("Name or email exceeds the allowed length.")
    from django.core.validators import EmailValidator
    from django.core.exceptions import ValidationError as DjangoValidationError
    try:
        EmailValidator()(email.strip())
    except DjangoValidationError as error:
        raise ValidationError({"email": "Enter a valid email address."}) from error
    if not isinstance(password, str) or len(password) < 8 or len(password) > 1024:
        raise ValidationError({"password": "Password must be between 8 and 1024 characters."})
    if password != confirm_password:
        raise ValidationError({"confirm_password": "Passwords do not match."})
    designation_id = _positive_id(
        request.data.get("designation_id"),
        "designation_id",
    )
    contact = _contact_number(request.data.get("contact_number"), "contact_number")
    alternate = _contact_number(
        request.data.get("alternate_contact_number"),
        "alternate_contact_number",
    )
    location = _silviculturist_scope_location(actor, request.data)
    if T001UserMaster.objects.filter(emailid__iexact=email.strip()).exists() or \
            CampaSilviculturistUser.objects.filter(emailid__iexact=email.strip()).exists():
        raise ValidationError({"email": "This email address is already registered."})

    with transaction.atomic(), connection.cursor() as cursor:
        cursor.execute(
            "SELECT Designation_Name FROM dbo.M015_Designation "
            "WHERE Designation_ID = %s AND Designation_Active = 'Y'",
            [designation_id],
        )
        designation_row = cursor.fetchone()
        if designation_row is None:
            raise ValidationError({"designation_id": "Select an active designation."})
        designation_name = designation_row[0]
        user_id = _next_master_id(cursor, "T001_UserMaster", "UM_ID")
        cursor.execute(
            """
            INSERT INTO dbo.T001_UserMaster (
                UM_ID, UM_Project_ID, UM_Level_ID, UM_State_ID,
                UM_District_ID, UM_Circle_ID, UM_Division_ID, UM_Range_ID,
                UM_Type, UM_FName, UM_LName, UM_EmailID, UM_Password,
                UM_Designation_ID, UM_MobileNo, UM_AlternateMobileNo,
                Language_Code, UM_EntryBy, UM_EntryDate, UM_Approved,
                UM_Active, UM_Password_Attempted, UM_Password_Set,
                UM_AC_Blocked, UM_Nodal_officer, UM_Status
            ) VALUES (
                %s, 2001, 5, %s, NULL, %s, %s, NULL, 'U', %s, %s, %s,
                %s, %s, %s, %s, 1, %s, %s, 'N', 'N', 0, 'Y', 'Y', 0, 0
            )
            """,
            [
                user_id, location["state_id"], location["circle_id"],
                location["division_id"], fname.strip(), lname.strip(),
                email.strip(), make_password(password), designation_id, contact, alternate,
                _actor_id(actor), timezone.now(),
            ],
        )
        silviculturist = CampaSilviculturistUser(
            user_level="Silviculturist",
            fname=fname.strip(),
            lname=lname.strip(),
            emailid=email.strip(),
            contact_number=contact,
            alternate_contact_number=alternate,
            designation=designation_name,
            role="User",
            is_active=False,
        )
        silviculturist.set_password(password)
        silviculturist.save()
    return Response({"id": user_id, "success": True}, status=status.HTTP_201_CREATED)


@api_view(["GET", "POST", "PATCH"])
@authentication_classes([WorkflowJWTAuthentication])
@permission_classes([IsAuthenticated])
def workflow_admin_masters(request, master):
    actor = _admin_actor(request)
    if request.method != "GET":
        _require_admin_actor_id(actor)
    if not isinstance(master, str) or master not in {
        "designations", "species", "species-age-height",
    }:
        return Response({"error": "Unknown master data type."}, status=status.HTTP_404_NOT_FOUND)
    if master == "designations":
        table, key, active = "M015_Designation", "Designation_ID", "Designation_Active"
        columns = "Designation_ID, Designation_Code, Designation_Name, Designation_Active"
    elif master == "species":
        table, key, active = "M007_Species", "Species_ID", "Species_Active"
        columns = "Species_ID, Species_Name, Species_S_Name, Species_POWO, Species_Active"
    else:
        table, key, active = "T003_SpeciesAgeHeight", "SAH_ID", "SAH_Active"
        columns = "SAH_ID, SAH_State_ID, SAH_Species_ID, SAH_Age_ID, SAH_Height_ID, SAH_Remarks, SAH_Active"

    if request.method == "GET":
        where, params = "1 = 1", []
        if master == "species-age-height":
            state_id = _int(request.query_params.get("state_id")) or _int(actor.scope.get("state_id"))
            if actor.role != "national":
                if not state_id or state_id != _int(actor.scope.get("state_id")):
                    raise PermissionDenied("The requested state is outside your assigned office.")
            if state_id:
                where, params = "SAH_State_ID = %s", [state_id]
        limit = min(max(_int(request.query_params.get("limit")) or 100, 1), 500)
        offset = min(max(_int(request.query_params.get("offset")) or 0, 0), 1_000_000)
        with connection.cursor() as cursor:
            cursor.execute(f"SELECT COUNT(1) FROM dbo.{table} WHERE {where}", params)
            count = cursor.fetchone()[0]
            cursor.execute(
                f"SELECT {columns} FROM dbo.{table} WHERE {where} "
                f"ORDER BY {key} DESC OFFSET %s ROWS FETCH NEXT %s ROWS ONLY",
                [*params, offset, limit],
            )
            records = [dict(zip(columns.split(", "), row)) for row in cursor.fetchall()]
        return Response({"records": records, "count": count})

    if master == "designations":
        if request.method == "POST":
            name = request.data.get("name")
            code = request.data.get("code")
            if not isinstance(name, str) or not name.strip() or len(name.strip()) > 200:
                raise ValidationError({"name": "Enter a designation name up to 200 characters."})
            if not isinstance(code, str) or not code.strip() or len(code.strip()) > 50:
                raise ValidationError({"code": "Enter a designation code up to 50 characters."})
            with transaction.atomic(), connection.cursor() as cursor:
                new_id = _next_master_id(cursor, table, key)
                cursor.execute(
                    "SELECT 1 FROM dbo.M015_Designation WHERE Designation_Code = %s",
                    [code.strip()],
                )
                if cursor.fetchone() is not None:
                    raise ValidationError({"code": "This designation code already exists."})
                cursor.execute(
                    "INSERT INTO dbo.M015_Designation "
                    "(Designation_ID, Designation_Code, Designation_Name, Language_Code, "
                    "Designation_Active, Designation_EntryBy, Designation_EntryOn) "
                    "VALUES (%s, %s, %s, 1, 'Y', %s, %s)",
                    [new_id, code.strip(), name.strip(), _actor_id(actor), timezone.now()],
                )
            return Response({"id": new_id, "success": True}, status=status.HTTP_201_CREATED)
        record_id = _positive_id(request.data.get("id"), "id")
        active_value = "Y" if request.data.get("active") is True else "N"
        with connection.cursor() as cursor:
            cursor.execute(
                "UPDATE dbo.M015_Designation SET Designation_Active = %s, "
                "Designation_UpdatedBy = %s, Designation_UpdatedOn = %s "
                "WHERE Designation_ID = %s",
                [active_value, _actor_id(actor), timezone.now(), record_id],
            )
            if cursor.rowcount != 1:
                raise ValidationError("The selected designation was not found.")
        return Response({"id": record_id, "active": active_value})

    if master == "species":
        if request.method == "POST":
            name = request.data.get("name")
            scientific_name = request.data.get("scientific_name") or ""
            powo = request.data.get("powo") or None
            if not isinstance(name, str) or not name.strip() or len(name.strip()) > 500:
                raise ValidationError({"name": "Enter a species name up to 500 characters."})
            if not isinstance(scientific_name, str) or len(scientific_name) > 4000:
                raise ValidationError({"scientific_name": "Scientific name is too long."})
            if powo is not None and (not isinstance(powo, str) or len(powo) > 100):
                raise ValidationError({"powo": "POWO reference cannot exceed 100 characters."})
            with transaction.atomic(), connection.cursor() as cursor:
                new_id = _next_master_id(cursor, table, key)
                cursor.execute(
                    "SELECT 1 FROM dbo.M007_Species WHERE Species_Name = %s",
                    [name.strip()],
                )
                if cursor.fetchone() is not None:
                    raise ValidationError({"name": "This species name already exists."})
                cursor.execute(
                    "INSERT INTO dbo.M007_Species "
                    "(Species_ID, Species_Name, Species_S_Name, Species_Active, "
                    "Species_EntryBy, Species_EntryOn, Species_POWO) "
                    "VALUES (%s, %s, %s, 'Y', %s, %s, %s)",
                    [new_id, name.strip(), scientific_name.strip() or None, _actor_id(actor), timezone.now(), powo],
                )
            return Response({"id": new_id, "success": True}, status=status.HTTP_201_CREATED)
        record_id = _positive_id(request.data.get("id"), "id")
        active_value = "Y" if request.data.get("active") is True else "N"
        with connection.cursor() as cursor:
            cursor.execute(
                "UPDATE dbo.M007_Species SET Species_Active = %s, "
                "Species_UpdatedBy = %s, Species_UpdatedOn = %s WHERE Species_ID = %s",
                [active_value, _actor_id(actor), timezone.now(), record_id],
            )
            if cursor.rowcount != 1:
                raise ValidationError("The selected species was not found.")
        return Response({"id": record_id, "active": active_value})

    if request.method == "POST":
        state_id = _positive_id(
            request.data.get("state_id") or actor.scope.get("state_id"), "state_id"
        )
        if actor.role != "national" and state_id != _int(actor.scope.get("state_id")):
            raise PermissionDenied("The selected state is outside your assigned office.")
        species_id = _positive_id(request.data.get("species_id"), "species_id")
        age_id = _positive_id(request.data.get("age_id"), "age_id")
        height_id = _positive_id(request.data.get("height_id"), "height_id")
        remarks = request.data.get("remarks") or None
        if remarks is not None and (not isinstance(remarks, str) or len(remarks) > 250):
            raise ValidationError({"remarks": "Remarks cannot exceed 250 characters."})
        with transaction.atomic(), connection.cursor() as cursor:
            cursor.execute("SELECT 1 FROM dbo.M007_Species WHERE Species_ID = %s AND Species_Active = 'Y'", [species_id])
            if cursor.fetchone() is None:
                raise ValidationError({"species_id": "Select an active species."})
            cursor.execute("SELECT 1 FROM dbo.M008_MasterAge WHERE Age_ID = %s AND Age_Active = 'Y'", [age_id])
            if cursor.fetchone() is None:
                raise ValidationError({"age_id": "Select an active age."})
            cursor.execute("SELECT 1 FROM dbo.M022_List_Master WHERE LM_ID = %s AND LM_Category = 'Species_Height' AND LM_Active = 'Y'", [height_id])
            if cursor.fetchone() is None:
                raise ValidationError({"height_id": "Select an active species height."})
            cursor.execute(
                "SELECT 1 FROM dbo.T003_SpeciesAgeHeight "
                "WHERE SAH_State_ID = %s AND SAH_Species_ID = %s AND SAH_Age_ID = %s "
                "AND SAH_Height_ID = %s AND SAH_Active = 'Y'",
                [state_id, species_id, age_id, height_id],
            )
            if cursor.fetchone() is not None:
                raise ValidationError("This active species, age, and height combination already exists.")
            new_id = _next_master_id(cursor, table, key)
            cursor.execute(
                "INSERT INTO dbo.T003_SpeciesAgeHeight "
                "(SAH_ID, SAH_State_ID, SAH_Species_ID, SAH_Age_ID, SAH_Height_ID, "
                "SAH_Remarks, SAH_Active, SAH_Entryby, SAH_Entryon) "
                "VALUES (%s, %s, %s, %s, %s, %s, 'Y', %s, %s)",
                [new_id, state_id, species_id, age_id, height_id, remarks, _actor_id(actor), timezone.now()],
            )
        return Response({"id": new_id, "success": True}, status=status.HTTP_201_CREATED)

    record_id = _positive_id(request.data.get("id"), "id")
    active_value = "Y" if request.data.get("active") is True else "N"
    where, params = "", []
    if actor.role != "national":
        state_id = _int(actor.scope.get("state_id"))
        if not state_id:
            raise PermissionDenied("Your account has no valid state mapping.")
        where, params = " AND SAH_State_ID = %s", [state_id]
    with connection.cursor() as cursor:
        cursor.execute(
            f"UPDATE dbo.T003_SpeciesAgeHeight SET SAH_Active = %s, "
            f"SAH_Updateby = %s, SAH_Updateon = %s WHERE SAH_ID = %s{where}",
            [active_value, _actor_id(actor), timezone.now(), record_id, *params],
        )
        if cursor.rowcount != 1:
            raise PermissionDenied("The selected species-age-height record is outside your scope.")
    return Response({"id": record_id, "active": active_value})


@api_view(["GET", "POST", "PATCH"])
@authentication_classes([WorkflowJWTAuthentication])
@permission_classes([IsAuthenticated])
def workflow_admin_directory(request):
    actor = _admin_actor(request)
    if request.method != "GET":
        _require_admin_actor_id(actor)
    if request.method == "GET":
        state_id = _int(request.query_params.get("state_id")) or _int(actor.scope.get("state_id"))
        circle_id = _int(request.query_params.get("circle_id")) or _int(actor.scope.get("circle_id"))
        division_id = _int(request.query_params.get("division_id")) or _int(actor.scope.get("division_id"))
        range_id = _int(request.query_params.get("range_id"))
        section_id = _int(request.query_params.get("section_id"))
        if actor.role != "national":
            if state_id != _int(actor.scope.get("state_id")):
                raise PermissionDenied("The requested state is outside your assigned office.")
            if actor.role == "circle" and circle_id != _int(actor.scope.get("circle_id")):
                raise PermissionDenied("The requested circle is outside your assigned office.")
            if actor.role == "dfo" and division_id != _int(actor.scope.get("division_id")):
                raise PermissionDenied("The requested division is outside your assigned office.")
        ranges = M004Range.objects.filter(
            **({"range_division_id": division_id} if division_id else {}),
        )
        directory_data = {
            "states": list(M001State.objects.filter(state_active="Y").order_by("state_name").values("state_id", "state_name")),
            "circles": list(M002Circle.objects.filter(
                **({"circle_state_id": state_id} if state_id else {}),
                **({"circle_id": circle_id} if actor.role == "circle" else {}),
            ).order_by("circle_name").values("circle_id", "circle_state_id", "circle_name", "circle_active")),
            "divisions": list(M003Division.objects.filter(
                **({"division_circle_id": circle_id} if circle_id else {}),
                **({"division_id": division_id} if actor.role == "dfo" else {}),
            ).order_by("division_name").values("division_id", "division_circle_id", "division_name", "division_active")),
            "ranges": list(ranges.order_by("range_name").values("range_id", "range_division_id", "range_name", "range_active")),
            "sections": [],
            "compartments": [],
        }
        if actor.role == "dfo" and range_id:
            if not ranges.filter(range_id=range_id, range_active="Y").exists():
                raise PermissionDenied("The selected Range is outside your division or is inactive.")
            sections = M005Section.objects.filter(section_range_id=range_id)
            directory_data["sections"] = list(
                sections.order_by("section_name").values(
                    "section_id", "section_range_id", "section_name", "section_active"
                )
            )
            if section_id:
                if not sections.filter(section_id=section_id, section_active="Y").exists():
                    raise ValidationError({"section_id": "Select an active Beat in the selected Range."})
                directory_data["compartments"] = list(
                    M006Compartment.objects.filter(compart_section_id=section_id)
                    .order_by("compart_name")
                    .values("compart_id", "compart_section_id", "compart_name", "compart_active")
                )
        return Response(directory_data)

    kind = request.data.get("kind")
    if not isinstance(kind, str):
        raise ValidationError({"kind": "Select a valid directory level."})
    scope = actor.scope
    state_id = _int(scope.get("state_id"))
    circle_id = _int(scope.get("circle_id"))
    division_id = _int(scope.get("division_id"))
    if request.method == "POST":
        name = request.data.get("name")
        if not isinstance(name, str) or not name.strip() or len(name.strip()) > 255:
            raise ValidationError({"name": "Enter a directory name up to 255 characters."})
        if kind == "circle" and actor.role in {"national", "state"}:
            selected_state = _positive_id(
                request.data.get("state_id") or state_id, "state_id"
            )
            if actor.role == "state" and selected_state != state_id:
                raise PermissionDenied("The selected state is outside your assigned office.")
            if not M001State.objects.filter(state_id=selected_state, state_active="Y").exists():
                raise ValidationError({"state_id": "Select an active state."})
            with transaction.atomic(), connection.cursor() as cursor:
                new_id = _next_master_id(cursor, "M002_Circle", "Circle_ID")
                cursor.execute(
                    "INSERT INTO dbo.M002_Circle "
                    "(Circle_ID, Circle_State_ID, Circle_Name, Circle_Active, Circle_Entryby, Circle_Entryon) "
                    "VALUES (%s, %s, %s, 'Y', %s, %s)",
                    [new_id, selected_state, name.strip(), _actor_id(actor), timezone.now()],
                )
        elif kind == "division" and actor.role == "circle":
            if not state_id or not circle_id:
                raise PermissionDenied("Your account has no valid circle mapping.")
            with transaction.atomic(), connection.cursor() as cursor:
                new_id = _next_master_id(cursor, "M003_Division", "Division_ID")
                cursor.execute(
                    "INSERT INTO dbo.M003_Division "
                    "(Division_ID, Division_Circle_ID, Division_Name, Division_Version, Division_Active, Division_EntryBy, Division_EntryOn) "
                    "VALUES (%s, %s, %s, 1, 'Y', %s, %s)",
                    [new_id, circle_id, name.strip(), _actor_id(actor), timezone.now()],
                )
        elif kind == "range" and actor.role == "dfo":
            if not state_id or not division_id:
                raise PermissionDenied("Your account has no valid division mapping.")
            with transaction.atomic(), connection.cursor() as cursor:
                new_id = _next_master_id(cursor, "M004_Range", "Range_ID")
                cursor.execute(
                    "INSERT INTO dbo.M004_Range "
                    "(Range_ID, Range_Division_ID, Range_Name, Range_Version, Range_Active, Range_EntryBy, Range_EntryOn) "
                    "VALUES (%s, %s, %s, 1, 'Y', %s, %s)",
                    [new_id, division_id, name.strip(), _actor_id(actor), timezone.now()],
                )
        elif kind == "section" and actor.role == "dfo":
            range_id = _positive_id(request.data.get("range_id"), "range_id")
            if not M004Range.objects.filter(
                range_id=range_id,
                range_division_id=division_id,
                range_active="Y",
            ).exists():
                raise PermissionDenied("The selected Range is outside your division or is inactive.")
            with transaction.atomic(), connection.cursor() as cursor:
                new_id = _next_master_id(cursor, "M005_Section", "Section_ID")
                cursor.execute(
                    "INSERT INTO dbo.M005_Section "
                    "(Section_ID, Section_Range_ID, Section_Name, Section_Version, "
                    "Section_Active, Section_EntryBy, Section_EntryOn) "
                    "VALUES (%s, %s, %s, 1, 'Y', %s, %s)",
                    [new_id, range_id, name.strip(), _actor_id(actor), timezone.now()],
                )
        elif kind == "compartment" and actor.role == "dfo":
            section_id = _positive_id(request.data.get("section_id"), "section_id")
            with connection.cursor() as cursor:
                cursor.execute(
                    "SELECT s.Section_ID FROM dbo.M005_Section s "
                    "JOIN dbo.M004_Range r ON r.Range_ID = s.Section_Range_ID "
                    "WHERE s.Section_ID = %s AND s.Section_Active = 'Y' "
                    "AND r.Range_Division_ID = %s AND r.Range_Active = 'Y'",
                    [section_id, division_id],
                )
                section = cursor.fetchone()
            if section is None:
                raise PermissionDenied("The selected Beat is outside your division or is inactive.")
            with transaction.atomic(), connection.cursor() as cursor:
                new_id = _next_master_id(cursor, "M006_Compart", "Compart_ID")
                cursor.execute(
                    "INSERT INTO dbo.M006_Compart "
                    "(Compart_ID, Compart_Section_ID, Compart_Name, Compart_Version, "
                    "Compart_Active, Compart_EntryBy, Compart_EntryOn) "
                    "VALUES (%s, %s, %s, 1, 'Y', %s, %s)",
                    [new_id, section_id, name.strip(), _actor_id(actor), timezone.now()],
                )
        else:
            raise PermissionDenied("You cannot add this directory level.")
        return Response({"id": new_id, "success": True}, status=status.HTTP_201_CREATED)

    record_id = _positive_id(request.data.get("id"), "id")
    active_value = "Y" if request.data.get("active") is True else "N"
    updates = {
        "circle": ("M002_Circle", "Circle_ID", "Circle_Active", "circle_id"),
        "division": ("M003_Division", "Division_ID", "Division_Active", "division_id"),
        "range": ("M004_Range", "Range_ID", "Range_Active", "range_id"),
    }
    if kind not in {*updates, "section", "compartment"}:
        raise ValidationError({"kind": "Select a valid directory level."})
    if kind in {"section", "compartment"}:
        if actor.role != "dfo":
            raise PermissionDenied("Only a DFO can manage Beats and Sub-beats in their division.")
        if kind == "section":
            with connection.cursor() as cursor:
                cursor.execute(
                    "UPDATE dbo.M005_Section SET Section_Active = %s, "
                    "Section_UpdatedBy = %s, Section_UpdatedOn = %s "
                    "WHERE Section_ID = %s AND Section_Range_ID IN "
                    "(SELECT Range_ID FROM dbo.M004_Range WHERE Range_Division_ID = %s)",
                    [active_value, _actor_id(actor), timezone.now(), record_id, division_id],
                )
        else:
            with connection.cursor() as cursor:
                cursor.execute(
                    "UPDATE dbo.M006_Compart SET Compart_Active = %s, "
                    "Compart_UpdatedBy = %s, Compart_UpdatedOn = %s "
                    "WHERE Compart_ID = %s AND Compart_Section_ID IN ("
                    "SELECT s.Section_ID FROM dbo.M005_Section s "
                    "JOIN dbo.M004_Range r ON r.Range_ID = s.Section_Range_ID "
                    "WHERE r.Range_Division_ID = %s)",
                    [active_value, _actor_id(actor), timezone.now(), record_id, division_id],
                )
        if cursor.rowcount != 1:
            raise PermissionDenied("The selected directory entry is outside your division.")
        return Response({"id": record_id, "active": active_value, "kind": kind})
    table, key, active_column, scope_key = updates[kind]
    if (kind == "circle" and actor.role not in {"national", "state"}) or (
        kind == "division" and actor.role != "circle"
    ) or (kind == "range" and actor.role != "dfo"):
        raise PermissionDenied("You cannot manage this directory level.")
    filters = ""
    params = []
    if kind == "circle" and actor.role == "state":
        filters, params = " AND Circle_State_ID = %s", [state_id]
    elif kind == "division":
        filters, params = " AND Division_Circle_ID = %s", [circle_id]
    elif kind == "range":
        filters, params = " AND Range_Division_ID = %s", [division_id]
    with connection.cursor() as cursor:
        cursor.execute(
            f"UPDATE dbo.{table} SET {active_column} = %s WHERE {key} = %s{filters}",
            [active_value, record_id, *params],
        )
        if cursor.rowcount != 1:
            raise PermissionDenied("The selected directory entry is outside your scope.")
    return Response({"id": record_id, "active": active_value, "kind": kind})


@api_view(["GET"])
@authentication_classes([WorkflowJWTAuthentication])
@permission_classes([IsAuthenticated])
def workflow_admin_lookups(request):
    actor = _admin_actor(request)
    state_id = _int(request.query_params.get("state_id")) or _int(actor.scope.get("state_id"))
    with connection.cursor() as cursor:
        cursor.execute("SELECT Level_ID, Level_Name FROM dbo.M010_Level WHERE Level_Active = 'Y' ORDER BY Level_ID")
        levels = [{"id": row[0], "name": row[1]} for row in cursor.fetchall()]
        cursor.execute(
            "SELECT Designation_ID, Designation_Code, Designation_Name "
            "FROM dbo.M015_Designation WHERE Designation_Active = 'Y' ORDER BY Designation_Name"
        )
        designations = [{"id": row[0], "code": row[1], "name": row[2]} for row in cursor.fetchall()]
        cursor.execute(
            "SELECT Species_ID, Species_Name, Species_S_Name, Species_POWO "
            "FROM dbo.M007_Species WHERE Species_Active = 'Y' ORDER BY Species_Name"
        )
        species = [{"id": row[0], "name": row[1], "scientific_name": row[2], "powo": row[3]} for row in cursor.fetchall()]
        cursor.execute("SELECT Age_ID, Age_AgeName FROM dbo.M008_MasterAge WHERE Age_Active = 'Y' ORDER BY Age_No")
        ages = [{"id": row[0], "name": row[1]} for row in cursor.fetchall()]
        cursor.execute(
            "SELECT LM_ID, LM_Name FROM dbo.M022_List_Master "
            "WHERE LM_Category = 'Species_Height' AND LM_Active = 'Y' ORDER BY TRY_CONVERT(int, LM_Code)"
        )
        heights = [{"id": row[0], "name": row[1]} for row in cursor.fetchall()]
        cursor.execute(
            """
            SELECT sah.SAH_ID, sah.SAH_State_ID, st.State_Name,
                   sah.SAH_Species_ID, sp.Species_Name, sp.Species_S_Name,
                   sah.SAH_Age_ID, age.Age_AgeName, sah.SAH_Height_ID,
                   height.LM_Name, sah.SAH_Remarks, sah.SAH_Active
            FROM dbo.T003_SpeciesAgeHeight sah
            LEFT JOIN dbo.M001_State st ON st.State_ID = sah.SAH_State_ID
            LEFT JOIN dbo.M007_Species sp ON sp.Species_ID = sah.SAH_Species_ID
            LEFT JOIN dbo.M008_MasterAge age ON age.Age_ID = sah.SAH_Age_ID
            LEFT JOIN dbo.M022_List_Master height ON height.LM_ID = sah.SAH_Height_ID
            WHERE (%s IS NULL OR sah.SAH_State_ID = %s)
            ORDER BY sah.SAH_ID DESC
            """,
            [state_id if actor.role == "national" else _int(actor.scope.get("state_id"))] * 2,
        )
        combinations = [
            {
                "id": row[0], "state_id": row[1], "state_name": row[2],
                "species_id": row[3], "species_name": row[4], "scientific_name": row[5],
                "age_id": row[6], "age_name": row[7], "height_id": row[8],
                "height_name": row[9], "remarks": row[10], "active": row[11],
            }
            for row in cursor.fetchall()
        ]
    states = list(M001State.objects.filter(state_active="Y").order_by("state_name").values("state_id", "state_name"))
    if actor.role != "national":
        states = [state for state in states if state["state_id"] == _int(actor.scope.get("state_id"))]
    return Response({
        "levels": levels,
        "allowed_child_level": ADMIN_CHILD_LEVELS[actor.role],
        "designations": designations,
        "species": species,
        "ages": ages,
        "heights": heights,
        "species_age_height": combinations,
        "states": states,
        "user_types": [{"id": "A", "name": "Admin"}, {"id": "U", "name": "User"}],
    })

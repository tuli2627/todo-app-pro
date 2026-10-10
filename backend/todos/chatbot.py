import re

from django.db.models import Q
from rest_framework import status
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError

from auth.workflow_auth import WorkflowJWTAuthentication
from .models import FieldProgressReport, M001State, M002District, T007Nursery
from .progress_workflow import _current_period, _visible_reports


MAX_QUESTION_LENGTH = 500
MAX_NURSERY_RESULTS = 8
COUNT_TERMS = (
    "count", "total", "how many", "number of", "kitni", "kitne", "kul", "sankhya",
    "कितनी", "कितने", "कुल", "संख्या",
)
NURSERY_TERMS = ("nursery", "nurseries", "nursary", "nर्सरी", "नर्सरी", "paudhshala")
SEARCH_TERMS = (
    "find", "search", "show", "list", "where", "details", "name", "available",
    "dikhao", "batao", "kahan", "naam", "सूची", "दिखाओ", "बताओ", "कहाँ", "नाम",
)
SEARCH_STOP_WORDS = {
    "a", "an", "and", "all", "details", "for", "give", "in", "me", "my", "of",
    "please", "the", "to", "with", "near", "around", "nursery", "nurseries",
    "show", "find", "search", "list", "available", "where", "name", "details",
    "nर्सरी", "में", "की", "का", "के", "मुझे", "बताओ", "दिखाओ", "पास",
}
PROGRESS_TERMS = (
    "progress", "report", "pending", "overdue", "ranking", "rank", "ro report",
    "field report", "silviculturist", "प्रगति", "रिपोर्ट", "लंबित",
)
PROGRESS_DATA_TERMS = (
    "my ", "pending", "overdue", "how many", "count", "status", "ranking",
    "rank", "show ", "मेरी", "लंबित", "कितने", "कितनी", "स्थिति",
)


def _normalize(value):
    return re.sub(r"\s+", " ", value.casefold()).strip()


def _state_in_question(question):
    states = M001State.objects.filter(state_active="Y").values_list(
        "state_id", "state_name"
    )
    normalized = _normalize(question)
    matches = [
        (state_id, state_name)
        for state_id, state_name in states
        if _normalize(state_name) in normalized
    ]
    return max(matches, key=lambda item: len(item[1])) if matches else None


def _faq_answer_key(question):
    normalized = _normalize(question)
    if any(term in normalized for term in ("service", "feature", "what can", "सेवा", "सुविधा")):
        return "chatbot.answers.services"
    if any(term in normalized for term in ("purpose", "what is this", "what is the portal", "platform", "उद्देश्य", "पोर्टल क्या")):
        return "chatbot.answers.purpose"
    if any(term in normalized for term in ("register", "registration", "create nursery", "नया", "पंजीकरण", "रजिस्टर")):
        return "chatbot.answers.registration"
    if any(term in normalized for term in ("login", "sign in", "password", "लॉगिन", "पासवर्ड")):
        return "chatbot.answers.login"
    if any(term in normalized for term in ("approval", "approve", "hierarchy", "अनुमोदन", "स्वीकृति")):
        return "chatbot.answers.approval"
    if any(term in normalized for term in ("six month", "six-month", "6 month", "half year", "छह महीने", "छमाही")):
        return "chatbot.answers.progress"
    if any(term in normalized for term in ("spa", "seed production area", "बीज उत्पादन")):
        return "chatbot.answers.spa"
    if any(term in normalized for term in ("cpt", "candidate plus tree")):
        return "chatbot.answers.cpt"
    if any(term in normalized for term in ("seed orchard", "बीज उद्यान")):
        return "chatbot.answers.seedOrchard"
    if any(term in normalized for term in ("booking", "advance booking", "बुकिंग")):
        return "chatbot.answers.booking"
    if any(term in normalized for term in ("map", "location", "gps", "नक्शा", "मानचित्र", "स्थान")):
        return "chatbot.answers.map"
    return None


def _nursery_answer(question, request):
    state = _state_in_question(question)
    nurseries = T007Nursery.objects.filter(nursery_active__in=("Y", "1"))
    if state:
        nurseries = nurseries.filter(nursery_state_id=state[0])

    is_count = any(term in _normalize(question) for term in COUNT_TERMS)
    if is_count:
        count = nurseries.count()
        return {
            "answer_key": "chatbot.answers.nurseryCount",
            "variables": {"count": count, "state": state[1] if state else None},
            "results": [],
        }

    search = _normalize(question)
    for term in NURSERY_TERMS + SEARCH_TERMS:
        search = search.replace(_normalize(term), " ")
    if state:
        search = search.replace(_normalize(state[1]), " ")
    words = [
        word for word in re.findall(r"[\w-]+", search)
        if len(word) > 1 and word not in SEARCH_STOP_WORDS
    ]
    for word in words[:8]:
        nurseries = nurseries.filter(
            Q(nursery_name__icontains=word)
            | Q(nursery_location__icontains=word)
            | Q(nursery_address__icontains=word)
        )

    rows = list(nurseries.order_by("nursery_name").values(
        "nursery_id",
        "nursery_name",
        "nursery_state__state_name",
        "nursery_district_id",
        "nursery_location",
        "nursery_address",
        "nursery_propagation_type",
        "nursery_contact_person_name",
        "nursery_contact_person_phone",
        "nursery_latitude",
        "nursery_longitude",
        "nursery_website",
    )[:MAX_NURSERY_RESULTS])
    district_ids = {row["nursery_district_id"] for row in rows if row["nursery_district_id"]}
    districts = dict(
        M002District.objects.filter(district_id__in=district_ids).values_list(
            "district_id", "district_name"
        )
    ) if district_ids else {}
    results = [
        {
            "id": row["nursery_id"],
            "name": row["nursery_name"],
            "state": row["nursery_state__state_name"],
            "district": districts.get(row["nursery_district_id"], ""),
            "location": row["nursery_location"] or row["nursery_address"] or "",
            "propagation_type": row["nursery_propagation_type"] or "",
            "contact_person": row["nursery_contact_person_name"] or "",
            "phone": row["nursery_contact_person_phone"] or "",
            "latitude": row["nursery_latitude"],
            "longitude": row["nursery_longitude"],
            "website": row["nursery_website"] or "",
            "url": f"/our-nurseries?nursery={row['nursery_id']}",
        }
        for row in rows
    ]
    return {
        "answer_key": "chatbot.answers.nurseryResults" if results else "chatbot.answers.noNurseries",
        "variables": {
            "count": len(results),
            "state": state[1] if state else None,
        },
        "results": results,
    }


def _progress_answer(user):
    if user is None or not getattr(user, "is_authenticated", False):
        return {"answer_key": "chatbot.answers.loginForInternal", "variables": {}, "results": []}

    start, end = _current_period()
    reports = _visible_reports(user).filter(period_start=start, period_end=end)
    submitted = reports.count()
    pending_assessments = reports.filter(technical_assessments__isnull=True).count()
    planted = sum(reports.values_list("planted_last_3_months", flat=True))
    return {
        "answer_key": "chatbot.answers.progressSummary",
        "variables": {
            "start": start.isoformat(),
            "end": end.isoformat(),
            "reports": submitted,
            "pending": pending_assessments,
            "planted": planted,
        },
        "results": [],
    }


def _is_progress_data_query(question):
    normalized = _normalize(question)
    return any(term in normalized for term in PROGRESS_DATA_TERMS)


@api_view(["POST"])
@authentication_classes([WorkflowJWTAuthentication])
@permission_classes([AllowAny])
def chatbot_message(request):
    question = request.data.get("message")
    if not isinstance(question, str) or not question.strip():
        raise ValidationError({"message": "Enter a question for the chatbot."})
    question = question.strip()
    if len(question) > MAX_QUESTION_LENGTH:
        raise ValidationError({"message": f"Questions must be no longer than {MAX_QUESTION_LENGTH} characters."})

    normalized = _normalize(question)
    has_nursery = any(term in normalized for term in NURSERY_TERMS)
    is_nursery_count = has_nursery and any(term in normalized for term in COUNT_TERMS)
    is_nursery_search = has_nursery and any(term in normalized for term in SEARCH_TERMS)
    has_progress_topic = any(term in normalized for term in PROGRESS_TERMS)
    faq_key = _faq_answer_key(question)
    if has_progress_topic and _is_progress_data_query(question):
        response = _progress_answer(request.user)
    elif is_nursery_count or is_nursery_search or (has_nursery and not faq_key):
        response = _nursery_answer(question, request)
    else:
        if faq_key:
            response = {"answer_key": faq_key, "variables": {}, "results": []}
        else:
            response = {
                "answer_key": "chatbot.answers.unknown",
                "variables": {},
                "results": [],
            }

    return Response(response, status=status.HTTP_200_OK)

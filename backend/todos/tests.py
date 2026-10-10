from io import BytesIO
import json
from contextlib import nullcontext
from unittest import TestCase
from unittest.mock import MagicMock, call, patch
from types import SimpleNamespace
from datetime import date
from decimal import Decimal

from django.db.models import Count
from django.core.files.uploadedfile import SimpleUploadedFile
from django.http import QueryDict
from django.test import SimpleTestCase
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.test import APIRequestFactory, force_authenticate

from .serializers import NurseryDetailSerializer
from .models import FieldProgressReport, SilviculturistAssessment
from .views import (
    MapDataView,
    TodoViewSet,
    _get_nursery_kml_source_url,
    dashboard_chart_data,
    get_nursery_kml,
)
from .workflow import (
    MODULES,
    _add_record_creator_metadata,
    _admin_scope_location,
    _contact_number,
    _compartments_for_section,
    _scope_for,
    _db_value,
    _locations,
    _upload,
    _record_workflow_details,
    _technical_review_history_complete,
    _technical_review_fields,
    _silviculturist_scope_location,
    workflow_technical_review,
    workflow_record_detail,
    workflow_admin_users,
    workflow_admin_directory,
    workflow_overview,
    workflow_records,
    workflow_decision,
    _lookups,
)
from .progress_workflow import (
    GPS_RADIUS_METERS,
    _current_period,
    _distance_meters,
    _decimal,
    _requested_period,
    _validate_photo_coordinates,
    _comparison_data,
    _add_technical_review_status,
    _site_assessment_keys,
    _site_species_by_module,
    _period_completion,
    workflow_progress_reports,
    workflow_progress_sites,
    workflow_site_technical_assessments,
    workflow_technical_assessment,
    _visible_reports,
)
from .chatbot import chatbot_message
from .public_dashboard import (
    _reporting_periods,
    _rank_offices,
    _rank_silviculturists,
    public_nurseries,
    public_progress_dashboard,
)
from auth.workflow_auth import WorkflowPrincipal


class ChatbotEndpointTests(SimpleTestCase):
    def setUp(self):
        self.factory = APIRequestFactory()

    def test_faq_request_returns_translation_key(self):
        request = self.factory.post(
            "/api/chatbot/message/",
            {"message": "What services does the portal provide?"},
            format="json",
        )
        response = chatbot_message(request)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["answer_key"], "chatbot.answers.services")
        self.assertEqual(response.data["variables"], {})
        self.assertEqual(response.data["results"], [])

    @patch("todos.chatbot._nursery_answer")
    def test_nursery_count_question_uses_structured_nursery_search(self, nursery_answer):
        nursery_answer.return_value = {
            "answer_key": "chatbot.answers.nurseryCount",
            "variables": {"count": 3, "state": "Gujarat"},
            "results": [],
        }
        question = "How many nurseries are in Gujarat?"
        request = self.factory.post(
            "/api/chatbot/message/", {"message": question}, format="json"
        )
        response = chatbot_message(request)

        self.assertEqual(response.status_code, 200)
        nursery_answer.assert_called_once()
        self.assertEqual(nursery_answer.call_args.args[0], question)
        self.assertEqual(response.data["answer_key"], "chatbot.answers.nurseryCount")

    def test_empty_and_oversized_questions_return_validation_errors(self):
        for message in ("  ", "x" * 501):
            with self.subTest(length=len(message)):
                request = self.factory.post(
                    "/api/chatbot/message/", {"message": message}, format="json"
                )
                response = chatbot_message(request)
                self.assertEqual(response.status_code, 400)

    def test_anonymous_progress_question_does_not_return_internal_data(self):
        request = self.factory.post(
            "/api/chatbot/message/",
            {"message": "Show my progress report totals"},
            format="json",
        )
        response = chatbot_message(request)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.data["answer_key"], "chatbot.answers.loginForInternal"
        )
        self.assertEqual(response.data["results"], [])

    @patch("todos.chatbot._current_period", return_value=(date(2026, 1, 1), date(2026, 6, 30)))
    @patch("todos.chatbot._visible_reports")
    def test_authenticated_progress_uses_the_users_visible_report_scope(
        self, visible_reports, current_period
    ):
        user = SimpleNamespace(is_authenticated=True)
        visible_scope = MagicMock()
        period_reports = MagicMock()
        pending_reports = MagicMock()
        visible_scope.filter.return_value = period_reports
        period_reports.count.return_value = 2
        period_reports.filter.return_value = pending_reports
        pending_reports.count.return_value = 1
        period_reports.values_list.return_value = [12, 8]
        visible_reports.return_value = visible_scope
        request = self.factory.post(
            "/api/chatbot/message/",
            {"message": "Show my progress report totals"},
            format="json",
        )
        force_authenticate(request, user=user)
        response = chatbot_message(request)

        visible_reports.assert_called_once_with(user)
        visible_scope.filter.assert_called_once_with(
            period_start=date(2026, 1, 1), period_end=date(2026, 6, 30)
        )
        period_reports.filter.assert_called_once_with(technical_assessments__isnull=True)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["answer_key"], "chatbot.answers.progressSummary")
        self.assertEqual(response.data["variables"]["reports"], 2)
        self.assertEqual(response.data["variables"]["pending"], 1)
        self.assertEqual(response.data["variables"]["planted"], 20)


class PublicDashboardEndpointTests(SimpleTestCase):
    def setUp(self):
        self.factory = APIRequestFactory()

    def test_progress_dashboard_includes_current_and_previous_reporting_periods(self):
        self.assertEqual(
            _reporting_periods(date(2026, 10, 11)),
            (
                (date(2026, 1, 1), date(2026, 6, 30)),
                (date(2026, 7, 1), date(2026, 12, 31)),
            ),
        )
        self.assertEqual(
            _reporting_periods(date(2027, 2, 1)),
            (
                (date(2026, 7, 1), date(2026, 12, 31)),
                (date(2027, 1, 1), date(2027, 6, 30)),
            ),
        )

    @patch("todos.public_dashboard.T007Nursery.objects.filter")
    def test_public_nursery_endpoint_rejects_non_numeric_state_filter(self, nursery_filter):
        nursery_filter.return_value.select_related.return_value = MagicMock()
        request = self.factory.get("/api/public-dashboard/nurseries/?state_id=unknown")
        response = public_nurseries(request)

        self.assertEqual(response.status_code, 400)

    @patch("todos.views.M001State.objects.all")
    def test_state_workflow_map_data_is_limited_to_assigned_state(self, all_states):
        states = MagicMock()
        states.filter.return_value.annotate.return_value = [
            SimpleNamespace(
                state_code="GJ",
                state_id=8,
                state_name="Gujarat",
                active_nurseries_count=12,
            )
        ]
        all_states.return_value = states
        request = self.factory.get("/api/map-data/")
        force_authenticate(
            request,
            user=WorkflowPrincipal({
                "workflow_user_id": 1,
                "workflow_role": "state",
                "workflow_scope": {"state_id": 8},
            }),
        )

        response = MapDataView.as_view()(request)

        self.assertEqual(response.status_code, 200)
        self.assertEqual([row["state_id"] for row in response.data], [8])
        states.filter.assert_called_once_with(state_id=8)

    @patch("todos.views.M001State.objects.all")
    def test_national_workflow_map_data_includes_all_states(self, all_states):
        states = MagicMock()
        states.annotate.return_value = [
            SimpleNamespace(
                state_code="GJ",
                state_id=8,
                state_name="Gujarat",
                active_nurseries_count=12,
            ),
            SimpleNamespace(
                state_code="KA",
                state_id=9,
                state_name="Karnataka",
                active_nurseries_count=20,
            ),
        ]
        all_states.return_value = states
        request = self.factory.get("/api/map-data/")
        force_authenticate(
            request,
            user=WorkflowPrincipal({
                "workflow_user_id": 1,
                "workflow_role": "national",
                "workflow_scope": {},
            }),
        )

        response = MapDataView.as_view()(request)

        self.assertEqual(response.status_code, 200)
        self.assertEqual([row["state_id"] for row in response.data], [8, 9])
        states.filter.assert_not_called()

    @patch("todos.public_dashboard.T007Nursery.objects.filter")
    def test_state_workflow_nursery_list_cannot_expand_to_another_state(self, nursery_filter):
        nurseries = MagicMock()
        nurseries.select_related.return_value = nurseries
        nurseries.filter.return_value = nurseries
        nurseries.count.return_value = 0
        nurseries.order_by.return_value.__getitem__.return_value = []
        nursery_filter.return_value = nurseries
        request = self.factory.get(
            "/api/public-dashboard/nurseries/?state_id=9"
        )
        force_authenticate(
            request,
            user=WorkflowPrincipal({
                "workflow_user_id": 1,
                "workflow_role": "state",
                "workflow_scope": {"state_id": 8},
            }),
        )

        response = public_nurseries(request)

        self.assertEqual(response.status_code, 200)
        self.assertIn(call(nursery_state_id=8), nurseries.filter.call_args_list)
        self.assertIn(call(nursery_state_id=9), nurseries.filter.call_args_list)

    @patch("todos.public_dashboard.FieldProgressReport.objects.filter")
    def test_public_progress_endpoint_rejects_unknown_hierarchy_level(self, report_filter):
        report_filter.return_value.prefetch_related.return_value = MagicMock()
        request = self.factory.get("/api/public-dashboard/progress/?level=country")
        response = public_progress_dashboard(request)

        self.assertEqual(response.status_code, 400)

    @patch("todos.public_dashboard.SilviculturistAssessment.objects.filter")
    def test_hierarchy_ranking_combines_planting_and_survival_scores(self, assessments):
        assessments.return_value.values.return_value.annotate.return_value.values_list.return_value = [
            (1, 1),
            (2, 1),
        ]
        reports = MagicMock()
        reports.exclude.return_value.values.return_value.annotate.return_value = [
            {
                "state_id": 1,
                "state_name": "State A",
                "report_count": 1,
                "planted": 100,
                "alive": 90,
                "dead": 10,
                "seedlings_available": 25,
                "assessments": 1,
            },
            {
                "state_id": 2,
                "state_name": "State B",
                "report_count": 1,
                "planted": 50,
                "alive": 100,
                "dead": 0,
                "seedlings_available": 12,
                "assessments": 1,
            },
        ]

        rankings = _rank_offices(reports, "state")

        self.assertEqual([row["office_name"] for row in rankings], ["State A", "State B"])
        self.assertEqual(rankings[0]["rank"], 1)
        self.assertEqual(rankings[0]["survival_percent"], 90)
        self.assertEqual(rankings[1]["survival_percent"], 100)

    @patch("todos.public_dashboard.SilviculturistAssessment.objects.filter")
    def test_silviculturist_ranking_prioritizes_review_volume_then_satisfactory_count(self, assessments):
        assessments.return_value.values.return_value.annotate.return_value = [
            {
                "assessed_by": 1,
                "assessed_by_name": "Officer A",
                "reviews": 2,
                "satisfactory": 2,
                "critical": 0,
            },
            {
                "assessed_by": 2,
                "assessed_by_name": "Officer B",
                "reviews": 3,
                "satisfactory": 1,
                "critical": 1,
            },
        ]

        rankings = _rank_silviculturists(MagicMock())

        self.assertEqual(rankings[0]["office_name"], "Officer B")
        self.assertEqual(rankings[0]["rank"], 1)
        self.assertEqual(rankings[0]["reviews"], 3)


class WorkflowReportLookupTests(TestCase):
    @patch("todos.workflow._scope_for")
    @patch("todos.workflow.connection.cursor")
    @patch("todos.workflow.M001State.objects")
    def test_report_lookups_skip_unrelated_record_catalogs(
        self, state_manager, cursor_factory, scope_for
    ):
        state_manager.filter.return_value.order_by.return_value.values.return_value = []
        cursor = MagicMock()
        cursor.__enter__.return_value = cursor
        cursor.__exit__.return_value = False
        cursor.fetchall.return_value = []
        cursor_factory.return_value = cursor
        request = SimpleNamespace(
            user=WorkflowPrincipal({"workflow_role": "national", "workflow_scope": {}}),
            query_params={"report_only": "1"},
        )

        result = _lookups(request)

        self.assertEqual(result["states"], [])
        scope_for.assert_not_called()
        self.assertNotIn("nurseries", result)


class WorkflowFieldValidationTests(SimpleTestCase):
    def test_seed_orchard_form_has_only_one_beat_field_and_no_subbeat(self):
        beat_fields = [
            field for field in MODULES["seed-orchard"]["form_fields"]
            if field["name"] in {"section_id", "compart_id"}
        ]

        self.assertEqual(
            [(field["name"], field["options"]) for field in beat_fields],
            [("section_id", "sections")],
        )

    def test_seed_collection_form_includes_required_coordinates(self):
        fields = {
            field["name"]: field
            for field in MODULES["seed-collection"]["form_fields"]
        }
        self.assertTrue(fields["latitude"]["required"])
        self.assertTrue(fields["longitude"]["required"])
        self.assertEqual(MODULES["seed-collection"]["field_columns"]["latitude"], "SCS_Latitude")
        self.assertEqual(MODULES["seed-collection"]["field_columns"]["longitude"], "SCS_Longitude")

    def test_range_officer_can_see_division_scoped_source_records(self):
        user = WorkflowPrincipal({
            "workflow_user_id": 23,
            "workflow_role": "ro",
            "workflow_scope": {"state_id": 12, "range_id": 1453},
        })
        definition = MODULES["processing-unit"]

        with patch("todos.workflow.M004Range.objects") as range_manager:
            range_manager.filter.return_value.values.return_value.first.return_value = {
                "range_division_id": 91955,
            }
            where, params = _scope_for(user, definition)

        self.assertIn("PTU_State_ID = %s", where)
        self.assertIn("PTU_Division_ID = %s", where)
        self.assertEqual(params, [12, 91955])
        range_manager.filter.assert_called_once_with(
            range_id=1453,
            range_active="Y",
        )

    def test_all_division_level_dropdown_sources_are_visible_to_range_officers(self):
        user = WorkflowPrincipal({
            "workflow_user_id": 23,
            "workflow_role": "ro",
            "workflow_scope": {"state_id": 12, "range_id": 1453},
        })
        modules = (
            "processing-unit",
            "seed-collection",
            "seed-processing",
            "nursery-distribution",
            "plant-production",
        )
        with patch("todos.workflow.M004Range.objects") as range_manager:
            range_manager.filter.return_value.values.return_value.first.return_value = {
                "range_division_id": 91955,
            }
            for module in modules:
                with self.subTest(module=module):
                    definition = MODULES[module]
                    where, params = _scope_for(user, definition)
                    division_column = definition["division_column"]
                    self.assertIn(f"{division_column} = %s", where)
                    self.assertEqual(params, [12, 91955])
        self.assertEqual(range_manager.filter.call_count, len(modules))

    @patch("todos.workflow.M006Compartment.objects")
    @patch("todos.workflow.M005Section.objects")
    def test_subbeats_are_loaded_only_for_an_active_beat_in_the_selected_range(
        self, section_manager, compartment_manager
    ):
        section_manager.filter.return_value.values.return_value.first.return_value = {
            "section_id": 952,
        }
        compartment_manager.filter.return_value.order_by.return_value.values.return_value = [
            {
                "compart_id": 227,
                "compart_section_id": 952,
                "compart_name": "North Sub-beat",
            }
        ]

        compartments = _compartments_for_section(1453, 952)

        self.assertEqual(compartments[0]["compart_section_id"], 952)
        section_manager.filter.assert_called_once_with(
            section_id=952,
            section_range_id=1453,
            section_active="Y",
        )
        compartment_manager.filter.assert_called_once_with(
            compart_section_id=952,
            compart_active="Y",
        )

    @patch("todos.workflow.M005Section.objects")
    def test_subbeats_are_empty_for_a_beat_outside_the_selected_range(
        self, section_manager
    ):
        section_manager.filter.return_value.values.return_value.first.return_value = None

        compartments = _compartments_for_section(1453, 9999)

        self.assertEqual(compartments, [])

    def test_beat_fields_are_only_exposed_by_tables_that_store_them(self):
        self.assertIn("section_id", MODULES["spa"]["field_columns"])
        self.assertIn("compart_id", MODULES["spa"]["field_columns"])
        self.assertIn("section_id", MODULES["seed-orchard"]["field_columns"])
        self.assertNotIn("compart_id", MODULES["seed-orchard"]["field_columns"])
        for module in ("nursery", "research-institute", "processing-unit"):
            self.assertNotIn("section_id", MODULES[module]["field_columns"])
            self.assertNotIn("compart_id", MODULES[module]["field_columns"])

    @patch("todos.workflow.default_storage.save", side_effect=lambda path, content: path)
    def test_photo_upload_path_fits_legacy_database_column(self, storage_save):
        folders = {
            "spa": "SPA",
            "seed-orchard": "SO",
            "nursery": "NUR",
            "research-institute": "RI",
            "processing-unit": "PTU",
            "seed-collection": "SCS",
        }
        for module, folder in folders.items():
            with self.subTest(module=module):
                request = SimpleNamespace(
                    FILES={
                        "photo": SimpleUploadedFile(
                            "a-very-long-original-forestry-photo-filename.jpg",
                            b"x" * (50 * 1024),
                            content_type="image/jpeg",
                        )
                    }
                )

                stored_path = _upload(request, "photo", module)

                self.assertLessEqual(len(stored_path), 50)
                self.assertTrue(stored_path.startswith(f"Uploads/{folder}/"))
                self.assertTrue(stored_path.endswith(".jpg"))
                self.assertNotIn("a-very-long", stored_path)
        self.assertEqual(storage_save.call_count, len(folders))

    @patch("todos.workflow.default_storage.save", side_effect=lambda path, content: path)
    def test_kml_upload_path_fits_legacy_database_column_for_all_modules(self, storage_save):
        modules = (
            "spa",
            "seed-orchard",
            "nursery",
            "research-institute",
            "processing-unit",
            "plant-disposal",
        )
        for module in modules:
            with self.subTest(module=module):
                request = SimpleNamespace(
                    FILES={
                        "kml": SimpleUploadedFile(
                            "a-very-long-original-map-filename.kml",
                            b"<kml />",
                        )
                    }
                )

                stored_path = _upload(request, "kml", module)

                self.assertLessEqual(len(stored_path), 50)
                self.assertTrue(stored_path.startswith("Uploads/KML/"))
                self.assertTrue(stored_path.endswith(".kml"))
        self.assertEqual(storage_save.call_count, len(modules))

    def test_multipart_values_are_scalarized_before_validation(self):
        data = QueryDict("distance=2&state_id=12&district_id=243")

        values = _locations("national", {}, data, MODULES["nursery"])

        self.assertEqual(values["distance"], "2")
        self.assertEqual(_db_value(values["distance"], {"name": "distance", "type": "number", "required": True}), 2.0)
        self.assertEqual(values["state_id"], "12")

    @patch("todos.workflow.M002Circle.objects")
    @patch("todos.workflow.M003Division.objects")
    @patch("todos.workflow.M004Range.objects")
    def test_range_and_beat_selection_is_checked_against_the_parent(
        self, range_manager, division_manager, circle_manager
    ):
        range_manager.filter.return_value.values.return_value.first.return_value = {
            "range_division_id": 9,
        }
        division_manager.filter.return_value.values.return_value.first.return_value = {
            "division_circle_id": 7,
        }
        circle_manager.filter.return_value.exists.return_value = True
        fields = {"field_columns": {
            "state_id": "SPA_State_ID",
            "circle_id": "SPA_Circle_ID",
            "division_id": "SPA_Division_ID",
            "range_id": "SPA_Range_ID",
            "section_id": "SPA_Section_ID",
            "compart_id": "SPA_Compart_ID",
        }}
        data = QueryDict("state_id=3&circle_id=7&division_id=9&range_id=14&section_id=21")

        with patch("todos.workflow.M005Section.objects") as section_manager:
            section_manager.filter.return_value.exists.return_value = True
            result = _locations("national", {}, data, fields)

        self.assertEqual(result["section_id"], "21")
        section_manager.filter.assert_called_once_with(
            section_id=21,
            section_range_id=14,
            section_active="Y",
        )

    @patch("todos.workflow.M004Range.objects")
    def test_range_from_another_division_is_rejected(self, range_manager):
        range_manager.filter.return_value.values.return_value.first.return_value = {
            "range_division_id": 99,
        }
        with self.assertRaises(PermissionDenied):
            _locations(
                "dfo",
                {"state_id": 3, "division_id": 9},
                QueryDict("state_id=3&division_id=9&range_id=14"),
                {"field_columns": {
                    "state_id": "SPA_State_ID",
                    "division_id": "SPA_Division_ID",
                    "range_id": "SPA_Range_ID",
                }},
            )

    @patch("todos.workflow.M006Compartment.objects")
    @patch("todos.workflow.M005Section.objects")
    @patch("todos.workflow.M002Circle.objects")
    @patch("todos.workflow.M003Division.objects")
    @patch("todos.workflow.M004Range.objects")
    def test_subbeat_must_belong_to_selected_beat(
        self, range_manager, division_manager, circle_manager,
        section_manager, compartment_manager
    ):
        range_manager.filter.return_value.values.return_value.first.return_value = {
            "range_division_id": 9,
        }
        division_manager.filter.return_value.values.return_value.first.return_value = {
            "division_circle_id": 7,
        }
        circle_manager.filter.return_value.exists.return_value = True
        section_manager.filter.return_value.exists.return_value = True
        compartment_manager.filter.return_value.exists.return_value = False
        with self.assertRaises(ValidationError):
            _locations(
                "national",
                {},
                QueryDict("state_id=3&circle_id=7&division_id=9&range_id=14&section_id=21&compart_id=28"),
                {"field_columns": {
                    "state_id": "SPA_State_ID",
                    "circle_id": "SPA_Circle_ID",
                    "division_id": "SPA_Division_ID",
                    "range_id": "SPA_Range_ID",
                    "section_id": "SPA_Section_ID",
                    "compart_id": "SPA_Compart_ID",
                }},
            )

    def test_number_fields_accept_decimal_comma_but_reject_negative_and_non_finite_values(self):
        distance = {"name": "distance", "type": "number", "required": True}
        self.assertEqual(_db_value("2", distance), 2.0)
        self.assertEqual(_db_value("1,25", distance), 1.25)
        for value in ("-", "-1", "NaN", "Infinity", "1,2.3", "1" + "0" * 400):
            with self.subTest(value=value):
                with self.assertRaises(ValidationError):
                    _db_value(value, distance)

    def test_coordinates_are_limited_to_eight_decimal_places(self):
        latitude = {"name": "latitude", "type": "number", "required": True}
        self.assertEqual(_db_value("23.12345678", latitude), 23.12345678)
        self.assertEqual(_db_value("-23.5", latitude), -23.5)
        longitude = {"name": "longitude", "type": "number", "required": True}
        self.assertEqual(_db_value("-180", longitude), -180.0)
        with self.assertRaises(ValidationError):
            _db_value("23.123456789", latitude)
        with self.assertRaises(ValidationError):
            _db_value("90.0001", latitude)
        with self.assertRaises(ValidationError):
            _db_value("-180.0001", longitude)

    def test_mobile_fields_require_ten_digits_without_separators(self):
        self.assertEqual(_contact_number("9876543210", "contact_number"), "9876543210")
        self.assertIsNone(_contact_number("", "contact_number"))
        for value in ("98765-43210", "987654321", "98765432101"):
            with self.subTest(value=value):
                with self.assertRaises(ValidationError):
                    _contact_number(value, "contact_number")


class WorkflowDirectoryManagementTests(SimpleTestCase):
    def setUp(self):
        self.factory = APIRequestFactory()
        self.dfo = WorkflowPrincipal({
            "workflow_user_id": 10,
            "workflow_role": "dfo",
            "workflow_scope": {"state_id": 3, "division_id": 9},
        })

    @patch("todos.workflow.M004Range.objects")
    @patch("todos.workflow.connection")
    @patch("todos.workflow.transaction.atomic", return_value=nullcontext())
    def test_dfo_can_add_a_beat_only_to_an_active_range_in_its_division(
        self, atomic, connection_mock, range_manager
    ):
        range_manager.filter.return_value.exists.return_value = True
        cursor = MagicMock()
        cursor.__enter__.return_value = cursor
        cursor.__exit__.return_value = False
        cursor.fetchone.return_value = (701,)
        connection_mock.cursor.return_value = cursor
        request = self.factory.post(
            "/api/workflow/admin/directory/",
            {"kind": "section", "name": "North Beat", "range_id": 1453},
            format="json",
        )
        force_authenticate(request, user=self.dfo)

        response = workflow_admin_directory(request)

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["id"], 701)
        range_manager.filter.assert_called_once_with(
            range_id=1453,
            range_division_id=9,
            range_active="Y",
        )
        insert_sql, insert_values = cursor.execute.call_args_list[-1].args
        self.assertIn("INSERT INTO dbo.M005_Section", insert_sql)
        self.assertEqual(insert_values[:3], [701, 1453, "North Beat"])

    @patch("todos.workflow.M004Range.objects")
    def test_dfo_cannot_add_a_beat_to_another_divisions_range(self, range_manager):
        range_manager.filter.return_value.exists.return_value = False
        request = self.factory.post(
            "/api/workflow/admin/directory/",
            {"kind": "section", "name": "Out of scope", "range_id": 555},
            format="json",
        )
        force_authenticate(request, user=self.dfo)

        response = workflow_admin_directory(request)

        self.assertEqual(response.status_code, 403)

    @patch("todos.workflow.connection")
    @patch("todos.workflow.transaction.atomic", return_value=nullcontext())
    def test_dfo_adds_subbeat_under_selected_beat(self, atomic, connection_mock):
        cursor = MagicMock()
        cursor.__enter__.return_value = cursor
        cursor.__exit__.return_value = False
        cursor.fetchone.side_effect = [(321,), (654,)]
        connection_mock.cursor.return_value = cursor
        request = self.factory.post(
            "/api/workflow/admin/directory/",
            {"kind": "compartment", "name": "North Sub-beat", "section_id": 321},
            format="json",
        )
        force_authenticate(request, user=self.dfo)

        response = workflow_admin_directory(request)

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["id"], 654)
        scope_sql = cursor.execute.call_args_list[0].args[0]
        self.assertIn("r.Range_Division_ID = %s", scope_sql)
        insert_sql, insert_values = cursor.execute.call_args_list[-1].args
        self.assertIn("INSERT INTO dbo.M006_Compart", insert_sql)
        self.assertEqual(insert_values[:3], [654, 321, "North Sub-beat"])

    @patch("todos.workflow.connection")
    def test_dfo_can_activate_a_beat_only_within_its_division(self, connection_mock):
        cursor = MagicMock()
        cursor.__enter__.return_value = cursor
        cursor.__exit__.return_value = False
        cursor.rowcount = 1
        connection_mock.cursor.return_value = cursor
        request = self.factory.patch(
            "/api/workflow/admin/directory/",
            {"kind": "section", "id": 321, "active": True},
            format="json",
        )
        force_authenticate(request, user=self.dfo)

        response = workflow_admin_directory(request)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["kind"], "section")
        update_sql, update_values = cursor.execute.call_args.args
        self.assertIn("Range_Division_ID = %s", update_sql)
        self.assertEqual(update_values[-1], 9)

    def test_dfo_directory_rejects_unknown_patch_kind(self):
        request = self.factory.patch(
            "/api/workflow/admin/directory/",
            {"kind": "unknown", "id": 321, "active": True},
            format="json",
        )
        force_authenticate(request, user=self.dfo)

        response = workflow_admin_directory(request)

        self.assertEqual(response.status_code, 400)


class NurseryDetailSerializerTests(SimpleTestCase):
    def test_includes_coordinates_and_original_photo_path(self):
        serializer = NurseryDetailSerializer(
            instance={
                "nursery_id": 878,
                "nursery_latitude": "23.5",
                "nursery_longitude": "78.2",
                "nursery_photo": "~/Uploads/NUR/nursery.jpg",
                "nursery_kmlurl": "~/Uploads/NUR/nursery.kml",
            }
        )

        self.assertEqual(serializer.data["latitude"], "23.5")
        self.assertEqual(serializer.data["longitude"], "78.2")
        self.assertEqual(serializer.data["photo"], "~/Uploads/NUR/nursery.jpg")
        self.assertEqual(serializer.data["kml_url"], "/api/nurseries/878/kml/")


class WorkflowSiteSpeciesTests(TestCase):
    @patch("todos.progress_workflow.connection.cursor")
    def test_site_species_are_loaded_from_linked_active_species(self, cursor_factory):
        cursor = MagicMock()
        cursor.__enter__.return_value = cursor
        cursor.__exit__.return_value = False
        cursor.fetchall.return_value = [
            (12, "Neem"),
            (12, "Teak"),
            (12, "Neem"),
            (18, "Bamboo"),
        ]
        cursor_factory.return_value = cursor

        species_by_site = _site_species_by_module("nursery", [12, 18])

        self.assertEqual(
            species_by_site,
            {12: ["Neem", "Teak"], 18: ["Bamboo"]},
        )
        query, params = cursor.execute.call_args.args
        self.assertIn("T013_Plant_Produced", query)
        self.assertIn("T010_Nursery_Distribution", query)
        self.assertEqual(params, [12, 18, 12, 18])

    @patch("todos.progress_workflow.connection.cursor")
    def test_site_species_loader_returns_empty_when_site_has_no_associated_species(
        self, cursor_factory
    ):
        cursor = MagicMock()
        cursor.__enter__.return_value = cursor
        cursor.__exit__.return_value = False
        cursor.fetchall.return_value = []
        cursor_factory.return_value = cursor

        self.assertEqual(_site_species_by_module("research-institute", [12]), {})
        cursor_factory.assert_not_called()


class FieldProgressValidationTests(SimpleTestCase):
    def test_reporting_period_uses_january_to_june_and_july_to_december(self):
        self.assertEqual(
            _current_period(date(2026, 4, 8)),
            (date(2026, 1, 1), date(2026, 6, 30)),
        )
        self.assertEqual(
            _current_period(date(2026, 11, 8)),
            (date(2026, 7, 1), date(2026, 12, 31)),
        )

    def test_distance_calculation_enforces_the_configured_100_meter_geofence(self):
        degrees_for_100_meters = GPS_RADIUS_METERS / 6_371_000 * 180 / 3.141592653589793

        self.assertLess(_distance_meters(0, 0, 0, degrees_for_100_meters * 0.99), GPS_RADIUS_METERS)
        self.assertGreater(_distance_meters(0, 0, 0, degrees_for_100_meters * 1.01), GPS_RADIUS_METERS)

    def test_gps_photo_validation_accepts_and_records_a_distant_fix(self):
        photo = SimpleUploadedFile("field.jpg", b"\xff\xd8\xfffield", content_type="image/jpeg")
        request = SimpleNamespace(
            data={
                "captured_latitude": "0",
                "captured_longitude": "0.0005",
                "gps_accuracy_m": "8",
            },
            FILES={"field_photo": photo},
        )
        result = _validate_photo_coordinates(
            request, {"latitude": Decimal("0"), "longitude": Decimal("0")}
        )
        self.assertLessEqual(result[3], Decimal(str(GPS_RADIUS_METERS)))

        request.data["captured_longitude"] = "0.002"
        result = _validate_photo_coordinates(
            request, {"latitude": Decimal("0"), "longitude": Decimal("0")}
        )
        self.assertGreater(result[3], Decimal(str(GPS_RADIUS_METERS)))

    def test_stored_site_distance_supports_far_away_gps_coordinates(self):
        distance = Decimal(str(round(_distance_meters(0, 0, 0, 14.7), 2)))
        self.assertGreater(distance, Decimal("999999.99"))
        for model in (FieldProgressReport, SilviculturistAssessment):
            distance_field = model._meta.get_field("site_distance_m")
            self.assertGreaterEqual(distance_field.max_digits - distance_field.decimal_places, 8)

    def test_gps_accuracy_accepts_200_meters_and_rejects_greater_values(self):
        photo = SimpleUploadedFile("field.jpg", b"\xff\xd8\xfffield", content_type="image/jpeg")
        request = SimpleNamespace(
            data={
                "captured_latitude": "0",
                "captured_longitude": "0",
                "gps_accuracy_m": "200",
            },
            FILES={"field_photo": photo},
        )
        site = {"latitude": Decimal("0"), "longitude": Decimal("0")}

        self.assertEqual(_validate_photo_coordinates(request, site)[2], Decimal("200"))

        request.data["gps_accuracy_m"] = "200.01"
        with self.assertRaises(ValidationError):
            _validate_photo_coordinates(request, site)

    def test_previous_period_comparison_reports_metric_deltas(self):
        current = SimpleNamespace(
            species_details='[{"species":"Neem","height_cm":40}]',
            planted_last_3_months=75,
            plants_alive=60,
            plants_dead=15,
            seedlings_produced=100,
            seedlings_available=80,
            seedlings_distributed=20,
        )
        previous = SimpleNamespace(
            id=5,
            period_start=date(2025, 7, 1),
            period_end=date(2025, 12, 31),
            species_details='[{"species":"Neem","height_cm":30}]',
            planted_last_3_months=50,
            plants_alive=55,
            plants_dead=10,
            seedlings_produced=70,
            seedlings_available=45,
            seedlings_distributed=25,
        )
        comparison = _comparison_data(current, previous)
        self.assertEqual(comparison["changes"]["planted_last_3_months"], 25)
        self.assertEqual(comparison["changes"]["seedlings_distributed"], -5)
        self.assertEqual(comparison["species_changes"][0]["changes"]["height_cm"], 10)

    def test_decimal_validation_rejects_non_finite_or_out_of_bounds_coordinates(self):
        with self.assertRaises(ValidationError):
            _decimal("NaN", "latitude", minimum=Decimal("-90"), maximum=Decimal("90"))
        with self.assertRaises(ValidationError):
            _decimal("91", "latitude", minimum=Decimal("-90"), maximum=Decimal("90"))

    @patch("todos.progress_workflow.timezone.localdate", return_value=date(2026, 10, 10))
    def test_reports_accept_only_current_or_immediately_previous_period(self, _today):
        request = SimpleNamespace(
            data={},
            query_params={
                "period_start": "2026-01-01",
                "period_end": "2026-06-30",
            },
        )
        self.assertEqual(
            _requested_period(request),
            (date(2026, 1, 1), date(2026, 6, 30)),
        )
        request.query_params = {
            "period_start": "2025-01-01",
            "period_end": "2025-06-30",
        }
        with self.assertRaises(ValidationError):
            _requested_period(request)

    def test_only_range_officers_can_submit_reports_and_silviculturists_can_assess(self):
        factory = APIRequestFactory()
        silviculturist = WorkflowPrincipal({
            "workflow_user_id": 11,
            "workflow_role": "silviculturist",
            "workflow_scope": {"state_id": 1},
        })
        range_officer = WorkflowPrincipal({
            "workflow_user_id": 12,
            "workflow_role": "ro",
            "workflow_scope": {"state_id": 1, "range_id": 4},
        })
        request = factory.post("/api/workflow/progress/reports/", {}, format="json")
        force_authenticate(request, user=silviculturist)
        self.assertEqual(workflow_progress_reports(request).status_code, 403)

        request = factory.get("/api/workflow/progress/sites/")
        force_authenticate(request, user=silviculturist)
        self.assertEqual(workflow_progress_sites(request).status_code, 403)

        request = factory.post("/api/workflow/progress/reports/1/assessment/", {}, format="json")
        force_authenticate(request, user=range_officer)
        self.assertEqual(workflow_technical_assessment(request, report_id=1).status_code, 403)

        request = factory.post(
            "/api/workflow/progress/site-assessments/",
            {"site_module": "nursery", "site_record_id": 1},
            format="json",
        )
        force_authenticate(request, user=range_officer)
        self.assertEqual(workflow_site_technical_assessments(request).status_code, 403)


class WorkflowApprovedSiteAssessmentTests(TestCase):
    def setUp(self):
        self.factory = APIRequestFactory()
        self.silviculturist = WorkflowPrincipal({
            "workflow_user_id": 11,
            "workflow_role": "silviculturist",
            "workflow_scope": {"state_id": 1, "division_id": 4},
        })
        self.approved_site = {
            "module": "nursery",
            "record_id": 23,
            "name": "Approved Nursery",
            "state_id": 1,
            "division_id": 4,
            "range_id": 6,
            "latitude": Decimal("28.5"),
            "longitude": Decimal("94.1"),
        }

    @patch("todos.progress_workflow.SilviculturistAssessment.objects.filter")
    @patch("todos.progress_workflow._scoped_sites")
    def test_assessment_site_list_is_limited_to_approved_scoped_sites(
        self, scoped_sites, assessments
    ):
        scoped_sites.return_value = [
            {
                **self.approved_site,
                "technical_review_exempt": False,
                "technical_review_complete": True,
            },
            {
                **self.approved_site,
                "record_id": 24,
                "name": "Legacy Nursery",
                "technical_review_exempt": True,
                "technical_review_complete": True,
            },
        ]
        assessments.return_value.order_by.return_value = []
        request = self.factory.get("/api/workflow/progress/site-assessments/")
        force_authenticate(request, user=self.silviculturist)

        response = workflow_site_technical_assessments(request)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["count"], 1)
        self.assertEqual(response.data["sites"][0]["name"], "Approved Nursery")
        self.assertEqual(response.data["sites"][0]["assessments"], [])
        scoped_sites.assert_called_once_with(
            self.silviculturist,
            include_technical_review=True,
            approved_only=True,
        )

    @patch("todos.progress_workflow.SilviculturistAssessment.objects.create")
    @patch("todos.progress_workflow.T001UserMaster.objects.filter")
    @patch("todos.progress_workflow._scoped_sites")
    def test_silviculturist_can_assess_approved_site_without_ro_report(
        self, scoped_sites, users, create_assessment
    ):
        scoped_sites.return_value = [{
            **self.approved_site,
            "technical_review_exempt": False,
            "technical_review_complete": True,
        }]
        users.return_value.exists.return_value = True
        create_assessment.return_value.id = 71
        request = self.factory.post(
            "/api/workflow/progress/site-assessments/",
            {
                "site_module": "nursery",
                "site_record_id": 23,
                "category": "satisfactory",
                "reasons": "Healthy site growth.",
                "recommendations": "Continue monitoring.",
                "scientific_assessment": "Survival is acceptable.",
            },
            format="json",
        )
        force_authenticate(request, user=self.silviculturist)

        response = workflow_site_technical_assessments(request)

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["id"], 71)
        scoped_sites.assert_called_once_with(
            self.silviculturist,
            include_technical_review=True,
            approved_only=True,
        )
        create_assessment.assert_called_once()
        self.assertIsNone(create_assessment.call_args.kwargs["report"])
        self.assertEqual(create_assessment.call_args.kwargs["site_module"], "nursery")
        self.assertEqual(create_assessment.call_args.kwargs["site_record_id"], 23)

    @patch("todos.progress_workflow.SilviculturistAssessment.objects.filter")
    def test_site_assessments_count_toward_reporting_period_completion(self, assessments):
        query = MagicMock()
        query.values_list.return_value = [23]
        assessments.return_value = query
        sites = [dict(self.approved_site)]

        assessed = _site_assessment_keys(
            sites,
            date(2026, 7, 1),
            date(2026, 12, 31),
        )

        self.assertEqual(assessed, {("nursery", 23)})
        assessments.assert_called_once_with(
            report__isnull=True,
            site_module="nursery",
            site_record_id__in=[23],
            created_at__date__gte=date(2026, 7, 1),
            created_at__date__lte=date(2026, 12, 31),
        )

    @patch("todos.progress_workflow.WorkflowTechnicalRecommendation.objects.filter")
    def test_progress_report_gate_requires_a_clean_final_technical_review(self, filter_recommendations):
        recommendation_history = {
            "seed-orchard": [
                {
                    "record_id": 1,
                    "requested_fields": '["name"]',
                    "addressed_at": date(2026, 1, 5),
                },
                {
                    "record_id": 1,
                    "requested_fields": "[]",
                    "addressed_at": None,
                },
            ],
            "nursery": [
                {
                    "record_id": 2,
                    "requested_fields": '["name"]',
                    "addressed_at": date(2026, 1, 5),
                },
            ],
        }
        recommendation_history["research-institute"] = []

        def recommendations_for(module, record_id__in):
            query = MagicMock()
            query.order_by.return_value.values.return_value = recommendation_history[module]
            return query

        filter_recommendations.side_effect = recommendations_for
        sites = [
            {
                "module": "seed-orchard",
                "record_id": 1,
                "_technical_approval_id": 10,
            },
            {
                "module": "nursery",
                "record_id": 2,
                "_technical_approval_id": 11,
            },
            {
                "module": "research-institute",
                "record_id": 3,
                "_technical_approval_id": None,
            },
            {
                "module": "seed-orchard",
                "record_id": 4,
                "_technical_approval_id": 12,
                "_workflow_status": "A",
            },
        ]

        _add_technical_review_status(sites)

        self.assertTrue(sites[0]["technical_review_complete"])
        self.assertTrue(sites[0]["technical_review_required"])
        self.assertFalse(sites[1]["technical_review_complete"])
        self.assertTrue(sites[1]["technical_review_required"])
        self.assertFalse(sites[2]["technical_review_required"])
        self.assertTrue(sites[2]["technical_review_complete"])
        self.assertTrue(sites[3]["technical_review_exempt"])
        self.assertFalse(sites[3]["technical_review_required"])
        self.assertTrue(sites[3]["technical_review_complete"])
        self.assertNotIn("_technical_approval_id", sites[0])
        self.assertNotIn("_workflow_status", sites[3])

    def test_old_approved_record_does_not_block_silviculturist_assessment_count(self):
        user = WorkflowPrincipal({
            "workflow_role": "silviculturist",
            "workflow_scope": {"state_id": 1},
        })
        legacy_site = {
            "module": "seed-orchard",
            "record_id": 4,
            "technical_review_exempt": True,
        }
        with (
            patch(
                "todos.progress_workflow._scoped_sites",
                return_value=[legacy_site],
            ),
            patch(
                "todos.progress_workflow._visible_reports"
            ) as visible_reports,
            patch(
                "todos.progress_workflow.SilviculturistAssessment.objects.filter"
            ) as assessments,
            patch(
                "todos.progress_workflow._site_assessment_keys",
                return_value=set(),
            ),
        ):
            filtered_reports = MagicMock()
            filtered_reports.order_by.return_value = []
            visible_reports.return_value.filter.return_value = filtered_reports
            assessments.return_value.values_list.return_value = []

            completion = _period_completion(user, date(2026, 7, 1), date(2026, 12, 31))

        self.assertEqual(completion["silviculturist_completed"], 0)
        self.assertEqual(completion["missing"], [{
            "task": "ro_report",
            **legacy_site,
        }])

    @patch("todos.progress_workflow._site_record")
    @patch("todos.progress_workflow._pending_technical_reviews")
    def test_progress_submission_is_blocked_until_all_required_reviews_are_done(
        self, pending_reviews, site_record
    ):
        pending_reviews.return_value = [
            {"name": "North Seed Orchard", "module": "seed-orchard"}
        ]
        request = APIRequestFactory().post(
            "/api/workflow/progress/reports/",
            {"site_module": "seed-orchard", "site_record_id": 1},
            format="json",
        )
        force_authenticate(
            request,
            user=WorkflowPrincipal({
                "workflow_user_id": 12,
                "workflow_role": "ro",
                "workflow_scope": {"state_id": 1, "range_id": 4},
            }),
        )

        response = workflow_progress_reports(request)

        self.assertEqual(response.status_code, 400)
        self.assertIn("North Seed Orchard", str(response.data))
        site_record.assert_not_called()


class NurseryKmlProxyTests(SimpleTestCase):
    def test_relative_kml_path_maps_to_the_configured_host(self):
        self.assertEqual(
            _get_nursery_kml_source_url("~/Uploads/NUR/KML/nursery.kml"),
            "https://nationalcampa.nic.in/Harit-SANKALP/Uploads/NUR/KML/nursery.kml",
        )

    def test_external_kml_host_is_rejected(self):
        with self.assertRaises(ValueError):
            _get_nursery_kml_source_url(
                "https://example.com/Uploads/NUR/nursery.kml"
            )

    @patch("todos.views.build_opener")
    @patch("todos.views.T007Nursery.objects")
    def test_kml_endpoint_serves_the_sourced_file(
        self, nursery_manager, opener_builder
    ):
        nursery_manager.filter.return_value.first.return_value = SimpleNamespace(
            nursery_kmlurl="Uploads/NUR/KML/nursery.kml"
        )
        opener = MagicMock()
        opener.open.return_value = BytesIO(b"<kml></kml>")
        opener_builder.return_value = opener

        response = get_nursery_kml(
            APIRequestFactory().get("/api/nurseries/878/kml/"),
            nursery_id=878,
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response["Content-Type"], "application/vnd.google-earth.kml+xml")
        self.assertEqual(response.content, b"<kml></kml>")


class TodoViewSetPermissionTests(SimpleTestCase):
    def setUp(self):
        self.list_todos = TodoViewSet.as_view({"get": "list"})
        self.factory = APIRequestFactory()

    def test_anonymous_user_cannot_list_todos(self):
        response = self.list_todos(self.factory.get("/api/todos/"))

        self.assertEqual(response.status_code, 403)

    def test_non_staff_user_cannot_list_todos(self):
        request = self.factory.get("/api/todos/")
        force_authenticate(
            request,
            user=SimpleNamespace(is_staff=False, is_authenticated=True),
        )

        response = self.list_todos(request)

        self.assertEqual(response.status_code, 403)


class DashboardChartDataTests(SimpleTestCase):
    def setUp(self):
        self.factory = APIRequestFactory()

    def test_height_filter_is_rejected_until_nursery_height_is_available(self):
        response = dashboard_chart_data(
            self.factory.get("/api/dashboard-chart-data/?height_range=0-30")
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("Height filtering is unavailable", response.data["error"])

    def test_district_filter_requires_state(self):
        response = dashboard_chart_data(
            self.factory.get("/api/dashboard-chart-data/?district_id=7")
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("state_id is required", response.data["error"])

    def test_non_numeric_filter_id_is_rejected(self):
        response = dashboard_chart_data(
            self.factory.get("/api/dashboard-chart-data/?state_id=abc")
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("state_id must be a positive integer", response.data["error"])

    @patch("todos.views.T007Nursery.objects")
    @patch("todos.views.M002District.objects")
    @patch("todos.views.M001State.objects")
    def test_state_filter_returns_active_nurseries_grouped_by_district(
        self, state_manager, district_manager, nursery_manager
    ):
        state_manager.filter.return_value.exists.return_value = True
        district_manager.filter.return_value.values.return_value = [
            {"district_id": 7, "district_name": "Sample District"}
        ]
        nursery_records = MagicMock()
        nursery_manager.filter.return_value = nursery_records
        nursery_records.filter.return_value = nursery_records
        nursery_records.values.return_value.annotate.return_value.order_by.return_value = [
            {"nursery_district_id": 7, "nursery_count": 4}
        ]

        response = dashboard_chart_data(
            self.factory.get("/api/dashboard-chart-data/?state_id=1")
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.data,
            {"items": [{"name": "Sample District", "value": 4}]}
        )
        nursery_records.values.assert_called_once_with("nursery_district_id")

    @patch("todos.views.T030AdvanceBooking.objects")
    def test_species_filter_counts_distinct_nurseries_with_matching_bookings(self, booking_manager):
        booking_records = MagicMock()
        booking_manager.filter.return_value = booking_records
        booking_records.values.return_value.annotate.return_value.order_by.return_value = [
            {"ab_state__state_name": "Sample State", "nursery_count": 2}
        ]

        response = dashboard_chart_data(
            self.factory.get("/api/dashboard-chart-data/?species_id=3")
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.data,
            {"items": [{"name": "Sample State", "value": 2}]}
        )
        booking_manager.filter.assert_called_once_with(
            ab_active__in=["Y", "1"],
            ab_species_id=3,
            ab_nursery__nursery_active__in=["Y", "1"]
        )
        booking_records.values.return_value.annotate.assert_called_once_with(
            nursery_count=Count("ab_nursery_id", distinct=True)
        )


class WorkflowRecordPaginationTests(TestCase):
    @patch("todos.workflow._workflow_actor_details")
    def test_delete_action_is_only_exposed_to_pending_record_creator(self, actor_details):
        definition = MODULES["nursery"]
        actor_details.return_value = {
            23: {"id": 23, "name": "DFO Officer", "role": "dfo"},
        }
        records = [
            {
                "Nursery_EntryBy": 23,
                "Nursery_Status": "P",
            },
            {
                "Nursery_EntryBy": 24,
                "Nursery_Status": "P",
            },
            {
                "Nursery_EntryBy": 23,
                "Nursery_Status": "A",
            },
        ]

        _add_record_creator_metadata(records, definition, actor_id=1)

        self.assertEqual(records[0]["created_by"], "DFO Officer")
        self.assertFalse(records[0]["can_delete"])
        self.assertFalse(records[1]["can_delete"])
        self.assertFalse(records[2]["can_delete"])
        _add_record_creator_metadata(records[:1], definition, actor_id=23)
        self.assertTrue(records[0]["can_delete"])

    def test_returns_total_and_offsets_for_database_records(self):
        module = "nursery"
        definition = MODULES[module]
        cursor = MagicMock()
        cursor.__enter__.return_value = cursor
        cursor.__exit__.return_value = False
        cursor.fetchall.side_effect = lambda: [
            tuple(f"value-{index}" for index in range(len(definition["columns"])))
            for _ in range(100)
        ]
        cursor.fetchone.return_value = (964,)
        principal = WorkflowPrincipal({
            "workflow_user_id": 1,
            "workflow_role": "national",
            "workflow_scope": {},
        })
        request = APIRequestFactory().get(
            "/api/workflow/records/nursery/?limit=100&offset=500"
        )
        force_authenticate(request, user=principal)

        with patch("todos.workflow.connection.cursor", return_value=cursor):
            response = workflow_records(request, module)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["count"], 964)
        self.assertEqual(response.data["next_offset"], 600)
        self.assertEqual(response.data["previous_offset"], 400)
        self.assertEqual(len(response.data["records"]), 100)
        self.assertIn("OFFSET %s ROWS FETCH NEXT %s ROWS ONLY", cursor.execute.call_args_list[0].args[0])
        self.assertEqual(cursor.execute.call_args_list[0].args[1][-2:], [500, 100])

    def test_last_page_has_no_next_offset(self):
        definition = MODULES["nursery"]
        cursor = MagicMock()
        cursor.__enter__.return_value = cursor
        cursor.__exit__.return_value = False
        cursor.fetchall.side_effect = lambda: [
            tuple(f"value-{index}" for index in range(len(definition["columns"])))
            for _ in range(64)
        ]
        cursor.fetchone.return_value = (964,)
        request = APIRequestFactory().get(
            "/api/workflow/records/nursery/?limit=100&offset=900"
        )
        force_authenticate(
            request,
            user=WorkflowPrincipal({
                "workflow_user_id": 1,
                "workflow_role": "national",
                "workflow_scope": {},
            }),
        )

        with patch("todos.workflow.connection.cursor", return_value=cursor):
            response = workflow_records(request, "nursery")

        self.assertEqual(response.status_code, 200)
        self.assertIsNone(response.data["next_offset"])
        self.assertEqual(response.data["previous_offset"], 800)
        self.assertEqual(len(response.data["records"]), 64)

    def test_pending_review_report_includes_all_lower_hierarchy_levels(self):
        definition = MODULES["nursery"]
        cursor = MagicMock()
        cursor.__enter__.return_value = cursor
        cursor.__exit__.return_value = False
        cursor.fetchall.return_value = []
        cursor.fetchone.return_value = (0,)
        request = APIRequestFactory().get("/api/workflow/records/nursery/?status=P")
        force_authenticate(
            request,
            user=WorkflowPrincipal({
                "workflow_user_id": 1,
                "workflow_role": "national",
                "workflow_scope": {},
            }),
        )

        with patch("todos.workflow.connection.cursor", return_value=cursor):
            response = workflow_records(request, "nursery")

        self.assertEqual(response.status_code, 200)
        query, params = cursor.execute.call_args_list[0].args
        self.assertIn("Nursery_EntryBy IN (SELECT UM_ID", query)
        self.assertIn("UM_Level_ID > %s", query)
        self.assertEqual(params, ["P", 1, 0, 100])

    @patch("todos.workflow._add_display_values")
    def test_workflow_report_filters_by_location_and_returns_display_names(self, add_display_values):
        definition = MODULES["nursery"]
        cursor = MagicMock()
        cursor.__enter__.return_value = cursor
        cursor.__exit__.return_value = False
        cursor.fetchall.return_value = [
            tuple(
                550 if column == "Nursery_District_ID"
                else "Sample Nursery" if column == "Nursery_Name"
                else None
                for column in definition["columns"]
            )
        ]
        cursor.fetchone.return_value = (1,)
        request = APIRequestFactory().get(
            "/api/workflow/records/nursery/?district_id=550&status=legacy&limit=25&offset=0"
        )
        force_authenticate(
            request,
            user=WorkflowPrincipal({
                "workflow_user_id": 1,
                "workflow_role": "national",
                "workflow_scope": {},
            }),
        )

        with patch("todos.workflow.connection.cursor", return_value=cursor):
            response = workflow_records(request, "nursery")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["count"], 1)
        sql = cursor.execute.call_args_list[0].args[0]
        self.assertIn("Nursery_District_ID = %s", sql)
        self.assertIn("Nursery_Status IS NULL", sql)
        self.assertEqual(cursor.execute.call_args_list[0].args[1], [550, 0, 25])
        add_display_values.assert_called_once()


class WorkflowRecordCreateTests(TestCase):
    @patch("todos.workflow.M002Circle.objects")
    @patch("todos.workflow.M003Division.objects")
    @patch("todos.workflow.M004Range.objects")
    def test_create_allocates_manual_primary_key_under_table_lock(
        self, range_manager, division_manager, circle_manager
    ):
        range_manager.filter.return_value.values.return_value.first.return_value = {
            "range_division_id": 91955,
        }
        division_manager.filter.return_value.values.return_value.first.return_value = {
            "division_circle_id": 65613,
        }
        circle_manager.filter.return_value.exists.return_value = True
        request = APIRequestFactory().post(
            "/api/workflow/records/nursery/",
            {
                "state_id": "12",
                "district_id": "243",
                "subdistrict_id": "6087",
                "block_id": "7058",
                "circle_id": "65613",
                "division_id": "91955",
                "range_id": "1453",
                "propagation_type": "S",
                "name": "Test nursery",
                "maintain_by": "FD",
                "year_id": "2024",
                "location": "Test location",
                "distance": "2",
                "contact_person_name": "Range Officer",
                "contact_person_designation": "Range Officer",
                "contact_person_phone": "7908343412",
                "address": "Test address",
                "website": "test.example",
                "latitude": "28.58360000",
                "longitude": "94.12650000",
                "photo": SimpleUploadedFile(
                    "nursery.jpg",
                    b"x" * (50 * 1024),
                    content_type="image/jpeg",
                ),
            },
            format="multipart",
        )
        force_authenticate(
            request,
            user=WorkflowPrincipal({
                "workflow_user_id": 1,
                "workflow_role": "national",
                "workflow_scope": {},
            }),
        )
        cursor = MagicMock()
        cursor.__enter__.return_value = cursor
        cursor.__exit__.return_value = False
        cursor.fetchone.side_effect = [(5609,), (5609,)]

        with patch("todos.workflow.connection.cursor", return_value=cursor):
            with patch("todos.workflow.transaction.atomic", return_value=nullcontext()):
                with patch("todos.workflow._upload", return_value="Uploads/NUR/photo.jpg"):
                    response = workflow_records(request, "nursery")

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["id"], 5609)
        allocation_call = cursor.execute.call_args_list[0]
        allocation_sql = allocation_call.args[0]
        self.assertIn("MAX([Nursery_ID])", allocation_sql)
        self.assertIn("TABLOCKX, HOLDLOCK", allocation_sql)
        insert_sql, insert_values = cursor.execute.call_args_list[1].args
        self.assertIn("[Nursery_ID]", insert_sql)
        self.assertEqual(insert_values[-1], 5609)


class WorkflowRecordDetailTests(TestCase):
    @patch("todos.workflow._record_workflow_details")
    @patch("todos.workflow._add_related_nursery_location")
    @patch("todos.workflow._add_display_values")
    @patch("todos.workflow.WorkflowTechnicalRecommendation.objects.filter")
    def test_detail_is_scoped_and_returns_location_and_audit_data(
        self, recommendations, add_display_values, add_related, workflow_details
    ):
        definition = MODULES["nursery"]
        row = tuple(
            14.3 if column == "Nursery_Latitude"
            else 74.8 if column == "Nursery_Longitude"
            else "Sample Nursery" if column == "Nursery_Name"
            else 550 if column == "Nursery_District_ID"
            else "P" if column == "Nursery_Status"
            else None
            for column in definition["columns"]
        )
        cursor = MagicMock()
        cursor.__enter__.return_value = cursor
        cursor.__exit__.return_value = False
        cursor.fetchone.return_value = row
        workflow_details.return_value = {"status": "P", "history": []}
        review_query = MagicMock()
        recommendations.return_value = review_query
        review_query.order_by.return_value = review_query
        review_query.filter.return_value.order_by.return_value.first.return_value = None
        request = APIRequestFactory().get("/api/workflow/records/nursery/55/")
        force_authenticate(
            request,
            user=WorkflowPrincipal({
                "workflow_user_id": 1,
                "workflow_role": "national",
                "workflow_scope": {},
            }),
        )

        with patch("todos.workflow.connection.cursor", return_value=cursor):
            response = workflow_record_detail(request, "nursery", 55)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["record"]["Nursery_Name"], "Sample Nursery")
        self.assertEqual(response.data["record"]["Nursery_District_ID"], 550)
        self.assertEqual(response.data["workflow"]["status"], "P")
        self.assertIn("Nursery_ID = %s", cursor.execute.call_args.args[0])
        add_display_values.assert_called_once()
        add_related.assert_called_once()
        self.assertEqual(response.data["technical_reviews"], [])
        self.assertTrue(response.data["review_fields"])
        self.assertFalse(response.data["can_correct"])

    @patch("todos.workflow.connection.cursor")
    def test_creator_can_delete_own_pending_record(self, cursor_factory):
        definition = MODULES["seed-orchard"]
        cursor = MagicMock()
        cursor.__enter__.return_value = cursor
        cursor.__exit__.return_value = False
        cursor.rowcount = 1
        cursor_factory.return_value = cursor
        request = APIRequestFactory().delete(
            "/api/workflow/records/seed-orchard/55/"
        )
        user = WorkflowPrincipal({
            "workflow_user_id": 23,
            "workflow_role": "ro",
            "workflow_scope": {"state_id": 12, "range_id": 1453},
        })
        force_authenticate(
            request,
            user=user,
        )
        scope_filter, scope_params = _scope_for(user, definition)

        with patch("todos.workflow.transaction.atomic", side_effect=lambda: nullcontext()):
            response = workflow_record_detail(request, "seed-orchard", 55)

        self.assertEqual(response.status_code, 204)
        query, params = cursor.execute.call_args.args
        self.assertIn(f"DELETE FROM dbo.{definition['table']}", query)
        self.assertIn(scope_filter, query)
        self.assertIn(f"{definition['entry_column']} = %s", query)
        self.assertIn(f"{definition['status_column']} = 'P'", query)
        self.assertEqual(params, [*scope_params, 55, 23])

    @patch("todos.workflow.connection.cursor")
    def test_creator_cannot_delete_approved_or_another_users_record(self, cursor_factory):
        cursor = MagicMock()
        cursor.__enter__.return_value = cursor
        cursor.__exit__.return_value = False
        cursor.rowcount = 0
        cursor_factory.return_value = cursor
        request = APIRequestFactory().delete(
            "/api/workflow/records/seed-orchard/55/"
        )
        force_authenticate(
            request,
            user=WorkflowPrincipal({
                "workflow_user_id": 23,
                "workflow_role": "ro",
                "workflow_scope": {"state_id": 12, "range_id": 1453},
            }),
        )

        with patch("todos.workflow.transaction.atomic", side_effect=lambda: nullcontext()):
            response = workflow_record_detail(request, "seed-orchard", 55)

        self.assertEqual(response.status_code, 404)
        self.assertIn("Only your own pending records", response.data["error"])


class WorkflowOverviewTests(TestCase):
    def test_pending_count_uses_separate_scoped_query_for_reviewer(self):
        cursor = MagicMock()
        cursor.__enter__.return_value = cursor
        cursor.__exit__.return_value = False
        cursor.fetchone.side_effect = [(964, 964), (2,)]
        request = APIRequestFactory().get("/api/workflow/overview/")
        force_authenticate(
            request,
            user=WorkflowPrincipal({
                "workflow_user_id": 1,
                "workflow_role": "national",
                "workflow_scope": {},
            }),
        )

        with patch("todos.workflow.MODULES", {"nursery": MODULES["nursery"]}), \
             patch("todos.workflow.connection.cursor", return_value=cursor):
            response = workflow_overview(request)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["counts"][0]["pending"], 2)
        self.assertEqual(cursor.execute.call_count, 2)
        aggregate_sql = cursor.execute.call_args_list[0].args[0]
        pending_sql, pending_params = cursor.execute.call_args_list[1].args
        self.assertNotIn("SELECT UM_ID", aggregate_sql)
        self.assertIn("Nursery_EntryBy IN (SELECT UM_ID", pending_sql)
        self.assertIn("UM_Level_ID > %s", pending_sql)
        self.assertEqual(pending_params, [1])

    def test_silviculturist_overview_counts_only_unchecked_pending_records(self):
        cursor = MagicMock()
        cursor.__enter__.return_value = cursor
        cursor.__exit__.return_value = False
        cursor.fetchone.side_effect = [(964, 964), (7,)]
        request = APIRequestFactory().get("/api/workflow/overview/")
        force_authenticate(
            request,
            user=WorkflowPrincipal({
                "workflow_user_id": 21,
                "workflow_role": "silviculturist",
                "workflow_scope": {"state_id": 8, "division_id": 2},
            }),
        )

        with patch("todos.workflow.MODULES", {"nursery": MODULES["nursery"]}), \
             patch("todos.workflow.connection.cursor", return_value=cursor):
            response = workflow_overview(request)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["counts"][0]["pending"], 7)
        pending_sql = cursor.execute.call_args_list[1].args[0]
        self.assertIn("Nursery_ApprovedBy IS NULL", pending_sql)


class WorkflowTechnicalReviewTests(TestCase):
    def test_review_fields_exclude_uploads_and_jurisdiction_fields(self):
        fields = _technical_review_fields(MODULES["nursery"])

        names = {field["name"] for field in fields}
        self.assertIn("name", names)
        self.assertIn("website", names)
        self.assertNotIn("range_id", names)
        self.assertNotIn("state_id", names)
        self.assertNotIn("photo", names)
        self.assertNotIn("kml", names)

    def test_technical_review_is_complete_only_after_corrections_and_clean_re_review(self):
        self.assertFalse(_technical_review_history_complete([]))
        self.assertFalse(_technical_review_history_complete([
            {"requested_fields": '["name"]', "addressed_at": None},
        ]))
        self.assertFalse(_technical_review_history_complete([
            {"requested_fields": '["name"]', "addressed_at": date(2026, 1, 5)},
        ]))
        self.assertTrue(_technical_review_history_complete([
            {"requested_fields": '["name"]', "addressed_at": date(2026, 1, 5)},
            {"requested_fields": "[]", "addressed_at": None},
        ]))

    @patch("todos.workflow._workflow_actor_details")
    def test_pending_record_exposes_latest_technical_check(self, actor_details):
        actor_details.return_value = {
            21: {"id": 21, "name": "Technical Officer", "role": "silviculturist"},
        }

        details = _record_workflow_details(
            {
                "Nursery_EntryBy": 15,
                "Nursery_ApprovedBy": 21,
                "Nursery_Status": "P",
                "Nursery_EntryOn": None,
                "Nursery_ApprovedOn": None,
            },
            MODULES["nursery"],
        )

        self.assertTrue(details["technical_reviewed"])
        self.assertEqual(details["technical_reviewed_by"]["name"], "Technical Officer")
        self.assertEqual(details["history"][-1]["action"], "technical_reviewed")

    @patch("todos.workflow.WorkflowTechnicalRecommendation.objects.filter")
    @patch("todos.workflow.WorkflowTechnicalRecommendation.objects.create")
    @patch("todos.workflow.T001UserMaster.objects.filter")
    @patch("todos.workflow.connection.cursor")
    def test_silviculturist_saves_recommendation_and_requested_fields_without_changing_status(
        self, cursor_factory, user_filter, create_recommendation, recommendation_filter
    ):
        user_filter.return_value.exists.return_value = True
        recommendation_filter.return_value.order_by.return_value.first.return_value = None
        cursor = MagicMock()
        cursor.__enter__.return_value = cursor
        cursor.__exit__.return_value = False
        cursor.fetchone.return_value = ("P", None)
        cursor.rowcount = 1
        cursor_factory.return_value = cursor
        request = APIRequestFactory().post(
            "/api/workflow/records/nursery/21/technical-review/",
            {
                "recommendation": "Correct the nursery location name.",
                "fields": ["name"],
            },
            format="json",
        )
        force_authenticate(
            request,
            user=WorkflowPrincipal({
                "workflow_user_id": 12,
                "workflow_role": "silviculturist",
                "workflow_scope": {"state_id": 8, "division_id": 4},
            }),
        )

        with patch("todos.workflow.transaction.atomic", side_effect=lambda: nullcontext()):
            response = workflow_technical_review(request, "nursery", 21)

        self.assertEqual(response.status_code, 201)
        create_recommendation.assert_called_once()
        created = create_recommendation.call_args.kwargs
        self.assertEqual(created["module"], "nursery")
        self.assertEqual(created["record_id"], 21)
        self.assertEqual(json.loads(created["requested_fields"]), ["name"])
        update_sql, update_params = cursor.execute.call_args.args
        self.assertIn("SET Nursery_ApprovedBy = %s", update_sql)
        self.assertNotIn("SET Nursery_Status", update_sql)
        self.assertEqual(update_params[0], 12)

    @patch("todos.workflow.WorkflowTechnicalRecommendation.objects.filter")
    @patch("todos.workflow.T001UserMaster.objects.filter")
    @patch("todos.workflow.connection.cursor")
    def test_silviculturist_cannot_re_review_before_requested_corrections(
        self, cursor_factory, user_filter, recommendation_filter
    ):
        user_filter.return_value.exists.return_value = True
        recommendation_filter.return_value.order_by.return_value.first.return_value = SimpleNamespace(
            addressed_at=None,
            requested_fields='["name"]',
        )
        cursor = MagicMock()
        cursor.__enter__.return_value = cursor
        cursor.__exit__.return_value = False
        cursor.fetchone.return_value = ("P", 12)
        cursor_factory.return_value = cursor
        request = APIRequestFactory().post(
            "/api/workflow/records/nursery/21/technical-review/",
            {"recommendation": "Please recheck the record.", "fields": []},
            format="json",
        )
        force_authenticate(
            request,
            user=WorkflowPrincipal({
                "workflow_user_id": 12,
                "workflow_role": "silviculturist",
                "workflow_scope": {"state_id": 8, "division_id": 4},
            }),
        )

        with patch("todos.workflow.transaction.atomic", side_effect=lambda: nullcontext()):
            response = workflow_technical_review(request, "nursery", 21)

        self.assertEqual(response.status_code, 409)
        self.assertEqual(cursor.execute.call_count, 1)

    @patch("todos.workflow.WorkflowTechnicalRecommendation.objects.filter")
    @patch("todos.workflow.connection.cursor")
    def test_ro_can_update_only_requested_fields_and_status_remains_pending(
        self, cursor_factory, recommendation_filter
    ):
        cursor = MagicMock()
        cursor.__enter__.return_value = cursor
        cursor.__exit__.return_value = False
        cursor.fetchone.return_value = ("P", 23)
        cursor.rowcount = 1
        cursor_factory.return_value = cursor
        recommendation = SimpleNamespace(
            requested_fields='["name"]',
            addressed_by=None,
            addressed_by_name="",
            addressed_at=None,
            correction_values="{}",
            save=MagicMock(),
        )
        recommendation_filter.return_value.order_by.return_value.first.return_value = recommendation
        request = APIRequestFactory().patch(
            "/api/workflow/records/nursery/21/",
            {"changes": {"name": "Corrected Nursery"}},
            format="json",
        )
        force_authenticate(
            request,
            user=WorkflowPrincipal({
                "workflow_user_id": 23,
                "workflow_role": "ro",
                "workflow_scope": {"state_id": 8, "range_id": 3},
                "name": "Range Officer",
            }),
        )

        with patch("todos.workflow.transaction.atomic", side_effect=lambda: nullcontext()):
            response = workflow_record_detail(request, "nursery", 21)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["corrected_fields"], ["name"])
        update_sql, update_params = cursor.execute.call_args.args
        self.assertIn("SET Nursery_Name = %s", update_sql)
        self.assertIn("Nursery_Status = 'P'", update_sql)
        self.assertNotIn("SET Nursery_Status", update_sql)
        self.assertEqual(update_params[0], "Corrected Nursery")
        self.assertEqual(recommendation.addressed_by, 23)
        recommendation.save.assert_called_once()

    @patch("todos.workflow.WorkflowTechnicalRecommendation.objects.filter")
    @patch("todos.workflow.connection.cursor")
    def test_ro_cannot_change_fields_not_requested_by_silviculturist(
        self, cursor_factory, recommendation_filter
    ):
        cursor = MagicMock()
        cursor.__enter__.return_value = cursor
        cursor.__exit__.return_value = False
        cursor.fetchone.return_value = ("P", 23)
        cursor_factory.return_value = cursor
        recommendation_filter.return_value.order_by.return_value.first.return_value = SimpleNamespace(
            requested_fields='["name"]'
        )
        request = APIRequestFactory().patch(
            "/api/workflow/records/nursery/21/",
            {"changes": {"name": "Allowed", "address": "Not allowed"}},
            format="json",
        )
        force_authenticate(
            request,
            user=WorkflowPrincipal({
                "workflow_user_id": 23,
                "workflow_role": "ro",
                "workflow_scope": {"state_id": 8, "range_id": 3},
            }),
        )

        with patch("todos.workflow.transaction.atomic", side_effect=lambda: nullcontext()):
            response = workflow_record_detail(request, "nursery", 21)

        self.assertEqual(response.status_code, 400)
        self.assertEqual(cursor.execute.call_count, 1)


class WorkflowProgressVisibilityTests(TestCase):
    @patch("todos.progress_workflow.FieldProgressReport.objects.all")
    def test_silviculturist_progress_reports_are_limited_to_assigned_state_and_division(
        self, report_manager
    ):
        reports = MagicMock()
        reports.filter.return_value = reports
        report_manager.return_value = reports
        user = WorkflowPrincipal({
            "workflow_user_id": 12,
            "workflow_role": "silviculturist",
            "workflow_scope": {"state_id": 8, "circle_id": 4, "division_id": 2},
        })

        _visible_reports(user)

        self.assertEqual(
            reports.filter.call_args_list,
            [call(state_id=8), call(division_id=2)],
        )


class WorkflowApprovalHierarchyTests(TestCase):
    def setUp(self):
        self.factory = APIRequestFactory()

    @patch("todos.workflow.connection.cursor")
    @patch("todos.workflow.WorkflowTechnicalRecommendation.objects.filter")
    def test_circle_can_approve_range_officer_record_in_its_jurisdiction(
        self, recommendations, cursor_factory
    ):
        recommendations.return_value.order_by.return_value.values.return_value = [
            {"requested_fields": "[]", "addressed_at": None},
        ]
        cursor = MagicMock()
        cursor.__enter__.return_value = cursor
        cursor.__exit__.return_value = False
        cursor.rowcount = 1
        cursor_factory.return_value = cursor
        request = self.factory.post(
            "/api/workflow/records/nursery/21/decision/",
            {"decision": "approve"},
            format="json",
        )
        force_authenticate(
            request,
            user=WorkflowPrincipal({
                "workflow_user_id": 12,
                "workflow_role": "circle",
                "workflow_scope": {"state_id": 1, "circle_id": 2},
            }),
        )

        with patch("todos.workflow.transaction.atomic", side_effect=lambda: nullcontext()):
            response = workflow_decision(request, "nursery", 21)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["status"], "A")
        self.assertEqual(cursor.execute.call_count, 2)
        update_sql, update_params = cursor.execute.call_args.args
        self.assertIn("submitter.UM_Level_ID > %s", update_sql)
        self.assertEqual(update_params[-1], 3)

    @patch("todos.workflow.connection.cursor")
    @patch("todos.workflow.WorkflowTechnicalRecommendation.objects.filter")
    def test_dfo_approval_uses_office_role_and_updates_pending_record(
        self, recommendations, cursor_factory
    ):
        recommendations.return_value.order_by.return_value.values.return_value = [
            {"requested_fields": "[]", "addressed_at": None},
        ]
        cursor = MagicMock()
        cursor.__enter__.return_value = cursor
        cursor.__exit__.return_value = False
        cursor.rowcount = 1
        cursor_factory.return_value = cursor
        request = self.factory.post(
            "/api/workflow/records/nursery/21/decision/",
            {"decision": "approve"},
            format="json",
        )
        force_authenticate(
            request,
            user=WorkflowPrincipal({
                "workflow_user_id": 12,
                "workflow_role": "dfo",
                "workflow_scope": {"state_id": 1, "division_id": 4},
            }),
        )

        with patch("todos.workflow.transaction.atomic", side_effect=lambda: nullcontext()):
            response = workflow_decision(request, "nursery", 21)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["status"], "A")
        self.assertEqual(cursor.execute.call_count, 2)
        update_sql, update_params = cursor.execute.call_args.args
        self.assertIn("SET Nursery_Status = %s", update_sql)
        self.assertIn("submitter.UM_Level_ID > %s", update_sql)
        self.assertEqual(update_params[-1], 4)

    @patch("todos.workflow.WorkflowTechnicalRecommendation.objects.filter")
    def test_all_superior_office_roles_can_review_lower_hierarchy_records(self, recommendations):
        recommendations.return_value.order_by.return_value.values.return_value = [
            {"requested_fields": "[]", "addressed_at": None},
        ]
        reviewer_scopes = {
            "national": {},
            "state": {"state_id": 1},
            "circle": {"state_id": 1, "circle_id": 2},
            "dfo": {"state_id": 1, "division_id": 4},
        }
        reviewer_levels = {"national": 1, "state": 2, "circle": 3, "dfo": 4}

        for role, scope in reviewer_scopes.items():
            with self.subTest(role=role):
                cursor = MagicMock()
                cursor.__enter__.return_value = cursor
                cursor.__exit__.return_value = False
                cursor.rowcount = 1
                request = self.factory.post(
                    "/api/workflow/records/nursery/21/decision/",
                    {"decision": "approve"},
                    format="json",
                )
                force_authenticate(
                    request,
                    user=WorkflowPrincipal({
                        "workflow_user_id": 12,
                        "workflow_role": role,
                        "workflow_scope": scope,
                    }),
                )

                with (
                    patch("todos.workflow.transaction.atomic", side_effect=lambda: nullcontext()),
                    patch("todos.workflow.connection.cursor", return_value=cursor),
                ):
                    response = workflow_decision(request, "nursery", 21)

                self.assertEqual(response.status_code, 200)
                query, params = cursor.execute.call_args.args
                self.assertIn("submitter.UM_Level_ID > %s", query)
                self.assertEqual(params[-1], reviewer_levels[role])

    @patch("todos.workflow.WorkflowTechnicalRecommendation.objects.filter")
    @patch("todos.workflow.connection.cursor")
    def test_approval_is_blocked_until_technical_corrections_are_rechecked(
        self, cursor_factory, recommendations
    ):
        cursor = MagicMock()
        cursor.__enter__.return_value = cursor
        cursor.__exit__.return_value = False
        cursor.fetchone.return_value = (1,)
        cursor_factory.return_value = cursor
        recommendations.return_value.order_by.return_value.values.return_value = [
            {"requested_fields": '["name"]', "addressed_at": None},
        ]
        request = self.factory.post(
            "/api/workflow/records/seed-orchard/21/decision/",
            {"decision": "approve"},
            format="json",
        )
        force_authenticate(
            request,
            user=WorkflowPrincipal({
                "workflow_user_id": 12,
                "workflow_role": "dfo",
                "workflow_scope": {"state_id": 1, "division_id": 4},
            }),
        )

        with patch("todos.workflow.transaction.atomic", side_effect=lambda: nullcontext()):
            response = workflow_decision(request, "seed-orchard", 21)

        self.assertEqual(response.status_code, 409)
        self.assertEqual(cursor.execute.call_count, 1)

    @patch("todos.workflow.WorkflowTechnicalRecommendation.objects.filter")
    @patch("todos.workflow.connection.cursor")
    def test_approval_proceeds_after_corrections_are_rechecked(
        self, cursor_factory, recommendations
    ):
        cursor = MagicMock()
        cursor.__enter__.return_value = cursor
        cursor.__exit__.return_value = False
        cursor.fetchone.return_value = (1,)
        cursor.rowcount = 1
        cursor_factory.return_value = cursor
        recommendations.return_value.order_by.return_value.values.return_value = [
            {"requested_fields": '["name"]', "addressed_at": date(2026, 1, 5)},
            {"requested_fields": "[]", "addressed_at": None},
        ]
        request = self.factory.post(
            "/api/workflow/records/seed-orchard/21/decision/",
            {"decision": "approve"},
            format="json",
        )
        force_authenticate(
            request,
            user=WorkflowPrincipal({
                "workflow_user_id": 12,
                "workflow_role": "dfo",
                "workflow_scope": {"state_id": 1, "division_id": 4},
            }),
        )

        with patch("todos.workflow.transaction.atomic", side_effect=lambda: nullcontext()):
            response = workflow_decision(request, "seed-orchard", 21)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["status"], "A")
        self.assertEqual(cursor.execute.call_count, 2)


class WorkflowAdminAuthorizationTests(SimpleTestCase):
    def setUp(self):
        self.factory = APIRequestFactory()

    def test_national_user_creation_is_limited_to_state_level(self):
        principal = WorkflowPrincipal({
            "workflow_user_id": 1,
            "workflow_role": "national",
            "workflow_scope": {},
        })

        location = _admin_scope_location(principal, 2, {"state_id": "8"})

        self.assertEqual(
            location,
            {"state_id": 8, "circle_id": None, "division_id": None, "range_id": None},
        )

    def test_national_user_cannot_create_an_arbitrary_lower_level_account(self):
        principal = WorkflowPrincipal({
            "workflow_user_id": 1,
            "workflow_role": "national",
            "workflow_scope": {},
        })

        with self.assertRaises(PermissionDenied):
            _admin_scope_location(principal, 5, {"state_id": "8"})

    def test_ro_cannot_access_account_administration(self):
        request = self.factory.get("/api/workflow/admin/users/")
        force_authenticate(
            request,
            user=WorkflowPrincipal({
                "workflow_user_id": 1,
                "workflow_role": "ro",
                "workflow_scope": {},
            }),
        )

        response = workflow_admin_users(request)

        self.assertEqual(response.status_code, 403)

    def test_admin_write_requires_a_numeric_database_actor_id(self):
        request = self.factory.post("/api/workflow/admin/users/", {}, format="json")
        force_authenticate(
            request,
            user=WorkflowPrincipal({
                "workflow_role": "national",
                "workflow_scope": {},
            }),
        )

        response = workflow_admin_users(request)

        self.assertEqual(response.status_code, 403)
        self.assertIn("numeric T001_UserMaster ID", str(response.data))

    @patch("todos.workflow.M004Range.objects")
    @patch("todos.workflow.T001UserMaster.objects")
    @patch("todos.workflow.CampaSilviculturistUser.objects")
    def test_dfo_user_list_is_limited_to_range_officers_in_its_ranges(
        self, silviculturist_manager, user_manager, range_manager
    ):
        users = MagicMock()
        state_users = MagicMock()
        scoped_users = MagicMock()
        range_ids = object()
        user_manager.all.return_value.exclude.return_value = users
        users.filter.return_value = state_users
        state_users.filter.return_value = scoped_users
        range_manager.filter.return_value.values_list.return_value = range_ids
        silviculturist_manager.values_list.return_value = []
        dfo = WorkflowPrincipal({
            "workflow_user_id": 10,
            "workflow_role": "dfo",
            "workflow_scope": {"state_id": 3, "division_id": 9},
        })

        from .workflow import _admin_users

        result = _admin_users(dfo)

        self.assertIs(result, scoped_users)
        range_manager.filter.assert_called_once_with(
            range_division_id=9,
            range_active="Y",
        )
        users.filter.assert_called_once_with(state_id=3)
        self.assertEqual(
            state_users.filter.call_args.kwargs,
            {"level_id": 5, "range_id__in": range_ids},
        )

    @patch("todos.workflow.M004Range.objects")
    @patch("todos.workflow.M003Division.objects")
    @patch("todos.workflow.T001UserMaster.objects")
    @patch("todos.workflow.CampaSilviculturistUser.objects")
    def test_circle_user_list_includes_dfo_accounts_and_range_users(
        self, silviculturist_manager, user_manager, division_manager, range_manager
    ):
        users = MagicMock()
        state_users = MagicMock()
        scoped_users = MagicMock()
        divisions = object()
        ranges = object()
        user_manager.all.return_value.exclude.return_value = users
        users.filter.return_value = state_users
        state_users.filter.return_value = scoped_users
        division_manager.filter.return_value.values_list.return_value = divisions
        range_manager.filter.return_value.values_list.return_value = ranges
        silviculturist_manager.values_list.return_value = []
        circle = WorkflowPrincipal({
            "workflow_user_id": 10,
            "workflow_role": "circle",
            "workflow_scope": {"state_id": 3, "circle_id": 8},
        })

        from .workflow import _admin_users
        from django.db.models import Q

        result = _admin_users(circle)

        self.assertIs(result, scoped_users)
        self.assertEqual(
            state_users.filter.call_args.args,
            (Q(division_id__in=divisions) | Q(range_id__in=ranges),),
        )

    @patch("todos.workflow._admin_users")
    def test_office_level_accounts_cannot_be_approved_or_activated(self, admin_users):
        for action in ("approve", "activate", "deactivate"):
            with self.subTest(action=action):
                target = MagicMock()
                target.values.return_value.first.return_value = {
                    "level_id": 4,
                    "user_type": "U",
                    "approved": "Y",
                }
                admin_users.return_value.filter.return_value = target
                request = self.factory.patch(
                    "/api/workflow/admin/users/",
                    {"user_id": 12, "action": action},
                    format="json",
                )
                force_authenticate(
                    request,
                    user=WorkflowPrincipal({
                        "workflow_user_id": 1,
                        "workflow_role": "national",
                        "workflow_scope": {},
                    }),
                )

                response = workflow_admin_users(request)

                self.assertEqual(response.status_code, 403)
                target.update.assert_not_called()

    def test_new_dfo_account_is_authenticated_without_manual_approval(self):
        request = self.factory.post(
            "/api/workflow/admin/users/",
            {
                "level_id": 4,
                "user_type": "U",
                "fname": "Forest",
                "lname": "Officer",
                "email": "dfo@example.test",
                "password": "password123",
                "confirm_password": "password123",
                "designation_id": 1,
                "state_id": 3,
                "circle_id": 8,
                "division_id": 9,
            },
            format="json",
        )
        force_authenticate(
            request,
            user=WorkflowPrincipal({
                "workflow_user_id": 1,
                "workflow_role": "circle",
                "workflow_scope": {
                    "state_id": 3,
                    "circle_id": 8,
                },
            }),
        )
        cursor = MagicMock()
        cursor.__enter__.return_value = cursor
        cursor.__exit__.return_value = False
        cursor.fetchone.side_effect = [(1,), (14,)]

        with (
            patch(
                "todos.workflow._admin_scope_location",
                return_value={
                    "state_id": 3,
                    "circle_id": 8,
                    "division_id": 9,
                    "range_id": None,
                },
            ),
            patch("todos.workflow._contact_number", return_value="9876543210"),
            patch("todos.workflow.M001State.objects") as state_manager,
            patch("todos.workflow.T001UserMaster.objects") as user_manager,
            patch("todos.workflow.connection") as connection_mock,
            patch("todos.workflow.transaction.atomic", return_value=nullcontext()),
            patch("todos.workflow.make_password", return_value="hashed-password"),
        ):
            state_manager.filter.return_value.exists.return_value = True
            user_manager.filter.return_value.exists.return_value = False
            connection_mock.cursor.return_value = cursor

            response = workflow_admin_users(request)

        self.assertEqual(response.status_code, 201)
        insert_sql, insert_values = cursor.execute.call_args_list[-1].args
        self.assertIn("UM_Approved", insert_sql)
        self.assertEqual(insert_values[-2:], ["Y", "Y"])

    @patch("todos.workflow._admin_users")
    def test_only_state_users_can_reset_passwords(self, admin_users):
        target = MagicMock()
        target.values.return_value.first.return_value = {
            "level_id": 2,
            "user_type": "U",
            "approved": "Y",
        }
        admin_users.return_value.filter.return_value = target
        request = self.factory.patch(
            "/api/workflow/admin/users/",
            {"user_id": 12, "action": "reset_password", "password": "password123", "confirm_password": "password123"},
            format="json",
        )
        force_authenticate(
            request,
            user=WorkflowPrincipal({
                "workflow_user_id": 1,
                "workflow_role": "national",
                "workflow_scope": {},
            }),
        )

        response = workflow_admin_users(request)

        self.assertEqual(response.status_code, 403)
        self.assertIn("Only State/Nodal officers", str(response.data))

    def test_silviculturist_cannot_read_modules_outside_technical_scope(self):
        request = self.factory.get("/api/workflow/records/research-institute/")
        force_authenticate(
            request,
            user=WorkflowPrincipal({
                "workflow_user_id": 12,
                "workflow_role": "silviculturist",
                "workflow_scope": {"state_id": 8, "division_id": 2},
            }),
        )

        response = workflow_records(request, "research-institute")

        self.assertEqual(response.status_code, 403)

    def test_only_silviculturist_can_record_technical_review(self):
        request = self.factory.post(
            "/api/workflow/records/nursery/21/technical-review/", {}, format="json"
        )
        force_authenticate(
            request,
            user=WorkflowPrincipal({
                "workflow_user_id": 12,
                "workflow_role": "ro",
                "workflow_scope": {"state_id": 8, "range_id": 3},
            }),
        )

        response = workflow_technical_review(request, "nursery", 21)

        self.assertEqual(response.status_code, 403)


class WorkflowAdminUserPaginationTests(SimpleTestCase):
    @patch("todos.workflow.T001UserMaster.objects")
    def test_admin_user_list_returns_pagination_metadata(self, user_manager):
        users = MagicMock()
        values = MagicMock()
        values.__getitem__.return_value = [{"id": 51}, {"id": 50}]
        users.exclude.return_value = users
        users.order_by.return_value.values.return_value = values
        users.count.return_value = 102
        user_manager.all.return_value = users
        request = APIRequestFactory().get(
            "/api/workflow/admin/users/?limit=100&offset=100"
        )
        force_authenticate(
            request,
            user=WorkflowPrincipal({
                "workflow_user_id": 1,
                "workflow_role": "national",
                "workflow_scope": {},
            }),
        )

        response = workflow_admin_users(request)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["count"], 102)
        self.assertEqual(response.data["users"], [{"id": 51}, {"id": 50}])
        self.assertIsNone(response.data["next_offset"])
        self.assertEqual(response.data["previous_offset"], 0)

    @patch("todos.workflow.T001UserMaster.objects")
    def test_user_type_filter_is_applied(self, user_manager):
        users = MagicMock()
        filtered_users = MagicMock()
        user_manager.all.return_value = users
        users.exclude.return_value = users
        users.filter.return_value = filtered_users
        filtered_users.order_by.return_value.values.return_value.__getitem__.return_value = []
        filtered_users.count.return_value = 0
        request = APIRequestFactory().get(
            "/api/workflow/admin/users/?user_type=U"
        )
        force_authenticate(
            request,
            user=WorkflowPrincipal({
                "workflow_user_id": 1,
                "workflow_role": "national",
                "workflow_scope": {},
            }),
        )

        response = workflow_admin_users(request)

        self.assertEqual(response.status_code, 200)
        users.filter.assert_called_once_with(user_type="U")

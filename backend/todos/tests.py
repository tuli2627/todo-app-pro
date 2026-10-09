from io import BytesIO
from unittest.mock import MagicMock, patch
from types import SimpleNamespace

from django.db.models import Count
from django.test import SimpleTestCase
from rest_framework.test import APIRequestFactory, force_authenticate

from .serializers import NurseryDetailSerializer
from .views import (
    TodoViewSet,
    _get_nursery_kml_source_url,
    dashboard_chart_data,
    get_nursery_kml,
)


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

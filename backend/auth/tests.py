import hashlib
from contextlib import nullcontext
from types import SimpleNamespace
from unittest import TestCase
from unittest.mock import Mock, patch

from django.core.exceptions import ImproperlyConfigured
from django.test import SimpleTestCase
from rest_framework.test import APIRequestFactory

from .backends import CampaNationalAuthBackend
from .models import CampaNationalUser, T001UserMaster
from .views import PariveshLoginView, ROLoginView, RORegistrationView


class PariveshLoginConfigurationTests(SimpleTestCase):
    def test_login_fails_closed_when_secret_is_missing(self):
        request = APIRequestFactory().post(
            "/api/parivesh-login/",
            {"username": "user", "password": "password"},
            format="json",
        )

        with patch("auth.views.settings.PARIVESH_SECRET_KEY", ""):
            with patch("auth.views.requests.post") as post:
                response = PariveshLoginView.as_view()(request)

        self.assertEqual(response.status_code, 503)
        post.assert_not_called()

    def test_authentication_backend_fails_closed_when_secret_is_missing(self):
        with patch(
            "auth.backends.CampaNationalUser.objects.get",
            side_effect=CampaNationalUser.DoesNotExist,
        ):
            with patch("auth.backends.settings.PARIVESH_SECRET_KEY", ""):
                with self.assertRaises(ImproperlyConfigured):
                    CampaNationalAuthBackend().authenticate(
                        None,
                        username="user",
                        password="password",
                    )


class RoleSpecificLoginTests(TestCase):
    def _parivesh_request(self, role, returned_roles):
        parivesh_role = {
            "national": "National Campa",
            "state": "Nodal Officer",
            "circle": "CF",
            "dfo": "DFO",
        }[role]
        request = APIRequestFactory().post(
            "/api/auth/parivesh-login/",
            {"username": "user", "password": "password", "role": role},
            format="json",
        )
        upstream_response = Mock(status_code=200)
        upstream_response.json.return_value = {
            "data": {
                "jwt": "test-token",
                "roleName": returned_roles,
                "roleNameAbbreviationDtos": [
                    {
                        "roleName": parivesh_role,
                        "officeId": "stable-office-11",
                        "officeName": "Sample Office",
                    }
                ],
            }
        }
        with patch("auth.views.settings.PARIVESH_SECRET_KEY", "configured"):
            with patch(
                "auth.views.requests.post",
                return_value=upstream_response,
            ):
                return PariveshLoginView.as_view()(request)

    def test_circle_role_is_authenticated_through_parivesh(self):
        with patch("auth.views._ensure_parivesh_state", return_value=3):
            with patch(
                "auth.views._resolve_parivesh_office",
                return_value={"state_id": 3, "circle_id": 11, "division_id": None},
            ):
                response = self._parivesh_request("circle", ["CF", "National Campa"])

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["user"]["role"], "CF")

    def test_circle_login_requires_existing_state(self):
        with patch("auth.views._ensure_parivesh_state", return_value=None):
            response = self._parivesh_request("circle", ["CF"])

        self.assertEqual(response.status_code, 400)
        self.assertIn("State se login", response.data["error"])

    def test_circle_login_rejects_unmapped_office_without_name(self):
        request = APIRequestFactory().post(
            "/api/auth/parivesh-login/",
            {"username": "user", "password": "password", "role": "circle"},
            format="json",
        )
        upstream_response = Mock(status_code=200)
        upstream_response.json.return_value = {
            "data": {
                "jwt": "test-token",
                "roleName": ["CF"],
                "roleNameAbbreviationDtos": [
                    {"roleName": "CF", "officeId": "stable-office-11"}
                ],
            }
        }
        with patch("auth.views.settings.PARIVESH_SECRET_KEY", "configured"):
            with patch("auth.views._ensure_parivesh_state", return_value=3):
                with patch("auth.views.requests.post", return_value=upstream_response):
                    with patch(
                        "auth.views.CampaWorkflowOffice.objects.filter"
                    ) as office_filter:
                        office_filter.return_value.first.return_value = None
                        response = PariveshLoginView.as_view()(request)

        self.assertEqual(response.status_code, 400)
        self.assertIn("could not be mapped", response.data["error"])

    def test_office_mapping_resolves_scope_without_relying_on_current_office_name(self):
        from .models import CampaWorkflowOffice
        from .views import _resolve_parivesh_office

        mapped_office = CampaWorkflowOffice(
            office_id="stable-office-11",
            role="circle",
            state_id=3,
            circle_id=11,
        )
        scope = {
            "office_id": "stable-office-11",
            "office_name": "Renamed Circle",
            "state_id": 3,
        }
        with patch(
            "auth.views.CampaWorkflowOffice.objects.filter"
        ) as office_filter, patch(
            "auth.views._ensure_parivesh_circle",
            side_effect=AssertionError("Existing office IDs should use their saved mapping."),
        ):
            office_filter.return_value.first.return_value = mapped_office
            resolved = _resolve_parivesh_office("circle", scope)

        self.assertEqual(resolved["circle_id"], 11)
        self.assertEqual(scope["office_id"], "stable-office-11")

    def test_first_office_login_persists_mapping_by_office_id_and_role(self):
        from .models import CampaWorkflowOffice
        from .views import _resolve_parivesh_office

        mapped_office = CampaWorkflowOffice(
            office_id="stable-office-11",
            role="circle",
            state_id=3,
            circle_id=11,
        )
        scope = {
            "office_id": 11,
            "office_name": "Sample Circle",
            "state_id": 3,
        }
        with patch(
            "auth.views.CampaWorkflowOffice.objects.filter"
        ) as office_filter, patch(
            "auth.views.CampaWorkflowOffice.objects.get_or_create",
            return_value=(mapped_office, True),
        ) as get_or_create, patch(
            "auth.views._ensure_parivesh_circle",
            return_value=11,
        ):
            office_filter.return_value.first.return_value = None
            resolved = _resolve_parivesh_office("circle", scope)

        self.assertEqual(resolved["circle_id"], 11)
        self.assertEqual(scope["office_id"], "11")
        get_or_create.assert_called_once_with(
            office_id="11",
            role="circle",
            defaults={
                "state_id": 3,
                "circle_id": 11,
                "division_id": None,
                "office_name": "Sample Circle",
            },
        )

    def test_dfo_login_requires_existing_state_and_circle(self):
        with patch("auth.views._ensure_parivesh_state", return_value=None):
            response = self._parivesh_request("dfo", ["DFO"])

        self.assertEqual(response.status_code, 400)
        self.assertIn("State aur Circle se login", response.data["error"])

    def test_selected_role_must_match_parivesh_account(self):
        response = self._parivesh_request("dfo", ["National Campa"])

        self.assertEqual(response.status_code, 403)

    def test_ro_login_uses_t001_user_master(self):
        self.assertEqual(T001UserMaster._meta.db_table, "T001_UserMaster")
        self.assertFalse(T001UserMaster._meta.managed)

        user = Mock(
            id=1,
            active="Y",
            approved="Y",
            account_blocked="N",
            level_id=5,
            user_type="U",
            fname="Test",
            lname="RO",
            emailid="ro@example.test",
            designation="9",
        )
        user.check_password.return_value = True
        request = APIRequestFactory().post(
            "/api/auth/ro-login/",
            {"userid": "ro@example.test", "password": "password"},
            format="json",
        )

        class RefreshToken:
            access_token = "access-token"

            def __str__(self):
                return "refresh-token"

        with patch("auth.views.T001UserMaster.objects.filter") as user_filter:
            user_filter.return_value.first.return_value = user
            with patch(
                "auth.views.RefreshToken.for_user",
                return_value=RefreshToken(),
            ):
                response = ROLoginView.as_view()(request)

        user_filter.assert_called_once_with(
            emailid__iexact="ro@example.test",
            level_id=5,
            user_type="U",
        )
        self.assertEqual(response.status_code, 200)

    def test_ro_registration_inserts_into_t001_user_master(self):
        request = APIRequestFactory().post(
            "/api/auth/ro-register/",
            {
                "fname": "Test",
                "lname": "RO",
                "emailid": "ro@example.test",
                "password": "secure-password",
                "confirm_password": "secure-password",
                "state_id": 12,
                "range_id": 34,
            },
            format="json",
        )
        cursor = Mock()
        cursor.fetchone.return_value = (2400,)
        cursor_context = Mock()
        cursor_context.__enter__ = Mock(return_value=cursor)
        cursor_context.__exit__ = Mock(return_value=False)

        with patch(
            "auth.views.transaction",
            SimpleNamespace(atomic=lambda: nullcontext()),
        ):
            with patch("auth.views.connection.cursor", return_value=cursor_context):
                with patch("auth.views.T001UserMaster.objects.filter") as user_filter:
                    user_filter.return_value.exists.return_value = False
                    with patch(
                        "django.contrib.auth.hashers.make_password",
                        return_value="django-hashed-password",
                    ):
                        response = RORegistrationView.as_view()(request)

        self.assertEqual(response.status_code, 201)
        self.assertIn("INSERT INTO dbo.T001_UserMaster", cursor.execute.call_args.args[0])
        self.assertEqual(response.data["user"]["id"], 2400)

    def test_t001_legacy_sha256_password_is_upgraded_after_login_check(self):
        user = T001UserMaster(
            id=1,
            level_id=5,
            user_type="U",
            fname="Test",
            lname="RO",
            emailid="ro@example.test",
            password=hashlib.sha256(b"old-password").hexdigest(),
            designation_id=9,
            approved="Y",
            active="Y",
            account_blocked="N",
            status=0,
        )

        with patch.object(user, "save") as save:
            self.assertTrue(user.check_password("old-password"))

        save.assert_called_once_with(update_fields=["password"])
        self.assertNotEqual(user.password, hashlib.sha256(b"old-password").hexdigest())

from rest_framework.authentication import BaseAuthentication, get_authorization_header
from rest_framework.exceptions import AuthenticationFailed
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import AccessToken

from .models import CampaStateWorkflowSession


class WorkflowPrincipal:
    is_authenticated = True
    is_anonymous = False

    def __init__(self, claims):
        self.id = claims.get("workflow_user_id")
        self.login_id = claims.get("user_id")
        self.account_role = claims.get("workflow_role")
        self.role = "state" if self.account_role == "silviculturist" else self.account_role
        self.scope = claims.get("workflow_scope") or {}
        self.name = claims.get("workflow_name") or ""

    def __str__(self):
        return str(self.login_id or self.id or "workflow-user")


class WorkflowJWTAuthentication(BaseAuthentication):
    def authenticate(self, request):
        header = get_authorization_header(request).split()
        if not header:
            return None
        if len(header) != 2 or header[0].lower() != b"bearer":
            raise AuthenticationFailed("Use a valid Bearer access token.")

        try:
            token = AccessToken(header[1])
        except TokenError as error:
            raise AuthenticationFailed("The access token is invalid or expired.") from error

        principal = WorkflowPrincipal(token.payload)
        if principal.account_role not in {
            "national", "state", "circle", "dfo", "ro", "silviculturist"
        }:
            raise AuthenticationFailed("The token has no valid workflow role.")
        if not principal.id:
            raise AuthenticationFailed("The token has no workflow user identity.")
        if principal.role in {"state", "silviculturist"}:
            state_id = principal.scope.get("state_id")
            session_id = token.payload.get("workflow_session_id")
            if not state_id or not session_id or not CampaStateWorkflowSession.objects.filter(
                state_id=state_id,
                session_id=session_id,
                workflow_role=principal.account_role,
                workflow_user_id=str(principal.id),
            ).exists():
                raise AuthenticationFailed(
                    "This State session has been replaced by another State-level login."
                )
        return principal, token

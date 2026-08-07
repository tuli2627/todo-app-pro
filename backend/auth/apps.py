from django.apps import AppConfig

class AuthConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'auth'            # <-- Change this from 'backend.auth' to 'auth'
    label = 'backend_auth'   # Keep this label string exactly the same

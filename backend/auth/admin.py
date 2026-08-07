from django.contrib import admin
from django.contrib.auth import get_user_model

# This automatically grabs your custom model assigned to settings.AUTH_USER_MODEL
User = get_user_model()

# If CAMPADFOUser was registered here, update it to use the new User class:
@admin.register(User)
class CampaDfoUserAdmin(admin.ModelAdmin):
    list_display = ('userid', 'emailid', 'fname', 'state', 'status')
    search_fields = ('userid', 'emailid', 'fname')

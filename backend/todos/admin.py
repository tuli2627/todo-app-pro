from django.contrib import admin
from .models import CAMPADFOUser

admin.site.register(CAMPADFOUser)
from .models import Todo


@admin.register(Todo)
class TodoAdmin(admin.ModelAdmin):
    list_display = ['title', 'completed', 'created_at']
    list_filter = ['completed']
    search_fields = ['title']

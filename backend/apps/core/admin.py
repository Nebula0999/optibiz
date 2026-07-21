from django.contrib import admin

from .models import ReportGeneration


@admin.register(ReportGeneration)
class ReportGenerationAdmin(admin.ModelAdmin):
    list_display = ("report_title", "report_type", "business", "generated_by", "item_count", "created_at")
    list_filter = ("business", "report_type", "created_at")
    search_fields = ("report_title", "business__name", "generated_by__username", "generated_by__first_name", "generated_by__last_name")
    readonly_fields = ("created_at", "updated_at")
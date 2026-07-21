from rest_framework import serializers

from apps.core.models import ReportGeneration


class ReportGenerationSerializer(serializers.ModelSerializer):
    generated_by_name = serializers.SerializerMethodField()
    period_label = serializers.SerializerMethodField()
    report_type_label = serializers.CharField(source="get_report_type_display", read_only=True)

    class Meta:
        model = ReportGeneration
        fields = [
            "id",
            "report_type",
            "report_type_label",
            "report_title",
            "date_from",
            "date_to",
            "period_label",
            "item_count",
            "generated_by_name",
            "created_at",
        ]

    def get_generated_by_name(self, obj):
        if not obj.generated_by:
            return ""
        return obj.generated_by.get_full_name() or obj.generated_by.username

    def get_period_label(self, obj):
        if obj.date_from and obj.date_to:
            return f"{obj.date_from} to {obj.date_to}"
        if obj.date_from:
            return f"From {obj.date_from}"
        if obj.date_to:
            return f"Up to {obj.date_to}"
        return "All time"
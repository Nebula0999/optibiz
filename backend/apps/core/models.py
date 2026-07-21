import uuid

from django.conf import settings
from django.db import models


class TimestampedModel(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True
        ordering = ["-created_at"]


class ReportGeneration(TimestampedModel):
    class ReportType(models.TextChoices):
        SALES = "sales", "Sales"
        EXPENSES = "expenses", "Expenses"
        INVENTORY = "inventory", "Inventory"
        PROFIT_LOSS = "profit-loss", "Profit & Loss"

    business = models.ForeignKey("business.Business", on_delete=models.CASCADE, related_name="report_generations")
    generated_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="generated_reports")
    report_type = models.CharField(max_length=20, choices=ReportType.choices)
    report_title = models.CharField(max_length=255)
    date_from = models.DateField(null=True, blank=True)
    date_to = models.DateField(null=True, blank=True)
    item_count = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = "core_reportgeneration"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["business", "created_at"]),
            models.Index(fields=["business", "report_type"]),
        ]

    def __str__(self) -> str:
        return f"{self.report_title} ({self.created_at:%Y-%m-%d})"

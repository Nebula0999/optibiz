from django.db import models

from apps.core.models import TimestampedModel


class Expense(TimestampedModel):
    business = models.ForeignKey("business.Business", on_delete=models.CASCADE, related_name="expenses")
    category = models.CharField(max_length=120)
    amount = models.DecimalField(max_digits=14, decimal_places=2)
    description = models.CharField(max_length=255, blank=True)
    expense_date = models.DateField()
    created_by = models.ForeignKey("users.User", on_delete=models.SET_NULL, null=True, blank=True, related_name="expenses")

    class Meta:
        db_table = "expenses_expense"
        ordering = ["-expense_date"]
        indexes = [
            models.Index(fields=["business", "expense_date"]),
            models.Index(fields=["business", "category"]),
        ]

    def __str__(self) -> str:
        return f"{self.category}: {self.amount}"

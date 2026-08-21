from django.db import models

from apps.core.models import TimestampedModel


class SACCOMember(TimestampedModel):
    business = models.ForeignKey("business.Business", on_delete=models.CASCADE, related_name="sacco_members")
    name = models.CharField(max_length=255)
    phone = models.CharField(max_length=20, blank=True)
    email = models.EmailField(blank=True)
    membership_no = models.CharField(max_length=120)
    join_date = models.DateField()
    status = models.CharField(max_length=50, default="active")

    class Meta:
        db_table = "sacco_member"
        ordering = ["name"]
        indexes = [models.Index(fields=["business", "status"])]
        constraints = [models.UniqueConstraint(fields=["business", "membership_no"], name="unique_membership_no_per_business")]

    def __str__(self) -> str:
        return self.name


class Contribution(TimestampedModel):
    class PaymentMethod(models.TextChoices):
        CASH = "cash", "Cash"
        MPESA = "mpesa", "M-Pesa"
        BANK = "bank", "Bank Transfer"

    member = models.ForeignKey(SACCOMember, on_delete=models.CASCADE, related_name="contributions")
    business = models.ForeignKey("business.Business", on_delete=models.CASCADE, related_name="sacco_contributions")
    amount = models.DecimalField(max_digits=14, decimal_places=2)
    date = models.DateField()
    payment_method = models.CharField(max_length=20, choices=PaymentMethod.choices, default=PaymentMethod.CASH)
    notes = models.TextField(blank=True)

    class Meta:
        db_table = "sacco_contribution"
        ordering = ["-date"]
        indexes = [
            models.Index(fields=["business", "date"]),
            models.Index(fields=["member", "date"]),
        ]

    def __str__(self) -> str:
        return f"Contribution {self.amount} for {self.member.name}"


class Loan(TimestampedModel):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        ACTIVE = "active", "Active"
        CLOSED = "closed", "Closed"

    member = models.ForeignKey(SACCOMember, on_delete=models.CASCADE, related_name="loans")
    business = models.ForeignKey("business.Business", on_delete=models.CASCADE, related_name="sacco_loans")
    amount = models.DecimalField(max_digits=14, decimal_places=2)
    interest_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    disbursement_date = models.DateField()
    due_date = models.DateField()
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)

    class Meta:
        db_table = "sacco_loan"
        ordering = ["-disbursement_date"]
        indexes = [
            models.Index(fields=["business", "status"]),
            models.Index(fields=["business", "disbursement_date"]),
        ]

    def __str__(self) -> str:
        return f"Loan {self.amount} for {self.member.name}"


class LoanRepayment(TimestampedModel):
    class PaymentMethod(models.TextChoices):
        CASH = "cash", "Cash"
        MPESA = "mpesa", "M-Pesa"
        BANK = "bank", "Bank Transfer"

    business = models.ForeignKey("business.Business", on_delete=models.CASCADE, related_name="sacco_loan_repayments")
    loan = models.ForeignKey(Loan, on_delete=models.CASCADE, related_name="repayments")
    amount_paid = models.DecimalField(max_digits=14, decimal_places=2)
    payment_date = models.DateField()
    payment_method = models.CharField(max_length=20, choices=PaymentMethod.choices, default=PaymentMethod.CASH)
    notes = models.TextField(blank=True)

    class Meta:
        db_table = "sacco_loanrepayment"
        ordering = ["-payment_date"]
        indexes = [
            models.Index(fields=["business", "payment_date"]),
            models.Index(fields=["loan", "payment_date"]),
        ]

    def __str__(self) -> str:
        return f"Repayment {self.amount_paid} for loan {self.loan_id}"

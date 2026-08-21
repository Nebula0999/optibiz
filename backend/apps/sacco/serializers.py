import uuid

from django.utils import timezone
from rest_framework import serializers

from apps.sacco.models import Contribution, Loan, LoanRepayment, SACCOMember


class SACCOMemberSerializer(serializers.ModelSerializer):
    membership_no = serializers.CharField(required=False)
    join_date = serializers.DateField(required=False, default=timezone.localdate)

    class Meta:
        model = SACCOMember
        fields = ["id", "business", "name", "phone", "email", "membership_no", "join_date", "status", "created_at", "updated_at"]
        read_only_fields = ["id", "business", "created_at", "updated_at"]

    def create(self, validated_data):
        validated_data.setdefault("membership_no", f"M-{uuid.uuid4().hex[:8].upper()}")
        return super().create(validated_data)


class ContributionSerializer(serializers.ModelSerializer):
    member_name = serializers.CharField(source="member.name", read_only=True)
    date = serializers.DateField(required=False, default=timezone.localdate)

    class Meta:
        model = Contribution
        fields = ["id", "member", "member_name", "business", "amount", "date", "payment_method", "notes", "created_at", "updated_at"]
        read_only_fields = ["id", "business", "created_at", "updated_at"]


class LoanSerializer(serializers.ModelSerializer):
    member_name = serializers.CharField(source="member.name", read_only=True)
    disbursement_date = serializers.DateField(required=False, default=timezone.localdate)
    due_date = serializers.DateField(required=False, default=timezone.localdate)

    class Meta:
        model = Loan
        fields = ["id", "member", "member_name", "business", "amount", "interest_rate", "disbursement_date", "due_date", "status", "created_at", "updated_at"]
        read_only_fields = ["id", "business", "created_at", "updated_at"]


class LoanRepaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = LoanRepayment
        fields = ["id", "business", "loan", "amount_paid", "payment_date", "payment_method", "notes", "created_at", "updated_at"]
        read_only_fields = ["id", "business", "created_at", "updated_at"]

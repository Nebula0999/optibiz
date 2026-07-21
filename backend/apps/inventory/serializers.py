from rest_framework import serializers

from apps.inventory.models import Inventory, StockMovement
from apps.inventory.services import record_stock_movement


class InventorySerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.name", read_only=True)
    product_buying_price = serializers.DecimalField(source="product.buying_price", max_digits=14, decimal_places=2, read_only=True)
    product_selling_price = serializers.DecimalField(source="product.selling_price", max_digits=14, decimal_places=2, read_only=True)
    product_unit = serializers.CharField(source="product.unit", read_only=True)
    branch_name = serializers.CharField(source="branch.name", read_only=True)
    current_stock = serializers.DecimalField(
        source="quantity_available",
        max_digits=14,
        decimal_places=2,
        read_only=True,
    )

    class Meta:
        model = Inventory
        fields = [
            "id",
            "business",
            "product",
            "product_name",
            "product_buying_price",
            "product_selling_price",
            "product_unit",
            "branch",
            "branch_name",
            "quantity_available",
            "current_stock",
            "reorder_level",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "business", "created_at", "updated_at"]


class StockMovementSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.name", read_only=True)
    branch_name = serializers.SerializerMethodField()

    def get_branch_name(self, obj):
        branch = obj.destination_branch or obj.source_branch
        return branch.name if branch else ""

    class Meta:
        model = StockMovement
        fields = [
            "id",
            "business",
            "product",
            "product_name",
            "source_branch",
            "destination_branch",
            "branch_name",
            "movement_type",
            "quantity",
            "created_by",
            "notes",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "business", "created_by", "created_at", "updated_at"]

    def validate_quantity(self, value):
        if value <= 0:
            raise serializers.ValidationError("Quantity must be greater than zero.")
        return value

    def create(self, validated_data):
        business = validated_data.pop("business")
        created_by = validated_data.pop("created_by", None)
        product = validated_data["product"]

        return record_stock_movement(
            business=business,
            product=product,
            movement_type=validated_data["movement_type"],
            quantity=validated_data["quantity"],
            created_by=created_by,
            notes=validated_data.get("notes", ""),
            source_branch=validated_data.get("source_branch"),
            destination_branch=validated_data.get("destination_branch"),
        )

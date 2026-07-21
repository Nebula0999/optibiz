from decimal import Decimal

from django.db import transaction
from rest_framework import serializers

from apps.business.models import Branch, Business
from apps.inventory.models import Inventory, StockMovement
from apps.products.models import Product


def get_business_branches(business: Business):
    branches = list(business.branches.filter(is_active=True).order_by("created_at"))
    if branches:
        return branches

    branches = list(business.branches.order_by("created_at"))
    if branches:
        return branches

    return [Branch.objects.create(business=business, name="Main Branch")]


def ensure_product_inventory(product: Product):
    branches = get_business_branches(product.business)
    for branch in branches:
        Inventory.objects.get_or_create(
            business=product.business,
            product=product,
            branch=branch,
            defaults={
                "quantity_available": Decimal("0"),
                "reorder_level": product.reorder_level,
            },
        )


def ensure_business_inventory(business: Business):
    branches = get_business_branches(business)
    products = Product.objects.filter(business=business, is_active=True).only("id", "reorder_level")

    for branch in branches:
        for product in products:
            Inventory.objects.get_or_create(
                business=business,
                product=product,
                branch=branch,
                defaults={
                    "quantity_available": Decimal("0"),
                    "reorder_level": product.reorder_level,
                },
            )


def get_sale_branch(business: Business):
    return get_business_branches(business)[0]


def apply_inventory_delta(
    *,
    business: Business,
    product: Product,
    branch: Branch,
    delta: Decimal,
):
    inventory, _ = Inventory.objects.select_for_update().get_or_create(
        business=business,
        product=product,
        branch=branch,
        defaults={
            "quantity_available": Decimal("0"),
            "reorder_level": product.reorder_level,
        },
    )

    new_quantity = inventory.quantity_available + delta
    if new_quantity < 0:
        raise serializers.ValidationError(
            {
                "quantity": f"Not enough stock for {product.name} at {branch.name}. Available: {inventory.quantity_available}."
            }
        )

    inventory.quantity_available = new_quantity
    if inventory.reorder_level == 0 and product.reorder_level:
        inventory.reorder_level = product.reorder_level
    inventory.save(update_fields=["quantity_available", "reorder_level", "updated_at"])


def record_stock_movement(
    *,
    business: Business,
    product: Product,
    movement_type: str,
    quantity,
    created_by=None,
    notes: str = "",
    source_branch: Branch | None = None,
    destination_branch: Branch | None = None,
):
    with transaction.atomic():
        quantity = Decimal(str(quantity))
        if quantity <= 0:
            raise serializers.ValidationError({"quantity": "Quantity must be greater than zero."})

        if movement_type == StockMovement.MovementType.IN:
            branch = destination_branch or get_sale_branch(business)
            apply_inventory_delta(
                business=business,
                product=product,
                branch=branch,
                delta=quantity,
            )
            source_branch = None
            destination_branch = branch
        elif movement_type == StockMovement.MovementType.OUT:
            branch = source_branch or get_sale_branch(business)
            apply_inventory_delta(
                business=business,
                product=product,
                branch=branch,
                delta=-quantity,
            )
            source_branch = branch
            destination_branch = None
        else:
            raise serializers.ValidationError({"movement_type": "Only stock in and stock out movements are supported."})

        return StockMovement.objects.create(
            business=business,
            product=product,
            movement_type=movement_type,
            quantity=quantity,
            source_branch=source_branch,
            destination_branch=destination_branch,
            created_by=created_by,
            notes=notes,
        )


def reverse_sale_inventory(sale):
    branch = sale.branch or get_sale_branch(sale.business)
    for item in sale.items.select_related("product"):
        record_stock_movement(
            business=sale.business,
            product=item.product,
            movement_type=StockMovement.MovementType.IN,
            quantity=item.quantity,
            created_by=sale.created_by,
            notes=f"Reversal for sale #{sale.pk}",
            destination_branch=branch,
        )

from rest_framework import serializers
from .models import (
    Category, Ingredient, Product, ProductIngredient,
    RestaurantTable, Customer, Order, OrderItem, Reservation
)
from decimal import Decimal
import uuid
from django.utils import timezone


class CategorySerializer(serializers.ModelSerializer):
    products_count = serializers.IntegerField(source='products.count', read_only=True)

    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'description', 'icon', 'display_order', 'is_active', 'products_count', 'created_at']


class IngredientSerializer(serializers.ModelSerializer):
    is_low_stock = serializers.BooleanField(read_only=True)

    class Meta:
        model = Ingredient
        fields = [
            'id', 'name', 'unit', 'stock_quantity', 'minimum_stock',
            'cost_price', 'is_allergen', 'allergen_info', 'is_low_stock', 'created_at'
        ]


class ProductIngredientSerializer(serializers.ModelSerializer):
    ingredient_name = serializers.ReadOnlyField(source='ingredient.name')
    ingredient_unit = serializers.ReadOnlyField(source='ingredient.unit')

    class Meta:
        model = ProductIngredient
        fields = ['id', 'product', 'ingredient', 'ingredient_name', 'ingredient_unit', 'quantity_required', 'is_optional']


class ProductSerializer(serializers.ModelSerializer):
    category_name = serializers.ReadOnlyField(source='category.name')
    recipe_ingredients = ProductIngredientSerializer(many=True, read_only=True)

    class Meta:
        model = Product
        fields = [
            'id', 'category', 'category_name', 'name', 'description',
            'price', 'pieces_count', 'preparation_time', 'calories',
            'is_available', 'is_chef_special', 'image_url',
            'recipe_ingredients', 'created_at', 'updated_at'
        ]


class RestaurantTableSerializer(serializers.ModelSerializer):
    location_display = serializers.CharField(source='get_location_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    active_orders_count = serializers.SerializerMethodField()

    class Meta:
        model = RestaurantTable
        fields = ['id', 'table_number', 'capacity', 'location', 'location_display', 'status', 'status_display', 'notes', 'active_orders_count']

    def get_active_orders_count(self, obj):
        return obj.orders.filter(status__in=['PENDIENTE', 'COCINA', 'SERVIDO']).count()


class CustomerSerializer(serializers.ModelSerializer):
    full_name = serializers.ReadOnlyField()
    orders_count = serializers.IntegerField(source='orders.count', read_only=True)
    reservations_count = serializers.IntegerField(source='reservations.count', read_only=True)

    class Meta:
        model = Customer
        fields = [
            'id', 'first_name', 'last_name', 'full_name', 'email', 'phone',
            'dietary_preferences', 'is_vip', 'loyalty_points',
            'orders_count', 'reservations_count', 'created_at'
        ]


class OrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.ReadOnlyField(source='product.name')
    product_price = serializers.ReadOnlyField(source='product.price')
    product_image = serializers.ReadOnlyField(source='product.image_url')

    class Meta:
        model = OrderItem
        fields = ['id', 'order', 'product', 'product_name', 'product_price', 'product_image', 'quantity', 'unit_price', 'subtotal', 'special_notes']
        read_only_fields = ['subtotal', 'order']


class OrderItemInputSerializer(serializers.Serializer):
    product_id = serializers.IntegerField()
    quantity = serializers.IntegerField(min_value=1, default=1)
    special_notes = serializers.CharField(required=False, allow_blank=True, default='')


class OrderSerializer(serializers.ModelSerializer):
    customer_name = serializers.SerializerMethodField()
    customer_email = serializers.ReadOnlyField(source='customer.email')
    table_number = serializers.ReadOnlyField(source='table.table_number')
    table_location = serializers.ReadOnlyField(source='table.get_location_display')
    order_type_display = serializers.CharField(source='get_order_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    items = OrderItemSerializer(many=True, read_only=True)
    items_count = serializers.IntegerField(source='items.count', read_only=True)
    items_payload = OrderItemInputSerializer(many=True, write_only=True, required=False)

    class Meta:
        model = Order
        fields = [
            'id', 'order_code', 'customer', 'customer_name', 'customer_email',
            'table', 'table_number', 'table_location', 'order_type', 'order_type_display',
            'status', 'status_display', 'payment_method', 'subtotal', 'tax_amount',
            'discount', 'total_amount', 'notes', 'items', 'items_count', 'items_payload',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['order_code', 'subtotal', 'tax_amount', 'total_amount']

    def get_customer_name(self, obj):
        return obj.customer.full_name if obj.customer else "Cliente General"

    def create(self, validated_data):
        items_payload = validated_data.pop('items_payload', [])
        # Auto-generate unique order code if not set
        now = timezone.now()
        short_id = uuid.uuid4().hex[:5].upper()
        validated_data['order_code'] = f"SH-{now.strftime('%y%m%d')}-{short_id}"

        order = Order.objects.create(**validated_data)

        for item_data in items_payload:
            product = Product.objects.get(id=item_data['product_id'])
            qty = item_data.get('quantity', 1)
            notes = item_data.get('special_notes', '')
            OrderItem.objects.create(
                order=order,
                product=product,
                quantity=qty,
                unit_price=product.price,
                subtotal=product.price * qty,
                special_notes=notes
            )

        order.calculate_totals()
        order.save()

        # Update table status if DINE_IN
        if order.table and order.status in ['PENDIENTE', 'COCINA', 'SERVIDO']:
            order.table.status = 'OCUPADA'
            order.table.save(update_fields=['status'])

        return order

    def update(self, instance, validated_data):
        items_payload = validated_data.pop('items_payload', None)
        old_status = instance.status

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if items_payload is not None:
            # Replace items
            instance.items.all().delete()
            for item_data in items_payload:
                product = Product.objects.get(id=item_data['product_id'])
                qty = item_data.get('quantity', 1)
                notes = item_data.get('special_notes', '')
                OrderItem.objects.create(
                    order=instance,
                    product=product,
                    quantity=qty,
                    unit_price=product.price,
                    subtotal=product.price * qty,
                    special_notes=notes
                )
            instance.calculate_totals()
            instance.save()

        # Update table status on order status changes
        if instance.table:
            if instance.status in ['PAGADO', 'CANCELADO']:
                # If no other active orders on table, set to DISPONIBLE
                other_active = Order.objects.filter(
                    table=instance.table,
                    status__in=['PENDIENTE', 'COCINA', 'SERVIDO']
                ).exclude(id=instance.id).exists()
                if not other_active:
                    instance.table.status = 'DISPONIBLE'
                    instance.table.save(update_fields=['status'])
            elif instance.status in ['PENDIENTE', 'COCINA', 'SERVIDO']:
                instance.table.status = 'OCUPADA'
                instance.table.save(update_fields=['status'])

        return instance


class ReservationSerializer(serializers.ModelSerializer):
    customer_name = serializers.ReadOnlyField(source='customer.full_name')
    customer_email = serializers.ReadOnlyField(source='customer.email')
    customer_phone = serializers.ReadOnlyField(source='customer.phone')
    table_number = serializers.ReadOnlyField(source='table.table_number')
    table_location = serializers.ReadOnlyField(source='table.get_location_display')
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = Reservation
        fields = [
            'id', 'customer', 'customer_name', 'customer_email', 'customer_phone',
            'table', 'table_number', 'table_location', 'reservation_date',
            'reservation_time', 'guests_count', 'status', 'status_display',
            'special_requests', 'created_at'
        ]


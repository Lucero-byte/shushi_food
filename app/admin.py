from django.contrib import admin
from .models import (
    Category, Ingredient, Product, ProductIngredient,
    RestaurantTable, Customer, Order, OrderItem, Reservation
)


class ProductIngredientInline(admin.TabularInline):
    model = ProductIngredient
    extra = 1


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['id', 'name', 'slug', 'display_order', 'is_active', 'created_at']
    list_editable = ['display_order', 'is_active']
    search_fields = ['name', 'description']
    prepopulated_fields = {'slug': ('name',)}


@admin.register(Ingredient)
class IngredientAdmin(admin.ModelAdmin):
    list_display = ['id', 'name', 'unit', 'stock_quantity', 'minimum_stock', 'cost_price', 'is_allergen']
    list_editable = ['stock_quantity', 'cost_price']
    search_fields = ['name', 'allergen_info']
    list_filter = ['is_allergen', 'unit']


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ['id', 'name', 'category', 'price', 'pieces_count', 'is_available', 'is_chef_special']
    list_editable = ['price', 'is_available', 'is_chef_special']
    search_fields = ['name', 'description']
    list_filter = ['category', 'is_available', 'is_chef_special']
    inlines = [ProductIngredientInline]


@admin.register(RestaurantTable)
class RestaurantTableAdmin(admin.ModelAdmin):
    list_display = ['id', 'table_number', 'capacity', 'location', 'status']
    list_editable = ['status']
    list_filter = ['location', 'status']


@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display = ['id', 'full_name', 'email', 'phone', 'is_vip', 'loyalty_points']
    list_editable = ['is_vip']
    search_fields = ['first_name', 'last_name', 'email', 'phone']
    list_filter = ['is_vip']


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ['subtotal']


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ['id', 'order_code', 'customer', 'table', 'order_type', 'status', 'total_amount', 'created_at']
    list_editable = ['status']
    list_filter = ['status', 'order_type', 'payment_method']
    search_fields = ['order_code', 'customer__first_name', 'customer__last_name']
    inlines = [OrderItemInline]
    readonly_fields = ['order_code', 'subtotal', 'tax_amount', 'total_amount']


@admin.register(Reservation)
class ReservationAdmin(admin.ModelAdmin):
    list_display = ['id', 'customer', 'table', 'reservation_date', 'reservation_time', 'guests_count', 'status']
    list_editable = ['status']
    list_filter = ['status', 'reservation_date']
    search_fields = ['customer__first_name', 'customer__last_name', 'customer__email']

from django.db import models
from django.core.validators import MinValueValidator
from django.utils import timezone
from django.contrib.auth.models import User
from decimal import Decimal


class Category(models.Model):
    """
    Categorías de la carta gastronómica japonesa (Nigiri, Sashimi, Maki, etc.)
    """
    name = models.CharField(max_length=100, unique=True, verbose_name="Nombre de Categoría")
    slug = models.SlugField(max_length=120, unique=True, verbose_name="Slug / Identificador")
    description = models.TextField(blank=True, verbose_name="Descripción gastronómica")
    icon = models.CharField(max_length=50, default="Utensils", verbose_name="Icono representativo")
    display_order = models.PositiveIntegerField(default=0, verbose_name="Orden de visualización")
    is_active = models.BooleanField(default=True, verbose_name="Activo en el menú")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Fecha de creación")

    class Meta:
        verbose_name = "Categoría"
        verbose_name_plural = "Categorías"
        ordering = ['display_order', 'name']

    def __str__(self):
        return self.name


class Ingredient(models.Model):
    """
    Inventario e insumos de cocina para la preparación de sushi
    """
    UNIT_CHOICES = [
        ('g', 'Gramos (g)'),
        ('kg', 'Kilogramos (kg)'),
        ('ml', 'Mililitros (ml)'),
        ('l', 'Litros (L)'),
        ('und', 'Unidades (und)'),
        ('porc', 'Porciones'),
    ]

    name = models.CharField(max_length=120, unique=True, verbose_name="Nombre del Ingrediente")
    unit = models.CharField(max_length=10, choices=UNIT_CHOICES, default='g', verbose_name="Unidad de medida")
    stock_quantity = models.DecimalField(
        max_digits=10, decimal_places=2, default=Decimal('0.00'),
        validators=[MinValueValidator(Decimal('0.00'))],
        verbose_name="Cantidad en Stock"
    )
    minimum_stock = models.DecimalField(
        max_digits=10, decimal_places=2, default=Decimal('5.00'),
        validators=[MinValueValidator(Decimal('0.00'))],
        verbose_name="Stock Mínimo de Alerta"
    )
    cost_price = models.DecimalField(
        max_digits=10, decimal_places=2, default=Decimal('0.00'),
        validators=[MinValueValidator(Decimal('0.00'))],
        verbose_name="Costo Unitario ($)"
    )
    is_allergen = models.BooleanField(default=False, verbose_name="Es Alérgeno")
    allergen_info = models.CharField(max_length=150, blank=True, verbose_name="Información de Alérgenos (Pescado, Marisco, Soja, Sésamo)")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Fecha de registro")

    class Meta:
        verbose_name = "Ingrediente"
        verbose_name_plural = "Ingredientes"
        ordering = ['name']

    @property
    def is_low_stock(self):
        return self.stock_quantity <= self.minimum_stock

    def __str__(self):
        return f"{self.name} ({self.stock_quantity} {self.unit})"


class Product(models.Model):
    """
    Platillos, bebidas y piezas de sushi disponibles en la carta
    """
    category = models.ForeignKey(
        Category, on_delete=models.CASCADE, related_name='products',
        verbose_name="Categoría"
    )
    name = models.CharField(max_length=150, verbose_name="Nombre del Platillo")
    description = models.TextField(blank=True, verbose_name="Descripción culinaria / Notas de cata")
    price = models.DecimalField(
        max_digits=10, decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))],
        verbose_name="Precio de Venta ($)"
    )
    pieces_count = models.PositiveIntegerField(default=1, verbose_name="Número de piezas")
    preparation_time = models.PositiveIntegerField(default=12, verbose_name="Tiempo de preparación (min)")
    calories = models.PositiveIntegerField(null=True, blank=True, verbose_name="Calorías (kcal)")
    is_available = models.BooleanField(default=True, verbose_name="Disponible para ordenar")
    is_chef_special = models.BooleanField(default=False, verbose_name="Especialidad del Chef / Omakase")
    image_url = models.URLField(max_length=500, blank=True, verbose_name="URL de Imagen del Platillo")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Fecha de creación")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Última actualización")

    class Meta:
        verbose_name = "Platillo / Producto"
        verbose_name_plural = "Platillos / Productos"
        ordering = ['category', 'name']

    def __str__(self):
        return f"{self.name} - ${self.price}"


class ProductIngredient(models.Model):
    """
    Receta técnica: relación intermedia entre un Platillo y sus Ingredientes con cantidad exacta
    """
    product = models.ForeignKey(
        Product, on_delete=models.CASCADE, related_name='recipe_ingredients',
        verbose_name="Platillo"
    )
    ingredient = models.ForeignKey(
        Ingredient, on_delete=models.CASCADE, related_name='product_recipes',
        verbose_name="Ingrediente"
    )
    quantity_required = models.DecimalField(
        max_digits=10, decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))],
        verbose_name="Cantidad Requerida por Porción"
    )
    is_optional = models.BooleanField(default=False, verbose_name="Ingrediente Opcional / Modificable")

    class Meta:
        verbose_name = "Ingrediente de Receta"
        verbose_name_plural = "Ingredientes de Recetas"
        unique_together = ('product', 'ingredient')

    def __str__(self):
        return f"{self.product.name} -> {self.ingredient.name}: {self.quantity_required} {self.ingredient.unit}"


class RestaurantTable(models.Model):
    """
    Distribución física de las mesas y barras del restaurante
    """
    LOCATION_CHOICES = [
        ('BARRA', 'Barra Omakase'),
        ('SALON', 'Salón Zen Principal'),
        ('TERRAZA', 'Terraza Bambú'),
        ('VIP', 'Privado Tatami VIP'),
    ]

    STATUS_CHOICES = [
        ('DISPONIBLE', 'Disponible'),
        ('OCUPADA', 'Ocupada'),
        ('RESERVADA', 'Reservada'),
        ('MANTENIMIENTO', 'En Mantenimiento'),
    ]

    table_number = models.PositiveIntegerField(unique=True, verbose_name="Número de Mesa")
    capacity = models.PositiveIntegerField(default=2, verbose_name="Capacidad de Comensales")
    location = models.CharField(max_length=20, choices=LOCATION_CHOICES, default='SALON', verbose_name="Zona / Ubicación")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='DISPONIBLE', verbose_name="Estado actual")
    notes = models.CharField(max_length=200, blank=True, verbose_name="Notas de ubicación")

    class Meta:
        verbose_name = "Mesa"
        verbose_name_plural = "Mesas"
        ordering = ['table_number']

    def __str__(self):
        return f"Mesa #{self.table_number} ({self.get_location_display()}) - {self.get_status_display()}"


class Customer(models.Model):
    """
    Directorio de clientes y comensales frecuentes
    """
    first_name = models.CharField(max_length=80, verbose_name="Nombre")
    last_name = models.CharField(max_length=80, verbose_name="Apellido")
    email = models.EmailField(unique=True, verbose_name="Correo Electrónico")
    phone = models.CharField(max_length=25, blank=True, verbose_name="Teléfono / WhatsApp")
    dietary_preferences = models.TextField(blank=True, verbose_name="Preferencias o Alergias Alimentarias")
    is_vip = models.BooleanField(default=False, verbose_name="Cliente VIP")
    loyalty_points = models.PositiveIntegerField(default=0, verbose_name="Puntos de Fidelidad")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Fecha de Registro")

    class Meta:
        verbose_name = "Cliente"
        verbose_name_plural = "Clientes"
        ordering = ['-is_vip', 'last_name', 'first_name']

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}".strip()

    def __str__(self):
        vip_tag = " [VIP]" if self.is_vip else ""
        return f"{self.full_name}{vip_tag} - {self.email}"


class Order(models.Model):
    """
    Cabecera del Pedido / Orden gastronómica
    """
    ORDER_TYPE_CHOICES = [
        ('DINE_IN', 'En Salón / Barra'),
        ('TAKEAWAY', 'Para Llevar (Takeaway)'),
        ('DELIVERY', 'Entrega a Domicilio'),
    ]

    STATUS_CHOICES = [
        ('PENDIENTE', 'Pendiente'),
        ('COCINA', 'En Preparación'),
        ('SERVIDO', 'Listo / Servido'),
        ('PAGADO', 'Pagado y Cerrado'),
        ('CANCELADO', 'Cancelado'),
    ]

    PAYMENT_METHOD_CHOICES = [
        ('TARJETA', 'Tarjeta Crédito/Débito'),
        ('EFECTIVO', 'Efectivo'),
        ('TRANSFERENCIA', 'Transferencia Bancaria'),
    ]

    order_code = models.CharField(max_length=30, unique=True, verbose_name="Código de Orden")
    customer = models.ForeignKey(
        Customer, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='orders', verbose_name="Cliente"
    )
    table = models.ForeignKey(
        RestaurantTable, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='orders', verbose_name="Mesa asignada"
    )
    order_type = models.CharField(max_length=20, choices=ORDER_TYPE_CHOICES, default='DINE_IN', verbose_name="Tipo de Pedido")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDIENTE', verbose_name="Estado de la Orden")
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHOD_CHOICES, default='TARJETA', verbose_name="Método de Pago")
    subtotal = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'), verbose_name="Subtotal ($)")
    tax_amount = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'), verbose_name="Impuestos IVA ($)")
    discount = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'), verbose_name="Descuento ($)")
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'), verbose_name="Total ($)")
    notes = models.TextField(blank=True, verbose_name="Instrucciones especiales para el Itamae (Chef)")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Fecha y Hora del Pedido")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Última modificación")

    class Meta:
        verbose_name = "Pedido / Orden"
        verbose_name_plural = "Pedidos / Órdenes"
        ordering = ['-created_at']

    def calculate_totals(self):
        """Calcula los subtotales e impuestos del pedido basado en sus items"""
        sub = sum(item.subtotal for item in self.items.all()) if self.pk else Decimal('0.00')
        tax = (sub - self.discount) * Decimal('0.10') if (sub - self.discount) > 0 else Decimal('0.00') # 10% IVA
        self.subtotal = round(sub, 2)
        self.tax_amount = round(tax, 2)
        self.total_amount = round(sub - self.discount + tax, 2)
        return self.total_amount

    def __str__(self):
        return f"Orden #{self.order_code} ({self.get_status_display()}) - ${self.total_amount}"


class OrderItem(models.Model):
    """
    Línea de detalle dentro de un pedido
    """
    order = models.ForeignKey(
        Order, on_delete=models.CASCADE, related_name='items',
        verbose_name="Pedido"
    )
    product = models.ForeignKey(
        Product, on_delete=models.CASCADE, related_name='order_items',
        verbose_name="Platillo"
    )
    quantity = models.PositiveIntegerField(default=1, verbose_name="Cantidad")
    unit_price = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Precio Unitario ($)")
    subtotal = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Subtotal ($)")
    special_notes = models.CharField(max_length=200, blank=True, verbose_name="Modificaciones (ej. sin wasabi, salsa aparte)")

    class Meta:
        verbose_name = "Item del Pedido"
        verbose_name_plural = "Items del Pedido"

    def save(self, *args, **kwargs):
        if not self.unit_price:
            self.unit_price = self.product.price
        self.subtotal = self.unit_price * self.quantity
        super().save(*args, **kwargs)
        if self.order_id:
            self.order.calculate_totals()
            self.order.save(update_fields=['subtotal', 'tax_amount', 'total_amount', 'updated_at'])

    def delete(self, *args, **kwargs):
        order = self.order
        super().delete(*args, **kwargs)
        order.calculate_totals()
        order.save(update_fields=['subtotal', 'tax_amount', 'total_amount', 'updated_at'])

    def __str__(self):
        return f"{self.quantity}x {self.product.name} en Orden #{self.order.order_code}"


class Reservation(models.Model):
    """
    Gestión de reservas de comensales para mesas y experiencias Omakase
    """
    STATUS_CHOICES = [
        ('PENDIENTE', 'Pendiente de Confirmación'),
        ('CONFIRMADA', 'Confirmada'),
        ('COMPLETADA', 'Completada / Atendida'),
        ('CANCELADA', 'Cancelada'),
    ]

    customer = models.ForeignKey(
        Customer, on_delete=models.CASCADE, related_name='reservations',
        verbose_name="Cliente"
    )
    table = models.ForeignKey(
        RestaurantTable, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='reservations', verbose_name="Mesa asignada"
    )
    reservation_date = models.DateField(verbose_name="Fecha de Reserva")
    reservation_time = models.TimeField(verbose_name="Hora de Reserva")
    guests_count = models.PositiveIntegerField(default=2, verbose_name="Número de Personas")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDIENTE', verbose_name="Estado de la Reserva")
    special_requests = models.TextField(blank=True, verbose_name="Peticiones especiales / Ocasión (Aniversario, etc.)")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Fecha de Creación")

    class Meta:
        verbose_name = "Reservación"
        verbose_name_plural = "Reservaciones"
        ordering = ['reservation_date', 'reservation_time']

    def __str__(self):
        return f"Reserva de {self.customer.full_name} - {self.reservation_date} {self.reservation_time} ({self.guests_count} pers.)"


class UserProfile(models.Model):
    """
    Perfil de usuario con rol de permisos en Kaiseki Sushi Bar
    """
    ROLE_CHOICES = [
        ('admin', 'Administrador'),
        ('encargado', 'Encargado de Reservas y Clientes'),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile', verbose_name="Usuario Django")
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='encargado', verbose_name="Rol en el Sistema")

    class Meta:
        verbose_name = "Perfil de Usuario"
        verbose_name_plural = "Perfiles de Usuario"

    def __str__(self):
        return f"{self.user.username} ({self.get_role_display()})"


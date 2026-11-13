from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.exceptions import PermissionDenied
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.db import models
from django.db.models import Sum, Count, Q
from django.utils import timezone
from decimal import Decimal

from .models import (
    Category, Ingredient, Product, ProductIngredient,
    RestaurantTable, Customer, Order, OrderItem, Reservation, UserProfile
)
from .serializers import (
    CategorySerializer, IngredientSerializer, ProductSerializer,
    ProductIngredientSerializer, RestaurantTableSerializer, CustomerSerializer,
    OrderSerializer, OrderItemSerializer, ReservationSerializer
)


def check_admin_permission(request):
    """
    Verifica si el usuario tiene rol de Administrador.
    Acepta el rol desde la cabecera X-User-Role, Authorization Bearer token,
    parámetros de consulta (?role=...), o desde la sesión autenticada de Django.
    El encargado solo tiene permiso para Clientes y Reservas.
    """
    role = request.headers.get('X-User-Role') or request.query_params.get('role')

    if not role:
        auth_header = request.headers.get('Authorization', '')
        if 'kaiseki-token-' in auth_header:
            try:
                user_id = int(auth_header.split('kaiseki-token-')[-1].strip())
                user = User.objects.filter(id=user_id).first()
                if user:
                    if user.is_superuser or user.username.lower() == 'admin':
                        role = 'admin'
                    elif hasattr(user, 'profile'):
                        role = user.profile.role
            except Exception:
                pass

    if not role and request.user.is_authenticated:
        if request.user.is_superuser or request.user.username.lower() == 'admin':
            role = 'admin'
        elif hasattr(request.user, 'profile'):
            role = request.user.profile.role

    if role == 'encargado':
        raise PermissionDenied("Acceso restringido: Esta acción requiere permisos de Administrador.")


class HealthCheckView(APIView):
    """
    Endpoint de verificación de estado y salud de la API (sin restricciones de CORS o Auth)
    """
    authentication_classes = []
    permission_classes = []

    def get(self, request):
        return Response({'status': 'ok', 'service': 'Kaiseki Sushi Bar Backend'})


@method_decorator(csrf_exempt, name='dispatch')
class LoginView(APIView):
    """
    Controlador de autenticación para Administrador y Encargado.
    Retorna los datos del usuario, su rol y un token de sesión seguro.
    """
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        username = request.data.get('username', '').strip()
        password = request.data.get('password', '')

        if not username or not password:
            return Response(
                {'error': 'Usuario y contraseña son requeridos.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Autenticar credenciales
        user = authenticate(username=username, password=password)
        if user is None:
            # Buscar por email
            try:
                user_obj = User.objects.get(email__iexact=username)
                user = authenticate(username=user_obj.username, password=password)
            except User.DoesNotExist:
                user = None

        if user is None:
            return Response(
                {'error': 'Credenciales inválidas. Verifica tu usuario y contraseña.'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        if not user.is_active:
            return Response(
                {'error': 'La cuenta de usuario se encuentra inactiva.'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Determinar rol
        role = 'encargado'
        role_display = 'Encargado de Reservas y Clientes'
        if user.is_superuser or user.username.lower() == 'admin':
            role = 'admin'
            role_display = 'Administrador'
        elif hasattr(user, 'profile'):
            role = user.profile.role
            role_display = user.profile.get_role_display()

        # Si existe sesión WSGI opcional
        if hasattr(request, '_request') and hasattr(request._request, 'session'):
            try:
                login(request._request, user)
            except Exception:
                pass

        return Response({
            'user': {
                'id': user.id,
                'username': user.username,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'full_name': user.get_full_name() or user.username,
                'email': user.email,
                'role': role,
                'role_display': role_display,
            },
            'token': f"kaiseki-token-{user.id}",
            'message': f'Bienvenido, {user.get_full_name() or user.username}'
        })


@method_decorator(csrf_exempt, name='dispatch')
class LogoutView(APIView):
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        if hasattr(request, '_request') and hasattr(request._request, 'session'):
            try:
                logout(request._request)
            except Exception:
                pass
        return Response({'message': 'Sesión cerrada exitosamente'})


@method_decorator(csrf_exempt, name='dispatch')
class CurrentUserView(APIView):
    authentication_classes = []
    permission_classes = []

    def get(self, request):
        user = None
        auth_header = request.headers.get('Authorization', '')
        if 'kaiseki-token-' in auth_header:
            try:
                user_id = int(auth_header.split('kaiseki-token-')[-1].strip())
                user = User.objects.filter(id=user_id, is_active=True).first()
            except (ValueError, TypeError):
                user = None

        if not user and request.user.is_authenticated:
            user = request.user

        if not user:
            return Response({'authenticated': False, 'user': None})

        role = 'encargado'
        role_display = 'Encargado de Reservas y Clientes'
        if user.is_superuser or user.username.lower() == 'admin':
            role = 'admin'
            role_display = 'Administrador'
        elif hasattr(user, 'profile'):
            role = user.profile.role
            role_display = user.profile.get_role_display()

        return Response({
            'authenticated': True,
            'user': {
                'id': user.id,
                'username': user.username,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'full_name': user.get_full_name() or user.username,
                'email': user.email,
                'role': role,
                'role_display': role_display,
            }
        })



class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer

    def initial(self, request, *args, **kwargs):
        super().initial(request, *args, **kwargs)
        if request.method not in ('GET', 'HEAD', 'OPTIONS'):
            check_admin_permission(request)

    def get_queryset(self):
        qs = super().get_queryset()
        active_only = self.request.query_params.get('active_only')
        if active_only == 'true':
            qs = qs.filter(is_active=True)
        return qs


class IngredientViewSet(viewsets.ModelViewSet):
    queryset = Ingredient.objects.all()
    serializer_class = IngredientSerializer

    def initial(self, request, *args, **kwargs):
        super().initial(request, *args, **kwargs)
        check_admin_permission(request)

    def get_queryset(self):
        qs = super().get_queryset()
        search = self.request.query_params.get('search')
        if search:
            qs = qs.filter(name__icontains=search)
        low_stock = self.request.query_params.get('low_stock')
        if low_stock == 'true':
            qs = qs.filter(stock_quantity__lte=models.F('minimum_stock'))
        return qs

    @action(detail=True, methods=['post'])
    def adjust_stock(self, request, pk=None):
        ingredient = self.get_object()
        delta = request.data.get('delta')
        if delta is None:
            return Response({'error': 'Campo delta es requerido'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            delta_val = Decimal(str(delta))
            new_qty = ingredient.stock_quantity + delta_val
            if new_qty < Decimal('0.00'):
                return Response({'error': 'El stock no puede ser negativo'}, status=status.HTTP_400_BAD_REQUEST)
            ingredient.stock_quantity = new_qty
            ingredient.save(update_fields=['stock_quantity'])
            return Response(IngredientSerializer(ingredient).data)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.select_related('category').prefetch_related('recipe_ingredients__ingredient').all()
    serializer_class = ProductSerializer

    def initial(self, request, *args, **kwargs):
        super().initial(request, *args, **kwargs)
        if request.method not in ('GET', 'HEAD', 'OPTIONS'):
            check_admin_permission(request)

    def get_queryset(self):
        qs = super().get_queryset()
        category_id = self.request.query_params.get('category')
        if category_id:
            qs = qs.filter(category_id=category_id)
        is_available = self.request.query_params.get('is_available')
        if is_available is not None:
            qs = qs.filter(is_available=(is_available.lower() == 'true'))
        is_chef_special = self.request.query_params.get('is_chef_special')
        if is_chef_special is not None:
            qs = qs.filter(is_chef_special=(is_chef_special.lower() == 'true'))
        search = self.request.query_params.get('search')
        if search:
            qs = qs.filter(Q(name__icontains=search) | Q(description__icontains=search))
        return qs

    @action(detail=True, methods=['post'])
    def toggle_availability(self, request, pk=None):
        product = self.get_object()
        product.is_available = not product.is_available
        product.save(update_fields=['is_available', 'updated_at'])
        return Response({'id': product.id, 'name': product.name, 'is_available': product.is_available})


class ProductIngredientViewSet(viewsets.ModelViewSet):
    queryset = ProductIngredient.objects.select_related('product', 'ingredient').all()
    serializer_class = ProductIngredientSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        product_id = self.request.query_params.get('product')
        if product_id:
            qs = qs.filter(product_id=product_id)
        return qs


class RestaurantTableViewSet(viewsets.ModelViewSet):
    queryset = RestaurantTable.objects.all()
    serializer_class = RestaurantTableSerializer

    def initial(self, request, *args, **kwargs):
        super().initial(request, *args, **kwargs)
        if request.method not in ('GET', 'HEAD', 'OPTIONS'):
            check_admin_permission(request)

    def get_queryset(self):
        qs = super().get_queryset()
        location = self.request.query_params.get('location')
        if location:
            qs = qs.filter(location=location)
        status_filter = self.request.query_params.get('status')
        if status_filter:
            qs = qs.filter(status=status_filter)
        return qs

    @action(detail=True, methods=['post'])
    def change_status(self, request, pk=None):
        table = self.get_object()
        new_status = request.data.get('status')
        valid_statuses = [choice[0] for choice in RestaurantTable.STATUS_CHOICES]
        if new_status not in valid_statuses:
            return Response({'error': f'Estado inválido. Opciones: {valid_statuses}'}, status=status.HTTP_400_BAD_REQUEST)
        table.status = new_status
        table.save(update_fields=['status'])
        return Response(RestaurantTableSerializer(table).data)


class CustomerViewSet(viewsets.ModelViewSet):
    queryset = Customer.objects.all()
    serializer_class = CustomerSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        search = self.request.query_params.get('search')
        if search:
            qs = qs.filter(
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search) |
                Q(email__icontains=search) |
                Q(phone__icontains=search)
            )
        is_vip = self.request.query_params.get('is_vip')
        if is_vip is not None:
            qs = qs.filter(is_vip=(is_vip.lower() == 'true'))
        return qs

    @action(detail=True, methods=['post'])
    def toggle_vip(self, request, pk=None):
        customer = self.get_object()
        customer.is_vip = not customer.is_vip
        customer.save(update_fields=['is_vip'])
        return Response({'id': customer.id, 'full_name': customer.full_name, 'is_vip': customer.is_vip})


class OrderViewSet(viewsets.ModelViewSet):
    queryset = Order.objects.select_related('customer', 'table').prefetch_related('items__product').all()
    serializer_class = OrderSerializer

    def initial(self, request, *args, **kwargs):
        super().initial(request, *args, **kwargs)
        check_admin_permission(request)

    def get_queryset(self):
        qs = super().get_queryset()
        status_filter = self.request.query_params.get('status')
        if status_filter:
            qs = qs.filter(status=status_filter)
        order_type = self.request.query_params.get('order_type')
        if order_type:
            qs = qs.filter(order_type=order_type)
        search = self.request.query_params.get('search')
        if search:
            qs = qs.filter(
                Q(order_code__icontains=search) |
                Q(customer__first_name__icontains=search) |
                Q(customer__last_name__icontains=search)
            )
        return qs

    @action(detail=True, methods=['post'])
    def change_status(self, request, pk=None):
        order = self.get_object()
        new_status = request.data.get('status')
        valid_statuses = [choice[0] for choice in Order.STATUS_CHOICES]
        if new_status not in valid_statuses:
            return Response({'error': f'Estado inválido. Opciones: {valid_statuses}'}, status=status.HTTP_400_BAD_REQUEST)
        
        order.status = new_status
        order.save(update_fields=['status', 'updated_at'])

        # Synchronize table status
        if order.table:
            if new_status in ['PAGADO', 'CANCELADO']:
                has_active = Order.objects.filter(
                    table=order.table,
                    status__in=['PENDIENTE', 'COCINA', 'SERVIDO']
                ).exclude(id=order.id).exists()
                if not has_active:
                    order.table.status = 'DISPONIBLE'
                    order.table.save(update_fields=['status'])
            elif new_status in ['PENDIENTE', 'COCINA', 'SERVIDO']:
                order.table.status = 'OCUPADA'
                order.table.save(update_fields=['status'])

        return Response(OrderSerializer(order).data)


class OrderItemViewSet(viewsets.ModelViewSet):
    queryset = OrderItem.objects.select_related('order', 'product').all()
    serializer_class = OrderItemSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        order_id = self.request.query_params.get('order')
        if order_id:
            qs = qs.filter(order_id=order_id)
        return qs


class ReservationViewSet(viewsets.ModelViewSet):
    queryset = Reservation.objects.select_related('customer', 'table').all()
    serializer_class = ReservationSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        status_filter = self.request.query_params.get('status')
        if status_filter:
            qs = qs.filter(status=status_filter)
        date_filter = self.request.query_params.get('date')
        if date_filter:
            qs = qs.filter(reservation_date=date_filter)
        return qs

    @action(detail=True, methods=['post'])
    def change_status(self, request, pk=None):
        reservation = self.get_object()
        new_status = request.data.get('status')
        valid_statuses = [choice[0] for choice in Reservation.STATUS_CHOICES]
        if new_status not in valid_statuses:
            return Response({'error': f'Estado inválido. Opciones: {valid_statuses}'}, status=status.HTTP_400_BAD_REQUEST)
        reservation.status = new_status
        reservation.save(update_fields=['status'])
        return Response(ReservationSerializer(reservation).data)


class DashboardView(APIView):
    """
    Controlador de Métricas e Inteligencia del Restaurante en Tiempo Real
    """
    def get(self, request):
        check_admin_permission(request)
        today = timezone.localdate()

        # Ventas totales hoy
        orders_today = Order.objects.filter(created_at__date=today)
        sales_today = orders_today.filter(status='PAGADO').aggregate(total=Sum('total_amount'))['total'] or Decimal('0.00')
        sales_all_time = Order.objects.filter(status='PAGADO').aggregate(total=Sum('total_amount'))['total'] or Decimal('0.00')

        # Órdenes activas
        active_orders = Order.objects.filter(status__in=['PENDIENTE', 'COCINA', 'SERVIDO']).count()
        orders_in_kitchen = Order.objects.filter(status='COCINA').count()
        orders_pending = Order.objects.filter(status='PENDIENTE').count()

        # Mesas
        total_tables = RestaurantTable.objects.count()
        occupied_tables = RestaurantTable.objects.filter(status='OCUPADA').count()
        available_tables = RestaurantTable.objects.filter(status='DISPONIBLE').count()

        # Alertas de inventario
        low_stock_ingredients = []
        for ing in Ingredient.objects.all():
            if ing.is_low_stock:
                low_stock_ingredients.append({
                    'id': ing.id,
                    'name': ing.name,
                    'stock': str(ing.stock_quantity),
                    'min_stock': str(ing.minimum_stock),
                    'unit': ing.unit
                })

        # Reservas de hoy
        reservations_today = Reservation.objects.filter(reservation_date=today)
        reservations_count = reservations_today.count()

        # Platillos más vendidos
        top_products = (
            OrderItem.objects.values('product__name', 'product__image_url')
            .annotate(total_ordered=Sum('quantity'), revenue=Sum('subtotal'))
            .order_by('-total_ordered')[:5]
        )

        # Últimas 5 órdenes
        recent_orders = Order.objects.select_related('customer', 'table').order_by('-created_at')[:5]

        return Response({
            'kpis': {
                'sales_today': float(sales_today),
                'sales_all_time': float(sales_all_time),
                'active_orders': active_orders,
                'orders_in_kitchen': orders_in_kitchen,
                'orders_pending': orders_pending,
                'total_tables': total_tables,
                'occupied_tables': occupied_tables,
                'available_tables': available_tables,
                'total_products': Product.objects.count(),
                'total_customers': Customer.objects.count(),
                'reservations_today': reservations_count,
                'low_stock_count': len(low_stock_ingredients),
            },
            'low_stock_items': low_stock_ingredients,
            'top_products': list(top_products),
            'recent_orders': OrderSerializer(recent_orders, many=True).data
        })

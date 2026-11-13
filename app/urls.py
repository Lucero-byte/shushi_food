from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CategoryViewSet, IngredientViewSet, ProductViewSet,
    ProductIngredientViewSet, RestaurantTableViewSet, CustomerViewSet,
    OrderViewSet, OrderItemViewSet, ReservationViewSet, DashboardView,
    LoginView, LogoutView, CurrentUserView, HealthCheckView
)

router = DefaultRouter()
router.register(r'categories', CategoryViewSet)
router.register(r'ingredients', IngredientViewSet)
router.register(r'products', ProductViewSet)
router.register(r'product-ingredients', ProductIngredientViewSet)
router.register(r'tables', RestaurantTableViewSet)
router.register(r'customers', CustomerViewSet)
router.register(r'orders', OrderViewSet)
router.register(r'order-items', OrderItemViewSet)
router.register(r'reservations', ReservationViewSet)

urlpatterns = [
    path('health/', HealthCheckView.as_view(), name='health-check'),
    path('auth/login/', LoginView.as_view(), name='auth-login'),
    path('auth/logout/', LogoutView.as_view(), name='auth-logout'),
    path('auth/user/', CurrentUserView.as_view(), name='auth-user'),
    path('dashboard/', DashboardView.as_view(), name='dashboard-stats'),
    path('', include(router.urls)),
]


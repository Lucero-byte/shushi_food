from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from decimal import Decimal
import datetime

from .models import Category, Customer, Reservation, UserProfile


class AuthenticationAndPermissionsTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()

        # Admin User
        self.admin_user = User.objects.create_superuser(
            username='admin',
            email='admin@kaiseki.com',
            password='admin123',
            first_name='Master',
            last_name='Itamae'
        )
        UserProfile.objects.create(user=self.admin_user, role='admin')

        # Encargado User
        self.encargado_user = User.objects.create_user(
            username='encargado',
            email='encargado@kaiseki.com',
            password='encargado123',
            first_name='Hiroshi',
            last_name='Sato'
        )
        UserProfile.objects.create(user=self.encargado_user, role='encargado')

    def test_login_success_admin(self):
        response = self.client.post('/api/auth/login/', {'username': 'admin', 'password': 'admin123'}, format='json')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['user']['role'], 'admin')
        self.assertIn('token', response.data)

    def test_login_success_encargado(self):
        response = self.client.post('/api/auth/login/', {'username': 'encargado', 'password': 'encargado123'}, format='json')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['user']['role'], 'encargado')
        self.assertIn('token', response.data)

    def test_login_invalid_credentials(self):
        response = self.client.post('/api/auth/login/', {'username': 'admin', 'password': 'wrongpassword'}, format='json')
        self.assertEqual(response.status_code, 401)
        self.assertIn('error', response.data)

    def test_encargado_blocked_from_inventory_and_categories(self):
        self.client.credentials(HTTP_X_USER_ROLE='encargado')
        response = self.client.post('/api/categories/', {'name': 'Test Nigiri', 'slug': 'test-nigiri'}, format='json')
        self.assertEqual(response.status_code, 403)

    def test_encargado_can_create_customer_and_reservation(self):
        self.client.credentials(HTTP_X_USER_ROLE='encargado')
        
        # Crear cliente
        cust_res = self.client.post('/api/customers/', {
            'first_name': 'Kenji',
            'last_name': 'Mori',
            'email': 'kenji@test.com',
            'phone': '123456789'
        }, format='json')
        self.assertEqual(cust_res.status_code, 201)
        customer_id = cust_res.data['id']

        # Crear reservación
        resv_res = self.client.post('/api/reservations/', {
            'customer': customer_id,
            'reservation_date': str(datetime.date.today()),
            'reservation_time': '20:00',
            'guests_count': 4,
            'status': 'PENDIENTE'
        }, format='json')
        self.assertEqual(resv_res.status_code, 201)

    def test_admin_full_access_to_categories(self):
        self.client.credentials(HTTP_X_USER_ROLE='admin')
        response = self.client.post('/api/categories/', {
            'name': 'Especialidades Omakase',
            'slug': 'especialidades-omakase',
            'display_order': 10
        }, format='json')
        self.assertEqual(response.status_code, 201)

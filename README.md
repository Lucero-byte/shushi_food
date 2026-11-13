# Kaiseki Sushi Bar (懐石) — Sistema Integral de Restaurante

Sistema web profesional, minimalista y elegante para la gestión gastronómica de un restaurante de sushi de alta cocina y experiencias *Omakase*.

---

## 🔐 Sistema de Autenticación y Control de Roles

El sistema cuenta con una pantalla de Login minimalista y elegante con estética japonesa Kaiseki, validación en tiempo real por Token Bearer (sin conflictos de cookies CSRF) y persistencia de sesión:

### Credenciales de Acceso:

| Rol | Usuario | Contraseña | Permisos |
|---|---|---|---|
| **👑 Administrador** | `admin` | `admin123` | **Acceso total irrestricto**: Dashboard, Platillos, Categorías, Pedidos, Mesas, Reservas, Clientes e **Inventario completo**. |
| **📋 Encargado** | `encargado` | `encargado123` | **Acceso restringido**: Registro y gestión de **Clientes** y agenda de **Reservas**. Protegido tanto en frontend como en backend (403 Forbidden para inventario o platillos). |

*Nota: La pantalla de login incluye botones de acceso rápido (1-click) para facilitar las pruebas y demostraciones de ambos roles.*

---

## 🗄️ Modelado de Base de Datos

El sistema cuenta con tablas relacionales normalizadas que soportan el flujo completo del restaurante:

1. **`UserProfile` (`app_userprofile`)**: Perfil de usuario vinculado al modelo `User` de Django con roles (`admin`, `encargado`).
2. **`Category` (`app_category`)**: Categorización del menú (Nigiris, Sashimis, Uramakis, Gunkan, Entrantes, Bebidas & Sakes, Postres).
3. **`Ingredient` (`app_ingredient`)**: Inventario de insumos nobles de cocina con control de stock, unidad de medida, costos unitarios y control de alérgenos.
4. **`Product` (`app_product`)**: Platillos gastronómicos, piezas de sushi, tiempos de preparación, calorías, precio de venta, disponibilidad y sellos de autor *Chef's Special*.
5. **`ProductIngredient` (`app_productingredient`)**: Tabla intermedia de recetas técnicas (relación N:M entre Platillos e Ingredientes) con cantidades requeridas por ración.
6. **`RestaurantTable` (`app_restauranttable`)**: Distribución física del restaurante por zonas (*Barra Omakase*, *Salón Zen*, *Terraza Bambú*, *Salón Tatami VIP*), aforo y estado en tiempo real (*Disponible*, *Ocupada*, *Reservada*, *Mantenimiento*).
7. **`Customer` (`app_customer`)**: Directorio de comensales, historial de pedidos, puntos de fidelidad, estatus VIP y notas de restricciones/alergias alimentarias.
8. **`Order` (`app_order`)**: Cabecera de pedidos con código único (ej. `SH-261108-001`), cliente, mesa, tipo (*Salón*, *Takeaway*, *Delivery*), estados (*Pendiente*, *En Cocina*, *Servido*, *Pagado*, *Cancelado*), métodos de pago y cálculo financiero.
9. **`OrderItem` (`app_orderitem`)**: Detalle por línea de cada pedido con platillos seleccionados, cantidades, precios y especificaciones culinarias personalizadas.
10. **`Reservation` (`app_reservation`)**: Agenda de reservaciones con asignación de mesa, comensales, fecha, hora, estado (*Pendiente*, *Confirmada*, *Completada*, *Cancelada*) y peticiones especiales.

---

## 🚀 Puesta en Marcha

### 1. Iniciar con un solo clic (Windows)
Ejecuta el archivo:
```bat
start_project.bat
```
Este script abre automáticamente el backend Django y el frontend React en paralelo.

### 2. Ejecución Manual

#### Backend (Django REST Framework):
```bash
# Activar entorno virtual
.\.venv\Scripts\activate

# Aplicar migraciones
python manage.py migrate

# Poblar datos gastronómicos y usuarios iniciales
python manage.py seed_sushi_data

# Iniciar servidor Django
python manage.py runserver 0.0.0.0:8000
```

#### Frontend (React + Vite):
```bash
cd frontend
npm install
npm run dev
```

---

## 🌐 URLs de Acceso

- **Frontend en Desarrollo (Vite)**: [http://localhost:5173](http://localhost:5173)
- **Frontend Unificado (Servido por Django)**: [http://127.0.0.1:8000/](http://127.0.0.1:8000/)
- **API REST Backend**: [http://127.0.0.1:8000/api/](http://127.0.0.1:8000/api/)
  - Autenticación: `/api/auth/login/`, `/api/auth/logout/`, `/api/auth/user/`
  - Dashboard: `/api/dashboard/`
  - Platillos: `/api/products/`
  - Categorías: `/api/categories/`
  - Pedidos: `/api/orders/`
  - Mesas: `/api/tables/`
  - Reservaciones: `/api/reservations/`
  - Clientes: `/api/customers/`
  - Insumos: `/api/ingredients/`
- **Panel Administrativo Django**: [http://127.0.0.1:8000/admin/](http://127.0.0.1:8000/admin/)

---

## 🐬 Configuración para MySQL (XAMPP)

Por defecto el sistema utiliza **SQLite** para funcionar de manera inmediata sin configuración externa. Si deseas conectarlo a **MySQL** en XAMPP:

1. Inicia el módulo **MySQL** en el panel de control de XAMPP.
2. Abre phpMyAdmin o la consola MySQL y crea la base de datos:
   ```sql
   CREATE DATABASE sushi_food CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```
3. Ejecuta con la variable de entorno activa:
   ```bash
   $env:USE_MYSQL="True"; python manage.py migrate
   $env:USE_MYSQL="True"; python manage.py seed_sushi_data
   $env:USE_MYSQL="True"; python manage.py runserver
   ```
   *(O configura permanentemente `USE_MYSQL = True` en `config/settings.py`)*.

---

Todos los derechos reservados a ALLABS

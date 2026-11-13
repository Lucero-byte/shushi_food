from django.core.management.base import BaseCommand
from django.utils import timezone
from django.contrib.auth.models import User
from decimal import Decimal
import datetime

from app.models import (
    Category, Ingredient, Product, ProductIngredient,
    RestaurantTable, Customer, Order, OrderItem, Reservation, UserProfile
)


class Command(BaseCommand):
    help = 'Puebla la base de datos con información gastronómica inicial para el restaurante de sushi'

    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE("Iniciando población de datos para Kaiseki Sushi Bar..."))

        # 1. Categorías
        categories_data = [
            {'name': 'Nigiri Clásico y Aburi', 'slug': 'nigiri', 'icon': 'Fish', 'display_order': 1, 'description': 'Bocados de arroz shari moldeados a mano coronados con cortes nobles de pescado fresco.'},
            {'name': 'Sashimi de Selección', 'slug': 'sashimi', 'icon': 'Flame', 'display_order': 2, 'description': 'Cortes puros y precisos de pesca de alta mar, servidos con rábano daikon y wasabi fresco.'},
            {'name': 'Makis & Uramakis de Autor', 'slug': 'uramakis', 'icon': 'Sparkles', 'display_order': 3, 'description': 'Rollos tradicionales y fusiones contemporáneas envueltos en sésamo o alga nori.'},
            {'name': 'Gunkan & Omakase Bites', 'slug': 'gunkan', 'icon': 'Layers', 'display_order': 4, 'description': 'Barquetas de alga nori rellenas con ingredientes cremosos y huevas marinas.'},
            {'name': 'Entrantes & Tempuras', 'slug': 'entrantes', 'icon': 'Soup', 'display_order': 5, 'description': 'Aperitivos calientes, gyozas artesanales, edamame al vapor y brochetas robata.'},
            {'name': 'Bebidas & Sakes de Autor', 'slug': 'bebidas-sake', 'icon': 'Wine', 'display_order': 6, 'description': 'Selección de sakes Junmai Daiginjo, té verde Sencha, cervezas japonesas y coctelería.'},
            {'name': 'Postres Tradicionales', 'slug': 'postres', 'icon': 'Coffee', 'display_order': 7, 'description': 'Delicadezas dulces inspiradas en la pastelería japonesa wagashi.'},
        ]

        categories_map = {}
        for cdata in categories_data:
            cat, _ = Category.objects.update_or_create(
                slug=cdata['slug'],
                defaults=cdata
            )
            categories_map[cdata['slug']] = cat

        self.stdout.write(self.style.SUCCESS(f"✓ {len(categories_map)} Categorías registradas"))

        # 2. Ingredientes
        ingredients_data = [
            {'name': 'Salmón Noruego Fresco (Sake)', 'unit': 'kg', 'stock_quantity': Decimal('14.50'), 'minimum_stock': Decimal('4.00'), 'cost_price': Decimal('22.00'), 'is_allergen': True, 'allergen_info': 'Pescado'},
            {'name': 'Atún Rojo Bluefin (Maguro)', 'unit': 'kg', 'stock_quantity': Decimal('8.20'), 'minimum_stock': Decimal('3.00'), 'cost_price': Decimal('45.00'), 'is_allergen': True, 'allergen_info': 'Pescado'},
            {'name': 'Arroz Especial Koshihikari', 'unit': 'kg', 'stock_quantity': Decimal('45.00'), 'minimum_stock': Decimal('15.00'), 'cost_price': Decimal('3.50'), 'is_allergen': False, 'allergen_info': ''},
            {'name': 'Alga Nori Tostada Premium', 'unit': 'und', 'stock_quantity': Decimal('180.00'), 'minimum_stock': Decimal('50.00'), 'cost_price': Decimal('0.35'), 'is_allergen': False, 'allergen_info': ''},
            {'name': 'Aguacate Hass Maduro', 'unit': 'kg', 'stock_quantity': Decimal('12.00'), 'minimum_stock': Decimal('5.00'), 'cost_price': Decimal('5.20'), 'is_allergen': False, 'allergen_info': ''},
            {'name': 'Queso Crema Philadelphia', 'unit': 'kg', 'stock_quantity': Decimal('9.50'), 'minimum_stock': Decimal('3.00'), 'cost_price': Decimal('7.80'), 'is_allergen': True, 'allergen_info': 'Lácteos'},
            {'name': 'Anguila de Agua Dulce (Unagi)', 'unit': 'kg', 'stock_quantity': Decimal('3.20'), 'minimum_stock': Decimal('3.50'), 'cost_price': Decimal('38.00'), 'is_allergen': True, 'allergen_info': 'Pescado'}, # Alerta stock bajo
            {'name': 'Huevas de Salmón (Ikura)', 'unit': 'g', 'stock_quantity': Decimal('450.00'), 'minimum_stock': Decimal('200.00'), 'cost_price': Decimal('0.15'), 'is_allergen': True, 'allergen_info': 'Pescado'},
            {'name': 'Wasabi Fresco Hon-Wasabi', 'unit': 'g', 'stock_quantity': Decimal('180.00'), 'minimum_stock': Decimal('150.00'), 'cost_price': Decimal('0.25'), 'is_allergen': False, 'allergen_info': ''},
            {'name': 'Semillas de Sésamo Tostado', 'unit': 'g', 'stock_quantity': Decimal('800.00'), 'minimum_stock': Decimal('300.00'), 'cost_price': Decimal('0.02'), 'is_allergen': True, 'allergen_info': 'Sésamo'},
            {'name': 'Langostino Tigre Tempura (Ebi)', 'unit': 'kg', 'stock_quantity': Decimal('6.80'), 'minimum_stock': Decimal('2.50'), 'cost_price': Decimal('19.00'), 'is_allergen': True, 'allergen_info': 'Crustáceos'},
            {'name': 'Té Matcha Ceremonial Uji', 'unit': 'g', 'stock_quantity': Decimal('350.00'), 'minimum_stock': Decimal('100.00'), 'cost_price': Decimal('0.40'), 'is_allergen': False, 'allergen_info': ''},
        ]

        ingredients_map = {}
        for idata in ingredients_data:
            ing, _ = Ingredient.objects.update_or_create(
                name=idata['name'],
                defaults=idata
            )
            ingredients_map[idata['name']] = ing

        self.stdout.write(self.style.SUCCESS(f"✓ {len(ingredients_map)} Ingredientes en almacén"))

        # 3. Platillos (Productos)
        products_data = [
            {
                'category': categories_map['nigiri'],
                'name': 'Nigiri Salmón Aburi Trufado (2 pcs)',
                'description': 'Láminas de salmón noruego sopleteado al momento, aceite de trufa blanca, salsa tare y sal maldon.',
                'price': Decimal('8.50'),
                'pieces_count': 2,
                'preparation_time': 8,
                'calories': 180,
                'is_available': True,
                'is_chef_special': True,
                'image_url': 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=700&q=80',
            },
            {
                'category': categories_map['nigiri'],
                'name': 'Nigiri O-Toro con Wasabi Fresco (2 pcs)',
                'description': 'Ventresca de atún rojo bluefin de textura aterciopelada y rallo de raíz de wasabi shizuoka.',
                'price': Decimal('14.00'),
                'pieces_count': 2,
                'preparation_time': 7,
                'calories': 210,
                'is_available': True,
                'is_chef_special': True,
                'image_url': 'https://images.unsplash.com/photo-1611143669185-af224c5e3252?w=700&q=80',
            },
            {
                'category': categories_map['sashimi'],
                'name': 'Sashimi Kaiseki Moriawase (15 cortes)',
                'description': 'Degustación maestra de 5 variedades: Salmón, Atún rojo, Pez mantequilla, Lubina salvaje y Vieira.',
                'price': Decimal('28.00'),
                'pieces_count': 15,
                'preparation_time': 15,
                'calories': 290,
                'is_available': True,
                'is_chef_special': True,
                'image_url': 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=700&q=80',
            },
            {
                'category': categories_map['uramakis'],
                'name': 'Dragon Roll Imperial (8 pcs)',
                'description': 'Relleno de langostino crujiente tempurizado y aguacate, cubierto con anguila kabayaki caramelizada.',
                'price': Decimal('16.50'),
                'pieces_count': 8,
                'preparation_time': 14,
                'calories': 480,
                'is_available': True,
                'is_chef_special': True,
                'image_url': 'https://images.unsplash.com/photo-1553621042-f6e147245754?w=700&q=80',
            },
            {
                'category': categories_map['uramakis'],
                'name': 'Spicy Tuna Crunch Roll (8 pcs)',
                'description': 'Tartar picante de atún rojo marinada con shichimi togarashi, pepino japonés y crujiente panko.',
                'price': Decimal('15.00'),
                'pieces_count': 8,
                'preparation_time': 12,
                'calories': 420,
                'is_available': True,
                'is_chef_special': False,
                'image_url': 'https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?w=700&q=80',
            },
            {
                'category': categories_map['uramakis'],
                'name': 'Philadelphia Rainbow Salmon (8 pcs)',
                'description': 'Salmón noruego exterior, relleno de queso philadelphia sedoso y aguacate hass fresco.',
                'price': Decimal('13.50'),
                'pieces_count': 8,
                'preparation_time': 10,
                'calories': 450,
                'is_available': True,
                'is_chef_special': False,
                'image_url': 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=700&q=80',
            },
            {
                'category': categories_map['gunkan'],
                'name': 'Gunkan Ikura con Shiso (2 pcs)',
                'description': 'Perlas explosivas de huevas de salmón salvaje en cama de arroz shari y aromática hoja shiso verde.',
                'price': Decimal('10.00'),
                'pieces_count': 2,
                'preparation_time': 6,
                'calories': 160,
                'is_available': True,
                'is_chef_special': False,
                'image_url': 'https://images.unsplash.com/photo-1583623025817-d180a2221d0a?w=700&q=80',
            },
            {
                'category': categories_map['entrantes'],
                'name': 'Gyozas de Wagyu & Shiitake (5 pcs)',
                'description': 'Empanadillas japonesas a la plancha rellenas de buey wagyu, cebollino nira y reducción ponzu.',
                'price': Decimal('9.50'),
                'pieces_count': 5,
                'preparation_time': 10,
                'calories': 320,
                'is_available': True,
                'is_chef_special': False,
                'image_url': 'https://images.unsplash.com/photo-1496116218417-1a781b1c416c?w=700&q=80',
            },
            {
                'category': categories_map['entrantes'],
                'name': 'Edamame Trufado al Wok',
                'description': 'Vainas de soja tierna salteadas con aceite virgen de sésamo tostado y escamas de sal volcánica.',
                'price': Decimal('6.00'),
                'pieces_count': 1,
                'preparation_time': 5,
                'calories': 140,
                'is_available': True,
                'is_chef_special': False,
                'image_url': 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=700&q=80',
            },
            {
                'category': categories_map['bebidas-sake'],
                'name': 'Sake Junmai Daiginjo Dassai 23 (300ml)',
                'description': 'La cúspide del sake japonés con pulido al 23%, notas de melocotón blanco y final aterciopelado.',
                'price': Decimal('42.00'),
                'pieces_count': 1,
                'preparation_time': 2,
                'calories': 190,
                'is_available': True,
                'is_chef_special': True,
                'image_url': 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=700&q=80',
            },
            {
                'category': categories_map['postres'],
                'name': 'Mochi Artesanal de Té Matcha y Sorbete',
                'description': 'Mochi tierno relleno de helado de té matcha de Kioto acompañado de gelée de yuzu cítrico.',
                'price': Decimal('7.00'),
                'pieces_count': 2,
                'preparation_time': 4,
                'calories': 220,
                'is_available': True,
                'is_chef_special': False,
                'image_url': 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=700&q=80',
            },
        ]

        products_map = {}
        for pdata in products_data:
            prod, _ = Product.objects.update_or_create(
                name=pdata['name'],
                defaults=pdata
            )
            products_map[pdata['name']] = prod

        self.stdout.write(self.style.SUCCESS(f"✓ {len(products_map)} Platillos sushi registrados"))

        # 4. Recetas (ProductIngredient)
        recipes = [
            (products_map['Nigiri Salmón Aburi Trufado (2 pcs)'], ingredients_map['Salmón Noruego Fresco (Sake)'], Decimal('0.06')),
            (products_map['Nigiri Salmón Aburi Trufado (2 pcs)'], ingredients_map['Arroz Especial Koshihikari'], Decimal('0.04')),
            (products_map['Dragon Roll Imperial (8 pcs)'], ingredients_map['Langostino Tigre Tempura (Ebi)'], Decimal('0.10')),
            (products_map['Dragon Roll Imperial (8 pcs)'], ingredients_map['Anguila de Agua Dulce (Unagi)'], Decimal('0.08')),
            (products_map['Dragon Roll Imperial (8 pcs)'], ingredients_map['Aguacate Hass Maduro'], Decimal('0.05')),
            (products_map['Dragon Roll Imperial (8 pcs)'], ingredients_map['Alga Nori Tostada Premium'], Decimal('1.00')),
            (products_map['Philadelphia Rainbow Salmon (8 pcs)'], ingredients_map['Salmón Noruego Fresco (Sake)'], Decimal('0.12')),
            (products_map['Philadelphia Rainbow Salmon (8 pcs)'], ingredients_map['Queso Crema Philadelphia'], Decimal('0.06')),
            (products_map['Philadelphia Rainbow Salmon (8 pcs)'], ingredients_map['Aguacate Hass Maduro'], Decimal('0.05')),
            (products_map['Gunkan Ikura con Shiso (2 pcs)'], ingredients_map['Huevas de Salmón (Ikura)'], Decimal('40.00')),
        ]
        for prod, ing, qty in recipes:
            ProductIngredient.objects.update_or_create(
                product=prod,
                ingredient=ing,
                defaults={'quantity_required': qty, 'is_optional': False}
            )

        # 5. Mesas del Restaurante
        tables_data = [
            {'table_number': 1, 'capacity': 2, 'location': 'BARRA', 'status': 'OCUPADA', 'notes': 'Frente al Maestro Itamae Omakase'},
            {'table_number': 2, 'capacity': 2, 'location': 'BARRA', 'status': 'DISPONIBLE', 'notes': 'Barra central'},
            {'table_number': 3, 'capacity': 4, 'location': 'SALON', 'status': 'OCUPADA', 'notes': 'Mesa junto al jardín de rocas zen'},
            {'table_number': 4, 'capacity': 4, 'location': 'SALON', 'status': 'DISPONIBLE', 'notes': 'Salón principal'},
            {'table_number': 5, 'capacity': 6, 'location': 'SALON', 'status': 'DISPONIBLE', 'notes': 'Mesa familiar amplia'},
            {'table_number': 6, 'capacity': 4, 'location': 'TERRAZA', 'status': 'DISPONIBLE', 'notes': 'Bajo pérgola de bambú'},
            {'table_number': 7, 'capacity': 6, 'location': 'VIP', 'status': 'RESERVADA', 'notes': 'Salón privado con esteras tatami'},
            {'table_number': 8, 'capacity': 8, 'location': 'VIP', 'status': 'DISPONIBLE', 'notes': 'Mesa imperial Omakase privado'},
        ]

        tables_map = {}
        for tdata in tables_data:
            tbl, _ = RestaurantTable.objects.update_or_create(
                table_number=tdata['table_number'],
                defaults=tdata
            )
            tables_map[tdata['table_number']] = tbl

        self.stdout.write(self.style.SUCCESS(f"✓ {len(tables_map)} Mesas configuradas"))

        # 6. Clientes
        customers_data = [
            {'first_name': 'Kenji', 'last_name': 'Takahashi', 'email': 'kenji.takahashi@tokyo.com', 'phone': '+34 612 345 678', 'dietary_preferences': 'Prefiere wasabi fresco aparte. Amante del O-Toro.', 'is_vip': True, 'loyalty_points': 450},
            {'first_name': 'Valentina', 'last_name': 'Moretti', 'email': 'v.moretti@luxuryliving.com', 'phone': '+34 699 876 543', 'dietary_preferences': 'Alérgica a mariscos y crustáceos.', 'is_vip': True, 'loyalty_points': 320},
            {'first_name': 'Santiago', 'last_name': 'Mendoza', 'email': 'santiago.m@gmail.com', 'phone': '+34 655 432 109', 'dietary_preferences': 'Sin restricciones. Fan de rolls con aguacate.', 'is_vip': False, 'loyalty_points': 80},
            {'first_name': 'Aoi', 'last_name': 'Nakamura', 'email': 'aoi.n@creativejapan.jp', 'phone': '+34 633 221 100', 'dietary_preferences': 'Vegetariana / Sólo rolls vegetales y tofu.', 'is_vip': False, 'loyalty_points': 120},
            {'first_name': 'Carlos', 'last_name': 'Vargas', 'email': 'carlos.vargas@finanzas.es', 'phone': '+34 644 112 233', 'dietary_preferences': 'Comidas de negocios frecuentes.', 'is_vip': True, 'loyalty_points': 580},
        ]

        customers_map = {}
        for cdata in customers_data:
            cust, _ = Customer.objects.update_or_create(
                email=cdata['email'],
                defaults=cdata
            )
            customers_map[cdata['email']] = cust

        self.stdout.write(self.style.SUCCESS(f"✓ {len(customers_map)} Clientes registrados"))

        # 7. Órdenes y Detalles (OrderItem)
        order1, _ = Order.objects.update_or_create(
            order_code='SH-261108-001',
            defaults={
                'customer': customers_map['kenji.takahashi@tokyo.com'],
                'table': tables_map[1],
                'order_type': 'DINE_IN',
                'status': 'COCINA',
                'payment_method': 'TARJETA',
                'notes': 'Cliente VIP en Barra Omakase: servir a temperatura ambiente precisa.',
            }
        )
        order1.items.all().delete()
        OrderItem.objects.create(order=order1, product=products_map['Nigiri O-Toro con Wasabi Fresco (2 pcs)'], quantity=2, unit_price=Decimal('14.00'), subtotal=Decimal('28.00'), special_notes='Poco arroz shari')
        OrderItem.objects.create(order=order1, product=products_map['Sashimi Kaiseki Moriawase (15 cortes)'], quantity=1, unit_price=Decimal('28.00'), subtotal=Decimal('28.00'))
        order1.calculate_totals()
        order1.save()

        order2, _ = Order.objects.update_or_create(
            order_code='SH-261108-002',
            defaults={
                'customer': customers_map['santiago.m@gmail.com'],
                'table': tables_map[3],
                'order_type': 'DINE_IN',
                'status': 'SERVIDO',
                'payment_method': 'TARJETA',
                'notes': 'Mesa 3 en Salón Zen.',
            }
        )
        order2.items.all().delete()
        OrderItem.objects.create(order=order2, product=products_map['Dragon Roll Imperial (8 pcs)'], quantity=1, unit_price=Decimal('16.50'), subtotal=Decimal('16.50'))
        OrderItem.objects.create(order=order2, product=products_map['Gyozas de Wagyu & Shiitake (5 pcs)'], quantity=1, unit_price=Decimal('9.50'), subtotal=Decimal('9.50'))
        OrderItem.objects.create(order=order2, product=products_map['Edamame Trufado al Wok'], quantity=1, unit_price=Decimal('6.00'), subtotal=Decimal('6.00'))
        order2.calculate_totals()
        order2.save()

        order3, _ = Order.objects.update_or_create(
            order_code='SH-261108-003',
            defaults={
                'customer': customers_map['carlos.vargas@finanzas.es'],
                'table': None,
                'order_type': 'TAKEAWAY',
                'status': 'PAGADO',
                'payment_method': 'TRANSFERENCIA',
                'notes': 'Empaque premium ecológico con palillos de bambú.',
            }
        )
        order3.items.all().delete()
        OrderItem.objects.create(order=order3, product=products_map['Sake Junmai Daiginjo Dassai 23 (300ml)'], quantity=1, unit_price=Decimal('42.00'), subtotal=Decimal('42.00'))
        OrderItem.objects.create(order=order3, product=products_map['Dragon Roll Imperial (8 pcs)'], quantity=2, unit_price=Decimal('16.50'), subtotal=Decimal('33.00'))
        order3.calculate_totals()
        order3.save()

        self.stdout.write(self.style.SUCCESS("✓ Pedidos iniciales y líneas de detalle creadas"))

        # 8. Reservaciones
        today = timezone.localdate()
        reservations_data = [
            {
                'customer': customers_map['v.moretti@luxuryliving.com'],
                'table': tables_map[7],
                'reservation_date': today,
                'reservation_time': datetime.time(20, 30),
                'guests_count': 4,
                'status': 'CONFIRMADA',
                'special_requests': 'Cena de celebración en Salón Tatami VIP. Recordar alérgeno a mariscos.',
            },
            {
                'customer': customers_map['carlos.vargas@finanzas.es'],
                'table': tables_map[8],
                'reservation_date': today + datetime.timedelta(days=1),
                'reservation_time': datetime.time(21, 00),
                'guests_count': 6,
                'status': 'PENDIENTE',
                'special_requests': 'Cena corporativa con maridaje de sake.',
            },
        ]

        for rdata in reservations_data:
            Reservation.objects.update_or_create(
                customer=rdata['customer'],
                reservation_date=rdata['reservation_date'],
                reservation_time=rdata['reservation_time'],
                defaults=rdata
            )

        self.stdout.write(self.style.SUCCESS("✓ Reservaciones iniciales creadas"))

        # 9. Usuarios y Roles del Sistema
        # Administrador (acceso total incluido inventario)
        admin_user, created_admin = User.objects.get_or_create(
            username='admin',
            defaults={
                'first_name': 'Master',
                'last_name': 'Itamae',
                'email': 'admin@kaiseki.com',
                'is_staff': True,
                'is_superuser': True,
            }
        )
        admin_user.set_password('admin123')
        admin_user.is_staff = True
        admin_user.is_superuser = True
        admin_user.save()
        UserProfile.objects.update_or_create(user=admin_user, defaults={'role': 'admin'})

        # Encargado (solo clientes y reservas)
        encargado_user, created_enc = User.objects.get_or_create(
            username='encargado',
            defaults={
                'first_name': 'Hiroshi',
                'last_name': 'Sato',
                'email': 'encargado@kaiseki.com',
                'is_staff': False,
                'is_superuser': False,
            }
        )
        encargado_user.set_password('encargado123')
        encargado_user.is_staff = False
        encargado_user.is_superuser = False
        encargado_user.save()
        UserProfile.objects.update_or_create(user=encargado_user, defaults={'role': 'encargado'})

        self.stdout.write(self.style.SUCCESS("✓ Usuarios y roles creados: 'admin' (Administrador) y 'encargado' (Encargado de Reservas)"))
        self.stdout.write(self.style.SUCCESS("✨ Base de datos poblada exitosamente."))

import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import {
  DollarSign,
  ShoppingBag,
  Flame,
  UtensilsCrossed,
  AlertCircle,
  Calendar,
  Users,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Clock
} from 'lucide-react';

export default function DashboardView({ onNavigate, showToast }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await api.getDashboard();
      setData(res);
    } catch (err) {
      showToast?.('Error al cargar datos del dashboard: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading && !data) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-secondary)' }}>
        <RefreshCw size={36} className="animate-spin-slow" style={{ color: 'var(--gold)', margin: '0 auto 1rem' }} />
        <p className="font-serif" style={{ fontSize: '1.25rem' }}>Cargando métricas de Kaiseki Sushi Bar...</p>
      </div>
    );
  }

  const kpis = data?.kpis || {};
  const lowStock = data?.low_stock_items || [];
  const topDishes = data?.top_products || [];
  const recentOrders = data?.recent_orders || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Welcome Banner */}
      <div className="glass-card glass-card-gold" style={{
        padding: '1.75rem 2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1.5rem',
        background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.08) 0%, rgba(18, 25, 34, 0.95) 100%)',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <span className="badge badge-gold">Servicio Activo • Omakase</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
          </div>
          <h2 className="font-serif tracking-wide" style={{ fontSize: '2rem', fontWeight: 700, marginTop: '0.4rem' }}>
            Panel de Control Gastronómico
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '620px', marginTop: '0.25rem' }}>
            Supervisión integral en tiempo real: salón, pedidos en cocina itamae, inventario de insumos nobles y reservas exclusivas.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={fetchStats} className="btn btn-secondary">
            <RefreshCw size={16} />
            <span>Actualizar</span>
          </button>
          <button onClick={() => onNavigate('orders')} className="btn btn-primary">
            <ShoppingBag size={16} />
            <span>Gestionar Pedidos</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '1.25rem'
      }}>
        {/* Ventas Hoy */}
        <div className="glass-card" style={{ padding: '1.4rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>
              Ventas Totales Hoy
            </span>
            <div style={{ padding: '0.45rem', borderRadius: '8px', background: 'var(--gold-glow)', color: 'var(--gold)' }}>
              <DollarSign size={20} />
            </div>
          </div>
          <div style={{ fontSize: '2.1rem', fontWeight: 700, color: 'var(--gold)', marginTop: '0.75rem', fontFamily: 'var(--font-serif)' }}>
            ${kpis.sales_today?.toFixed(2) || '0.00'}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
            Acumulado histórico: ${kpis.sales_all_time?.toFixed(2) || '0.00'}
          </div>
        </div>

        {/* Órdenes Activas */}
        <div className="glass-card" style={{ padding: '1.4rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>
              Pedidos Activos
            </span>
            <div style={{ padding: '0.45rem', borderRadius: '8px', background: 'var(--crimson-glow)', color: '#fb7185' }}>
              <Flame size={20} />
            </div>
          </div>
          <div style={{ fontSize: '2.1rem', fontWeight: 700, color: '#fb7185', marginTop: '0.75rem', fontFamily: 'var(--font-serif)' }}>
            {kpis.active_orders ?? 0}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.35rem', display: 'flex', gap: '0.75rem' }}>
            <span>🔥 {kpis.orders_in_kitchen ?? 0} en cocina</span>
            <span>⏳ {kpis.orders_pending ?? 0} pendientes</span>
          </div>
        </div>

        {/* Ocupación de Mesas */}
        <div className="glass-card" style={{ padding: '1.4rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>
              Mesas del Salón
            </span>
            <div style={{ padding: '0.45rem', borderRadius: '8px', background: 'var(--emerald-glow)', color: '#34d399' }}>
              <UtensilsCrossed size={20} />
            </div>
          </div>
          <div style={{ fontSize: '2.1rem', fontWeight: 700, color: '#34d399', marginTop: '0.75rem', fontFamily: 'var(--font-serif)' }}>
            {kpis.occupied_tables ?? 0} / {kpis.total_tables ?? 0}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
            {kpis.available_tables ?? 0} mesas disponibles para servicio
          </div>
        </div>

        {/* Reservas de Hoy */}
        <div className="glass-card" style={{ padding: '1.4rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>
              Reservas para Hoy
            </span>
            <div style={{ padding: '0.45rem', borderRadius: '8px', background: 'rgba(14, 165, 233, 0.15)', color: '#38bdf8' }}>
              <Calendar size={20} />
            </div>
          </div>
          <div style={{ fontSize: '2.1rem', fontWeight: 700, color: '#38bdf8', marginTop: '0.75rem', fontFamily: 'var(--font-serif)' }}>
            {kpis.reservations_today ?? 0}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
            {kpis.total_customers ?? 0} comensales registrados en total
          </div>
        </div>
      </div>

      {/* Main Content 2-Column Split */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '1.5rem' }}>

        {/* Recent Orders List */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShoppingBag size={18} color="var(--gold)" />
              <h3 className="font-serif" style={{ fontSize: '1.25rem', fontWeight: 700 }}>Últimos Pedidos</h3>
            </div>
            <button onClick={() => onNavigate('orders')} className="btn btn-secondary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}>
              Ver todas <ArrowRight size={14} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {recentOrders.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No hay pedidos recientes.</p>
            ) : (
              recentOrders.map((ord) => (
                <div key={ord.id} style={{
                  padding: '0.85rem 1rem',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1rem',
                }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                        {ord.order_code}
                      </span>
                      <span className={`badge ${ord.status === 'PAGADO' ? 'badge-emerald' :
                          ord.status === 'COCINA' ? 'badge-crimson' :
                            ord.status === 'SERVIDO' ? 'badge-sky' : 'badge-amber'
                        }`}>
                        {ord.status_display}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                      {ord.customer_name} {ord.table_number ? `• Mesa #${ord.table_number}` : `• ${ord.order_type_display}`}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 700, color: 'var(--gold)', fontSize: '1.05rem', fontFamily: 'var(--font-serif)' }}>
                      ${ord.total_amount}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      {ord.items_count} platillos
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Low Stock & Inventory Alerts */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertCircle size={18} color={lowStock.length > 0 ? '#fb7185' : 'var(--emerald)'} />
              <h3 className="font-serif" style={{ fontSize: '1.25rem', fontWeight: 700 }}>Alertas de Almacén</h3>
            </div>
            <button onClick={() => onNavigate('inventory')} className="btn btn-secondary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}>
              Insumos <ArrowRight size={14} />
            </button>
          </div>

          {lowStock.length === 0 ? (
            <div style={{
              padding: '1.5rem',
              textAlign: 'center',
              background: 'rgba(16, 185, 129, 0.05)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid rgba(16, 185, 129, 0.15)'
            }}>
              <p style={{ color: '#34d399', fontSize: '0.9rem', fontWeight: 500 }}>
                ✓ Todos los insumos e ingredientes cuentan con stock óptimo.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {lowStock.map((item) => (
                <div key={item.id} style={{
                  padding: '0.85rem 1rem',
                  background: 'rgba(225, 29, 72, 0.08)',
                  border: '1px solid rgba(225, 29, 72, 0.25)',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}>
                  <div>
                    <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#f8fafc' }}>{item.name}</h4>
                    <span style={{ fontSize: '0.75rem', color: '#fb7185' }}>
                      Stock actual: <strong>{item.stock} {item.unit}</strong> (Mínimo requerido: {item.min_stock} {item.unit})
                    </span>
                  </div>
                  <button onClick={() => onNavigate('inventory')} className="btn btn-crimson" style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}>
                    Reabastecer
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Top Products */}
          <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-subtle)' }}>
            <h4 className="font-serif" style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.75rem' }}>
              Platillos Más Pedidos
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {topDishes.slice(0, 3).map((dish, idx) => (
                <div key={idx} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '0.85rem',
                  padding: '0.4rem 0',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <span style={{ color: 'var(--gold)', fontWeight: 700, fontFamily: 'var(--font-serif)' }}>#{idx + 1}</span>
                    <span style={{ color: 'var(--text-primary)' }}>{dish.product__name}</span>
                  </div>
                  <span style={{ color: 'var(--text-muted)' }}>
                    <strong>{dish.total_ordered}</strong> ordenados (${dish.revenue})
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}


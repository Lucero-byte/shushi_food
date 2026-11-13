import React from 'react';
import { 
  LayoutDashboard, 
  Fish, 
  Layers, 
  ShoppingBag, 
  Users, 
  Calendar, 
  Sparkles, 
  Boxes,
  UtensilsCrossed,
  CircleDot,
  Shield,
  UserCheck,
  LogOut
} from 'lucide-react';

export default function Navbar({ currentTab, setCurrentTab, isConnected, user, onLogout }) {
  const role = user?.role || 'admin';
  const isAdmin = role === 'admin';

  const allNavItems = [
    { id: 'dashboard', label: 'Dashboard', sub: '懐石', icon: LayoutDashboard, roles: ['admin'] },
    { id: 'products', label: 'Platillos', sub: '鮨', icon: Fish, roles: ['admin'] },
    { id: 'categories', label: 'Categorías', sub: '分類', icon: Layers, roles: ['admin'] },
    { id: 'orders', label: 'Pedidos', sub: '注文', icon: ShoppingBag, roles: ['admin'] },
    { id: 'tables', label: 'Mesas & Zonas', sub: '座席', icon: UtensilsCrossed, roles: ['admin'] },
    { id: 'reservations', label: 'Reservas', sub: '予約', icon: Calendar, roles: ['admin', 'encargado'] },
    { id: 'customers', label: 'Clientes', sub: '顧客', icon: Users, roles: ['admin', 'encargado'] },
    { id: 'inventory', label: 'Inventario', sub: '在庫', icon: Boxes, roles: ['admin'] },
  ];

  const visibleNavItems = allNavItems.filter(item => item.roles.includes(role));

  return (
    <header style={{
      background: 'rgba(10, 14, 19, 0.95)',
      backdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      <div style={{
        maxWidth: '1440px',
        margin: '0 auto',
        padding: '0.85rem 1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
      }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #1c2633 0%, #0d131a 100%)',
            border: '1px solid var(--border-gold)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--shadow-gold)',
            color: 'var(--gold)'
          }}>
            <Sparkles size={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
              <h1 className="font-serif tracking-wider" style={{
                fontSize: '1.45rem',
                fontWeight: 700,
                color: '#f8fafc',
                lineHeight: 1
              }}>
                KAISEKI
              </h1>
              <span style={{
                fontSize: '0.75rem',
                color: 'var(--gold)',
                letterSpacing: '0.2em',
                fontWeight: 600
              }}>
                懐石料理
              </span>
            </div>
            <p style={{
              fontSize: '0.7rem',
              color: 'var(--text-muted)',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              marginTop: '0.15rem'
            }}>
              Luxury Sushi & Omakase System
            </p>
          </div>
        </div>

        {/* Navigation Tabs Filtered by Role */}
        <nav style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.35rem',
          background: 'rgba(255, 255, 255, 0.03)',
          padding: '0.3rem',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-subtle)',
          overflowX: 'auto',
          maxWidth: '100%',
        }}>
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  padding: '0.55rem 0.85rem',
                  fontSize: '0.8rem',
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? '#0a0e13' : 'var(--text-secondary)',
                  background: isActive ? 'linear-gradient(135deg, #e5c07b 0%, #d4af37 100%)' : 'transparent',
                  borderRadius: 'var(--radius-md)',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: isActive ? '0 2px 12px rgba(212, 175, 55, 0.3)' : 'none',
                  whiteSpace: 'nowrap'
                }}
              >
                <Icon size={16} color={isActive ? '#0a0e13' : 'currentColor'} />
                <span>{item.label}</span>
                <span style={{
                  fontSize: '0.65rem',
                  opacity: isActive ? 0.8 : 0.45,
                  fontWeight: 400
                }}>
                  {item.sub}
                </span>
              </button>
            );
          })}
        </nav>

        {/* Right Section: User Profile & Logout & API Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {/* User Profile Card */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            background: 'rgba(255, 255, 255, 0.03)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            padding: '0.35rem 0.75rem',
          }}>
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '8px',
              background: isAdmin ? 'rgba(212, 175, 55, 0.15)' : 'rgba(56, 189, 248, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: isAdmin ? 'var(--gold)' : '#38bdf8'
            }}>
              {isAdmin ? <Shield size={16} /> : <UserCheck size={16} />}
            </div>

            <div>
              <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#f8fafc', lineHeight: 1.1 }}>
                {user?.full_name || user?.username || 'Usuario'}
              </div>
              <div style={{
                fontSize: '0.68rem',
                color: isAdmin ? 'var(--gold)' : '#38bdf8',
                fontWeight: 500,
                marginTop: '0.1rem'
              }}>
                {isAdmin ? 'Administrador' : 'Encargado'}
              </div>
            </div>
          </div>

          {/* Logout Button */}
          <button
            onClick={onLogout}
            title="Cerrar Sesión"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.45rem 0.75rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              background: 'rgba(239, 68, 68, 0.08)',
              color: '#fca5a5',
              cursor: 'pointer',
              fontSize: '0.75rem',
              fontWeight: 500,
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
              e.currentTarget.style.borderColor = '#ef4444';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)';
              e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)';
            }}
          >
            <LogOut size={14} />
            <span>Salir</span>
          </button>

          {/* Backend API Status Pill */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            padding: '0.35rem 0.7rem',
            borderRadius: 'var(--radius-full)',
            background: isConnected ? 'rgba(16, 185, 129, 0.1)' : 'rgba(225, 29, 72, 0.1)',
            border: `1px solid ${isConnected ? 'rgba(16, 185, 129, 0.25)' : 'rgba(225, 29, 72, 0.25)'}`,
            fontSize: '0.7rem',
            color: isConnected ? '#34d399' : '#fb7185',
          }}>
            <CircleDot size={10} className={isConnected ? '' : 'animate-pulse'} />
            <span style={{ fontWeight: 600 }}>
              {isConnected ? 'API Online' : 'Offline'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}

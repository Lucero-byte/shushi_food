import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import LoginView from './views/LoginView';
import DashboardView from './views/DashboardView';
import ProductsView from './views/ProductsView';
import CategoriesView from './views/CategoriesView';
import OrdersView from './views/OrdersView';
import TablesView from './views/TablesView';
import ReservationsView from './views/ReservationsView';
import CustomersView from './views/CustomersView';
import InventoryView from './views/InventoryView';
import { api, authStorage } from './services/api';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState(() => authStorage.getUser());
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [isConnected, setIsConnected] = useState(true);
  const [toast, setToast] = useState(null); // { message, type: 'success' | 'error' | 'info' }

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Adjust active tab depending on role
  useEffect(() => {
    if (user?.role === 'encargado') {
      if (currentTab !== 'reservations' && currentTab !== 'customers') {
        setCurrentTab('reservations');
      }
    }
  }, [user, currentTab]);

  // Check backend health periodically
  useEffect(() => {
    const checkHealth = async () => {
      try {
        await api.getHealth();
        setIsConnected(true);
      } catch (err) {
        setIsConnected(false);
      }
    };
    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    if (userData.role === 'encargado') {
      setCurrentTab('reservations');
    } else {
      setCurrentTab('dashboard');
    }
  };

  const handleLogout = async () => {
    await api.logout();
    setUser(null);
    showToast('Sesión cerrada exitosamente', 'info');
  };

  const isEncargado = user?.role === 'encargado';

  // If not logged in, show the Login screen
  if (!user) {
    return (
      <>
        {/* Toast Notification */}
        {toast && (
          <div style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.85rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            background: toast.type === 'error' ? '#200d14' : toast.type === 'info' ? '#0d1828' : '#0c221a',
            border: `1px solid ${toast.type === 'error' ? '#fb7185' : toast.type === 'info' ? '#38bdf8' : '#34d399'}`,
            color: '#f8fafc',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
            fontSize: '0.875rem',
            maxWidth: '420px',
          }}>
            {toast.type === 'error' ? (
              <AlertCircle size={20} color="#fb7185" />
            ) : toast.type === 'info' ? (
              <Info size={20} color="#38bdf8" />
            ) : (
              <CheckCircle2 size={20} color="#34d399" />
            )}
            <span style={{ flex: 1, lineHeight: 1.4 }}>{toast.message}</span>
            <button 
              onClick={() => setToast(null)} 
              style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            >
              <X size={16} />
            </button>
          </div>
        )}

        <LoginView onLoginSuccess={handleLoginSuccess} showToast={showToast} />
      </>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Toast Notification */}
      {toast && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          padding: '0.85rem 1.25rem',
          borderRadius: 'var(--radius-md)',
          background: toast.type === 'error' ? '#200d14' : toast.type === 'info' ? '#0d1828' : '#0c221a',
          border: `1px solid ${toast.type === 'error' ? '#fb7185' : toast.type === 'info' ? '#38bdf8' : '#34d399'}`,
          color: '#f8fafc',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
          fontSize: '0.875rem',
          maxWidth: '420px',
        }}>
          {toast.type === 'error' ? (
            <AlertCircle size={20} color="#fb7185" />
          ) : toast.type === 'info' ? (
            <Info size={20} color="#38bdf8" />
          ) : (
            <CheckCircle2 size={20} color="#34d399" />
          )}
          <span style={{ flex: 1, lineHeight: 1.4 }}>{toast.message}</span>
          <button 
            onClick={() => setToast(null)} 
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Luxury Navigation Header */}
      <Navbar 
        currentTab={currentTab} 
        setCurrentTab={setCurrentTab} 
        isConnected={isConnected}
        user={user}
        onLogout={handleLogout}
      />

      {/* Main Container */}
      <main style={{
        flex: 1,
        maxWidth: '1440px',
        width: '100%',
        margin: '0 auto',
        padding: '2rem 1.5rem 4rem',
      }}>
        {/* Admin only views */}
        {!isEncargado && currentTab === 'dashboard' && (
          <DashboardView onNavigate={setCurrentTab} showToast={showToast} />
        )}
        {!isEncargado && currentTab === 'products' && (
          <ProductsView showToast={showToast} />
        )}
        {!isEncargado && currentTab === 'categories' && (
          <CategoriesView showToast={showToast} />
        )}
        {!isEncargado && currentTab === 'orders' && (
          <OrdersView showToast={showToast} />
        )}
        {!isEncargado && currentTab === 'tables' && (
          <TablesView showToast={showToast} />
        )}
        {!isEncargado && currentTab === 'inventory' && (
          <InventoryView showToast={showToast} />
        )}

        {/* Views available to both Admin and Encargado */}
        {currentTab === 'reservations' && (
          <ReservationsView showToast={showToast} />
        )}
        {currentTab === 'customers' && (
          <CustomersView showToast={showToast} />
        )}
      </main>

      {/* Luxury Minimalist Footer */}
      <footer style={{
        background: '#070a0e',
        borderTop: '1px solid var(--border-subtle)',
        padding: '1.75rem 1.5rem',
        marginTop: 'auto',
      }}>
        <div style={{
          maxWidth: '1440px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          fontSize: '0.85rem',
          color: 'var(--text-muted)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span className="font-serif" style={{ color: 'var(--gold)', fontWeight: 700, fontSize: '1.05rem' }}>
              KAISEKI • 懐石
            </span>
            <span>|</span>
            <span>Sistema Integral de Restaurante de Sushi</span>
          </div>

          <div style={{ color: 'var(--text-secondary)' }}>
            Todos los derechos reservados a ALLABS
          </div>
        </div>
      </footer>
    </div>
  );
}

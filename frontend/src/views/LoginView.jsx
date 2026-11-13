import React, { useState } from 'react';
import { 
  Sparkles, 
  Lock, 
  User, 
  ShieldCheck, 
  UserCheck, 
  ArrowRight, 
  AlertCircle,
  Eye,
  EyeOff,
  CircleDot,
  Check
} from 'lucide-react';
import { api } from '../services/api';

export default function LoginView({ onLoginSuccess, showToast }) {
  const [selectedRole, setSelectedRole] = useState('admin'); // 'admin' | 'encargado'
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Cambiar rol y pre-cargar credenciales de forma interactiva
  const handleSelectRole = (role) => {
    setSelectedRole(role);
    setError('');
    if (role === 'admin') {
      setUsername('admin');
      setPassword('admin123');
    } else {
      setUsername('encargado');
      setPassword('encargado123');
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!username.trim() || !password) {
      setError('Por favor ingresa tu usuario y contraseña.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await api.login(username.trim(), password);
      showToast?.(`¡Bienvenido, ${response.user.full_name}!`, 'success');
      onLoginSuccess(response.user);
    } catch (err) {
      const msg = err.message || 'Error al iniciar sesión. Verifica tus credenciales.';
      setError(msg);
      showToast?.(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      {/* Spacer Top */}
      <div />

      {/* Main Container */}
      <div style={{ width: '100%', maxWidth: '490px', margin: '1rem auto' }}>
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div style={{
            width: '68px',
            height: '68px',
            margin: '0 auto 1.15rem',
            borderRadius: '20px',
            background: 'linear-gradient(135deg, #243042 0%, #0d131b 100%)',
            border: '1px solid rgba(212, 175, 55, 0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 28px rgba(0, 0, 0, 0.6), 0 0 25px rgba(212, 175, 55, 0.2)',
            color: 'var(--gold)',
          }}>
            <Sparkles size={34} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.65rem' }}>
            <h1 className="font-serif tracking-widest" style={{
              fontSize: '2.15rem',
              fontWeight: 700,
              color: '#f8fafc',
              letterSpacing: '0.14em',
              margin: 0,
              lineHeight: 1
            }}>
              KAISEKI
            </h1>
            <span style={{
              fontSize: '1.1rem',
              color: 'var(--gold)',
              fontWeight: 600,
              letterSpacing: '0.22em'
            }}>
              懐石
            </span>
          </div>

          <p style={{
            color: 'var(--text-muted)',
            fontSize: '0.8rem',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            marginTop: '0.55rem',
            fontWeight: 500
          }}>
            Sistema Gastronómico de Alta Cocina & Omakase
          </p>
        </div>

        {/* Card */}
        <div className="login-card">
          <div style={{ marginBottom: '1.25rem' }}>
            <h2 style={{
              fontSize: '1.25rem',
              fontWeight: 600,
              color: '#f8fafc',
              marginBottom: '0.25rem'
            }}>
              Acceso al Sistema
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.825rem' }}>
              Elige el rol con el que deseas ingresar o edita las credenciales:
            </p>
          </div>

          {/* Interactive Role Selector Tabs */}
          <div className="login-role-selector">
            <button
              type="button"
              className={`login-role-tab ${selectedRole === 'admin' ? 'active-admin' : ''}`}
              onClick={() => handleSelectRole('admin')}
            >
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: selectedRole === 'admin' ? 'rgba(212, 175, 55, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: selectedRole === 'admin' ? 'var(--gold)' : 'var(--text-muted)',
                flexShrink: 0
              }}>
                <ShieldCheck size={18} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: '0.825rem',
                  fontWeight: 600,
                  color: selectedRole === 'admin' ? '#f8fafc' : 'var(--text-secondary)',
                  lineHeight: 1.2
                }}>
                  Administrador
                </div>
                <div style={{
                  fontSize: '0.7rem',
                  color: selectedRole === 'admin' ? 'var(--gold)' : 'var(--text-muted)',
                  marginTop: '0.15rem'
                }}>
                  Acceso Total
                </div>
              </div>
            </button>

            <button
              type="button"
              className={`login-role-tab ${selectedRole === 'encargado' ? 'active-encargado' : ''}`}
              onClick={() => handleSelectRole('encargado')}
            >
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: selectedRole === 'encargado' ? 'rgba(56, 189, 248, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: selectedRole === 'encargado' ? '#38bdf8' : 'var(--text-muted)',
                flexShrink: 0
              }}>
                <UserCheck size={18} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: '0.825rem',
                  fontWeight: 600,
                  color: selectedRole === 'encargado' ? '#f8fafc' : 'var(--text-secondary)',
                  lineHeight: 1.2
                }}>
                  Encargado
                </div>
                <div style={{
                  fontSize: '0.7rem',
                  color: selectedRole === 'encargado' ? '#38bdf8' : 'var(--text-muted)',
                  marginTop: '0.15rem'
                }}>
                  Clientes & Reservas
                </div>
              </div>
            </button>
          </div>

          {/* Error Message Box */}
          {error && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
              padding: '0.75rem 1rem',
              marginBottom: '1.25rem',
              borderRadius: '10px',
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              color: '#fca5a5',
              fontSize: '0.825rem',
              animation: 'slideUp 0.2s ease-out'
            }}>
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit}>
            {/* Username / Email */}
            <div style={{ marginBottom: '1.15rem' }}>
              <label style={{
                display: 'block',
                fontSize: '0.75rem',
                fontWeight: 600,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: 'var(--text-secondary)',
                marginBottom: '0.45rem'
              }}>
                Usuario o Correo
              </label>

              <div className="login-input-group">
                <div className="login-input-icon">
                  <User size={18} />
                </div>
                <input
                  type="text"
                  className="login-input"
                  placeholder="ej. admin o encargado"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={loading}
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem' }}>
                <label style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  color: 'var(--text-secondary)',
                }}>
                  Contraseña
                </label>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  {selectedRole === 'admin' ? 'Clave: admin123' : 'Clave: encargado123'}
                </span>
              </div>

              <div className="login-input-group">
                <div className="login-input-icon">
                  <Lock size={18} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="login-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'color 0.2s ease',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
                  onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                  title={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Remember & Role info */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1.5rem',
              fontSize: '0.78rem',
              color: 'var(--text-muted)'
            }}>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                cursor: 'pointer',
                userSelect: 'none'
              }}>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  style={{
                    accentColor: 'var(--gold)',
                    width: '15px',
                    height: '15px',
                    cursor: 'pointer'
                  }}
                />
                <span style={{ color: 'var(--text-secondary)' }}>Recordar sesión</span>
              </label>

              <span style={{
                fontSize: '0.72rem',
                color: selectedRole === 'admin' ? 'var(--gold)' : '#38bdf8',
                fontWeight: 500
              }}>
                {selectedRole === 'admin' ? '👑 Control Maestro' : '📋 Reservas & Clientes'}
              </span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="login-btn-submit"
            >
              {loading ? (
                <span>Validando credenciales...</span>
              ) : (
                <>
                  <span>Ingresar al Sistema</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          {/* Micro Status Bar */}
          <div style={{
            marginTop: '1.75rem',
            paddingTop: '1.15rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.07)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.72rem',
            color: 'var(--text-muted)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <CircleDot size={10} color="#34d399" />
              <span>Backend Django 6.1 Online</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Lock size={12} color="var(--gold)" />
              <span>Token Seguro Bearer</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer style={{
        textAlign: 'center',
        padding: '1.5rem 0 0.5rem',
        fontSize: '0.825rem',
        color: 'var(--text-secondary)',
        letterSpacing: '0.02em'
      }}>
        Todos los derechos reservados a ALLABS
      </footer>
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import Modal from '../components/Modal';
import ConfirmModal from '../components/ConfirmModal';
import { Plus, Edit3, Trash2, Search, Star, Phone, Mail, Award, AlertCircle } from 'lucide-react';

export default function CustomersView({ showToast }) {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete State
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingCustomer, setDeletingCustomer] = useState(null);

  const initialForm = {
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    dietary_preferences: '',
    is_vip: false,
    loyalty_points: 0,
  };
  const [form, setForm] = useState(initialForm);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const data = await api.getCustomers();
      setCustomers(data);
    } catch (err) {
      showToast?.('Error al cargar clientes: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const openCreateModal = () => {
    setEditingCustomer(null);
    setForm(initialForm);
    setIsModalOpen(true);
  };

  const openEditModal = (cust) => {
    setEditingCustomer(cust);
    setForm({
      first_name: cust.first_name,
      last_name: cust.last_name,
      email: cust.email,
      phone: cust.phone || '',
      dietary_preferences: cust.dietary_preferences || '',
      is_vip: cust.is_vip,
      loyalty_points: cust.loyalty_points,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.first_name || !form.last_name || !form.email) {
      showToast?.('Nombre, apellido y correo son requeridos', 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        ...form,
        loyalty_points: parseInt(form.loyalty_points) || 0,
      };

      if (editingCustomer) {
        await api.updateCustomer(editingCustomer.id, payload);
        showToast?.('Cliente actualizado exitosamente');
      } else {
        await api.createCustomer(payload);
        showToast?.('Cliente registrado en la base de datos');
      }
      setIsModalOpen(false);
      loadCustomers();
    } catch (err) {
      showToast?.('Error al guardar cliente: ' + err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleVip = async (cust) => {
    try {
      await api.toggleCustomerVip(cust.id);
      setCustomers(customers.map(c => c.id === cust.id ? { ...c, is_vip: !c.is_vip } : c));
      showToast?.(`Estatus VIP de ${cust.full_name}: ${!cust.is_vip ? 'Activado ★' : 'Desactivado'}`);
    } catch (err) {
      showToast?.('Error al actualizar estatus VIP: ' + err.message, 'error');
    }
  };

  const confirmDelete = (cust) => {
    setDeletingCustomer(cust);
    setIsDeleteOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingCustomer) return;
    try {
      setIsSubmitting(true);
      await api.deleteCustomer(deletingCustomer.id);
      showToast?.('Cliente eliminado del directorio');
      setIsDeleteOpen(false);
      loadCustomers();
    } catch (err) {
      showToast?.('Error al eliminar cliente: ' + err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredCustomers = customers.filter(c => {
    const term = search.toLowerCase();
    return c.full_name.toLowerCase().includes(term) ||
           c.email.toLowerCase().includes(term) ||
           (c.phone && c.phone.includes(term));
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className="badge badge-gold">Directorio de Comensales</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{customers.length} clientes registrados</span>
          </div>
          <h2 className="font-serif" style={{ fontSize: '1.85rem', fontWeight: 700, marginTop: '0.2rem' }}>
            Clientes y Preferencias Gastronómicas
          </h2>
        </div>

        <button onClick={openCreateModal} className="btn btn-primary">
          <Plus size={18} />
          <span>Registrar Nuevo Cliente</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="glass-card" style={{ padding: '0.85rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <Search size={18} color="var(--text-muted)" />
        <input
          type="text"
          placeholder="Buscar cliente por nombre, correo electrónico o teléfono..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-primary)',
            width: '100%',
            fontSize: '0.9rem',
            outline: 'none',
          }}
        />
      </div>

      {/* Customers Table */}
      <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Comensal</th>
                <th>Contacto</th>
                <th>Estatus VIP</th>
                <th>Puntos Kaiseki</th>
                <th>Alergias / Preferencias</th>
                <th>Historial</th>
                <th style={{ textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    Cargando comensales...
                  </td>
                </tr>
              ) : filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    No se encontraron clientes registrados.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map(cust => (
                  <tr key={cust.id}>
                    <td>
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                          {cust.full_name}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          Cliente desde {new Date(cust.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <Mail size={12} color="var(--gold)" /> {cust.email}
                        </span>
                        {cust.phone && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <Phone size={12} color="var(--emerald)" /> {cust.phone}
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <button
                        onClick={() => toggleVip(cust)}
                        className={`badge ${cust.is_vip ? 'badge-gold' : 'badge-neutral'}`}
                        style={{ cursor: 'pointer', border: 'none' }}
                        title="Alternar membresía VIP"
                      >
                        <Star size={11} /> {cust.is_vip ? 'Socio VIP' : 'Estándar'}
                      </button>
                    </td>
                    <td>
                      <span style={{ fontWeight: 700, color: 'var(--text-gold)', fontFamily: 'var(--font-serif)', fontSize: '1rem' }}>
                        {cust.loyalty_points} pts
                      </span>
                    </td>
                    <td style={{ maxWidth: '240px', fontSize: '0.8rem' }}>
                      {cust.dietary_preferences ? (
                        <span style={{ color: '#fb7185' }}>
                          ⚠️ {cust.dietary_preferences}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>Sin restricciones</span>
                      )}
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      <div>{cust.orders_count} pedidos</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{cust.reservations_count} reservas</div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                        <button onClick={() => openEditModal(cust)} className="btn-icon" title="Editar cliente">
                          <Edit3 size={15} />
                        </button>
                        <button onClick={() => confirmDelete(cust)} className="btn-icon" style={{ color: '#fb7185' }} title="Eliminar cliente">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Form */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCustomer ? "Editar Comensal" : "Nuevo Comensal"}
        subtitle="Ficha de cliente y registro de gustos gastronómicos"
      >
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Nombre *</label>
              <input
                type="text"
                className="form-input"
                placeholder="ej. Kenji"
                value={form.first_name}
                onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Apellido *</label>
              <input
                type="text"
                className="form-input"
                placeholder="ej. Takahashi"
                value={form.last_name}
                onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                required
              />
            </div>

            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label">Correo Electrónico *</label>
              <input
                type="email"
                className="form-input"
                placeholder="kenji.takahashi@tokyo.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Teléfono / WhatsApp</label>
              <input
                type="text"
                className="form-input"
                placeholder="+34 600 000 000"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Puntos de Fidelidad</label>
              <input
                type="number"
                min="0"
                className="form-input"
                value={form.loyalty_points}
                onChange={(e) => setForm({ ...form, loyalty_points: e.target.value })}
              />
            </div>

            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label">Alergias Alimentarias o Preferencias Omakase</label>
              <textarea
                className="form-textarea"
                placeholder="ej. Alérgico a crustáceos o mariscos, prefiere poco wasabi, sin sésamo..."
                value={form.dietary_preferences}
                onChange={(e) => setForm({ ...form, dietary_preferences: e.target.value })}
              />
            </div>

            <div style={{ gridColumn: 'span 2' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--text-gold)' }}>
                <input
                  type="checkbox"
                  checked={form.is_vip}
                  onChange={(e) => setForm({ ...form, is_vip: e.target.checked })}
                />
                <span>★ Marcar como Socio VIP Omakase</span>
              </label>
            </div>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '0.75rem',
            marginTop: '1.5rem',
            paddingTop: '1rem',
            borderTop: '1px solid var(--border-subtle)',
          }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? "Guardando..." : (editingCustomer ? "Actualizar Cliente" : "Registrar Cliente")}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Eliminar Cliente"
        message={`¿Estás seguro de eliminar el registro de "${deletingCustomer?.full_name}"?`}
        isLoading={isSubmitting}
      />
    </div>
  );
}


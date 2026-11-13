import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import Modal from '../components/Modal';
import ConfirmModal from '../components/ConfirmModal';
import { Plus, Edit3, Trash2, Calendar, Clock, Users, CheckCircle, XCircle, Search } from 'lucide-react';

export default function ReservationsView({ showToast }) {
  const [reservations, setReservations] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReservation, setEditingReservation] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete State
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingReservation, setDeletingReservation] = useState(null);

  const initialForm = {
    customer: '',
    table: '',
    reservation_date: new Date().toISOString().split('T')[0],
    reservation_time: '20:00',
    guests_count: 2,
    status: 'PENDIENTE',
    special_requests: '',
  };
  const [form, setForm] = useState(initialForm);

  const loadData = async () => {
    try {
      setLoading(true);
      const [resData, custData, tblData] = await Promise.all([
        api.getReservations(),
        api.getCustomers(),
        api.getTables(),
      ]);
      setReservations(resData);
      setCustomers(custData);
      setTables(tblData);
      if (custData.length > 0 && !form.customer) {
        setForm(prev => ({ ...prev, customer: custData[0].id }));
      }
    } catch (err) {
      showToast?.('Error al cargar reservas: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreateModal = () => {
    setEditingReservation(null);
    setForm({
      ...initialForm,
      customer: customers.length > 0 ? customers[0].id : '',
      table: tables.length > 0 ? tables[0].id : '',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (res) => {
    setEditingReservation(res);
    setForm({
      customer: res.customer,
      table: res.table || '',
      reservation_date: res.reservation_date,
      reservation_time: res.reservation_time.slice(0, 5),
      guests_count: res.guests_count,
      status: res.status,
      special_requests: res.special_requests || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.customer || !form.reservation_date || !form.reservation_time) {
      showToast?.('Cliente, fecha y hora son obligatorios', 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        ...form,
        customer: parseInt(form.customer),
        table: form.table ? parseInt(form.table) : null,
        guests_count: parseInt(form.guests_count) || 2,
      };

      if (editingReservation) {
        await api.updateReservation(editingReservation.id, payload);
        showToast?.('Reserva actualizada');
      } else {
        await api.createReservation(payload);
        showToast?.('Reserva confirmada en el sistema');
      }
      setIsModalOpen(false);
      loadData();
    } catch (err) {
      showToast?.('Error al guardar reserva: ' + err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const changeStatus = async (resId, newStatus) => {
    try {
      await api.changeReservationStatus(resId, newStatus);
      showToast?.(`Estado de reserva cambiado a: ${newStatus}`);
      loadData();
    } catch (err) {
      showToast?.('Error al cambiar estado: ' + err.message, 'error');
    }
  };

  const confirmDelete = (res) => {
    setDeletingReservation(res);
    setIsDeleteOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingReservation) return;
    try {
      setIsSubmitting(true);
      await api.deleteReservation(deletingReservation.id);
      showToast?.('Reserva eliminada');
      setIsDeleteOpen(false);
      loadData();
    } catch (err) {
      showToast?.('Error al eliminar reserva: ' + err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredReservations = reservations.filter(r => statusFilter ? r.status === statusFilter : true);

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
            <span className="badge badge-gold">Agenda Omakase</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{reservations.length} reservas registradas</span>
          </div>
          <h2 className="font-serif" style={{ fontSize: '1.85rem', fontWeight: 700, marginTop: '0.2rem' }}>
            Reservaciones de Comensales
          </h2>
        </div>

        <button onClick={openCreateModal} className="btn btn-primary">
          <Plus size={18} />
          <span>Nueva Reservación</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="glass-card" style={{
        padding: '0.85rem 1.25rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        flexWrap: 'wrap',
      }}>
        {[
          { id: '', label: 'Todas las reservas' },
          { id: 'CONFIRMADA', label: 'Confirmadas ✓' },
          { id: 'PENDIENTE', label: 'Pendientes ⏳' },
          { id: 'COMPLETADA', label: 'Completadas' },
          { id: 'CANCELADA', label: 'Canceladas ✕' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setStatusFilter(tab.id)}
            className={`btn ${statusFilter === tab.id ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem' }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Fecha y Hora</th>
                <th>Personas</th>
                <th>Mesa Asignada</th>
                <th>Peticiones Especiales</th>
                <th>Estado</th>
                <th style={{ textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    Cargando reservas...
                  </td>
                </tr>
              ) : filteredReservations.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    No hay reservaciones registradas con este criterio.
                  </td>
                </tr>
              ) : (
                filteredReservations.map(res => (
                  <tr key={res.id}>
                    <td>
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{res.customer_name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{res.customer_phone || res.customer_email}</div>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)' }}>
                        <Calendar size={14} color="var(--gold)" />
                        <span>{res.reservation_date}</span>
                        <Clock size={14} color="var(--text-muted)" style={{ marginLeft: '0.3rem' }} />
                        <span>{res.reservation_time.slice(0, 5)}</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--text-secondary)' }}>
                        <Users size={14} />
                        <span><strong>{res.guests_count}</strong> comensales</span>
                      </div>
                    </td>
                    <td>
                      {res.table_number ? (
                        <span className="badge badge-neutral">
                          Mesa #{res.table_number} ({res.table_location})
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Sin mesa fija</span>
                      )}
                    </td>
                    <td style={{ color: 'var(--text-muted)', maxWidth: '240px', fontSize: '0.8rem' }}>
                      {res.special_requests || "—"}
                    </td>
                    <td>
                      <span className={`badge ${
                        res.status === 'CONFIRMADA' ? 'badge-emerald' :
                        res.status === 'PENDIENTE' ? 'badge-amber' :
                        res.status === 'COMPLETADA' ? 'badge-sky' : 'badge-crimson'
                      }`}>
                        {res.status_display}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                        {res.status === 'PENDIENTE' && (
                          <button
                            onClick={() => changeStatus(res.id, 'CONFIRMADA')}
                            className="btn-icon"
                            style={{ color: '#34d399' }}
                            title="Confirmar reserva"
                          >
                            <CheckCircle size={15} />
                          </button>
                        )}
                        <button onClick={() => openEditModal(res)} className="btn-icon" title="Editar reserva">
                          <Edit3 size={15} />
                        </button>
                        <button onClick={() => confirmDelete(res)} className="btn-icon" style={{ color: '#fb7185' }} title="Eliminar reserva">
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
        title={editingReservation ? "Editar Reservación" : "Nueva Reservación"}
        subtitle="Asignación de fecha, comensales y mesa"
      >
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label">Cliente *</label>
              <select
                className="form-select"
                value={form.customer}
                onChange={(e) => setForm({ ...form, customer: e.target.value })}
                required
              >
                {customers.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.full_name} ({c.email}) {c.is_vip ? '★ [VIP]' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Fecha de la Reserva *</label>
              <input
                type="date"
                className="form-input"
                value={form.reservation_date}
                onChange={(e) => setForm({ ...form, reservation_date: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Hora *</label>
              <input
                type="time"
                className="form-input"
                value={form.reservation_time}
                onChange={(e) => setForm({ ...form, reservation_time: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Número de Comensales *</label>
              <input
                type="number"
                min="1"
                className="form-input"
                value={form.guests_count}
                onChange={(e) => setForm({ ...form, guests_count: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Mesa Asignada</label>
              <select
                className="form-select"
                value={form.table}
                onChange={(e) => setForm({ ...form, table: e.target.value })}
              >
                <option value="">Por asignar / A elección al llegar</option>
                {tables.map(t => (
                  <option key={t.id} value={t.id}>
                    Mesa #{t.table_number} ({t.location_display}) - Cap: {t.capacity} pers.
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label">Estado de la Reserva</label>
              <select
                className="form-select"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                <option value="PENDIENTE">Pendiente de Confirmación</option>
                <option value="CONFIRMADA">Confirmada</option>
                <option value="COMPLETADA">Completada / Atendida</option>
                <option value="CANCELADA">Cancelada</option>
              </select>
            </div>

            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label">Peticiones Especiales / Ocasión</label>
              <textarea
                className="form-textarea"
                placeholder="ej. Celebración de aniversario, menú degustación Omakase, alérgicos a mariscos..."
                value={form.special_requests}
                onChange={(e) => setForm({ ...form, special_requests: e.target.value })}
              />
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
              {isSubmitting ? "Guardando..." : (editingReservation ? "Actualizar Reserva" : "Confirmar Reserva")}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Eliminar Reservación"
        message={`¿Estás seguro de cancelar y eliminar la reserva de "${deletingReservation?.customer_name}"?`}
        isLoading={isSubmitting}
      />
    </div>
  );
}


import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import Modal from '../components/Modal';
import ConfirmModal from '../components/ConfirmModal';
import { Plus, Edit3, Trash2, UtensilsCrossed, Users, MapPin, CheckCircle, Clock, ShieldAlert } from 'lucide-react';

export default function TablesView({ showToast }) {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [locationFilter, setLocationFilter] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTable, setEditingTable] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete State
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingTable, setDeletingTable] = useState(null);

  const initialForm = {
    table_number: '',
    capacity: 2,
    location: 'SALON',
    status: 'DISPONIBLE',
    notes: '',
  };
  const [form, setForm] = useState(initialForm);

  const loadTables = async () => {
    try {
      setLoading(true);
      const data = await api.getTables();
      setTables(data);
    } catch (err) {
      showToast?.('Error al cargar mesas: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTables();
  }, []);

  const openCreateModal = () => {
    setEditingTable(null);
    const nextNumber = tables.length > 0 ? Math.max(...tables.map(t => t.table_number)) + 1 : 1;
    setForm({
      ...initialForm,
      table_number: nextNumber,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (tbl) => {
    setEditingTable(tbl);
    setForm({
      table_number: tbl.table_number,
      capacity: tbl.capacity,
      location: tbl.location,
      status: tbl.status,
      notes: tbl.notes || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.table_number || !form.capacity) {
      showToast?.('Número de mesa y capacidad son requeridos', 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        ...form,
        table_number: parseInt(form.table_number),
        capacity: parseInt(form.capacity),
      };

      if (editingTable) {
        await api.updateTable(editingTable.id, payload);
        showToast?.('Mesa actualizada');
      } else {
        await api.createTable(payload);
        showToast?.('Mesa configurada');
      }
      setIsModalOpen(false);
      loadTables();
    } catch (err) {
      showToast?.('Error al guardar mesa: ' + err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const changeStatus = async (tbl, newStatus) => {
    try {
      await api.changeTableStatus(tbl.id, newStatus);
      setTables(tables.map(t => t.id === tbl.id ? { ...t, status: newStatus, status_display: newStatus } : t));
      showToast?.(`Mesa #${tbl.table_number} marcada como ${newStatus}`);
      loadTables();
    } catch (err) {
      showToast?.('Error al cambiar estado: ' + err.message, 'error');
    }
  };

  const confirmDelete = (tbl) => {
    setDeletingTable(tbl);
    setIsDeleteOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingTable) return;
    try {
      setIsSubmitting(true);
      await api.deleteTable(deletingTable.id);
      showToast?.('Mesa eliminada');
      setIsDeleteOpen(false);
      loadTables();
    } catch (err) {
      showToast?.('Error al eliminar mesa: ' + err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredTables = tables.filter(t => locationFilter ? t.location === locationFilter : true);

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
            <span className="badge badge-gold">Distribución del Restaurante</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{tables.length} mesas en servicio</span>
          </div>
          <h2 className="font-serif" style={{ fontSize: '1.85rem', fontWeight: 700, marginTop: '0.2rem' }}>
            Plano de Mesas & Zonas Omakase
          </h2>
        </div>

        <button onClick={openCreateModal} className="btn btn-primary">
          <Plus size={18} />
          <span>Configurar Nueva Mesa</span>
        </button>
      </div>

      {/* Filter by Zone */}
      <div className="glass-card" style={{
        padding: '0.85rem 1.25rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        flexWrap: 'wrap',
      }}>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginRight: '0.5rem' }}>
          Zonas:
        </span>
        {[
          { id: '', label: 'Todo el Restaurante' },
          { id: 'BARRA', label: 'Barra Omakase 🍣' },
          { id: 'SALON', label: 'Salón Zen Principal 🎋' },
          { id: 'TERRAZA', label: 'Terraza Bambú 🍃' },
          { id: 'VIP', label: 'Salón Tatami VIP 👑' },
        ].map(zone => (
          <button
            key={zone.id}
            onClick={() => setLocationFilter(zone.id)}
            className={`btn ${locationFilter === zone.id ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem' }}
          >
            {zone.label}
          </button>
        ))}
      </div>

      {/* Tables Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-secondary)' }}>
          Cargando distribución de mesas...
        </div>
      ) : filteredTables.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '3rem 1.5rem', color: 'var(--text-muted)' }}>
          <p className="font-serif" style={{ fontSize: '1.25rem' }}>No hay mesas registradas en esta zona.</p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '1.25rem',
        }}>
          {filteredTables.map(tbl => (
            <div key={tbl.id} className="glass-card" style={{
              padding: '1.4rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              borderTop: `4px solid ${
                tbl.status === 'DISPONIBLE' ? 'var(--emerald)' :
                tbl.status === 'OCUPADA' ? 'var(--crimson)' :
                tbl.status === 'RESERVADA' ? 'var(--gold)' : 'var(--text-muted)'
              }`,
            }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3 className="font-serif" style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      Mesa #{tbl.table_number}
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.15rem' }}>
                      <MapPin size={13} color="var(--gold)" />
                      <span>{tbl.location_display}</span>
                    </div>
                  </div>

                  <span className={`badge ${
                    tbl.status === 'DISPONIBLE' ? 'badge-emerald' :
                    tbl.status === 'OCUPADA' ? 'badge-crimson' :
                    tbl.status === 'RESERVADA' ? 'badge-gold' : 'badge-neutral'
                  }`}>
                    {tbl.status_display}
                  </span>
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  margin: '1rem 0',
                  padding: '0.75rem',
                  background: 'rgba(255, 255, 255, 0.02)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.85rem',
                  color: 'var(--text-secondary)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Users size={16} color="var(--gold)" />
                    <span>Capacidad: <strong>{tbl.capacity} personas</strong></span>
                  </div>
                  {tbl.active_orders_count > 0 && (
                    <span style={{ color: '#fb7185', fontWeight: 600 }}>
                      🔥 Pedido activo
                    </span>
                  )}
                </div>

                {tbl.notes && (
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic', marginBottom: '1rem' }}>
                    "{tbl.notes}"
                  </p>
                )}
              </div>

              {/* Status Switcher & Actions */}
              <div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  marginBottom: '0.85rem',
                  flexWrap: 'wrap'
                }}>
                  {['DISPONIBLE', 'OCUPADA', 'RESERVADA'].map(st => (
                    <button
                      key={st}
                      onClick={() => changeStatus(tbl, st)}
                      disabled={tbl.status === st}
                      className="btn"
                      style={{
                        padding: '0.25rem 0.55rem',
                        fontSize: '0.7rem',
                        background: tbl.status === st ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.03)',
                        borderColor: tbl.status === st ? 'var(--gold)' : 'var(--border-subtle)',
                        color: tbl.status === st ? 'var(--gold)' : 'var(--text-muted)'
                      }}
                    >
                      {st === 'DISPONIBLE' ? 'Libre' : st === 'OCUPADA' ? 'Ocupar' : 'Reservar'}
                    </button>
                  ))}
                </div>

                <div style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '0.4rem',
                  borderTop: '1px solid var(--border-subtle)',
                  paddingTop: '0.75rem'
                }}>
                  <button onClick={() => openEditModal(tbl)} className="btn-icon" title="Editar mesa">
                    <Edit3 size={14} />
                  </button>
                  <button onClick={() => confirmDelete(tbl)} className="btn-icon" style={{ color: '#fb7185' }} title="Eliminar mesa">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Form */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingTable ? "Editar Mesa" : "Nueva Mesa"}
        subtitle="Configuración de ubicación y aforo"
      >
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Número de Mesa *</label>
              <input
                type="number"
                min="1"
                className="form-input"
                value={form.table_number}
                onChange={(e) => setForm({ ...form, table_number: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Capacidad (Comensales) *</label>
              <input
                type="number"
                min="1"
                className="form-input"
                value={form.capacity}
                onChange={(e) => setForm({ ...form, capacity: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Zona del Restaurante *</label>
              <select
                className="form-select"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
              >
                <option value="BARRA">Barra Omakase</option>
                <option value="SALON">Salón Zen Principal</option>
                <option value="TERRAZA">Terraza Bambú</option>
                <option value="VIP">Salón Tatami VIP</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Estado Inicial *</label>
              <select
                className="form-select"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                <option value="DISPONIBLE">Disponible</option>
                <option value="OCUPADA">Ocupada</option>
                <option value="RESERVADA">Reservada</option>
                <option value="MANTENIMIENTO">En Mantenimiento</option>
              </select>
            </div>

            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label">Notas Adicionales</label>
              <input
                type="text"
                placeholder="ej. Frente a la vitrina de corte itamae, vistas al estanque koi..."
                className="form-input"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
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
              {isSubmitting ? "Guardando..." : (editingTable ? "Actualizar Mesa" : "Crear Mesa")}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Eliminar Mesa"
        message={`¿Estás seguro de eliminar la Mesa #${deletingTable?.table_number}?`}
        isLoading={isSubmitting}
      />
    </div>
  );
}


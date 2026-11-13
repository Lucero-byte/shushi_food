import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import Modal from '../components/Modal';
import ConfirmModal from '../components/ConfirmModal';
import { 
  Plus, 
  Edit3, 
  Trash2, 
  Boxes, 
  AlertTriangle, 
  CheckCircle, 
  ArrowUpRight, 
  ArrowDownRight, 
  Search,
  DollarSign
} from 'lucide-react';

export default function InventoryView({ showToast }) {
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterLowStock, setFilterLowStock] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Stock Adjust Modal State
  const [isAdjustOpen, setIsAdjustOpen] = useState(false);
  const [adjustingItem, setAdjustingItem] = useState(null);
  const [adjustDelta, setAdjustDelta] = useState('');

  // Delete State
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingIngredient, setDeletingIngredient] = useState(null);

  const initialForm = {
    name: '',
    unit: 'kg',
    stock_quantity: '1.00',
    minimum_stock: '2.00',
    cost_price: '0.00',
    is_allergen: false,
    allergen_info: '',
  };
  const [form, setForm] = useState(initialForm);

  const loadIngredients = async () => {
    try {
      setLoading(true);
      const data = await api.getIngredients();
      setIngredients(data);
    } catch (err) {
      showToast?.('Error al cargar inventario: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIngredients();
  }, []);

  const openCreateModal = () => {
    setEditingIngredient(null);
    setForm(initialForm);
    setIsModalOpen(true);
  };

  const openEditModal = (ing) => {
    setEditingIngredient(ing);
    setForm({
      name: ing.name,
      unit: ing.unit,
      stock_quantity: ing.stock_quantity,
      minimum_stock: ing.minimum_stock,
      cost_price: ing.cost_price,
      is_allergen: ing.is_allergen,
      allergen_info: ing.allergen_info || '',
    });
    setIsModalOpen(true);
  };

  const openAdjustModal = (ing) => {
    setAdjustingItem(ing);
    setAdjustDelta('');
    setIsAdjustOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.unit) {
      showToast?.('Nombre y unidad son obligatorios', 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        ...form,
        stock_quantity: parseFloat(form.stock_quantity) || 0,
        minimum_stock: parseFloat(form.minimum_stock) || 0,
        cost_price: parseFloat(form.cost_price) || 0,
      };

      if (editingIngredient) {
        await api.updateIngredient(editingIngredient.id, payload);
        showToast?.('Ingrediente actualizado');
      } else {
        await api.createIngredient(payload);
        showToast?.('Insumo añadido al almacén');
      }
      setIsModalOpen(false);
      loadIngredients();
    } catch (err) {
      showToast?.('Error al guardar insumo: ' + err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAdjustStock = async (e) => {
    e.preventDefault();
    if (!adjustingItem || !adjustDelta) return;

    try {
      setIsSubmitting(true);
      await api.adjustStock(adjustingItem.id, parseFloat(adjustDelta));
      showToast?.(`Stock de ${adjustingItem.name} ajustado`);
      setIsAdjustOpen(false);
      loadIngredients();
    } catch (err) {
      showToast?.('Error al ajustar stock: ' + err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = (ing) => {
    setDeletingIngredient(ing);
    setIsDeleteOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingIngredient) return;
    try {
      setIsSubmitting(true);
      await api.deleteIngredient(deletingIngredient.id);
      showToast?.('Insumo eliminado del almacén');
      setIsDeleteOpen(false);
      loadIngredients();
    } catch (err) {
      showToast?.('Error al eliminar ingrediente: ' + err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredIngredients = ingredients.filter(ing => {
    const matchesSearch = ing.name.toLowerCase().includes(search.toLowerCase());
    const matchesLowStock = filterLowStock ? ing.is_low_stock : true;
    return matchesSearch && matchesLowStock;
  });

  const lowStockCount = ingredients.filter(i => i.is_low_stock).length;

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
            <span className="badge badge-gold">Almacén de Cocina</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{ingredients.length} insumos registrados</span>
          </div>
          <h2 className="font-serif" style={{ fontSize: '1.85rem', fontWeight: 700, marginTop: '0.2rem' }}>
            Inventario de Insumos Nobles
          </h2>
        </div>

        <button onClick={openCreateModal} className="btn btn-primary">
          <Plus size={18} />
          <span>Añadir Insumo</span>
        </button>
      </div>

      {/* Filter and Low Stock Alert Pill */}
      <div className="glass-card" style={{
        padding: '0.85rem 1.25rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', minWidth: '240px' }}>
          <Search size={16} color="var(--text-muted)" />
          <input
            type="text"
            placeholder="Buscar insumo (ej. Salmón, Arroz, Wasabi)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-primary)',
              width: '100%',
              fontSize: '0.85rem',
              outline: 'none',
            }}
          />
        </div>

        <button
          onClick={() => setFilterLowStock(!filterLowStock)}
          className={`btn ${filterLowStock ? 'btn-crimson' : 'btn-secondary'}`}
          style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem' }}
        >
          <AlertTriangle size={15} />
          <span>Solo en alerta de stock bajo ({lowStockCount})</span>
        </button>
      </div>

      {/* Table */}
      <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Insumo</th>
                <th>Stock Actual</th>
                <th>Mínimo Alerta</th>
                <th>Costo Unitario</th>
                <th>Alérgeno</th>
                <th>Estado</th>
                <th style={{ textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    Cargando inventario...
                  </td>
                </tr>
              ) : filteredIngredients.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    No se encontraron insumos con este criterio.
                  </td>
                </tr>
              ) : (
                filteredIngredients.map(ing => (
                  <tr key={ing.id} style={{ background: ing.is_low_stock ? 'rgba(225, 29, 72, 0.04)' : 'transparent' }}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <div style={{
                          padding: '0.35rem',
                          borderRadius: '6px',
                          background: 'rgba(212, 175, 55, 0.1)',
                          color: 'var(--gold)'
                        }}>
                          <Boxes size={16} />
                        </div>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                          {ing.name}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span style={{
                        fontSize: '1.05rem',
                        fontWeight: 700,
                        color: ing.is_low_stock ? '#fb7185' : 'var(--text-primary)',
                        fontFamily: 'var(--font-serif)'
                      }}>
                        {ing.stock_quantity} {ing.unit}
                      </span>
                    </td>
                    <td>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        {ing.minimum_stock} {ing.unit}
                      </span>
                    </td>
                    <td>
                      <span style={{ color: 'var(--gold)', fontWeight: 600, fontSize: '0.9rem' }}>
                        ${ing.cost_price} / {ing.unit}
                      </span>
                    </td>
                    <td>
                      {ing.is_allergen ? (
                        <span className="badge badge-crimson">
                          {ing.allergen_info || 'Alérgeno'}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>No</span>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${ing.is_low_stock ? 'badge-crimson' : 'badge-emerald'}`}>
                        {ing.is_low_stock ? '⚠️ Stock Bajo' : '✓ Óptimo'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                        <button
                          onClick={() => openAdjustModal(ing)}
                          className="btn btn-secondary"
                          style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                          title="Ajustar stock (+/-)"
                        >
                          Ajustar
                        </button>
                        <button onClick={() => openEditModal(ing)} className="btn-icon" title="Editar insumo">
                          <Edit3 size={15} />
                        </button>
                        <button onClick={() => confirmDelete(ing)} className="btn-icon" style={{ color: '#fb7185' }} title="Eliminar insumo">
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

      {/* Modal Form (Create / Edit) */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingIngredient ? "Editar Insumo" : "Nuevo Insumo de Cocina"}
        subtitle="Control de existencias y costos de materia prima"
      >
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label">Nombre del Insumo *</label>
              <input
                type="text"
                className="form-input"
                placeholder="ej. Salmón Noruego Fresco (Sake)"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Unidad de Medida *</label>
              <select
                className="form-select"
                value={form.unit}
                onChange={(e) => setForm({ ...form, unit: e.target.value })}
              >
                <option value="kg">Kilogramos (kg)</option>
                <option value="g">Gramos (g)</option>
                <option value="l">Litros (L)</option>
                <option value="ml">Mililitros (ml)</option>
                <option value="und">Unidades (und)</option>
                <option value="porc">Porciones</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Costo Unitario ($) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="form-input"
                placeholder="22.50"
                value={form.cost_price}
                onChange={(e) => setForm({ ...form, cost_price: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Cantidad Actual en Stock *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="form-input"
                value={form.stock_quantity}
                onChange={(e) => setForm({ ...form, stock_quantity: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Stock Mínimo de Alerta *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="form-input"
                value={form.minimum_stock}
                onChange={(e) => setForm({ ...form, minimum_stock: e.target.value })}
                required
              />
            </div>

            <div style={{ gridColumn: 'span 2', padding: '0.4rem 0' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem' }}>
                <input
                  type="checkbox"
                  checked={form.is_allergen}
                  onChange={(e) => setForm({ ...form, is_allergen: e.target.checked })}
                />
                <span>Contiene alérgenos reconocidos</span>
              </label>
            </div>

            {form.is_allergen && (
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label className="form-label">Tipo de Alérgeno (Pescado, Marisco, Soja, Sésamo, etc.)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="ej. Pescado noble"
                  value={form.allergen_info}
                  onChange={(e) => setForm({ ...form, allergen_info: e.target.value })}
                />
              </div>
            )}
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
              {isSubmitting ? "Guardando..." : (editingIngredient ? "Actualizar Insumo" : "Guardar Insumo")}
            </button>
          </div>
        </form>
      </Modal>

      {/* Adjust Stock Modal */}
      <Modal
        isOpen={isAdjustOpen}
        onClose={() => setIsAdjustOpen(false)}
        title="Ajuste de Existencias"
        subtitle={`Modificar stock para: ${adjustingItem?.name}`}
        maxWidth="440px"
      >
        <form onSubmit={handleAdjustStock}>
          <div style={{
            padding: '1rem',
            background: 'rgba(255, 255, 255, 0.02)',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1.25rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Stock actual:</span>
            <span style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--gold)' }}>
              {adjustingItem?.stock_quantity} {adjustingItem?.unit}
            </span>
          </div>

          <div className="form-group">
            <label className="form-label">Cantidad a Modificar (+ o -)</label>
            <input
              type="number"
              step="0.01"
              placeholder="ej. +5 para reabastecer o -2 para merma"
              className="form-input"
              value={adjustDelta}
              onChange={(e) => setAdjustDelta(e.target.value)}
              required
              autoFocus
            />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Usa un número positivo para entrada de mercancía, o negativo para bajas o consumo.
            </span>
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
            <button type="button" className="btn btn-secondary" onClick={() => setIsAdjustOpen(false)}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? "Aplicando..." : "Confirmar Ajuste"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Eliminar Insumo"
        message={`¿Estás seguro de eliminar el insumo "${deletingIngredient?.name}" del almacén?`}
        isLoading={isSubmitting}
      />
    </div>
  );
}


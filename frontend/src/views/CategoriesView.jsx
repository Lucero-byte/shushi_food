import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import Modal from '../components/Modal';
import ConfirmModal from '../components/ConfirmModal';
import { Plus, Edit3, Trash2, Layers, CheckCircle2, XCircle } from 'lucide-react';

export default function CategoriesView({ showToast }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete State
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingCategory, setDeletingCategory] = useState(null);

  const initialForm = {
    name: '',
    slug: '',
    description: '',
    icon: 'Utensils',
    display_order: 1,
    is_active: true,
  };
  const [form, setForm] = useState(initialForm);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const data = await api.getCategories();
      setCategories(data);
    } catch (err) {
      showToast?.('Error al cargar categorías: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const openCreateModal = () => {
    setEditingCategory(null);
    setForm({
      ...initialForm,
      display_order: categories.length + 1,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (cat) => {
    setEditingCategory(cat);
    setForm({
      name: cat.name,
      slug: cat.slug,
      description: cat.description || '',
      icon: cat.icon || 'Utensils',
      display_order: cat.display_order,
      is_active: cat.is_active,
    });
    setIsModalOpen(true);
  };

  const handleNameChange = (name) => {
    const slug = name.toLowerCase().trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
    setForm(prev => ({
      ...prev,
      name,
      slug: editingCategory ? prev.slug : slug,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.slug) {
      showToast?.('Nombre y Slug son obligatorios', 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      if (editingCategory) {
        await api.updateCategory(editingCategory.id, form);
        showToast?.('Categoría actualizada exitosamente');
      } else {
        await api.createCategory(form);
        showToast?.('Categoría creada exitosamente');
      }
      setIsModalOpen(false);
      loadCategories();
    } catch (err) {
      showToast?.('Error al guardar categoría: ' + err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = (cat) => {
    setDeletingCategory(cat);
    setIsDeleteOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingCategory) return;
    try {
      setIsSubmitting(true);
      await api.deleteCategory(deletingCategory.id);
      showToast?.('Categoría eliminada');
      setIsDeleteOpen(false);
      loadCategories();
    } catch (err) {
      showToast?.('Error al eliminar categoría: ' + err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

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
            <span className="badge badge-gold">Estructura del Menú</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{categories.length} categorías activas</span>
          </div>
          <h2 className="font-serif" style={{ fontSize: '1.85rem', fontWeight: 700, marginTop: '0.2rem' }}>
            Categorías Gastronómicas
          </h2>
        </div>

        <button onClick={openCreateModal} className="btn btn-primary">
          <Plus size={18} />
          <span>Añadir Categoría</span>
        </button>
      </div>

      {/* Categories Table */}
      <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '80px' }}>Orden</th>
                <th>Nombre</th>
                <th>Slug</th>
                <th>Descripción</th>
                <th>Platillos</th>
                <th>Estado</th>
                <th style={{ textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    Cargando categorías...
                  </td>
                </tr>
              ) : categories.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    No se han registrado categorías aún.
                  </td>
                </tr>
              ) : (
                categories.map((cat) => (
                  <tr key={cat.id}>
                    <td>
                      <span className="badge badge-neutral" style={{ fontWeight: 700 }}>
                        #{cat.display_order}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <div style={{
                          padding: '0.35rem',
                          borderRadius: '6px',
                          background: 'rgba(212, 175, 55, 0.1)',
                          color: 'var(--gold)'
                        }}>
                          <Layers size={16} />
                        </div>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                          {cat.name}
                        </span>
                      </div>
                    </td>
                    <td>
                      <code style={{ fontSize: '0.8rem', color: 'var(--text-gold)', background: 'rgba(0,0,0,0.3)', padding: '0.2rem 0.4rem', borderRadius: '4px' }}>
                        {cat.slug}
                      </code>
                    </td>
                    <td style={{ color: 'var(--text-secondary)', maxWidth: '320px', fontSize: '0.825rem' }}>
                      {cat.description || "—"}
                    </td>
                    <td>
                      <span className="badge badge-gold">
                        {cat.products_count} platillos
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${cat.is_active ? 'badge-emerald' : 'badge-crimson'}`}>
                        {cat.is_active ? 'Activa' : 'Oculta'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                        <button
                          onClick={() => openEditModal(cat)}
                          className="btn-icon"
                          title="Editar categoría"
                        >
                          <Edit3 size={15} />
                        </button>
                        <button
                          onClick={() => confirmDelete(cat)}
                          className="btn-icon"
                          style={{ color: '#fb7185' }}
                          title="Eliminar categoría"
                        >
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
        title={editingCategory ? "Editar Categoría" : "Nueva Categoría"}
        subtitle="Organización de los tiempos y platillos del menú"
      >
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Nombre de la Categoría *</label>
              <input
                type="text"
                className="form-input"
                placeholder="ej. Nigiri Clásico y Aburi"
                value={form.name}
                onChange={(e) => handleNameChange(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Slug / Identificador *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="nigiri-aburi"
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Orden de Visualización</label>
                <input
                  type="number"
                  min="1"
                  className="form-input"
                  value={form.display_order}
                  onChange={(e) => setForm({ ...form, display_order: parseInt(e.target.value) || 1 })}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Descripción Gastronómica</label>
              <textarea
                className="form-textarea"
                placeholder="Breve reseña sobre los ingredientes o técnicas de esta sección..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem' }}>
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
              />
              <span>Categoría activa y visible en la carta</span>
            </label>
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
              {isSubmitting ? "Guardando..." : (editingCategory ? "Actualizar" : "Crear Categoría")}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Eliminar Categoría"
        message={`¿Estás seguro de eliminar la categoría "${deletingCategory?.name}"? Se desvinculará de sus platillos.`}
        isLoading={isSubmitting}
      />
    </div>
  );
}


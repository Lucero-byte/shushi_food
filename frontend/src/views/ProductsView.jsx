import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import Modal from '../components/Modal';
import ConfirmModal from '../components/ConfirmModal';
import { 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  Sparkles, 
  Clock, 
  Check, 
  X, 
  Flame,
  Filter,
  DollarSign
} from 'lucide-react';

export default function ProductsView({ showToast }) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete State
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingProduct, setDeletingProduct] = useState(null);

  // Form State
  const initialForm = {
    name: '',
    category: '',
    description: '',
    price: '',
    pieces_count: 1,
    preparation_time: 12,
    calories: '',
    is_available: true,
    is_chef_special: false,
    image_url: '',
  };
  const [form, setForm] = useState(initialForm);

  const loadData = async () => {
    try {
      setLoading(true);
      const [prodsData, catsData] = await Promise.all([
        api.getProducts(),
        api.getCategories(),
      ]);
      setProducts(prodsData);
      setCategories(catsData);
      if (catsData.length > 0 && !form.category) {
        setForm(prev => ({ ...prev, category: catsData[0].id }));
      }
    } catch (err) {
      showToast?.('Error al cargar platillos: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreateModal = () => {
    setEditingProduct(null);
    setForm({
      ...initialForm,
      category: categories.length > 0 ? categories[0].id : '',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    setForm({
      name: product.name,
      category: product.category,
      description: product.description || '',
      price: product.price,
      pieces_count: product.pieces_count,
      preparation_time: product.preparation_time,
      calories: product.calories || '',
      is_available: product.is_available,
      is_chef_special: product.is_chef_special,
      image_url: product.image_url || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.category || !form.price) {
      showToast?.('Por favor completa los campos requeridos', 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        ...form,
        price: parseFloat(form.price),
        pieces_count: parseInt(form.pieces_count) || 1,
        preparation_time: parseInt(form.preparation_time) || 10,
        calories: form.calories ? parseInt(form.calories) : null,
      };

      if (editingProduct) {
        await api.updateProduct(editingProduct.id, payload);
        showToast?.('Platillo actualizado exitosamente');
      } else {
        await api.createProduct(payload);
        showToast?.('Platillo añadido a la carta');
      }
      setIsModalOpen(false);
      loadData();
    } catch (err) {
      showToast?.('Error al guardar platillo: ' + err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = (product) => {
    setDeletingProduct(product);
    setIsDeleteOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingProduct) return;
    try {
      setIsSubmitting(true);
      await api.deleteProduct(deletingProduct.id);
      showToast?.('Platillo eliminado de la carta');
      setIsDeleteOpen(false);
      loadData();
    } catch (err) {
      showToast?.('Error al eliminar platillo: ' + err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleAvailability = async (product) => {
    try {
      await api.toggleProductAvailability(product.id);
      setProducts(products.map(p => p.id === product.id ? { ...p, is_available: !p.is_available } : p));
      showToast?.(`${product.name} ahora está ${!product.is_available ? 'Disponible' : 'No disponible'}`);
    } catch (err) {
      showToast?.('Error al cambiar disponibilidad: ' + err.message, 'error');
    }
  };

  // Filter products
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory ? String(p.category) === String(selectedCategory) : true;
    return matchesSearch && matchesCategory;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header and Actions */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className="badge badge-gold">Carta Omakase</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{products.length} platillos en total</span>
          </div>
          <h2 className="font-serif" style={{ fontSize: '1.85rem', fontWeight: 700, marginTop: '0.2rem' }}>
            Platillos & Piezas de Sushi
          </h2>
        </div>

        <button onClick={openCreateModal} className="btn btn-primary">
          <Plus size={18} />
          <span>Añadir Nuevo Platillo</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-card" style={{
        padding: '0.85rem 1.25rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: '240px' }}>
          <Search size={18} color="var(--text-muted)" />
          <input
            type="text"
            placeholder="Buscar por nombre, ingredientes o descripción..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
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

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Filter size={16} color="var(--text-muted)" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="form-select"
            style={{ width: 'auto', padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
          >
            <option value="">Todas las categorías ({categories.length})</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Products Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-secondary)' }}>
          Cargando platillos sushi...
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '3rem 1.5rem', color: 'var(--text-muted)' }}>
          <p className="font-serif" style={{ fontSize: '1.25rem' }}>No se encontraron platillos con los filtros actuales.</p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '1.25rem',
        }}>
          {filteredProducts.map((p) => (
            <div key={p.id} className="glass-card" style={{
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              opacity: p.is_available ? 1 : 0.65,
              position: 'relative'
            }}>
              {/* Product Image */}
              <div style={{
                height: '180px',
                width: '100%',
                background: '#0d131a',
                position: 'relative',
                overflow: 'hidden',
              }}>
                {p.image_url ? (
                  <img
                    src={p.image_url}
                    alt={p.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                ) : (
                  <div style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--text-muted)'
                  }}>
                    Sin imagen disponible
                  </div>
                )}
                {/* Floating Badges */}
                <div style={{
                  position: 'absolute',
                  top: '10px',
                  left: '10px',
                  display: 'flex',
                  gap: '0.4rem',
                  flexWrap: 'wrap'
                }}>
                  <span className="badge badge-neutral" style={{ backdropFilter: 'blur(8px)', background: 'rgba(10, 14, 19, 0.75)' }}>
                    {p.category_name}
                  </span>
                  {p.is_chef_special && (
                    <span className="badge badge-gold" style={{ backdropFilter: 'blur(8px)', background: 'rgba(212, 175, 55, 0.25)' }}>
                      <Sparkles size={11} /> Chef's Omakase
                    </span>
                  )}
                </div>

                <div style={{ position: 'absolute', top: '10px', right: '10px' }}>
                  <button
                    onClick={() => toggleAvailability(p)}
                    className={`badge ${p.is_available ? 'badge-emerald' : 'badge-crimson'}`}
                    style={{ cursor: 'pointer', border: 'none' }}
                    title="Alternar disponibilidad"
                  >
                    {p.is_available ? '✓ Disponible' : '✕ Agotado'}
                  </button>
                </div>
              </div>

              {/* Product Details */}
              <div style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '0.5rem' }}>
                  <h3 className="font-serif" style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {p.name}
                  </h3>
                  <div style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--gold)', fontFamily: 'var(--font-serif)', whiteSpace: 'nowrap' }}>
                    ${p.price}
                  </div>
                </div>

                <p style={{
                  fontSize: '0.825rem',
                  color: 'var(--text-secondary)',
                  marginTop: '0.4rem',
                  lineHeight: 1.5,
                  flex: 1,
                }}>
                  {p.description || "Delicadeza culinaria de la carta japonesa."}
                </p>

                {/* Meta Attributes */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.9rem',
                  fontSize: '0.75rem',
                  color: 'var(--text-muted)',
                  marginTop: '0.85rem',
                  paddingTop: '0.75rem',
                  borderTop: '1px solid var(--border-subtle)',
                }}>
                  <span>🍱 {p.pieces_count} {p.pieces_count === 1 ? 'pieza' : 'piezas'}</span>
                  <span>⏱ {p.preparation_time} min</span>
                  {p.calories && <span>🔥 {p.calories} kcal</span>}
                </div>

                {/* Actions Footer */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  gap: '0.5rem',
                  marginTop: '0.85rem',
                }}>
                  <button
                    onClick={() => openEditModal(p)}
                    className="btn btn-secondary"
                    style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem' }}
                  >
                    <Edit3 size={14} /> Editar
                  </button>
                  <button
                    onClick={() => confirmDelete(p)}
                    className="btn btn-crimson"
                    style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem' }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Create / Edit Product */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingProduct ? "Editar Platillo" : "Nuevo Platillo Sushi"}
        subtitle="Configuración gastronómica de la carta"
      >
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label">Nombre del Platillo *</label>
              <input
                type="text"
                className="form-input"
                placeholder="ej. Nigiri Salmón Aburi Trufado"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Categoría *</label>
              <select
                className="form-select"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                required
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Precio de Venta ($) *</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                className="form-input"
                placeholder="14.50"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Número de Piezas</label>
              <input
                type="number"
                min="1"
                className="form-input"
                value={form.pieces_count}
                onChange={(e) => setForm({ ...form, pieces_count: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Tiempo de Prep. (min)</label>
              <input
                type="number"
                min="1"
                className="form-input"
                value={form.preparation_time}
                onChange={(e) => setForm({ ...form, preparation_time: e.target.value })}
              />
            </div>

            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label">URL de Imagen (Unsplash u otra)</label>
              <input
                type="url"
                className="form-input"
                placeholder="https://images.unsplash.com/..."
                value={form.image_url}
                onChange={(e) => setForm({ ...form, image_url: e.target.value })}
              />
            </div>

            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label">Descripción Gastronómica / Notas del Itamae</label>
              <textarea
                className="form-textarea"
                placeholder="Detalla los cortes de pescado, marinados, trufa o acompañamientos..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>

            <div style={{ display: 'flex', gap: '1.5rem', gridColumn: 'span 2', padding: '0.5rem 0' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem' }}>
                <input
                  type="checkbox"
                  checked={form.is_available}
                  onChange={(e) => setForm({ ...form, is_available: e.target.checked })}
                />
                <span>Disponible en carta</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--text-gold)' }}>
                <input
                  type="checkbox"
                  checked={form.is_chef_special}
                  onChange={(e) => setForm({ ...form, is_chef_special: e.target.checked })}
                />
                <span>★ Especialidad del Chef (Omakase)</span>
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
              {isSubmitting ? "Guardando..." : (editingProduct ? "Actualizar Platillo" : "Guardar Platillo")}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Eliminar Platillo"
        message={`¿Estás seguro de que deseas retirar "${deletingProduct?.name}" de la carta de sushi? Esta acción no se puede deshacer.`}
        isLoading={isSubmitting}
      />
    </div>
  );
}


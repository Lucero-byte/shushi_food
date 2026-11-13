import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import Modal from '../components/Modal';
import ConfirmModal from '../components/ConfirmModal';
import { 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  FileText, 
  Flame, 
  CheckCircle, 
  Clock, 
  CreditCard, 
  Receipt,
  User,
  UtensilsCrossed,
  Printer
} from 'lucide-react';

export default function OrdersView({ showToast }) {
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [tables, setTables] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');

  // Ticket modal
  const [viewingOrder, setViewingOrder] = useState(null);

  // New Order Modal
  const [isNewOrderOpen, setIsNewOrderOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete Modal
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingOrder, setDeletingOrder] = useState(null);

  // New Order Form
  const initialOrderForm = {
    customer: '',
    table: '',
    order_type: 'DINE_IN',
    payment_method: 'TARJETA',
    notes: '',
    items: [], // [{ product_id, quantity, special_notes, price, name }]
  };
  const [orderForm, setOrderForm] = useState(initialOrderForm);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [itemQty, setItemQty] = useState(1);
  const [itemNotes, setItemNotes] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [ordData, custData, tblData, prodData] = await Promise.all([
        api.getOrders(),
        api.getCustomers(),
        api.getTables(),
        api.getProducts(),
      ]);
      setOrders(ordData);
      setCustomers(custData);
      setTables(tblData);
      setProducts(prodData);
    } catch (err) {
      showToast?.('Error al cargar pedidos: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openNewOrderModal = () => {
    setOrderForm(initialOrderForm);
    setSelectedProductId(products.length > 0 ? products[0].id : '');
    setItemQty(1);
    setItemNotes('');
    setIsNewOrderOpen(true);
  };

  const addItemToOrder = () => {
    if (!selectedProductId) return;
    const prod = products.find(p => String(p.id) === String(selectedProductId));
    if (!prod) return;

    const existingIndex = orderForm.items.findIndex(item => item.product_id === prod.id && item.special_notes === itemNotes);
    if (existingIndex > -1) {
      const updated = [...orderForm.items];
      updated[existingIndex].quantity += itemQty;
      setOrderForm({ ...orderForm, items: updated });
    } else {
      setOrderForm({
        ...orderForm,
        items: [
          ...orderForm.items,
          {
            product_id: prod.id,
            name: prod.name,
            price: parseFloat(prod.price),
            quantity: itemQty,
            special_notes: itemNotes,
          }
        ]
      });
    }

    setItemQty(1);
    setItemNotes('');
  };

  const removeItemFromOrder = (index) => {
    const updated = orderForm.items.filter((_, i) => i !== index);
    setOrderForm({ ...orderForm, items: updated });
  };

  const calculatedSubtotal = orderForm.items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const calculatedTax = calculatedSubtotal * 0.10;
  const calculatedTotal = calculatedSubtotal + calculatedTax;

  const handleCreateOrder = async (e) => {
    e.preventDefault();
    if (orderForm.items.length === 0) {
      showToast?.('Agrega al menos un platillo sushi al pedido', 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        customer: orderForm.customer ? parseInt(orderForm.customer) : null,
        table: orderForm.table ? parseInt(orderForm.table) : null,
        order_type: orderForm.order_type,
        payment_method: orderForm.payment_method,
        notes: orderForm.notes,
        status: 'PENDIENTE',
        items_payload: orderForm.items.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity,
          special_notes: item.special_notes,
        }))
      };

      await api.createOrder(payload);
      showToast?.('Pedido creado exitosamente');
      setIsNewOrderOpen(false);
      loadData();
    } catch (err) {
      showToast?.('Error al crear pedido: ' + err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const changeStatus = async (orderId, newStatus) => {
    try {
      await api.changeOrderStatus(orderId, newStatus);
      showToast?.(`Pedido actualizado a: ${newStatus}`);
      loadData();
    } catch (err) {
      showToast?.('Error al actualizar estado: ' + err.message, 'error');
    }
  };

  const confirmDelete = (order) => {
    setDeletingOrder(order);
    setIsDeleteOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingOrder) return;
    try {
      setIsSubmitting(true);
      await api.deleteOrder(deletingOrder.id);
      showToast?.('Pedido eliminado');
      setIsDeleteOpen(false);
      loadData();
    } catch (err) {
      showToast?.('Error al eliminar pedido: ' + err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredOrders = orders.filter(o => {
    const matchesStatus = statusFilter ? o.status === statusFilter : true;
    const matchesSearch = o.order_code.toLowerCase().includes(search.toLowerCase()) ||
                          o.customer_name?.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
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
            <span className="badge badge-gold">Cocina & Pedidos</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{orders.length} pedidos registrados</span>
          </div>
          <h2 className="font-serif" style={{ fontSize: '1.85rem', fontWeight: 700, marginTop: '0.2rem' }}>
            Control de Pedidos del Restaurante
          </h2>
        </div>

        <button onClick={openNewOrderModal} className="btn btn-primary">
          <Plus size={18} />
          <span>Nuevo Pedido</span>
        </button>
      </div>

      {/* Filter Tabs & Search */}
      <div className="glass-card" style={{
        padding: '0.85rem 1.25rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          {[
            { id: '', label: 'Todas' },
            { id: 'PENDIENTE', label: 'Pendientes' },
            { id: 'COCINA', label: 'En Cocina 🔥' },
            { id: 'SERVIDO', label: 'Servidas' },
            { id: 'PAGADO', label: 'Pagadas ✓' },
            { id: 'CANCELADO', label: 'Canceladas' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`btn ${statusFilter === tab.id ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', minWidth: '220px' }}>
          <Search size={16} color="var(--text-muted)" />
          <input
            type="text"
            placeholder="Buscar por código o cliente..."
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
      </div>

      {/* Orders List Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-secondary)' }}>
          Cargando pedidos...
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '3rem 1.5rem', color: 'var(--text-muted)' }}>
          <p className="font-serif" style={{ fontSize: '1.25rem' }}>No hay pedidos que coincidan con la búsqueda.</p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
          gap: '1.25rem',
        }}>
          {filteredOrders.map(ord => (
            <div key={ord.id} className="glass-card" style={{
              display: 'flex',
              flexDirection: 'column',
              padding: '1.35rem',
              borderLeft: `4px solid ${
                ord.status === 'COCINA' ? '#fb7185' :
                ord.status === 'SERVIDO' ? '#38bdf8' :
                ord.status === 'PAGADO' ? '#34d399' :
                ord.status === 'CANCELADO' ? '#64748b' : 'var(--gold)'
              }`,
            }}>
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className="font-serif" style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {ord.order_code}
                    </span>
                    <span className={`badge ${
                      ord.status === 'PAGADO' ? 'badge-emerald' :
                      ord.status === 'COCINA' ? 'badge-crimson' :
                      ord.status === 'SERVIDO' ? 'badge-sky' :
                      ord.status === 'CANCELADO' ? 'badge-neutral' : 'badge-amber'
                    }`}>
                      {ord.status_display}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <User size={13} /> {ord.customer_name}
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--gold)', fontFamily: 'var(--font-serif)' }}>
                    ${ord.total_amount}
                  </div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    {ord.payment_method}
                  </span>
                </div>
              </div>

              {/* Table / Location Info */}
              <div style={{
                margin: '0.9rem 0',
                padding: '0.65rem 0.85rem',
                background: 'rgba(255, 255, 255, 0.02)',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.8rem',
                color: 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <UtensilsCrossed size={14} color="var(--gold)" />
                  <span>{ord.table_number ? `Mesa #${ord.table_number} (${ord.table_location})` : ord.order_type_display}</span>
                </div>
                <span>{new Date(ord.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>

              {/* Items summary */}
              <div style={{ flex: 1, marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                  Detalle del Sushi ({ord.items?.length || 0} ítems)
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', maxHeight: '120px', overflowY: 'auto' }}>
                  {ord.items?.map((it, idx) => (
                    <div key={idx} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '0.825rem',
                      color: 'var(--text-secondary)',
                    }}>
                      <span><strong>{it.quantity}x</strong> {it.product_name}</span>
                      <span>${it.subtotal}</span>
                    </div>
                  ))}
                </div>
                {ord.notes && (
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-gold)', fontStyle: 'italic', marginTop: '0.5rem' }}>
                    Nota: "{ord.notes}"
                  </p>
                )}
              </div>

              {/* Workflow Actions */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '0.5rem',
                paddingTop: '0.85rem',
                borderTop: '1px solid var(--border-subtle)',
                flexWrap: 'wrap',
              }}>
                <div style={{ display: 'flex', gap: '0.35rem' }}>
                  {ord.status === 'PENDIENTE' && (
                    <button
                      onClick={() => changeStatus(ord.id, 'COCINA')}
                      className="btn btn-crimson"
                      style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
                    >
                      <Flame size={13} /> A Cocina
                    </button>
                  )}
                  {ord.status === 'COCINA' && (
                    <button
                      onClick={() => changeStatus(ord.id, 'SERVIDO')}
                      className="btn btn-secondary"
                      style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem', borderColor: '#38bdf8', color: '#38bdf8' }}
                    >
                      <CheckCircle size={13} /> Servido
                    </button>
                  )}
                  {ord.status === 'SERVIDO' && (
                    <button
                      onClick={() => changeStatus(ord.id, 'PAGADO')}
                      className="btn btn-emerald"
                      style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
                    >
                      <CreditCard size={13} /> Cobrar
                    </button>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '0.35rem' }}>
                  <button
                    onClick={() => setViewingOrder(ord)}
                    className="btn-icon"
                    title="Ver ticket detallado"
                  >
                    <Receipt size={15} />
                  </button>
                  <button
                    onClick={() => confirmDelete(ord)}
                    className="btn-icon"
                    style={{ color: '#fb7185' }}
                    title="Eliminar pedido"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal New Order */}
      <Modal
        isOpen={isNewOrderOpen}
        onClose={() => setIsNewOrderOpen(false)}
        title="Crear Nuevo Pedido"
        subtitle="Registra el pedido para mesa o servicio de takeaway"
        maxWidth="720px"
      >
        <form onSubmit={handleCreateOrder}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
            <div className="form-group">
              <label className="form-label">Cliente</label>
              <select
                className="form-select"
                value={orderForm.customer}
                onChange={(e) => setOrderForm({ ...orderForm, customer: e.target.value })}
              >
                <option value="">Cliente Ocasional / General</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.full_name} {c.is_vip ? '★ [VIP]' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Mesa Asignada</label>
              <select
                className="form-select"
                value={orderForm.table}
                onChange={(e) => setOrderForm({ ...orderForm, table: e.target.value })}
              >
                <option value="">Sin mesa (Para llevar / Delivery)</option>
                {tables.map(t => (
                  <option key={t.id} value={t.id}>
                    Mesa #{t.table_number} ({t.location_display}) - {t.status_display}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Tipo de Pedido</label>
              <select
                className="form-select"
                value={orderForm.order_type}
                onChange={(e) => setOrderForm({ ...orderForm, order_type: e.target.value })}
              >
                <option value="DINE_IN">En Salón / Barra</option>
                <option value="TAKEAWAY">Para Llevar (Takeaway)</option>
                <option value="DELIVERY">Entrega a Domicilio</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Método de Pago</label>
              <select
                className="form-select"
                value={orderForm.payment_method}
                onChange={(e) => setOrderForm({ ...orderForm, payment_method: e.target.value })}
              >
                <option value="TARJETA">Tarjeta Crédito / Débito</option>
                <option value="EFECTIVO">Efectivo</option>
                <option value="TRANSFERENCIA">Transferencia</option>
              </select>
            </div>
          </div>

          {/* Item Selector Box */}
          <div style={{
            padding: '1rem',
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid var(--border-gold)',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1.25rem'
          }}>
            <h4 className="font-serif" style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--gold)', marginBottom: '0.75rem' }}>
              Agregar Platillos de Sushi
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr auto', gap: '0.75rem', alignItems: 'end' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Platillo</label>
                <select
                  className="form-select"
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                >
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} - ${p.price}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Cantidad</label>
                <input
                  type="number"
                  min="1"
                  className="form-input"
                  value={itemQty}
                  onChange={(e) => setItemQty(parseInt(e.target.value) || 1)}
                />
              </div>

              <button type="button" onClick={addItemToOrder} className="btn btn-primary" style={{ height: '42px' }}>
                <Plus size={16} /> Agregar
              </button>
            </div>

            <div className="form-group" style={{ marginTop: '0.6rem', marginBottom: 0 }}>
              <input
                type="text"
                placeholder="Instrucción culinaria (opcional: sin wasabi, salsa aparte, etc.)"
                className="form-input"
                value={itemNotes}
                onChange={(e) => setItemNotes(e.target.value)}
              />
            </div>
          </div>

          {/* Selected items list */}
          <div style={{ marginBottom: '1.25rem' }}>
            <h5 style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
              Platillos en el pedido ({orderForm.items.length})
            </h5>
            {orderForm.items.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontStyle: 'italic' }}>
                No hay ítems seleccionados aún.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {orderForm.items.map((it, idx) => (
                  <div key={idx} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.5rem 0.75rem',
                    background: 'rgba(255, 255, 255, 0.03)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.875rem'
                  }}>
                    <div>
                      <span><strong>{it.quantity}x</strong> {it.name}</span>
                      {it.special_notes && <span style={{ color: 'var(--gold)', fontSize: '0.75rem', marginLeft: '0.5rem' }}>({it.special_notes})</span>}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span style={{ fontWeight: 600 }}>${(it.price * it.quantity).toFixed(2)}</span>
                      <button type="button" onClick={() => removeItemFromOrder(idx)} className="btn-icon" style={{ padding: '0.2rem', color: '#fb7185' }}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Totals Summary */}
          <div style={{
            padding: '1rem',
            background: 'rgba(10, 14, 19, 0.8)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            marginBottom: '1rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              <span>Subtotal:</span>
              <span>${calculatedSubtotal.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
              <span>Impuesto IVA (10%):</span>
              <span>${calculatedTax.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.25rem', fontWeight: 700, color: 'var(--gold)', marginTop: '0.5rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.5rem' }}>
              <span>Total Estimado:</span>
              <span className="font-serif">${calculatedTotal.toFixed(2)}</span>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Notas Generales del Pedido</label>
            <textarea
              className="form-textarea"
              placeholder="Anotaciones para sala o cocina..."
              value={orderForm.notes}
              onChange={(e) => setOrderForm({ ...orderForm, notes: e.target.value })}
            />
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
            <button type="button" className="btn btn-secondary" onClick={() => setIsNewOrderOpen(false)}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? "Emitiendo Pedido..." : "Crear y Enviar a Cocina"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Ticket Modal */}
      <Modal
        isOpen={!!viewingOrder}
        onClose={() => setViewingOrder(null)}
        title="Ticket de Pedido"
        subtitle="Comprobante gastronómico oficial"
        maxWidth="480px"
      >
        {viewingOrder && (
          <div>
            <div style={{
              textAlign: 'center',
              borderBottom: '1px dashed var(--border-gold)',
              paddingBottom: '1rem',
              marginBottom: '1rem',
            }}>
              <h3 className="font-serif" style={{ fontSize: '1.4rem', color: 'var(--gold)' }}>KAISEKI SUSHI BAR</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Alta Cocina Japonesa & Omakase</p>
              <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                <strong>Pedido: {viewingOrder.order_code}</strong>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {new Date(viewingOrder.created_at).toLocaleString()}
              </div>
            </div>

            <div style={{ fontSize: '0.85rem', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between' }}>
              <span>Cliente: <strong>{viewingOrder.customer_name}</strong></span>
              <span>{viewingOrder.table_number ? `Mesa #${viewingOrder.table_number}` : viewingOrder.order_type_display}</span>
            </div>

            <div style={{ borderBottom: '1px dashed var(--border-subtle)', paddingBottom: '0.75rem', marginBottom: '0.75rem' }}>
              {viewingOrder.items?.map((it, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', padding: '0.25rem 0' }}>
                  <span>{it.quantity}x {it.product_name}</span>
                  <span>${it.subtotal}</span>
                </div>
              ))}
            </div>

            <div style={{ fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                <span>Subtotal:</span>
                <span>${viewingOrder.subtotal}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                <span>IVA (10%):</span>
                <span>${viewingOrder.tax_amount}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.25rem', fontWeight: 700, color: 'var(--gold)', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.5rem' }}>
                <span>Total Pagado:</span>
                <span className="font-serif">${viewingOrder.total_amount}</span>
              </div>
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginTop: '1.5rem',
              paddingTop: '1rem',
              borderTop: '1px solid var(--border-subtle)'
            }}>
              <button onClick={() => window.print()} className="btn btn-secondary">
                <Printer size={16} /> Imprimir Ticket
              </button>
              <button onClick={() => setViewingOrder(null)} className="btn btn-primary">
                Cerrar
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Eliminar Pedido"
        message={`¿Estás seguro de eliminar el pedido "${deletingOrder?.order_code}"? Esta acción borrará el registro y los ítems asociados.`}
        isLoading={isSubmitting}
      />
    </div>
  );
}


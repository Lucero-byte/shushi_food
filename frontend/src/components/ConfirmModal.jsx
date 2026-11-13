import React from 'react';
import Modal from './Modal';
import { AlertTriangle, Trash2 } from 'lucide-react';

export default function ConfirmModal({ isOpen, onClose, onConfirm, title, message, isLoading }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title || "Confirmar Acción"} maxWidth="460px">
      <div style={{ textAlign: 'center', padding: '0.5rem 0 1rem' }}>
        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: 'rgba(225, 29, 72, 0.15)',
          color: '#fb7185',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1.25rem',
          border: '1px solid rgba(225, 29, 72, 0.3)'
        }}>
          <AlertTriangle size={28} />
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6 }}>
          {message || "¿Estás seguro de que deseas eliminar este registro permanentemente?"}
        </p>
      </div>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: '0.75rem',
        marginTop: '1.5rem',
        paddingTop: '1rem',
        borderTop: '1px solid var(--border-subtle)'
      }}>
        <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isLoading}>
          Cancelar
        </button>
        <button 
          type="button" 
          className="btn btn-crimson" 
          onClick={onConfirm} 
          disabled={isLoading}
        >
          <Trash2 size={16} />
          <span>{isLoading ? "Eliminando..." : "Eliminar Definitivamente"}</span>
        </button>
      </div>
    </Modal>
  );
}


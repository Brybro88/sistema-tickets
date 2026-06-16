import React from 'react';
import { s } from '../../styles/ticketStyles';

const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, isLoading }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex justify-center items-center z-[2000] p-4 animate-fade-in" onClick={!isLoading ? onClose : undefined}>
      <div className="glass-panel w-full max-w-sm relative animate-slide-up" style={{...s.modal, padding: '24px'}} onClick={(e) => e.stopPropagation()}>
        <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 shrink-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
          </div>
          <h2 style={{ ...s.modalTitle, margin: 0, fontSize: '18px' }}>{title || 'Confirmar Acción'}</h2>
        </div>
        
        <p style={{ ...s.modalSub, marginBottom: '24px', color: '#475569', lineHeight: '1.5' }}>
          {message || '¿Estás seguro? Esta acción no se puede deshacer.'}
        </p>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button type="button" onClick={onClose} style={s.cancelBtn} disabled={isLoading}>Cancelar</button>
          <button 
            type="button" 
            onClick={onConfirm} 
            style={{...s.submitBtn, backgroundColor: '#EF4444', borderColor: '#DC2626', opacity: isLoading ? 0.8 : 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px'}} 
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Procesando...
              </>
            ) : (
              'Sí, eliminar'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;

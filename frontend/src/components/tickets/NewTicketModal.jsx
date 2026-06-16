import React, { useState } from 'react';
import axios from 'axios';
import { s } from '../../styles/ticketStyles';

const NewTicketModal = ({ onClose, onSuccess, categoriesData = [] }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [subcategoryId, setSubcategoryId] = useState('');
  const [errorForm, setErrorForm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Obtener subcategorías basadas en la categoría seleccionada
  const selectedCategory = categoriesData.find(c => c.id === categoryId);
  const subcategories = selectedCategory?.subcategories || [];

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    if (!categoryId) {
      setErrorForm('Por favor selecciona una categoría.');
      return;
    }
    
    setErrorForm('');
    setIsSubmitting(true);
    
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        'http://localhost:5000/api/tickets',
        {
          title,
          description,
          categoryId,
          subcategoryId
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      onSuccess();
    } catch (err) {
      setErrorForm(err.response?.data?.message || 'Error al crear el ticket');
      setIsSubmitting(false); // Only re-enable if there's an error
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex justify-center items-center z-[1000] p-4 animate-fade-in" onClick={!isSubmitting ? onClose : undefined}>
      <div className="glass-panel w-full max-w-lg relative animate-slide-up" style={{...s.modal, padding: '24px'}} onClick={(e) => e.stopPropagation()}>
        <div style={s.modalHead}>
          <div>
            <h2 style={s.modalTitle}>Nuevo Ticket</h2>
            <p style={s.modalSub}>Describe el problema para asignarlo al equipo correcto</p>
          </div>
          {!isSubmitting && (
            <button onClick={onClose} style={s.closeBtn}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          )}
        </div>

        {errorForm && (
          <div style={s.errorBox}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            {errorForm}
          </div>
        )}

        <form onSubmit={handleCreateTicket} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={s.field}>
            <label style={s.fieldLabel}>Asunto</label>
            <input
              type="text"
              required
              placeholder="Ej. Falla de conexión a internet o No puedo imprimir..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={s.fieldInput}
              disabled={isSubmitting}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: subcategories.length > 0 ? '1fr 1fr' : '1fr', gap: '16px' }}>
            <div style={s.field}>
              <label style={s.fieldLabel}>Categoría</label>
              <select 
                style={s.fieldInput}
                value={categoryId}
                onChange={(e) => {
                  setCategoryId(e.target.value);
                  setSubcategoryId('');
                }}
                required
                disabled={isSubmitting}
              >
                <option value="">Selecciona una categoría</option>
                {categoriesData.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            {subcategories.length > 0 && (
              <div style={s.field}>
                <label style={s.fieldLabel}>Subcategoría (Opcional)</label>
                <select 
                  style={s.fieldInput}
                  value={subcategoryId}
                  onChange={(e) => setSubcategoryId(e.target.value)}
                  disabled={isSubmitting}
                >
                  <option value="">Selecciona una subcategoría</option>
                  {subcategories.map((sub, idx) => (
                    <option key={idx} value={sub}>{sub}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div style={s.field}>
            <label style={s.fieldLabel}>Descripción detallada (Opcional)</label>
            <textarea
              placeholder="Explica qué sucede con el mayor detalle posible…"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{ ...s.fieldInput, resize: 'none', minHeight: '100px', fontFamily: 'inherit' }}
              rows="4"
              disabled={isSubmitting}
            />
          </div>

          <div style={{ display: 'flex', gap: '12px', paddingTop: '8px' }}>
            <button type="button" onClick={onClose} style={s.cancelBtn} disabled={isSubmitting}>Cancelar</button>
            <button 
              type="submit" 
              style={{...s.submitBtn, opacity: isSubmitting ? 0.8 : 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px'}} 
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  ✨ Analizando y asignando con IA...
                </>
              ) : (
                'Enviar reporte'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewTicketModal;

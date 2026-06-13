import React, { useState } from 'react';
import axios from 'axios';
import { s } from '../../styles/ticketStyles';

const NewTicketModal = ({ categoriesData, onClose, onSuccess }) => {
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(categoriesData[0]?.id || '');
  const [subcategory, setSubcategory] = useState(categoriesData[0]?.subcategories[0] || 'Otro');
  const [subcategoryOther, setSubcategoryOther] = useState('');
  const [errorForm, setErrorForm] = useState('');

  const getAutoAgent = () => {
    // Para simplificar, devolvemos null y el backend lo manejará si es necesario.
    // También podríamos pasar agents como prop si se requiere asignación automática real aquí.
    return null; 
  };

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    setErrorForm('');
    
    const catName = categoriesData.find(c => c.id === category)?.name || 'General';
    const autoTitle = `${catName} - ${subcategory === 'Otro' ? (subcategoryOther || 'Otro') : subcategory}`;
    const autoAgentId = getAutoAgent();
    
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        'http://localhost:5000/api/tickets',
        {
          title: autoTitle,
          description,
          category,
          subcategory: subcategory === 'Otro' ? subcategoryOther : subcategory,
          subcategoryOtherDescription: subcategoryOther,
          agentId: autoAgentId
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      onSuccess();
    } catch (err) {
      setErrorForm(err.response?.data?.message || 'Error al crear el ticket');
    }
  };

  return (
    <div style={s.overlay} onClick={onClose}>
      <div style={s.modal} onClick={(e) => e.stopPropagation()}>
        <div style={s.modalHead}>
          <div>
            <h2 style={s.modalTitle}>Nuevo Ticket</h2>
            <p style={s.modalSub}>Describe el problema para asignarlo al equipo correcto</p>
          </div>
          <button onClick={onClose} style={s.closeBtn}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {errorForm && (
          <div style={s.errorBox}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            {errorForm}
          </div>
        )}

        <form onSubmit={handleCreateTicket} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={s.field}>
            <label style={s.fieldLabel}>Categoría</label>
            <select
              value={category}
              onChange={(e) => {
                const newCatId = e.target.value;
                setCategory(newCatId);
                const catObj = categoriesData.find(c => c.id === newCatId);
                if (catObj && catObj.subcategories.length > 0) {
                  setSubcategory(catObj.subcategories[0]);
                } else {
                  setSubcategory('Otro');
                }
                setSubcategoryOther('');
              }}
              style={s.fieldInput}
            >
              {categoriesData.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div style={s.field}>
            <label style={s.fieldLabel}>Subcategoría</label>
            <select
              value={subcategory}
              onChange={(e) => { setSubcategory(e.target.value); setSubcategoryOther(''); }}
              style={s.fieldInput}
            >
              {categoriesData.find(c => c.id === category)?.subcategories.map(sub => (
                <option key={sub} value={sub}>{sub}</option>
              ))}
              <option value="Otro">Otro</option>
            </select>
          </div>

          {subcategory === 'Otro' && (
            <div style={s.field}>
              <label style={s.fieldLabel}>Especifica el problema</label>
              <input
                type="text"
                placeholder="Describe brevemente el tipo de problema..."
                value={subcategoryOther}
                onChange={(e) => setSubcategoryOther(e.target.value)}
                style={s.fieldInput}
                required
              />
            </div>
          )}

          <div style={s.field}>
            <label style={s.fieldLabel}>
              Descripción detallada{' '}
              <span style={{ fontWeight: '400', color: '#94A3B8' }}>(opcional)</span>
            </label>
            <textarea
              placeholder="Explica qué sucede con el mayor detalle posible…"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{ ...s.fieldInput, resize: 'none', minHeight: '100px', fontFamily: 'inherit' }}
              rows="4"
            />
          </div>

          <div style={{ display: 'flex', gap: '12px', paddingTop: '4px' }}>
            <button type="button" onClick={onClose} style={s.cancelBtn}>Cancelar</button>
            <button type="submit" style={s.submitBtn}>Enviar reporte</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewTicketModal;

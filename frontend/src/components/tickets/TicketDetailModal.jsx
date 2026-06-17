import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { s } from '../../styles/ticketStyles';
import { AuthContext } from '../../context/AuthContext';

const TicketDetailModal = ({ 
  selectedTicket, 
  onClose, 
  agents, 
  categoriesData, 
  onStatusChange, 
  onOpenReassign 
}) => {
  const { user } = useContext(AuthContext);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [isInternalComment, setIsInternalComment] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);

  useEffect(() => {
    if (selectedTicket) {
      fetchComments();
    }
  }, [selectedTicket]);

  const fetchComments = async () => {
    setLoadingComments(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`http://localhost:5000/api/tickets/${selectedTicket.id}/comments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setComments(res.data);
    } catch (err) {
      console.error('Error al traer comentarios:', err);
    }
    setLoadingComments(false);
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(
        `http://localhost:5000/api/tickets/${selectedTicket.id}/comments`,
        { message: newComment, isInternal: isInternalComment },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setComments(prev => [...prev, res.data]);
      setNewComment('');
      setIsInternalComment(false);
    } catch (err) {
      console.error('Error al agregar comentario:', err);
    }
  };

  const getCategoryName = (catId) => {
    const cat = categoriesData.find(c => c.id === catId);
    return cat ? cat.name : 'General';
  };

  const formatDateTime = (dateStr) => {
    return new Date(dateStr).toLocaleString('es-MX', { 
      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' 
    });
  };

  const getStatus = (st) => {
    const config = {
      'abierto':    { label: 'Pendiente',  color: '#F59E0B', bg: '#FFFBEB', dot: '#F59E0B' },
      'en proceso': { label: 'En Proceso', color: '#06B6D4', bg: '#ECFEFF', dot: '#06B6D4' },
      'cerrado':    { label: 'Resuelto',   color: '#059669', bg: '#ECFDF5', dot: '#059669' },
    };
    return config[st] || { label: st, color: '#64748B', bg: '#F1F5F9', dot: '#94A3B8' };
  };

  const nextStatus = (current) => current === 'abierto' ? 'en proceso' : current === 'en proceso' ? 'cerrado' : 'abierto';
  const nextStatusLabel = (current) => current === 'abierto' ? 'Marcar en proceso' : current === 'en proceso' ? 'Marcar resuelto' : 'Reabrir';

  if (!selectedTicket) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex justify-center items-center z-[1000] p-4 animate-fade-in" onClick={onClose}>
      <div 
        className="glass-panel w-full max-w-[620px] max-h-[90vh] overflow-y-auto relative animate-slide-up"
        style={{ padding: '32px' }} 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera */}
        <div style={s.modalHead}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
              <span style={s.tdMono}>#{selectedTicket.id?.substring(0, 7).toUpperCase()}</span>
              <span style={{ ...s.statusBadge, color: getStatus(selectedTicket.status).color, backgroundColor: getStatus(selectedTicket.status).bg }}>
                <span style={{ ...s.statusDot, backgroundColor: getStatus(selectedTicket.status).dot }} />
                {getStatus(selectedTicket.status).label}
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-1">{selectedTicket.title}</h2>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {/* Info */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
          <div style={s.infoBlock}>
            <span style={s.infoLabel}>CATEGORÍA</span>
            <span style={s.infoValue}>{getCategoryName(selectedTicket.categoryId)}</span>
          </div>
          <div style={s.infoBlock}>
            <span style={s.infoLabel}>SUBCATEGORÍA</span>
            <span style={s.infoValue}>{selectedTicket.subcategory || '—'}</span>
          </div>
          <div style={s.infoBlock}>
            <span style={s.infoLabel}>REPORTADO POR</span>
            <span style={s.infoValue}>{selectedTicket.usuario?.name || user.name || '—'}</span>
          </div>
          <div style={s.infoBlock}>
            <span style={s.infoLabel}>AGENTE ASIGNADO</span>
            <span style={s.infoValue}>
              {selectedTicket.agente?.name || agents.find(a => a.id === selectedTicket.agentId)?.name || 'Sin agente'}
            </span>
            {(() => {
              const agentSpecialties = selectedTicket.agente?.specialties || agents.find(a => a.id === selectedTicket.agentId)?.specialties;
              if (agentSpecialties && agentSpecialties.length > 0) {
                return (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {agentSpecialties.map((skill, index) => (
                      <span key={index} className="bg-blue-50 text-blue-600 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-blue-200">
                        {skill}
                      </span>
                    ))}
                  </div>
                );
              }
              return null;
            })()}
          </div>
          <div style={s.infoBlock}>
            <span style={s.infoLabel}>FECHA DE CREACIÓN</span>
            <span style={s.infoValue}>{formatDateTime(selectedTicket.createdAt)}</span>
          </div>
          <div style={s.infoBlock}>
            <span style={s.infoLabel}>ÚLTIMA ACTUALIZACIÓN</span>
            <span style={s.infoValue}>{formatDateTime(selectedTicket.updatedAt)}</span>
          </div>
        </div>

        {selectedTicket.description && (
          <div style={{ marginBottom: '20px' }}>
            <span style={s.infoLabel}>DESCRIPCIÓN</span>
            <p style={{ margin: '6px 0 0', fontSize: '13.5px', color: '#374151', lineHeight: '1.6', padding: '12px', backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
              {selectedTicket.description}
            </p>
          </div>
        )}

        {/* Acciones (agente/admin) */}
        {(user.role === 'agente' || user.role === 'sysadmin') && (
          <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
            <button
              style={{ ...s.statusBtn, backgroundColor: '#EFF6FF', borderColor: '#BFDBFE', color: '#2563EB' }}
              onClick={() => onStatusChange(selectedTicket.id, nextStatus(selectedTicket.status))}
            >
              {nextStatusLabel(selectedTicket.status)}
            </button>
            {user.role === 'sysadmin' && (
              <button
                style={{ ...s.statusBtn, backgroundColor: '#F0FDF4', borderColor: '#BBF7D0', color: '#059669' }}
                onClick={() => onOpenReassign(selectedTicket.id)}
              >
                {selectedTicket.agentId ? 'Reasignar agente' : 'Asignar agente'}
              </button>
            )}
          </div>
        )}

        {/* Sección comentarios */}
        <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '20px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#0F172A', margin: '0 0 14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            Comentarios {comments.length > 0 && <span style={{ color: '#94A3B8', fontWeight: '500' }}>({comments.length})</span>}
          </h3>

          {loadingComments ? (
            <p style={{ fontSize: '13px', color: '#94A3B8', textAlign: 'center', padding: '20px 0' }}>Cargando comentarios…</p>
          ) : comments.length === 0 ? (
            <p style={{ fontSize: '13px', color: '#94A3B8', textAlign: 'center', padding: '16px 0' }}>Sin comentarios todavía.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px', maxHeight: '220px', overflowY: 'auto' }}>
              {comments.map((c, i) => (
                <div key={c.id || i} style={s.commentBubble}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontSize: '12px', fontWeight: '700', color: c.isInternal ? '#9333EA' : '#2563EB' }}>
                      {c.autor?.name || c.user?.name || user.name || 'Usuario'}
                      {c.isInternal && (
                        <span style={{ marginLeft: '8px', fontSize: '10px', backgroundColor: '#F3E8FF', color: '#9333EA', padding: '2px 6px', borderRadius: '10px' }}>
                          Interno
                        </span>
                      )}
                    </span>
                    <span style={{ fontSize: '11px', color: '#94A3B8' }}>{formatDateTime(c.createdAt)}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: '13px', color: '#374151', lineHeight: '1.5' }}>{c.message}</p>
                </div>
              ))}
            </div>
          )}

          {/* Input nuevo comentario */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
            <textarea
              placeholder="Escribe un comentario…"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAddComment(); } }}
              style={{ ...s.fieldInput, resize: 'none', flex: 1, minHeight: '70px', fontFamily: 'inherit' }}
              rows="2"
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
            {(user.role === 'agente' || user.role === 'sysadmin') ? (
              <label style={{ fontSize: '12px', color: '#475569', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={isInternalComment} 
                  onChange={(e) => setIsInternalComment(e.target.checked)} 
                />
                Nota interna (oculta al usuario)
              </label>
            ) : <div/>}
            <button
              onClick={handleAddComment}
              disabled={!newComment.trim()}
              style={{
                ...s.submitBtn,
                padding: '10px 16px',
                flex: 'none',
                opacity: newComment.trim() ? 1 : 0.5,
                cursor: newComment.trim() ? 'pointer' : 'not-allowed',
                alignSelf: 'flex-end',
              }}
            >
              Enviar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketDetailModal;

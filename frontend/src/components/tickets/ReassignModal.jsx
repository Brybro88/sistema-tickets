import React from 'react';
import { s } from '../../styles/ticketStyles';

const ReassignModal = ({ 
  reassignTicketId, 
  selectedTicket, 
  agents, 
  onClose, 
  onAssignAgent 
}) => {
  if (!reassignTicketId || !selectedTicket) return null;

  return (
    <div style={s.overlay} onClick={onClose}>
      <div style={{ ...s.modal, maxWidth: '400px' }} onClick={(e) => e.stopPropagation()}>
        <div style={s.modalHead}>
          <div>
            <h2 style={s.modalTitle}>{selectedTicket.agentId ? 'Reasignar agente' : 'Asignar agente'}</h2>
            <p style={s.modalSub}>Selecciona el agente para este ticket</p>
          </div>
          <button onClick={onClose} style={s.closeBtn}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {agents.length === 0 && (
            <p style={{ fontSize: '13px', color: '#94A3B8', textAlign: 'center', padding: '16px 0' }}>No hay agentes disponibles.</p>
          )}
          {agents.map(agent => {
            const isCurrent = agent.id === selectedTicket.agentId;
            return (
              <button
                key={agent.id}
                onClick={() => onAssignAgent(reassignTicketId, agent.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '12px 14px', borderRadius: '10px',
                  border: isCurrent ? '2px solid #2563EB' : '1.5px solid #E2E8F0',
                  backgroundColor: isCurrent ? '#EFF6FF' : '#F8FAFC',
                  cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
                }}
              >
                <div style={{ ...s.authorAvatar, width: '36px', height: '36px', fontSize: '12px' }}>
                  {agent.name.substring(0, 2).toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13.5px', fontWeight: '600', color: '#0F172A' }}>{agent.name}</div>
                  <div style={{ fontSize: '11.5px', color: '#64748B' }}>{agent.email}</div>
                </div>
                {isCurrent && (
                  <span style={{ fontSize: '11px', color: '#2563EB', fontWeight: '700', backgroundColor: '#DBEAFE', padding: '2px 8px', borderRadius: '20px' }}>
                    Actual
                  </span>
                )}
              </button>
            );
          })}

          {selectedTicket.agentId && (
            <button
              onClick={() => onAssignAgent(reassignTicketId, null)}
              style={{ ...s.cancelBtn, marginTop: '4px', width: '100%', textAlign: 'center', color: '#EF4444', borderColor: '#FCA5A5' }}
            >
              Quitar asignación
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReassignModal;

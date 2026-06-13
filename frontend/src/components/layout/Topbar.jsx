import React, { useContext } from 'react';
import { s } from '../../styles/ticketStyles';
import { AuthContext } from '../../context/AuthContext';

const Topbar = ({ activeView, onNewTicket }) => {
  const { user } = useContext(AuthContext);

  if (!user) return null;

  return (
    <div style={s.topbar}>
      <div>
        <h1 style={s.pageTitle}>
          {activeView === 'dashboard' && (user.role === 'sysadmin' ? 'Centro de Operaciones IT' : 'Mis Reportes de Soporte')}
          {activeView === 'mis-tickets' && 'Mis Tickets'}
          {activeView === 'reportes' && 'Reportes Avanzados'}
          {activeView === 'configuracion' && 'Configuración'}
        </h1>
        <p style={s.pageSubtitle}>
          {new Date().toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>
      <div style={s.topbarRight}>
        <span style={user.role === 'sysadmin' ? s.roleAdmin : s.roleUser}>
          {user.role === 'sysadmin' ? 'ADMINISTRADOR' : user.role === 'agente' ? 'AGENTE DE SOPORTE' : 'USUARIO REGULAR'}
        </span>
        <button onClick={onNewTicket} style={s.primaryBtn}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Nuevo Ticket
        </button>
      </div>
    </div>
  );
};

export default Topbar;

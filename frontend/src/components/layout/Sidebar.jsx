import React, { useContext } from 'react';
import { s } from '../../styles/ticketStyles';
import { AuthContext } from '../../context/AuthContext';

const Sidebar = ({ activeView, setActiveView }) => {
  const { user, logout } = useContext(AuthContext);

  if (!user) return null;

  return (
    <aside style={s.sidebar}>
      <div style={s.sidebarBrand}>
        <div style={s.brandIcon}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
        </div>
        <div style={s.brandName}>TechSupport Hub</div>
      </div>

      <div style={s.nav}>
        <div style={activeView === 'dashboard' ? s.navItemActive : s.navItem} onClick={() => setActiveView('dashboard')}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
          Dashboard
        </div>
        <div style={activeView === 'mis-tickets' ? s.navItemActive : s.navItem} onClick={() => setActiveView('mis-tickets')}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          Mis Tickets
        </div>
        {(user.role === 'sysadmin' || user.role === 'agente') && (
          <div style={activeView === 'reportes' ? s.navItemActive : s.navItem} onClick={() => setActiveView('reportes')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Reportes
          </div>
        )}
        <div style={activeView === 'configuracion' ? s.navItemActive : s.navItem} onClick={() => setActiveView('configuracion')}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/></svg>
          Configuración
        </div>
      </div>

      <div style={s.sidebarFooter}>
        <div style={s.sidebarAvatar}>{user.name ? user.name.substring(0, 2).toUpperCase() : 'U'}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={s.sidebarName}>{user.name}</div>
          <div style={s.sidebarEmail}>{user.email}</div>
        </div>
        <button onClick={logout} style={s.sidebarLogout} title="Cerrar sesión">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;

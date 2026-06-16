import React, { useContext } from 'react';
import { s } from '../../styles/ticketStyles';
import { AuthContext } from '../../context/AuthContext';

const Sidebar = ({ activeView, setActiveView }) => {
  const { user, logout } = useContext(AuthContext);

  if (!user) return null;

  return (
    <aside className="glass-dark w-[260px] min-w-[260px] flex flex-col sticky top-0 h-screen text-slate-300 z-20" style={s.sidebar}>
      <div className="flex items-center gap-3 px-6 py-8 border-b border-white/5">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/50">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
        </div>
        <div className="font-bold text-lg text-white tracking-tight">TechSupport Hub</div>
      </div>

      <div className="flex-1 px-4 py-6 flex flex-col gap-1.5 overflow-y-auto">
        <div 
          className={`nav-item ${activeView === 'dashboard' ? 'bg-blue-600/20 text-blue-400 font-semibold' : 'hover:bg-white/5 hover:text-white'}`}
          onClick={() => setActiveView('dashboard')}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
          Dashboard
        </div>
        
        <div 
          className={`nav-item ${activeView === 'mis-tickets' ? 'bg-blue-600/20 text-blue-400 font-semibold' : 'hover:bg-white/5 hover:text-white'}`}
          onClick={() => setActiveView('mis-tickets')}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          Mis Tickets
        </div>

        {(user.role === 'sysadmin' || user.role === 'agente') && (
          <div 
            className={`nav-item ${activeView === 'reportes' ? 'bg-blue-600/20 text-blue-400 font-semibold' : 'hover:bg-white/5 hover:text-white'}`}
            onClick={() => setActiveView('reportes')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Reportes
          </div>
        )}

        <div 
          className={`nav-item ${activeView === 'configuracion' ? 'bg-blue-600/20 text-blue-400 font-semibold' : 'hover:bg-white/5 hover:text-white'}`}
          onClick={() => setActiveView('configuracion')}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/></svg>
          Configuración
        </div>
      </div>

      <div className="flex items-center gap-3 px-6 py-6 border-t border-white/5 bg-slate-950/30">
        <div className="w-9 h-9 min-w-9 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-md">
          {user.name ? user.name.substring(0, 2).toUpperCase() : 'U'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-slate-100 whitespace-nowrap overflow-hidden text-ellipsis">{user.name}</div>
          <div className="text-xs text-slate-500 whitespace-nowrap overflow-hidden text-ellipsis">{user.email}</div>
        </div>
        <button onClick={logout} className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors" title="Cerrar sesión">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;

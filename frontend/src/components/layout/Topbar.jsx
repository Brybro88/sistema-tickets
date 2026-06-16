import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../../context/AuthContext';

const Topbar = ({ activeView, onNewTicket }) => {
  const { user } = useContext(AuthContext);
  const [greeting, setGreeting] = useState('Hola');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Buenos días');
    else if (hour < 19) setGreeting('Buenas tardes');
    else setGreeting('Buenas noches');
  }, []);

  if (!user) return null;

  // Extract initials for the avatar
  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0].substring(0, 2).toUpperCase();
  };

  return (
    <div className="sticky top-4 z-10 px-6 py-4 bg-white/80 backdrop-blur-md border border-slate-200/50 rounded-2xl shadow-md shadow-slate-200/40 flex justify-between items-center transition-all duration-300 animate-fade-in">
      <div className="flex items-center gap-4">
        {/* User Initials Avatar */}
        <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-blue-500 via-indigo-500 to-violet-500 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-indigo-500/20 border-2 border-white select-none">
          {getInitials(user.name)}
        </div>
        
        <div>
          <h1 className="text-xl font-bold text-slate-800 m-0 flex items-center gap-1.5 leading-tight">
            {activeView === 'dashboard' ? (
              <>
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 font-extrabold">
                  {greeting}
                </span>
                <span className="text-slate-700 font-semibold">, {user.name.split(' ')[0]}</span>
              </>
            ) : (
              <span className="text-slate-800">
                {activeView === 'mis-tickets' && 'Mis Tickets'}
                {activeView === 'reportes' && 'Reportes Avanzados'}
                {activeView === 'configuracion' && 'Configuración'}
              </span>
            )}
          </h1>
          <p className="text-xs text-slate-400 mt-1 capitalize font-medium flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-slate-400 stroke-[2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            <span>
              {new Date().toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
          </p>
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <span className={`text-xs font-bold tracking-wide px-3 py-1 rounded-full border ${
          user.role === 'sysadmin' 
            ? 'bg-amber-50 text-amber-700 border-amber-200/50 shadow-sm shadow-amber-500/5' 
            : 'bg-blue-50 text-blue-700 border-blue-200/50 shadow-sm shadow-blue-500/5'
        }`}>
          {user.role === 'sysadmin' ? 'ADMINISTRADOR' : user.role === 'agente' ? 'AGENTE DE SOPORTE' : 'USUARIO REGULAR'}
        </span>
        
        <button 
          onClick={onNewTicket} 
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-lg shadow-blue-500/50 hover:-translate-y-1 hover:bg-blue-500 active:scale-95 transition-all duration-200 cursor-pointer disabled:opacity-60 disabled:pointer-events-none"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Nuevo Ticket
        </button>
      </div>
    </div>
  );
};

export default Topbar;


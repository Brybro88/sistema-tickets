import React from 'react';

const EmptyState = ({ 
  title = "Nada por aquí", 
  description = "No se encontraron registros en este momento.",
  icon = "box" // "box", "check", "shield"
}) => {
  const renderIcon = () => {
    switch (icon) {
      case 'check':
        return (
          <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center border border-emerald-100 shadow-sm shadow-emerald-500/10 text-emerald-500">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
        );
      case 'shield':
        return (
          <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center border border-blue-100 shadow-sm shadow-blue-500/10 text-blue-500">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
        );
      case 'box':
      default:
        return (
          <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100 shadow-sm shadow-slate-500/5 text-slate-400">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="12" x2="2" y2="12" />
              <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
              <path d="M14 12a2 2 0 0 1-4 0" />
            </svg>
          </div>
        );
    }
  };

  return (
    <div className="flex flex-col items-center justify-center text-center p-8 py-16 bg-white/50 backdrop-blur-sm border border-slate-100 rounded-2xl shadow-sm animate-fade-in my-4 max-w-lg mx-auto">
      <div className="mb-4 transform hover:scale-105 transition-transform duration-300">
        {renderIcon()}
      </div>
      <h3 className="text-lg font-bold text-slate-800 tracking-tight mb-1">
        {title}
      </h3>
      <p className="text-sm text-slate-500 max-w-sm font-medium leading-relaxed">
        {description}
      </p>
    </div>
  );
};

export default EmptyState;

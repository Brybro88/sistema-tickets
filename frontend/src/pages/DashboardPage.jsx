import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { s } from '../styles/ticketStyles';
import { AuthContext } from '../context/AuthContext';
import DashboardLayout from '../components/layout/DashboardLayout';
import TicketDetailModal from '../components/tickets/TicketDetailModal';
import ReassignModal from '../components/tickets/ReassignModal';
import EmptyState from '../components/shared/EmptyState';
import ConfirmModal from '../components/shared/ConfirmModal';

const DashboardPage = () => {
  const { user } = useContext(AuthContext);

  // States for data
  const [tickets, setTickets] = useState([]);
  const [agents, setAgents] = useState([]);
  const [categoriesData, setCategoriesData] = useState([]);
  const [stats, setStats] = useState({ total: 0, abiertos: 0, enProceso: 0, resueltos: 0 });

  // UI state
  const [activeView, setActiveView] = useState('dashboard');
  const [filter, setFilter] = useState('Todos');
  const [filterAgent, setFilterAgent] = useState('Todos');
  const [reportFilters, setReportFilters] = useState({
    agentId: '', categoryId: '', status: '', start_date: '', end_date: ''
  });

  // Modals state
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [reassignTicketId, setReassignTicketId] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [adminTab, setAdminTab] = useState('usuarios');
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showSubcategoryModal, setShowSubcategoryModal] = useState(null);
  const [showSkillsModal, setShowSkillsModal] = useState(null);
  const [loadingAiAssign, setLoadingAiAssign] = useState(null);
  const [confirmConfig, setConfirmConfig] = useState({ isOpen: false, title: '', message: '', onConfirm: null, isLoading: false });

  useEffect(() => {
    fetchTickets();
    fetchAgents();
    fetchCategories();
    if (user && (user.role === 'sysadmin' || user.role === 'agente')) {
        fetchStats();
    }
    if (user && user.role === 'sysadmin' && activeView === 'configuracion') {
        fetchAllUsers();
    }
  }, [filter, filterAgent, activeView, reportFilters, user]);

  const fetchCategories = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/categories');
      setCategoriesData(res.data);
    } catch (err) {
      console.error('Error al traer categorías:', err);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/tickets/stats');
      setStats(res.data);
    } catch (err) {
        console.error('Error al traer estadisticas', err);
    }
  };

  const fetchTickets = async () => {
    try {
      let url = 'http://localhost:5000/api/tickets';
      const params = [];
      if (activeView === 'reportes') {
          if (reportFilters.agentId) params.push(`agentId=${reportFilters.agentId}`);
          if (reportFilters.categoryId) params.push(`categoryId=${reportFilters.categoryId}`);
          if (reportFilters.status) params.push(`status=${reportFilters.status}`);
          if (reportFilters.start_date) params.push(`start_date=${reportFilters.start_date}`);
          if (reportFilters.end_date) params.push(`end_date=${reportFilters.end_date}`);
      } else {
        if (filter !== 'Todos' && activeView !== 'mis-tickets') {
            const statusMap = { 'Pendiente': 'abierto', 'En Proceso': 'en proceso', 'Resuelto': 'cerrado' };
            params.push(`status=${statusMap[filter]}`);
        }
        if (filterAgent !== 'Todos') {
            params.push(`agentId=${filterAgent}`);
        }
      }
      if (params.length > 0) url += '?' + params.join('&');
      
      const res = await axios.get(url);
      setTickets(res.data);
    } catch (err) {
      console.error('Error al traer tickets:', err);
    }
  };

  const fetchAgents = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/users?role=agente');
      setAgents(res.data);
    } catch (err) {
      console.error('Error al traer agentes:', err);
    }
  };

  const fetchAllUsers = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/users');
      setAllUsers(res.data);
    } catch (err) {
      console.error('Error al traer todos los usuarios:', err);
    }
  };

  const handleDeleteUser = (userId) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Eliminar Usuario',
      message: '¿Estás seguro? Si hay tickets asignados o creados por este usuario, quedarán sin autor/agente.',
      isLoading: false,
      onConfirm: async () => {
        setConfirmConfig(prev => ({ ...prev, isLoading: true }));
        try {
          const token = localStorage.getItem('token');
          await axios.delete(`http://localhost:5000/api/users/${userId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setAllUsers(prev => prev.filter(u => u.id !== userId));
          setConfirmConfig({ isOpen: false, title: '', message: '', onConfirm: null, isLoading: false });
          fetchTickets(); // Refresh tickets in case they were updated
          if (activeView === 'dashboard') fetchStats();
        } catch (err) {
          console.error(err);
          alert('Error al eliminar usuario');
          setConfirmConfig(prev => ({ ...prev, isLoading: false }));
        }
      }
    });
  };

  const handleDeleteCategory = (catId) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Eliminar Categoría',
      message: '¿Estás seguro? Si hay tickets en esta categoría, quedarán sin asignar (General).',
      isLoading: false,
      onConfirm: async () => {
        setConfirmConfig(prev => ({ ...prev, isLoading: true }));
        try {
          const token = localStorage.getItem('token');
          await axios.delete(`http://localhost:5000/api/categories/${catId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setCategoriesData(prev => prev.filter(c => c.id !== catId));
          setConfirmConfig({ isOpen: false, title: '', message: '', onConfirm: null, isLoading: false });
          fetchTickets();
        } catch (err) {
          console.error(err);
          alert('Error al eliminar categoría');
          setConfirmConfig(prev => ({ ...prev, isLoading: false }));
        }
      }
    });
  };

  const handleDeleteSubcategory = (catId, subName) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Eliminar Subcategoría',
      message: `¿Estás seguro de eliminar la subcategoría "${subName}"?`,
      isLoading: false,
      onConfirm: async () => {
        setConfirmConfig(prev => ({ ...prev, isLoading: true }));
        try {
          const token = localStorage.getItem('token');
          const res = await axios.delete(`http://localhost:5000/api/categories/${catId}/subcategory/${encodeURIComponent(subName)}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setCategoriesData(prev => prev.map(c => c.id === catId ? res.data : c));
          setConfirmConfig({ isOpen: false, title: '', message: '', onConfirm: null, isLoading: false });
          fetchTickets();
        } catch (err) {
          console.error(err);
          alert('Error al eliminar subcategoría');
          setConfirmConfig(prev => ({ ...prev, isLoading: false }));
        }
      }
    });
  };

  const handleAiAutoAssign = async (ticketId) => {
    setLoadingAiAssign(ticketId);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(
        `http://localhost:5000/api/tickets/${ticketId}/auto-assign-ai`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Actualizar el ticket en el estado local 'tickets'
      setTickets(prev => prev.map(t => t.id === ticketId ? res.data : t));
    } catch (err) {
      console.error('Error al auto-asignar con IA:', err);
      alert(err.response?.data?.message || 'Error durante la asignación por IA');
    } finally {
      setLoadingAiAssign(null);
    }
  };



  const handleStatusChange = async (ticketId, newStatus) => {
    try {
      await axios.put(`http://localhost:5000/api/tickets/${ticketId}`, { status: newStatus });
      fetchTickets();
      if (activeView === 'dashboard') fetchStats();
      if (selectedTicket && selectedTicket.id === ticketId) {
        setSelectedTicket({ ...selectedTicket, status: newStatus });
      }
    } catch (err) {
      console.error('Error al cambiar estado:', err);
    }
  };

  const handleAssignAgent = async (ticketId, newAgentId) => {
    try {
      await axios.put(`http://localhost:5000/api/tickets/${ticketId}`, { agentId: newAgentId });
      setReassignTicketId(null);
      fetchTickets();
      if (selectedTicket && selectedTicket.id === ticketId) {
        setSelectedTicket({ ...selectedTicket, agentId: newAgentId });
      }
    } catch (err) {
      console.error('Error al reasignar:', err);
    }
  };

  const getCategoryName = (catId) => {
    const cat = categoriesData.find(c => c.id === catId);
    return cat ? cat.name : 'General';
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const getStatus = (st) => {
    const config = {
      'abierto':    { label: 'Pendiente',  color: '#F59E0B', bg: '#FFFBEB', dot: '#F59E0B' },
      'en proceso': { label: 'En Proceso', color: '#06B6D4', bg: '#ECFEFF', dot: '#06B6D4' },
      'cerrado':    { label: 'Resuelto',   color: '#059669', bg: '#ECFDF5', dot: '#059669' },
    };
    return config[st] || { label: st, color: '#64748B', bg: '#F1F5F9', dot: '#94A3B8' };
  };

  const misTickets = tickets.filter(t => t.userId === user?.id);

  if (!user) return null;

  return (
    <DashboardLayout 
      activeView={activeView} 
      setActiveView={setActiveView} 
      categoriesData={categoriesData}
      onTicketCreated={() => {
        fetchTickets();
        if (user.role === 'sysadmin' || user.role === 'agente') fetchStats();
      }}
    >
      {/* ── VISTA: DASHBOARD ── */}
      {activeView === 'dashboard' && (
        <>
          {(user.role === 'sysadmin' || user.role === 'agente') && (
            <div className="grid grid-cols-4 gap-4 mb-6 animate-slide-up">
            {[
                { label: 'Total Tickets', value: stats.total, color: 'text-blue-600', bg: 'bg-blue-600', lightBg: 'bg-blue-50', icon: '📋' },
                { label: 'Pendientes', value: stats.abiertos, color: 'text-amber-500', bg: 'bg-amber-500', lightBg: 'bg-amber-50', icon: '🕐' },
                { label: 'En Proceso', value: stats.enProceso, color: 'text-cyan-500', bg: 'bg-cyan-500', lightBg: 'bg-cyan-50', icon: '⚡' },
                { label: 'Resueltos', value: stats.resueltos, color: 'text-emerald-600', bg: 'bg-emerald-600', lightBg: 'bg-emerald-50', icon: '✓' },
            ].map((m) => (
                <div key={m.label} className="glass-panel rounded-xl overflow-hidden flex items-center relative transition-transform hover:-translate-y-1 duration-300">
                <div className={`w-1 h-full min-h-[80px] shrink-0 ${m.bg}`} />
                <div className="flex-1 px-4 py-4">
                    <div className="text-[11px] font-bold text-slate-400 tracking-wider uppercase mb-1">{m.label}</div>
                    <div className={`text-3xl font-extrabold leading-none ${m.color}`}>{m.value}</div>
                </div>
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center mr-4 text-lg shrink-0 ${m.lightBg} ${m.color}`}>{m.icon}</div>
                </div>
            ))}
            </div>
          )}

          <div className="glass-panel animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <div style={s.tableHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <h2 style={s.tableTitle}>Tickets Recientes</h2>

              </div>
              <div style={s.filterRow}>
                {user.role === 'sysadmin' && (
                  <select value={filterAgent} onChange={e => setFilterAgent(e.target.value)} style={s.filterSelect}>
                    <option value="Todos">Todos los agentes</option>
                    {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                )}
                {['Todos', 'Pendiente', 'En Proceso', 'Resuelto'].map(f => (
                  <button key={f} onClick={() => setFilter(f)} style={filter === f ? s.chipActive : s.chip}>{f}</button>
                ))}
              </div>
            </div>
            <div style={s.tableScroll}>
              <table style={s.table}>
                <thead>
                  <tr>
                    {['ID', 'Asunto', 'Reportado por', 'Categoría', 'Fecha', 'Estado', 'Agente'].map((h) => (
                      <th key={h} style={s.th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tickets.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="py-8 bg-transparent">
                        <EmptyState 
                          title="No se encontraron tickets" 
                          description="No hay ningún ticket en la base de datos o que coincida con los filtros activos."
                          icon="box"
                        />
                      </td>
                    </tr>
                  ) : (
                    tickets.map((t, i) => {
                      const st = getStatus(t.status);
                      const agentName = t.agente?.name || agents.find(a => a.id === t.agentId)?.name;
                      return (
                        <tr
                          key={t.id}
                          style={{ ...s.tr, backgroundColor: i % 2 === 0 ? '#fff' : '#F8FAFC', cursor: 'pointer' }}
                          onClick={() => setSelectedTicket(t)}
                        >
                          <td style={s.tdMono}>#{t.id?.substring(0, 7).toUpperCase()}</td>
                          <td style={s.tdMain}>
                            <div style={s.tdTitle}>{t.title}</div>
                            <div style={s.tdSub}>{t.description?.substring(0, 60)}{t.description?.length > 60 ? '…' : ''}</div>
                          </td>
                          <td style={s.tdText}>
                            <div style={s.authorChip}>
                              <div style={s.authorAvatar}>{t.usuario?.name?.substring(0, 2).toUpperCase() || 'U'}</div>
                              {t.usuario?.name || 'Usuario'}
                            </div>
                          </td>
                          <td style={s.tdText}><span style={s.categoryTag}>{getCategoryName(t.categoryId)}</span></td>
                          <td style={s.tdText}>{formatDate(t.createdAt)}</td>
                          <td style={s.tdText}>
                            <span style={{ ...s.statusBadge, color: st.color, backgroundColor: st.bg }}>
                              <span style={{ ...s.statusDot, backgroundColor: st.dot }} />
                              {st.label}
                            </span>
                          </td>
                          <td style={s.tdText}>
                            {agentName ? (
                              <span style={{ fontSize: '13px', color: '#374151', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                {agentName}
                                {t.assignedByAi && (
                                  <span title="Asignado automáticamente por IA" style={{ cursor: 'help' }}>✨</span>
                                )}
                              </span>
                            ) : user.role !== 'sysadmin' ? (
                              <span style={{ fontSize: '12px', color: '#94A3B8' }}>Sin asignar</span>
                            ) : (
                              <button
                                onClick={(e) => { e.stopPropagation(); setReassignTicketId(t.id); setSelectedTicket(t); }}
                                style={{ ...s.primaryBtn, padding: '4px 8px', fontSize: '11px', backgroundColor: '#DBEAFE', color: '#2563EB', boxShadow: 'none' }}
                              >
                                Asignar
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ── VISTA: MIS TICKETS ── */}
      {activeView === 'mis-tickets' && (
        <div className="glass-panel animate-slide-up" style={s.tableCard}>
          <div style={s.tableHeader}>
            <h2 style={s.tableTitle}>Mis Tickets</h2>
            <span style={{ fontSize: '13px', color: '#94A3B8' }}>{misTickets.length} ticket(s) registrado(s)</span>
          </div>
          <div style={s.tableScroll}>
            <table style={s.table}>
              <thead>
                <tr>
                  {['ID', 'Asunto', 'Categoría', 'Fecha', 'Estado'].map(h => (
                    <th key={h} style={s.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {misTickets.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-8 bg-transparent">
                      <EmptyState 
                        title="No tienes tickets registrados" 
                        description="Parece que aún no has creado ningún ticket de soporte."
                        icon="check"
                      />
                    </td>
                  </tr>
                ) : (
                  misTickets.map((t, i) => {
                    const st = getStatus(t.status);
                    return (
                      <tr
                        key={t.id}
                        style={{ ...s.tr, backgroundColor: i % 2 === 0 ? '#fff' : '#F8FAFC', cursor: 'pointer' }}
                        onClick={() => setSelectedTicket(t)}
                      >
                        <td style={s.tdMono}>#{t.id?.substring(0, 7).toUpperCase()}</td>
                        <td style={s.tdMain}>
                          <div style={s.tdTitle}>{t.title}</div>
                          <div style={s.tdSub}>{t.description?.substring(0, 60)}{t.description?.length > 60 ? '…' : ''}</div>
                        </td>
                        <td style={s.tdText}><span style={s.categoryTag}>{getCategoryName(t.categoryId)}</span></td>
                        <td style={s.tdText}>
                          {formatDate(t.createdAt)}
                          {t.status !== 'cerrado' && (
                            <div style={{ fontSize: '11px', color: '#F59E0B', marginTop: '2px' }}>
                              {Math.floor((new Date() - new Date(t.createdAt)) / 86400000)} días abierto
                            </div>
                          )}
                        </td>
                        <td style={s.tdText}>
                          <span style={{ ...s.statusBadge, color: st.color, backgroundColor: st.bg }}>
                            <span style={{ ...s.statusDot, backgroundColor: st.dot }} />
                            {st.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── VISTA: REPORTES ── */}
      {activeView === 'reportes' && (user.role === 'sysadmin' || user.role === 'agente') && (
        <div className="glass-panel animate-slide-up" style={{ ...s.tableCard, height: 'max-content', marginBottom: 'auto' }}>
          <div style={{ padding: '24px', borderBottom: '1px solid #F1F5F9', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={s.tableTitle}>Filtros de Reporte</h2>
              <button onClick={() => {
                  setReportFilters({ agentId: '', categoryId: '', status: '', start_date: '', end_date: '' });
              }} style={s.cancelBtn}>Limpiar Filtros</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              {user.role === 'sysadmin' && (
                <div style={s.field}>
                    <label style={s.fieldLabel}>Agente Asignado</label>
                    <select 
                        style={s.fieldInput}
                        value={reportFilters.agentId}
                        onChange={(e) => setReportFilters({...reportFilters, agentId: e.target.value})}
                    >
                        <option value="">Todos los agentes</option>
                        {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>
                </div>
              )}
              <div style={s.field}>
                  <label style={s.fieldLabel}>Categoría</label>
                  <select 
                      style={s.fieldInput}
                      value={reportFilters.categoryId}
                      onChange={(e) => setReportFilters({...reportFilters, categoryId: e.target.value})}
                  >
                      <option value="">Todas las categorías</option>
                      {categoriesData.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
              </div>
              <div style={s.field}>
                  <label style={s.fieldLabel}>Estado</label>
                  <select 
                      style={s.fieldInput}
                      value={reportFilters.status}
                      onChange={(e) => setReportFilters({...reportFilters, status: e.target.value})}
                  >
                      <option value="">Todos los estados</option>
                      <option value="abierto">Pendiente</option>
                      <option value="en proceso">En Proceso</option>
                      <option value="cerrado">Resuelto</option>
                  </select>
              </div>
              <div style={s.field}>
                  <label style={s.fieldLabel}>Fecha Desde</label>
                  <input 
                      type="date" 
                      style={s.fieldInput}
                      value={reportFilters.start_date}
                      onChange={(e) => setReportFilters({...reportFilters, start_date: e.target.value})}
                  />
              </div>
              <div style={s.field}>
                  <label style={s.fieldLabel}>Fecha Hasta</label>
                  <input 
                      type="date" 
                      style={s.fieldInput}
                      value={reportFilters.end_date}
                      onChange={(e) => setReportFilters({...reportFilters, end_date: e.target.value})}
                  />
              </div>
            </div>
          </div>
          <div style={s.tableScroll}>
            <table style={s.table}>
              <thead>
                <tr>
                  {['ID', 'Asunto', 'Reportado por', 'Agente', 'Categoría', 'Fecha', 'Estado'].map((h) => (
                    <th key={h} style={s.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tickets.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-8 bg-transparent">
                      <EmptyState 
                        title="Sin resultados" 
                        description="Intenta ajustar o limpiar los filtros del reporte para encontrar lo que buscas."
                        icon="shield"
                      />
                    </td>
                  </tr>
                ) : (
                  tickets.map((t, i) => {
                    const st = getStatus(t.status);
                    const agentName = t.agente?.name || agents.find(a => a.id === t.agentId)?.name;
                    return (
                      <tr
                        key={t.id}
                        style={{ ...s.tr, backgroundColor: i % 2 === 0 ? '#fff' : '#F8FAFC', cursor: 'pointer' }}
                        onClick={() => setSelectedTicket(t)}
                      >
                        <td style={s.tdMono}>#{t.id?.substring(0, 7).toUpperCase() || 'N/A'}</td>
                        <td style={s.tdMain}>
                          <div style={s.tdTitle}>{t.title}</div>
                          <div style={s.tdSub}>{t.description?.substring(0, 60)}{t.description?.length > 60 ? '…' : ''}</div>
                        </td>
                        <td style={s.tdText}>{t.usuario?.name || 'Sin asignar'}</td>
                        <td style={s.tdText}>
                          {agentName ? (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              {agentName}
                              {t.assignedByAi && (
                                <span title="Asignado automáticamente por IA" style={{ cursor: 'help' }}>✨</span>
                              )}
                            </span>
                          ) : user.role === 'sysadmin' ? (
                            <button
                              onClick={(e) => { e.stopPropagation(); setReassignTicketId(t.id); setSelectedTicket(t); }}
                              style={{ ...s.primaryBtn, padding: '4px 8px', fontSize: '11px', backgroundColor: '#DBEAFE', color: '#2563EB', boxShadow: 'none' }}
                            >
                              Asignar
                            </button>
                          ) : (
                            <span style={{ fontSize: '12px', color: '#94A3B8' }}>Sin agente</span>
                          )}
                        </td>
                        <td style={s.tdText}>
                          <span style={s.categoryTag}>{getCategoryName(t.categoryId)}</span>
                        </td>
                        <td style={s.tdText}>{formatDate(t.createdAt)}</td>
                        <td style={s.tdText}>
                          <span style={{ ...s.statusBadge, color: st.color, backgroundColor: st.bg }}>
                            <span style={{ ...s.statusDot, backgroundColor: st.dot }} />
                            {st.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── VISTA: CONFIGURACIÓN ── */}
      {activeView === 'configuracion' && (
        <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="bg-white/80 backdrop-blur-md rounded-3xl p-8 shadow-sm border border-slate-200 mb-8" style={{ maxWidth: '640px' }}>
            <h2 className="text-xl font-bold text-slate-800 mb-6">Mi Perfil</h2>
            
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
              {/* Avatar */}
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-3xl font-extrabold shadow-md shrink-0">
                {user.name ? user.name.substring(0, 2).toUpperCase() : 'U'}
              </div>
              
              {/* Identidad */}
              <div className="flex-1 text-center sm:text-left mt-2">
                <h3 className="text-2xl font-bold text-slate-800">{user.name || 'Usuario Desconocido'}</h3>
                
                <div className="mt-2">
                  {user.role === 'sysadmin' && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-700 border border-purple-200">
                      Administrador del Sistema
                    </span>
                  )}
                  {user.role === 'agente' && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-700 border border-blue-200">
                      Agente de Soporte
                    </span>
                  )}
                  {user.role === 'usuario' && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-slate-100 text-slate-700 border border-slate-200">
                      Usuario Regular
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="my-8 border-t border-slate-200/60"></div>

            {/* Detalles de contacto */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 text-slate-400">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                </div>
                <div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Correo Electrónico</div>
                  <div className="text-slate-800 font-medium">{user.email || '—'}</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="mt-0.5 text-slate-400">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                </div>
                <div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Nivel de Acceso</div>
                  <div className="text-slate-800 font-medium capitalize">{user.role || '—'}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Panel de Administración (Solo Sysadmin) */}
          {user.role === 'sysadmin' && (
            <div className="glass-panel" style={{ ...s.tableCard }}>
              <div style={{ ...s.tableHeader, borderBottom: '1px solid #E2E8F0', paddingBottom: '0' }}>
                <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
                  <h2 style={{ ...s.tableTitle, paddingBottom: '16px' }}>Panel de Administración</h2>
                  <button 
                    onClick={() => setAdminTab('usuarios')} 
                    style={{
                      background: 'none',
                      border: 'none',
                      borderBottom: adminTab === 'usuarios' ? '2px solid #2563EB' : '2px solid transparent',
                      color: adminTab === 'usuarios' ? '#2563EB' : '#64748B',
                      fontWeight: '600',
                      fontSize: '14px',
                      padding: '0 0 16px',
                      cursor: 'pointer'
                    }}
                  >
                    Usuarios
                  </button>
                  <button 
                    onClick={() => setAdminTab('categorias')} 
                    style={{
                      background: 'none',
                      border: 'none',
                      borderBottom: adminTab === 'categorias' ? '2px solid #2563EB' : '2px solid transparent',
                      color: adminTab === 'categorias' ? '#2563EB' : '#64748B',
                      fontWeight: '600',
                      fontSize: '14px',
                      padding: '0 0 16px',
                      cursor: 'pointer'
                    }}
                  >
                    Categorías
                  </button>
                </div>
                {adminTab === 'usuarios' ? (
                  <button 
                    onClick={() => setShowRegisterModal(true)} 
                    style={{ ...s.primaryBtn, marginBottom: '16px' }}
                  >
                    Registrar Usuario de Soporte
                  </button>
                ) : (
                  <button 
                    onClick={() => setShowCategoryModal(true)} 
                    style={{ ...s.primaryBtn, marginBottom: '16px' }}
                  >
                    Agregar Nueva Categoría
                  </button>
                )}
              </div>

              {adminTab === 'usuarios' && (
                <div style={s.tableScroll}>
                  <table style={s.table}>
                    <thead>
                      <tr>
                        {['ID', 'Nombre', 'Correo', 'Rol', 'Fecha de Registro', 'Acción'].map(h => (
                          <th key={h} style={s.th}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {allUsers.length === 0 ? (
                        <tr>
                          <td colSpan="6" style={s.emptyCell}>Cargando usuarios...</td>
                        </tr>
                      ) : (
                        allUsers.map((u, i) => (
                          <tr key={u.id} style={{ ...s.tr, backgroundColor: i % 2 === 0 ? '#fff' : '#F8FAFC' }}>
                            <td style={s.tdMono}>#{u.id?.substring(0, 7).toUpperCase()}</td>
                            <td style={s.tdText}><strong style={{ color: '#0F172A' }}>{u.name}</strong></td>
                            <td style={s.tdText}>{u.email}</td>
                            <td style={s.tdText}>
                              <span style={u.role === 'sysadmin' ? s.roleAdmin : s.roleUser}>
                                {u.role}
                              </span>
                            </td>
                            <td style={s.tdText}>{formatDate(u.createdAt)}</td>
                            <td style={s.tdText}>
                              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                {u.role === 'agente' ? (
                                  <button 
                                    onClick={() => setShowSkillsModal(u)} 
                                    style={{ ...s.statusBtn, backgroundColor: '#F0FDF4', borderColor: '#BBF7D0', color: '#059669', padding: '4px 8px', fontSize: '12px' }}
                                  >
                                    ⚙️ Skills
                                  </button>
                                ) : (
                                  <span style={{ color: '#94A3B8', fontSize: '12px', minWidth: '70px', textAlign: 'center' }}>—</span>
                                )}
                                <button
                                  onClick={() => handleDeleteUser(u.id)}
                                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: '#EF4444', display: 'flex', alignItems: 'center', transition: 'all 0.2s', borderRadius: '4px' }}
                                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#FEE2E2'}
                                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                  title="Eliminar usuario"
                                >
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {adminTab === 'categorias' && (
                <div style={s.tableScroll}>
                  <table style={s.table}>
                    <thead>
                      <tr>
                        {['ID', 'Categoría Principal', 'Subcategorías', 'Acción'].map(h => (
                          <th key={h} style={s.th}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {categoriesData.length === 0 ? (
                        <tr>
                          <td colSpan="4" style={s.emptyCell}>No hay categorías creadas</td>
                        </tr>
                      ) : (
                        categoriesData.map((c, i) => (
                          <tr key={c.id} style={{ ...s.tr, backgroundColor: i % 2 === 0 ? '#fff' : '#F8FAFC' }}>
                            <td style={s.tdMono}>#{String(c.id).substring(0, 7).toUpperCase()}</td>
                            <td style={s.tdText}><strong style={{ color: '#0F172A' }}>{c.name}</strong></td>
                            <td style={{ ...s.tdText, whiteSpace: 'normal', maxWidth: '400px' }}>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                {c.subcategories && c.subcategories.length > 0 ? (
                                  c.subcategories.map((sub, idx) => (
                                    <div key={idx} style={{ ...s.categoryTag, backgroundColor: '#E2E8F0', color: '#1E293B', display: 'flex', alignItems: 'center', gap: '4px', paddingRight: '4px' }}>
                                      {sub}
                                      <button 
                                        onClick={() => handleDeleteSubcategory(c.id, sub)}
                                        style={{ background: 'none', border: 'none', padding: '2px', cursor: 'pointer', color: '#64748B', display: 'flex', alignItems: 'center', borderRadius: '50%' }}
                                        onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#CBD5E1'; e.currentTarget.style.color = '#EF4444'; }}
                                        onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#64748B'; }}
                                        title="Eliminar subcategoría"
                                      >
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                                      </button>
                                    </div>
                                  ))
                                ) : (
                                  <span style={{ color: '#94A3B8', fontSize: '12px' }}>Ninguna subcategoría</span>
                                )}
                              </div>
                            </td>
                            <td style={s.tdText}>
                              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <button 
                                  onClick={() => setShowSubcategoryModal(c)} 
                                  style={{ ...s.statusBtn, backgroundColor: '#EFF6FF', borderColor: '#BFDBFE', color: '#2563EB' }}
                                >
                                  + Agregar Subcategoría
                                </button>
                                <button
                                  onClick={() => handleDeleteCategory(c.id)}
                                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px', color: '#EF4444', display: 'flex', alignItems: 'center', transition: 'all 0.2s', borderRadius: '6px' }}
                                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#FEE2E2'}
                                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                  title="Eliminar categoría"
                                >
                                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <TicketDetailModal 
        selectedTicket={selectedTicket} 
        onClose={() => setSelectedTicket(null)} 
        agents={agents} 
        categoriesData={categoriesData} 
        onStatusChange={handleStatusChange} 
        onOpenReassign={(id) => setReassignTicketId(id)} 
      />
      
      <ReassignModal 
        reassignTicketId={reassignTicketId} 
        selectedTicket={selectedTicket} 
        agents={agents} 
        onClose={() => setReassignTicketId(null)} 
        onAssignAgent={handleAssignAgent} 
      />

      <RegisterUserModal 
        isOpen={showRegisterModal} 
        onClose={() => setShowRegisterModal(false)} 
        onRegisterSuccess={fetchAllUsers} 
      />

      <CategoryModal 
        isOpen={showCategoryModal} 
        onClose={() => setShowCategoryModal(false)} 
        onCategorySuccess={fetchCategories} 
      />

      <SubcategoryModal 
        category={showSubcategoryModal} 
        onClose={() => setShowSubcategoryModal(null)} 
        onSubcategorySuccess={fetchCategories} 
      />

      <SkillsModal 
        agent={showSkillsModal} 
        onClose={() => setShowSkillsModal(null)} 
        onSaveSuccess={fetchAllUsers} 
      />

      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        onClose={() => !confirmConfig.isLoading && setConfirmConfig({ ...confirmConfig, isOpen: false })}
        onConfirm={confirmConfig.onConfirm}
        title={confirmConfig.title}
        message={confirmConfig.message}
        isLoading={confirmConfig.isLoading}
      />
    </DashboardLayout>
  );
};

// Modals for Admin Panel
const RegisterUserModal = ({ isOpen, onClose, onRegisterSuccess }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('usuario');
  const [specialties, setSpecialties] = useState([]);
  const [error, setError] = useState('');

  const availableSpecialties = [
    'Redes y Conectividad',
    'Soporte de Software',
    'Hardware y Equipos',
    'Cuentas y Accesos',
    'Telefonía e IP',
    'Correo Electrónico',
    'Seguridad Informática',
    'Servicios de Impresión',
    'Servidores y Nube',
    'Desarrollo y BD'
  ];

  if (!isOpen) return null;

  const handleCheckboxChange = (spec) => {
    if (specialties.includes(spec)) {
      setSpecialties(specialties.filter(item => item !== spec));
    } else {
      setSpecialties([...specialties, spec]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await axios.post('http://localhost:5000/api/auth/register-by-admin', {
        name, email, password, role,
        specialties: role === 'agente' ? specialties : []
      });
      setName('');
      setEmail('');
      setPassword('');
      setRole('usuario');
      setSpecialties([]);
      onRegisterSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al registrar usuario');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex justify-center items-center z-[1000] p-4 animate-fade-in" onClick={onClose}>
      <div className="glass-panel w-full relative animate-slide-up" style={{ ...s.modal, maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
        <div style={s.modalHead}>
          <div>
            <h2 style={s.modalTitle}>Registrar Usuario</h2>
            <p style={s.modalSub}>Crea una nueva cuenta de usuario, agente o administrador</p>
          </div>
          <button onClick={onClose} style={s.closeBtn}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {error && (
          <div style={s.errorBox}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={s.field}>
            <label style={s.fieldLabel}>Nombre Completo</label>
            <input 
              type="text" 
              required 
              style={s.fieldInput} 
              value={name} 
              onChange={e => setName(e.target.value)} 
              placeholder="Ej. Juan Pérez"
            />
          </div>
          <div style={s.field}>
            <label style={s.fieldLabel}>Correo Institucional</label>
            <input 
              type="email" 
              required 
              style={s.fieldInput} 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              placeholder="usuario@itsrll.edu.mx"
            />
          </div>
          <div style={s.field}>
            <label style={s.fieldLabel}>Contraseña</label>
            <input 
              type="password" 
              required 
              style={s.fieldInput} 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              placeholder="••••••••"
            />
          </div>
          <div style={s.field}>
            <label style={s.fieldLabel}>Rol en el Sistema</label>
            <select style={s.fieldInput} value={role} onChange={e => setRole(e.target.value)}>
              <option value="usuario">Usuario Común</option>
              <option value="agente">Agente de Soporte</option>
              <option value="sysadmin">Administrador (Sysadmin)</option>
            </select>
          </div>

          {role === 'agente' && (
            <div style={s.field}>
              <label style={s.fieldLabel}>Especialidades del Agente</label>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr', 
                gap: '10px', 
                padding: '12px', 
                backgroundColor: '#F8FAFC', 
                borderRadius: '8px', 
                border: '1.5px solid #E2E8F0', 
                maxHeight: '140px', 
                overflowY: 'auto' 
              }}>
                {availableSpecialties.map(spec => (
                  <label key={spec} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', color: '#475569', cursor: 'pointer' }}>
                    <input 
                      type="checkbox" 
                      checked={specialties.includes(spec)}
                      onChange={() => handleCheckboxChange(spec)}
                    />
                    {spec}
                  </label>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
            <button type="button" onClick={onClose} style={s.cancelBtn}>Cancelar</button>
            <button type="submit" style={s.submitBtn}>Registrar</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const CategoryModal = ({ isOpen, onClose, onCategorySuccess }) => {
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await axios.post('http://localhost:5000/api/categories', { name });
      setName('');
      onCategorySuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al crear categoría');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex justify-center items-center z-[1000] p-4 animate-fade-in" onClick={onClose}>
      <div className="glass-panel w-full relative animate-slide-up" style={s.modal} onClick={(e) => e.stopPropagation()}>
        <div style={s.modalHead}>
          <div>
            <h2 style={s.modalTitle}>Nueva Categoría</h2>
            <p style={s.modalSub}>Crea una categoría principal para clasificar tickets</p>
          </div>
          <button onClick={onClose} style={s.closeBtn}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {error && (
          <div style={s.errorBox}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={s.field}>
            <label style={s.fieldLabel}>Nombre de la Categoría</label>
            <input 
              type="text" 
              required 
              style={s.fieldInput} 
              value={name} 
              onChange={e => setName(e.target.value)} 
              placeholder="Ej. Redes e Internet"
            />
          </div>
          <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
            <button type="button" onClick={onClose} style={s.cancelBtn}>Cancelar</button>
            <button type="submit" style={s.submitBtn}>Crear</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const SubcategoryModal = ({ category, onClose, onSubcategorySuccess }) => {
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  if (!category) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await axios.put(`http://localhost:5000/api/categories/${category.id}/subcategory`, {
        subcategoryName: name
      });
      setName('');
      onSubcategorySuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al agregar subcategoría');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex justify-center items-center z-[1000] p-4 animate-fade-in" onClick={onClose}>
      <div className="glass-panel w-full relative animate-slide-up" style={s.modal} onClick={(e) => e.stopPropagation()}>
        <div style={s.modalHead}>
          <div>
            <h2 style={s.modalTitle}>Nueva Subcategoría</h2>
            <p style={s.modalSub}>Añadir subcategoría a: <strong>{category.name}</strong></p>
          </div>
          <button onClick={onClose} style={s.closeBtn}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {error && (
          <div style={s.errorBox}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={s.field}>
            <label style={s.fieldLabel}>Nombre de la Subcategoría</label>
            <input 
              type="text" 
              required 
              style={s.fieldInput} 
              value={name} 
              onChange={e => setName(e.target.value)} 
              placeholder="Ej. Configuración de VPN"
            />
          </div>
          <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
            <button type="button" onClick={onClose} style={s.cancelBtn}>Cancelar</button>
            <button type="submit" style={s.submitBtn}>Agregar</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const SkillsModal = ({ agent, onClose, onSaveSuccess }) => {
  const [skills, setSkills] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (agent) {
      setSkills(agent.specialties || []);
      setInputValue('');
      setError('');
    }
  }, [agent]);

  if (!agent) return null;

  const handleAddSkill = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const val = inputValue.trim();
      if (val && !skills.includes(val)) {
        setSkills([...skills, val]);
        setInputValue('');
      }
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    setSkills(skills.filter(s => s !== skillToRemove));
  };

  const handleSave = async () => {
    try {
      await axios.put(`http://localhost:5000/api/users/${agent.id}/specialties`, {
        specialties: skills
      });
      onSaveSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al guardar especialidades');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex justify-center items-center z-[1000] p-4 animate-fade-in" onClick={onClose}>
      <div className="glass-panel w-full relative animate-slide-up" style={s.modal} onClick={(e) => e.stopPropagation()}>
        <div style={s.modalHead}>
          <div>
            <h2 style={s.modalTitle}>Gestionar Skills</h2>
            <p style={s.modalSub}>Editar habilidades técnicas para <strong>{agent.name}</strong></p>
          </div>
          <button onClick={onClose} style={s.closeBtn}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {error && (
          <div style={s.errorBox}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            <span>{error}</span>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={s.field}>
            <label style={s.fieldLabel}>Escribir Habilidad (Presiona Enter)</label>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleAddSkill}
              placeholder="Ej. Redes LAN, Mantenimiento"
              style={s.fieldInput}
            />
          </div>

          <div style={s.field}>
            <label style={s.fieldLabel}>Skills del Agente</label>
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '8px',
              padding: '12px',
              backgroundColor: '#F8FAFC',
              borderRadius: '8px',
              border: '1.5px solid #E2E8F0',
              minHeight: '80px',
              alignContent: 'flex-start'
            }}>
              {skills.length === 0 ? (
                <span style={{ color: '#94A3B8', fontSize: '13px' }}>Sin skills asignadas.</span>
              ) : (
                skills.map(skill => (
                  <span
                    key={skill}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      backgroundColor: '#EFF6FF',
                      color: '#1D4ED8',
                      padding: '4px 10px',
                      borderRadius: '20px',
                      fontSize: '12.5px',
                      fontWeight: '600'
                    }}
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(skill)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#1D4ED8',
                        cursor: 'pointer',
                        padding: 0,
                        fontSize: '14px',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      ×
                    </button>
                  </span>
                ))
              )}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
            <button type="button" onClick={onClose} style={s.cancelBtn}>Cancelar</button>
            <button type="button" onClick={handleSave} style={s.submitBtn}>Guardar Cambios</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;

import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { s } from '../styles/ticketStyles';
import { AuthContext } from '../context/AuthContext';
import DashboardLayout from '../components/layout/DashboardLayout';
import TicketDetailModal from '../components/tickets/TicketDetailModal';
import ReassignModal from '../components/tickets/ReassignModal';

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

  useEffect(() => {
    fetchTickets();
    fetchAgents();
    fetchCategories();
    if (user && (user.role === 'sysadmin' || user.role === 'agente')) {
        fetchStats();
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
            <div style={s.metricsRow}>
            {[
                { label: 'Total Tickets', value: stats.total, color: '#2563EB', icon: '📋' },
                { label: 'Pendientes', value: stats.abiertos, color: '#F59E0B', icon: '🕐' },
                { label: 'En Proceso', value: stats.enProceso, color: '#06B6D4', icon: '⚡' },
                { label: 'Resueltos', value: stats.resueltos, color: '#059669', icon: '✓' },
            ].map((m) => (
                <div key={m.label} style={s.metricCard}>
                <div style={{ ...s.metricBar, backgroundColor: m.color }} />
                <div style={s.metricInner}>
                    <div style={s.metricLabel}>{m.label}</div>
                    <div style={{ ...s.metricValue, color: m.color }}>{m.value}</div>
                </div>
                <div style={{ ...s.metricIcon, backgroundColor: m.color + '15', color: m.color }}>{m.icon}</div>
                </div>
            ))}
            </div>
          )}

          <div style={s.tableCard}>
            <div style={s.tableHeader}>
              <h2 style={s.tableTitle}>Tickets Recientes</h2>
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
                      <td colSpan="7" style={s.emptyCell}>
                        <div style={s.emptyState}>
                          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="1.5"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
                          <span>No se encontraron tickets</span>
                        </div>
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
                              <span style={{ fontSize: '13px', color: '#374151', fontWeight: '500' }}>{agentName}</span>
                            ) : user.role === 'usuario' ? (
                              <span style={{ fontSize: '12px', color: '#94A3B8' }}>Sin asignar</span>
                            ) : (
                              <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                  onClick={(e) => { e.stopPropagation(); setReassignTicketId(t.id); setSelectedTicket(t); }}
                                  style={{ ...s.primaryBtn, padding: '4px 8px', fontSize: '11px', backgroundColor: '#DBEAFE', color: '#2563EB', boxShadow: 'none' }}
                                >
                                  Asignar agente
                                </button>
                              </div>
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
        <div style={s.tableCard}>
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
                    <td colSpan="5" style={s.emptyCell}>
                      <div style={s.emptyState}>
                        <span>No tienes tickets registrados</span>
                      </div>
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
        <div style={s.tableCard}>
          <div style={{...s.tableHeader, flexDirection: 'column', alignItems: 'stretch'}}>
            <h2 style={s.tableTitle}>Filtros de Reporte</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginTop: '16px' }}>
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
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
                <button onClick={() => {
                    setReportFilters({ agentId: '', categoryId: '', status: '', start_date: '', end_date: '' });
                }} style={s.cancelBtn}>Limpiar Filtros</button>
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
                    <td colSpan="7" style={s.emptyCell}>
                      <div style={s.emptyState}>
                        <span>No hay resultados para estos filtros</span>
                      </div>
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
                          {agentName ? agentName : <span style={{ fontSize: '12px', color: '#94A3B8' }}>Sin agente</span>}
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
        <div style={s.tableCard}>
          <div style={{ padding: '32px', maxWidth: '480px' }}>
            <h2 style={{ ...s.tableTitle, marginBottom: '24px' }}>Mi Perfil</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={s.configRow}>
                <span style={s.configLabel}>NOMBRE</span>
                <span style={s.configValue}>{user.name || '—'}</span>
              </div>
              <div style={s.configRow}>
                <span style={s.configLabel}>CORREO</span>
                <span style={s.configValue}>{user.email || '—'}</span>
              </div>
              <div style={s.configRow}>
                <span style={s.configLabel}>ROL</span>
                <span style={{ ...s.configValue, textTransform: 'capitalize' }}>{user.role || '—'}</span>
              </div>
            </div>
          </div>
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
    </DashboardLayout>
  );
};

export default DashboardPage;

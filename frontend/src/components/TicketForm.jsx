import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const [tickets, setTickets] = useState([]);
  const [agents, setAgents] = useState([]);
  const [user, setUser] = useState({});
  const [activeView, setActiveView] = useState('dashboard');
  const [filter, setFilter] = useState('Todos');
  const [filterAgent, setFilterAgent] = useState('Todos');

  // Modal nuevo ticket
  const [showModal, setShowModal] = useState(false);
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('f45cebbc-4a51-4c6a-9574-ef042a41f777');
  const [errorForm, setErrorForm] = useState('');
  const [subcategory, setSubcategory] = useState('Equipo dañado');
  const [subcategoryOther, setSubcategoryOther] = useState('');

  // Modal detalle / comentarios
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);

  // Modal reasignar agente
  const [reassignTicketId, setReassignTicketId] = useState(null);

  const subcategoryMap = {
    'f45cebbc-4a51-4c6a-9574-ef042a41f777': ['Equipo dañado', 'Pantalla', 'Teclado', 'Mouse', 'Impresora', 'Proyector', 'Batería', 'Otro'],
    '34b22773-b57a-4ee3-8d72-890f4a1f2d76': ['WiFi', 'VPN', 'Cableado', 'Sin internet', 'Lentitud de red', 'Firewall', 'Otro'],
    '00000000-0000-0000-0000-000000000003': ['Correo', 'Contraseña olvidada', 'Permisos', 'Alta de usuario', 'Baja de usuario', 'Acceso a sistema', 'Otro'],
    'e827ce69-c9a3-4eb3-8fe6-4ae860a82f8c': ['Windows', 'SAP', 'Office', 'Antivirus', 'Instalación de software', 'Error de sistema', 'Actualización', 'Otro'],
  };

  const navigate = useNavigate();

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    setUser(userData);
    fetchTickets();
    fetchAgents();
  }, [filter, filterAgent, activeView]);

  const fetchTickets = async () => {
    try {
      const token = localStorage.getItem('token');
      let url = 'http://localhost:5000/api/tickets';
      const params = [];
      if (filter !== 'Todos' && activeView !== 'mis-tickets') {
        const statusMap = { 'Pendiente': 'abierto', 'En Proceso': 'en proceso', 'Resuelto': 'cerrado' };
        params.push(`status=${statusMap[filter]}`);
      }
      if (filterAgent !== 'Todos') {
        params.push(`agentId=${filterAgent}`);
      }
      if (params.length > 0) url += '?' + params.join('&');
      const res = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
      setTickets(res.data);
    } catch (err) {
      console.error('Error al traer los tickets:', err);
    }
  };

  const fetchAgents = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/users?role=agente', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAgents(res.data || []);
    } catch (err) {
      console.error('Error al traer agentes:', err);
    }
  };

  // Asignación automática: round-robin entre agentes disponibles
  const getAutoAgent = () => {
    if (agents.length === 0) return null;
    // Contar tickets por agente para balancear
    const counts = {};
    agents.forEach(a => { counts[a.id] = 0; });
    tickets.forEach(t => {
      if (t.agentId && counts[t.agentId] !== undefined) counts[t.agentId]++;
    });
    // Asignar al agente con menos tickets
    const minAgent = agents.reduce((prev, curr) =>
      (counts[curr.id] || 0) < (counts[prev.id] || 0) ? curr : prev
    );
    return minAgent.id;
  };

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    setErrorForm('');
    const autoTitle = `${getCategoryName(category)} - ${subcategory === 'Otro' ? (subcategoryOther || 'Otro') : subcategory}`;
    const autoAgentId = getAutoAgent();
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/tickets',
        {
          title: autoTitle,
          description: description || '',
          category,
          subcategory,
          subcategoryOtherDescription: subcategory === 'Otro' ? subcategoryOther : '',
          agentId: autoAgentId,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setDescription('');
      setCategory('f45cebbc-4a51-4c6a-9574-ef042a41f777');
      setSubcategory('Equipo dañado');
      setSubcategoryOther('');
      setShowModal(false);
      fetchTickets();
    } catch (err) {
      setErrorForm(err.response?.data?.message || 'Error al registrar el ticket');
    }
  };

  const handleStatusChange = async (ticketId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:5000/api/tickets/${ticketId}`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchTickets();
      if (selectedTicket?.id === ticketId) {
        setSelectedTicket(prev => ({ ...prev, status: newStatus }));
      }
    } catch (err) {
      console.error('Error al cambiar estatus:', err);
    }
  };

  const handleAssignAgent = async (ticketId, agentId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:5000/api/tickets/${ticketId}`,
        { agentId: agentId || null },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchTickets();
      setReassignTicketId(null);
      if (selectedTicket?.id === ticketId) {
        const agent = agents.find(a => a.id === agentId);
        setSelectedTicket(prev => ({ ...prev, agentId, agente: agent }));
      }
    } catch (err) {
      console.error('Error al asignar agente:', err);
    }
  };

  const handleOpenTicket = async (ticket) => {
    setSelectedTicket(ticket);
    setLoadingComments(true);
    setComments([]);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`http://localhost:5000/api/tickets/${ticket.id}/comments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setComments(res.data || []);
    } catch (err) {
      console.error('Error al traer comentarios:', err);
      setComments([]);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !selectedTicket) return;
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(
        `http://localhost:5000/api/tickets/${selectedTicket.id}/comments`,
        { content: newComment },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setComments(prev => [...prev, res.data]);
      setNewComment('');
    } catch (err) {
      console.error('Error al agregar comentario:', err);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const getCategoryName = (catId) => {
    const names = {
      'f45cebbc-4a51-4c6a-9574-ef042a41f777': 'Soporte Hardware',
      '34b22773-b57a-4ee3-8d72-890f4a1f2d76': 'Redes e Internet',
      '00000000-0000-0000-0000-000000000003': 'Cuentas y Accesos',
      'e827ce69-c9a3-4eb3-8fe6-4ae860a82f8c': 'Soporte Software',
    };
    return names[catId] || 'General';
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleString('es-MX', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const nextStatus = (current) => {
    if (current === 'abierto') return 'en proceso';
    if (current === 'en proceso') return 'cerrado';
    return 'abierto';
  };

  const nextStatusLabel = (current) => {
    if (current === 'abierto') return 'Iniciar proceso';
    if (current === 'en proceso') return 'Marcar resuelto';
    return 'Reabrir';
  };

  const total = tickets.length;
  const abiertos  = tickets.filter(t => t.status === 'abierto').length;
  const enProceso = tickets.filter(t => t.status === 'en proceso').length;
  const resueltos = tickets.filter(t => t.status === 'cerrado').length;

  const statusConfig = {
    'abierto':    { label: 'Pendiente',  color: '#F59E0B', bg: '#FFFBEB', dot: '#F59E0B' },
    'en proceso': { label: 'En Proceso', color: '#2563EB', bg: '#EFF6FF', dot: '#2563EB' },
    'cerrado':    { label: 'Resuelto',   color: '#059669', bg: '#ECFDF5', dot: '#059669' },
  };

  const getStatus = (s) => statusConfig[s] || { label: s, color: '#6B7280', bg: '#F3F4F6', dot: '#6B7280' };

  const misTickets = tickets.filter(t =>
    t.userId === user.id || t.usuario?.email === user.email
  );

  // Agentes distintos del actual para reasignar
  const otherAgents = agents.filter(a => a.id !== selectedTicket?.agentId);

  return (
    <div style={s.root}>

      {/* ── SIDEBAR ── */}
      <aside style={s.sidebar}>
        <div style={s.sidebarBrand}>
          <div style={s.brandIcon}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          </div>
          <span style={s.brandName}>SoporteCentral</span>
        </div>

        <nav style={s.nav}>
          <div style={activeView === 'dashboard' ? s.navItemActive : s.navItem} onClick={() => setActiveView('dashboard')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
            Dashboard
          </div>
          <div style={activeView === 'mis-tickets' ? s.navItemActive : s.navItem} onClick={() => setActiveView('mis-tickets')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            Mis Tickets
          </div>
          <div style={activeView === 'configuracion' ? s.navItemActive : s.navItem} onClick={() => setActiveView('configuracion')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/></svg>
            Configuración
          </div>
        </nav>

        <div style={s.sidebarFooter}>
          <div style={s.sidebarAvatar}>{user.name?.substring(0, 2).toUpperCase() || 'U'}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={s.sidebarName}>{user.name || 'Usuario'}</div>
            <div style={s.sidebarEmail}>{user.email || ''}</div>
          </div>
          <button onClick={handleLogout} style={s.sidebarLogout} title="Cerrar sesión">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          </button>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <main style={s.main}>

        {/* TOPBAR */}
        <div style={s.topbar}>
          <div>
            <h1 style={s.pageTitle}>
              {activeView === 'dashboard' && (user.role === 'sysadmin' ? 'Centro de Operaciones IT' : 'Mis Reportes de Soporte')}
              {activeView === 'mis-tickets' && 'Mis Tickets'}
              {activeView === 'configuracion' && 'Configuración'}
            </h1>
            <p style={s.pageSubtitle}>{new Date().toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
          <div style={s.topbarRight}>
            <span style={user.role === 'sysadmin' ? s.roleAdmin : s.roleUser}>
              {user.role === 'sysadmin' ? 'Administrador' : user.role === 'agente' ? 'Agente' : 'Usuario'}
            </span>
            <button onClick={() => setShowModal(true)} style={s.primaryBtn}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Nueva Incidencia
            </button>
          </div>
        </div>

        {/* ── VISTA: DASHBOARD ── */}
        {activeView === 'dashboard' && (
          <>
            <div style={s.metricsRow}>
              {[
                { label: 'Total Tickets', value: total, color: '#2563EB', icon: '📋' },
                { label: 'Pendientes', value: abiertos, color: '#F59E0B', icon: '🕐' },
                { label: 'En Proceso', value: enProceso, color: '#06B6D4', icon: '⚡' },
                { label: 'Resueltos', value: resueltos, color: '#059669', icon: '✓' },
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

            <div style={s.tableCard}>
              <div style={s.tableHeader}>
                <h2 style={s.tableTitle}>Listado de Incidencias</h2>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                  {/* Filtro por estatus */}
                  <div style={s.filterRow}>
                    {['Todos', 'Pendiente', 'En Proceso', 'Resuelto'].map((btn) => (
                      <button key={btn} onClick={() => setFilter(btn)} style={filter === btn ? s.chipActive : s.chip}>
                        {btn}
                      </button>
                    ))}
                  </div>
                  {/* Filtro por agente (solo admin/sysadmin) */}
                  {(user.role === 'sysadmin' || user.role === 'agente') && agents.length > 0 && (
                    <select
                      value={filterAgent}
                      onChange={(e) => setFilterAgent(e.target.value)}
                      style={s.filterSelect}
                    >
                      <option value="Todos">Todos los agentes</option>
                      {agents.map(a => (
                        <option key={a.id} value={a.id}>{a.name}</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              <div style={s.tableScroll}>
                <table style={s.table}>
                  <thead>
                    <tr>
                      {['ID', 'Asunto', 'Reportado por', 'Agente', 'Categoría', 'Fecha', 'Estado', 'Acción'].map((h) => (
                        <th key={h} style={s.th}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {tickets.length === 0 ? (
                      <tr>
                        <td colSpan="8" style={s.emptyCell}>
                          <div style={s.emptyState}>
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                            <span>Sin incidencias registradas</span>
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
                            onClick={() => handleOpenTicket(t)}
                          >
                            <td style={s.tdMono}>#{t.id?.substring(0, 7).toUpperCase() || 'N/A'}</td>
                            <td style={s.tdMain}>
                              <div style={s.tdTitle}>{t.title}</div>
                              <div style={s.tdSub}>{t.description?.substring(0, 60)}{t.description?.length > 60 ? '…' : ''}</div>
                            </td>
                            <td style={s.tdText}>
                              <div style={s.authorChip}>
                                <div style={s.authorAvatar}>{(t.usuario?.name || user.name || 'U').substring(0, 2).toUpperCase()}</div>
                                <span>{t.usuario?.name || user.name || 'Sin asignar'}</span>
                              </div>
                            </td>
                            <td style={s.tdText}>
                              {agentName ? (
                                <div style={s.authorChip}>
                                  <div style={{ ...s.authorAvatar, backgroundColor: '#F0FDF4', color: '#059669' }}>
                                    {agentName.substring(0, 2).toUpperCase()}
                                  </div>
                                  <span>{agentName}</span>
                                </div>
                              ) : (
                                <span style={{ fontSize: '12px', color: '#94A3B8' }}>Sin agente</span>
                              )}
                            </td>
                            <td style={s.tdText}>
                              <span style={s.categoryTag}>{getCategoryName(t.categoryId)}</span>
                            </td>
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
                            <td style={s.tdText} onClick={(e) => e.stopPropagation()}>
                              {(user.role === 'agente' || user.role === 'sysadmin') && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                  <button
                                    style={s.statusBtn}
                                    onClick={() => handleStatusChange(t.id, nextStatus(t.status))}
                                  >
                                    {nextStatusLabel(t.status)}
                                  </button>
                                  <button
                                    style={{ ...s.statusBtn, color: '#2563EB', borderColor: '#BFDBFE' }}
                                    onClick={() => { setSelectedTicket(t); setReassignTicketId(t.id); handleOpenTicket(t); }}
                                  >
                                    {t.agentId ? 'Reasignar' : 'Asignar agente'}
                                  </button>
                                </div>
                              )}
                              {user.role === 'usuario' && (
                                <span style={{ fontSize: '12px', color: '#94A3B8' }}>—</span>
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
                          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
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
                          onClick={() => handleOpenTicket(t)}
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
              <button
                onClick={handleLogout}
                style={{ ...s.statusBtn, marginTop: '32px', backgroundColor: '#FEF2F2', borderColor: '#FCA5A5', color: '#DC2626', padding: '10px 20px', fontSize: '13.5px' }}
              >
                Cerrar sesión
              </button>
            </div>
          </div>
        )}

      </main>

      {/* ── MODAL: NUEVO TICKET ── */}
      {showModal && (
        <div style={s.overlay}>
          <div style={s.modal}>
            <div style={s.modalHead}>
              <div>
                <h2 style={s.modalTitle}>Nueva Incidencia</h2>
                <p style={s.modalSub}>Completa el formulario para abrir un ticket de soporte</p>
              </div>
              <button onClick={() => setShowModal(false)} style={s.closeBtn}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            {errorForm && (
              <div style={s.errorBox}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                {errorForm}
              </div>
            )}

            {agents.length > 0 && (
              <div style={{ ...s.errorBox, backgroundColor: '#F0FDF4', color: '#059669', marginBottom: '16px' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                Se asignará automáticamente a un agente disponible
              </div>
            )}

            <form onSubmit={handleCreateTicket} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div style={s.field}>
                <label style={s.fieldLabel}>Categoría</label>
                <select
                  value={category}
                  onChange={(e) => {
                    const newCat = e.target.value;
                    setCategory(newCat);
                    setSubcategory(subcategoryMap[newCat][0]);
                    setSubcategoryOther('');
                  }}
                  style={s.fieldInput}
                >
                  <option value="f45cebbc-4a51-4c6a-9574-ef042a41f777">Soporte Hardware — Equipos, pantallas, teclados</option>
                  <option value="34b22773-b57a-4ee3-8d72-890f4a1f2d76">Redes e Internet — WiFi, VPN, cableado</option>
                  <option value="00000000-0000-0000-0000-000000000003">Cuentas y Accesos — Correos, contraseñas</option>
                  <option value="e827ce69-c9a3-4eb3-8fe6-4ae860a82f8c">Soporte Software — Programas, Windows, SAP</option>
                </select>
              </div>

              <div style={s.field}>
                <label style={s.fieldLabel}>Subcategoría</label>
                <select
                  value={subcategory}
                  onChange={(e) => { setSubcategory(e.target.value); setSubcategoryOther(''); }}
                  style={s.fieldInput}
                >
                  {(subcategoryMap[category] || ['Otro']).map(sub => (
                    <option key={sub} value={sub}>{sub}</option>
                  ))}
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

              {/* Descripción detallada — NO obligatoria */}
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
                <button type="button" onClick={() => setShowModal(false)} style={s.cancelBtn}>Cancelar</button>
                <button type="submit" style={s.submitBtn}>Enviar reporte</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: DETALLE DEL TICKET ── */}
      {selectedTicket && !reassignTicketId && (
        <div style={s.overlay} onClick={() => setSelectedTicket(null)}>
          <div style={{ ...s.modal, maxWidth: '620px', maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
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
                <h2 style={s.modalTitle}>{selectedTicket.title}</h2>
              </div>
              <button onClick={() => setSelectedTicket(null)} style={s.closeBtn}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
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
                  onClick={() => handleStatusChange(selectedTicket.id, nextStatus(selectedTicket.status))}
                >
                  {nextStatusLabel(selectedTicket.status)}
                </button>
                <button
                  style={{ ...s.statusBtn, backgroundColor: '#F0FDF4', borderColor: '#BBF7D0', color: '#059669' }}
                  onClick={() => setReassignTicketId(selectedTicket.id)}
                >
                  {selectedTicket.agentId ? 'Reasignar agente' : 'Asignar agente'}
                </button>
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
                        <span style={{ fontSize: '12px', fontWeight: '700', color: '#2563EB' }}>
                          {c.autor?.name || c.user?.name || user.name || 'Usuario'}
                        </span>
                        <span style={{ fontSize: '11px', color: '#94A3B8' }}>{formatDateTime(c.createdAt)}</span>
                      </div>
                      <p style={{ margin: 0, fontSize: '13px', color: '#374151', lineHeight: '1.5' }}>{c.content}</p>
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
      )}

      {/* ── MODAL: REASIGNAR AGENTE ── */}
      {reassignTicketId && selectedTicket && (
        <div style={s.overlay} onClick={() => setReassignTicketId(null)}>
          <div style={{ ...s.modal, maxWidth: '400px' }} onClick={(e) => e.stopPropagation()}>
            <div style={s.modalHead}>
              <div>
                <h2 style={s.modalTitle}>{selectedTicket.agentId ? 'Reasignar agente' : 'Asignar agente'}</h2>
                <p style={s.modalSub}>Selecciona el agente para este ticket</p>
              </div>
              <button onClick={() => setReassignTicketId(null)} style={s.closeBtn}>
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
                    onClick={() => handleAssignAgent(reassignTicketId, agent.id)}
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
                  onClick={() => handleAssignAgent(reassignTicketId, null)}
                  style={{ ...s.cancelBtn, marginTop: '4px', width: '100%', textAlign: 'center', color: '#EF4444', borderColor: '#FCA5A5' }}
                >
                  Quitar asignación
                </button>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

/* ─────────────────────────────────────────────────────────── ESTILOS ── */
const s = {
  root: { display: 'flex', minHeight: '100vh', backgroundColor: '#F1F5F9', fontFamily: "'Inter', -apple-system, sans-serif" },
  sidebar: { width: '240px', minWidth: '240px', backgroundColor: '#0F172A', display: 'flex', flexDirection: 'column', padding: '0', position: 'sticky', top: 0, height: '100vh' },
  sidebarBrand: { display: 'flex', alignItems: 'center', gap: '10px', padding: '24px 20px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' },
  brandIcon: { width: '36px', height: '36px', backgroundColor: '#2563EB', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  brandName: { fontWeight: '700', fontSize: '15px', color: '#F8FAFC', letterSpacing: '-0.3px' },
  nav: { padding: '16px 12px', flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' },
  navItem: { display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '8px', color: '#94A3B8', fontSize: '13.5px', cursor: 'pointer', transition: 'background 0.15s' },
  navItemActive: { display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '8px', backgroundColor: '#1E3A5F', color: '#60A5FA', fontSize: '13.5px', fontWeight: '600', cursor: 'pointer' },
  sidebarFooter: { display: 'flex', alignItems: 'center', gap: '10px', padding: '16px 16px', borderTop: '1px solid rgba(255,255,255,0.06)' },
  sidebarAvatar: { width: '34px', height: '34px', minWidth: '34px', backgroundColor: '#2563EB', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '700', color: '#fff' },
  sidebarName: { fontSize: '13px', fontWeight: '600', color: '#F1F5F9', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  sidebarEmail: { fontSize: '11px', color: '#64748B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  sidebarLogout: { background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' },
  main: { flex: 1, padding: '32px 36px', display: 'flex', flexDirection: 'column', gap: '24px', minWidth: 0 },
  topbar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  pageTitle: { fontSize: '22px', fontWeight: '700', color: '#0F172A', margin: 0 },
  pageSubtitle: { fontSize: '13px', color: '#94A3B8', margin: '4px 0 0', textTransform: 'capitalize' },
  topbarRight: { display: 'flex', alignItems: 'center', gap: '12px' },
  roleAdmin: { fontSize: '11px', fontWeight: '700', letterSpacing: '0.5px', backgroundColor: '#FEF3C7', color: '#B45309', padding: '4px 10px', borderRadius: '20px' },
  roleUser: { fontSize: '11px', fontWeight: '700', letterSpacing: '0.5px', backgroundColor: '#DBEAFE', color: '#1D4ED8', padding: '4px 10px', borderRadius: '20px' },
  primaryBtn: { display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#2563EB', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: '8px', fontSize: '13.5px', fontWeight: '600', cursor: 'pointer', boxShadow: '0 1px 3px rgba(37,99,235,0.3)' },
  metricsRow: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' },
  metricCard: { backgroundColor: '#fff', borderRadius: '12px', overflow: 'hidden', display: 'flex', alignItems: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', position: 'relative' },
  metricBar: { width: '4px', height: '100%', minHeight: '80px', flexShrink: 0 },
  metricInner: { flex: 1, padding: '18px 16px' },
  metricLabel: { fontSize: '11px', fontWeight: '700', color: '#94A3B8', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '6px' },
  metricValue: { fontSize: '30px', fontWeight: '800', lineHeight: 1 },
  metricIcon: { width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '16px', fontSize: '18px', flexShrink: 0 },
  tableCard: { backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', overflow: 'hidden' },
  tableHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px 16px', borderBottom: '1px solid #F1F5F9', flexWrap: 'wrap', gap: '12px' },
  tableTitle: { fontSize: '16px', fontWeight: '700', color: '#0F172A', margin: 0 },
  filterRow: { display: 'flex', gap: '6px' },
  filterSelect: { padding: '6px 12px', borderRadius: '20px', border: '1px solid #E2E8F0', backgroundColor: '#fff', color: '#374151', fontSize: '12.5px', cursor: 'pointer', outline: 'none' },
  chip: { padding: '6px 14px', borderRadius: '20px', border: '1px solid #E2E8F0', backgroundColor: 'transparent', color: '#64748B', fontSize: '12.5px', cursor: 'pointer', fontWeight: '500' },
  chipActive: { padding: '6px 14px', borderRadius: '20px', border: '1px solid #2563EB', backgroundColor: '#EFF6FF', color: '#2563EB', fontSize: '12.5px', cursor: 'pointer', fontWeight: '600' },
  tableScroll: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', minWidth: '900px' },
  th: { padding: '10px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: '#94A3B8', letterSpacing: '0.5px', textTransform: 'uppercase', backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', whiteSpace: 'nowrap' },
  tr: { borderBottom: '1px solid #F1F5F9', transition: 'background 0.1s' },
  tdMono: { padding: '14px 16px', fontFamily: 'monospace', fontSize: '12px', color: '#2563EB', fontWeight: '600', whiteSpace: 'nowrap' },
  tdMain: { padding: '14px 16px', minWidth: '200px' },
  tdTitle: { fontSize: '13.5px', fontWeight: '600', color: '#0F172A', marginBottom: '2px' },
  tdSub: { fontSize: '12px', color: '#94A3B8', lineHeight: '1.4' },
  tdText: { padding: '14px 16px', fontSize: '13px', color: '#374151', whiteSpace: 'nowrap' },
  emptyCell: { padding: '48px 16px', textAlign: 'center' },
  emptyState: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', color: '#CBD5E1', fontSize: '14px' },
  authorChip: { display: 'flex', alignItems: 'center', gap: '8px' },
  authorAvatar: { width: '28px', height: '28px', backgroundColor: '#EFF6FF', color: '#2563EB', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '700', flexShrink: 0 },
  categoryTag: { backgroundColor: '#F1F5F9', color: '#475569', padding: '3px 8px', borderRadius: '4px', fontSize: '11.5px', fontWeight: '500' },
  statusBadge: { display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' },
  statusDot: { width: '6px', height: '6px', borderRadius: '50%', flexShrink: 0 },
  statusBtn: { backgroundColor: 'transparent', border: '1px solid #E2E8F0', color: '#374151', padding: '5px 10px', borderRadius: '6px', fontSize: '11.5px', fontWeight: '500', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s' },
  configRow: { display: 'flex', flexDirection: 'column', gap: '4px', padding: '12px 0', borderBottom: '1px solid #F1F5F9' },
  configLabel: { fontSize: '11px', fontWeight: '700', color: '#94A3B8', letterSpacing: '0.5px' },
  configValue: { fontSize: '14px', fontWeight: '500', color: '#0F172A' },
  overlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(3px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  modal: { backgroundColor: '#fff', borderRadius: '16px', padding: '32px', width: '100%', maxWidth: '480px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' },
  modalHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' },
  modalTitle: { fontSize: '18px', fontWeight: '700', color: '#0F172A', margin: '0 0 4px' },
  modalSub: { fontSize: '13px', color: '#94A3B8', margin: 0 },
  closeBtn: { background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: '2px', display: 'flex' },
  errorBox: { display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#FEF2F2', color: '#DC2626', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', marginBottom: '18px' },
  field: { display: 'flex', flexDirection: 'column', gap: '6px' },
  fieldLabel: { fontSize: '12px', fontWeight: '600', color: '#475569', letterSpacing: '0.3px' },
  fieldInput: { padding: '10px 14px', borderRadius: '8px', border: '1.5px solid #E2E8F0', fontSize: '13.5px', color: '#0F172A', outline: 'none', backgroundColor: '#F8FAFC', width: '100%', boxSizing: 'border-box' },
  cancelBtn: { padding: '10px 20px', borderRadius: '8px', border: '1.5px solid #E2E8F0', backgroundColor: 'transparent', color: '#64748B', fontSize: '13.5px', fontWeight: '600', cursor: 'pointer' },
  submitBtn: { flex: 1, padding: '10px 20px', borderRadius: '8px', border: 'none', backgroundColor: '#2563EB', color: '#fff', fontSize: '13.5px', fontWeight: '600', cursor: 'pointer', boxShadow: '0 1px 3px rgba(37,99,235,0.3)' },
  infoBlock: { display: 'flex', flexDirection: 'column', gap: '3px', padding: '10px 12px', backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' },
  infoLabel: { fontSize: '10px', fontWeight: '700', color: '#94A3B8', letterSpacing: '0.5px', textTransform: 'uppercase' },
  infoValue: { fontSize: '13.5px', fontWeight: '500', color: '#0F172A' },
  commentBubble: { padding: '10px 14px', backgroundColor: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0' },
};

export default Dashboard;
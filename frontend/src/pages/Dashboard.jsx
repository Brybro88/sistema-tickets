import { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import TicketForm from '../components/TicketForm';

const Dashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const [tickets, setTickets] = useState([]);
  
  // Estados exclusivos del Admin
  const [adminRegisterData, setAdminRegisterData] = useState({ name: '', email: '', password: '', role: 'usuario' });
  const [newCatName, setNewCatName] = useState('');

  const fetchTickets = async () => {
    const { data } = await axios.get('http://localhost:5000/api/tickets');
    setTickets(data);
  };

  useEffect(() => { fetchTickets(); }, []);

  // Calcular cuántos días lleva abierto
  const calculateDaysOpen = (createdAt, status) => {
    const created = new Date(createdAt);
    const today = new Date();
    const diffTime = Math.abs(today - created);
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  };

  const handleAdminRegister = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/auth/register-by-admin', adminRegisterData);
      alert(`¡${adminRegisterData.role} registrado con éxito!`);
      setAdminRegisterData({ name: '', email: '', password: '', role: 'usuario' });
    } catch (error) { alert('Error al registrar usuario'); }
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    await axios.post('http://localhost:5000/api/categories', { name: newCatName, subcategories: [] });
    setNewCatName('');
    alert('Categoría creada');
  };

  return (
    <div style={{ padding: '20px' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between' }}>
        <h2>Panel de Control - Rol: {user.role.toUpperCase()}</h2>
        <button onClick={logout}>Cerrar Sesión</button>
      </header>

      <div style={{ display: 'flex', gap: '40px', marginTop: '20px' }}>
        
        {/* LADO IZQUIERDO: ACCIONES SEGÚN ROL */}
        <div style={{ flex: 1 }}>
          {user.role === 'usuario' && <TicketForm onTicketCreated={fetchTickets} />}
          
          {user.role === 'sysadmin' && (
            <div>
              <h3>⚙️ Herramientas de Sysadmin</h3>
              <form onSubmit={handleAdminRegister} style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '20px' }}>
                <h4>Crear Nuevo Usuario/Agente/Admin</h4>
                <input type="text" placeholder="Nombre" value={adminRegisterData.name} onChange={e => setAdminRegisterData({...adminRegisterData, name: e.target.value})} required />
                <input type="email" placeholder="Correo" value={adminRegisterData.email} onChange={e => setAdminRegisterData({...adminRegisterData, email: e.target.value})} required />
                <input type="password" placeholder="Contraseña" value={adminRegisterData.password} onChange={e => setAdminRegisterData({...adminRegisterData, password: e.target.value})} required />
                <select value={adminRegisterData.role} onChange={e => setAdminRegisterData({...adminRegisterData, role: e.target.value})}>
                  <option value="usuario">Usuario</option>
                  <option value="agente">Agente</option>
                  <option value="sysadmin">Sysadmin</option>
                </select>
                <button type="submit">Registrar Cuenta</button>
              </form>

              <form onSubmit={handleCreateCategory}>
                <h4>Agregar Categoría</h4>
                <input type="text" placeholder="Nombre Categoría" value={newCatName} onChange={e => setNewCatName(e.target.value)} required />
                <button type="submit">Guardar Categoría</button>
              </form>
            </div>
          )}

          {(user.role === 'agente' || user.role === 'sysadmin') && (
            <div style={{ marginTop: '20px' }}>
              <Link to="/reports"><button style={{ padding: '10px 20px', background: '#007bff', color: 'white', border: 'none', cursor: 'pointer' }}>📈 Ir a Reportes de Tickets</button></Link>
            </div>
          )}
        </div>

        {/* LADO DERECHO: TABLA DE TICKETS */}
        <div style={{ flex: 2 }}>
          <h3>Lista de Tickets {user.role === 'sysadmin' && '(Totales Admin)'}</h3>
          <table border="1" cellPadding="10" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th>Título</th>
                <th>Estado</th>
                <th>Subcategoría</th>
                <th>Días Abierto</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map(t => (
                <tr key={t._id}>
                  <td>{t.title}</td>
                  <td><strong>{t.status}</strong></td>
                  <td>{t.subcategory === 'otro' ? `Otro: ${t.subcategoryOtherDescription}` : t.subcategory}</td>
                  <td>{calculateDaysOpen(t.createdAt)} días</td>
                  <td><Link to={`/ticket/${t._id}`}>Ver Detalle</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
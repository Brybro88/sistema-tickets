import { useState, useEffect } from 'react';
import axios from 'axios';

const Reports = () => {
  const [tickets, setTickets] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');

  const fetchFilteredTickets = async () => {
    const url = statusFilter ? `http://localhost:5000/api/tickets?status=${statusFilter}` : 'http://localhost:5000/api/tickets';
    const { data } = await axios.get(url);
    setTickets(data);
  };

  useEffect(() => { fetchFilteredTickets(); }, [statusFilter]);

  return (
    <div style={{ padding: '20px' }}>
      <h2>📈 Reporte Avanzado de Tickets</h2>
      <div style={{ marginBottom: '20px' }}>
        <label>Filtrar por Estado: </label>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">Todos los estados</option>
          <option value="abierto">Abiertos</option>
          <option value="en proceso">En proceso</option>
          <option value="cerrado">Cerrados</option>
        </select>
      </div>

      <table border="1" cellPadding="10" style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th>Usuario</th>
            <th>Título</th>
            <th>Agente Asignado</th>
            <th>Categoría</th>
            <th>Fecha de Creación</th>
          </tr>
        </thead>
        <tbody>
          {tickets.map(t => (
            <tr key={t._id}>
              <td>{t.user?.name} ({t.user?.email})</td>
              <td>{t.title}</td>
              <td>{t.agent ? t.agent.name : 'Sin Asignar'}</td>
              <td>{t.category?.name}</td>
              <td>{new Date(t.createdAt).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Reports;
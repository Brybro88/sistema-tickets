import { useEffect, useState, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import CommentSection from '../components/CommentSection';

const TicketDetail = () => {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const [ticket, setTicket] = useState(null);
  const [status, setStatus] = useState('');

  useEffect(() => {
    const fetchTicket = async () => {
      const { data } = await axios.get(`http://localhost:5000/api/tickets`);
      const current = data.find(t => t._id === id);
      setTicket(current);
      if (current) setStatus(current.status);
    };
    fetchTicket();
  }, [id]);

  const handleUpdate = async () => {
    try {
      await axios.put(`http://localhost:5000/api/tickets/${id}`, { status });
      alert('Ticket actualizado con éxito');
    } catch (error) { alert('Error al actualizar'); }
  };

  if (!ticket) return <p>Cargando ticket...</p>;

  return (
    <div style={{ padding: '20px' }}>
      <Link to="/dashboard">⬅️ Volver al Dashboard</Link>
      <h2>{ticket.title}</h2>
      <p><strong>Descripción:</strong> {ticket.description}</p>
      <p><strong>Categoría:</strong> {ticket.category?.name} ({ticket.subcategory})</p>
      
      {/* Controles para Agente y Sysadmin */}
      {user.role !== 'usuario' ? (
        <div style={{ margin: '15px 0' }}>
          <label><strong>Cambiar Estado: </strong></label>
          <select value={status} onChange={e => setStatus(e.target.value)}>
            <option value="abierto">Abierto</option>
            <option value="en proceso">En proceso</option>
            <option value="cerrado">Cerrado</option>
          </select>
          <button onClick={handleUpdate} style={{ marginLeft: '10px' }}>Guardar</button>
        </div>
      ) : (
        <p><strong>Estado Actual:</strong> {status}</p>
      )}

      <CommentSection ticketId={id} />
    </div>
  );
};

export default TicketDetail;
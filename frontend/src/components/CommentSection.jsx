import { useState, useEffect } from 'react';
import axios from 'axios';

const CommentSection = ({ ticketId }) => {
  const [comments, setComments] = useState([]);
  const [newMessage, setNewMessage] = useState('');

  const fetchComments = async () => {
    const token = localStorage.getItem('token');
    const { data } = await axios.get(`http://localhost:5000/api/tickets/${ticketId}/comments`, { headers: { Authorization: `Bearer ${token}` } });
    setComments(data);
  };
  

  useEffect(() => { fetchComments(); }, [ticketId]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    await axios.post(`http://localhost:5000/api/tickets/${ticketId}/comments`, { message: newMessage });
    setNewMessage('');
    fetchComments();
  };

  return (
    <div style={{ marginTop: '20px', borderTop: '1px solid #ccc', paddingTop: '10px' }}>
      <h4>Comentarios</h4>
      <div style={{ maxHeight: '200px', overflowY: 'auto', marginBottom: '10px' }}>
        {comments.map(c => (
          <p key={c.id}><strong>{c.autor?.name} ({c.autor?.role}):</strong> {c.message}</p>
        ))}
      </div>
      <form onSubmit={handleSend}>
        <input type="text" value={newMessage} onChange={e => setNewMessage(e.target.value)} placeholder="Escribe un comentario..." />
        <button type="submit">Enviar</button>
      </form>
    </div>
  );
};

export default CommentSection;
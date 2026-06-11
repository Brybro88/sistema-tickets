import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      // Petición a tu Backend en Node con Postgres
      const res = await axios.post('http://localhost:5000/api/auth/login', { email, password });
      
      // Guardar sesión en el navegador
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      
      // Brincar al panel de tickets
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Credenciales inválidas');
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Iniciar Sesión</h2>
        
        {error && <p style={styles.error}>{error}</p>}

        <form onSubmit={handleLogin} style={styles.form}>
          <input 
            type="email" 
            placeholder="Correo" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            style={styles.input}
            required
          />
          <input 
            type="password" 
            placeholder="Contraseña" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            style={styles.input}
            required
          />
          <button type="submit" style={styles.button}>Entrar</button>
        </form>

        {/* Enlace para alternar pantallas */}
        <p style={styles.switchText}>
          ¿No tienes una cuenta? <Link to="/register" style={styles.link}>Regístrate aquí</Link>
        </p>
      </div>
    </div>
  );
};

const styles = {
  container: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#121214', color: '#fff', fontFamily: 'sans-serif' },
  card: { backgroundColor: '#202024', padding: '40px', borderRadius: '8px', boxShadow: '0 4px 10px rgba(0,0,0,0.3)', width: '320px', textAlign: 'center' },
  title: { marginBottom: '20px', fontSize: '24px' },
  form: { display: 'flex', flexDirection: 'column', gap: '12px' },
  input: { padding: '12px', borderRadius: '4px', border: '1px solid #323238', backgroundColor: '#121214', color: '#fff', fontSize: '14px' },
  button: { padding: '12px', borderRadius: '4px', border: 'none', backgroundColor: '#4b5563', color: '#fff', fontSize: '16px', cursor: 'pointer', fontWeight: 'bold' },
  error: { color: '#f75a68', fontSize: '14px', marginBottom: '10px' },
  switchText: { marginTop: '20px', fontSize: '14px', color: '#a8a8b3' },
  link: { color: '#81a1c1', textDecoration: 'none', fontWeight: 'bold' }
};

export default Login;
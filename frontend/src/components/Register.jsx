import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await axios.post('http://localhost:5000/api/auth/register', { name, email, password, role: 'usuario' });
      setSuccess('¡Cuenta creada con éxito corporativo!');
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al procesar el registro');
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.logoContainer}>
        <div style={styles.logoIcon}>♊</div>
        <h1 style={styles.logoText}>TechSupport <span style={{color: '#4f4f5f'}}>Hub</span></h1>
      </div>

      <div style={styles.card}>
        <h2 style={styles.title}>Crear una cuenta</h2>
        <p style={styles.subtitle}>Registra tus datos para solicitar acceso al portal de soporte técnico corporativo.</p>
        
        {error && <p style={styles.error}>{error}</p>}
        {success && <p style={styles.success}>{success}</p>}

        <form onSubmit={handleRegister} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>NOMBRE COMPLETO</label>
            <div style={styles.inputWrapper}>
              <span style={styles.icon}>👤</span>
              <input type="text" placeholder="Ej. Bastián García" value={name} onChange={(e) => setName(e.target.value)} style={styles.input} required />
            </div>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>CORREO ELECTRÓNICO</label>
            <div style={styles.inputWrapper}>
              <span style={styles.icon}>✉</span>
              <input type="email" placeholder="tu@correo.com" value={email} onChange={(e) => setEmail(e.target.value)} style={styles.input} required />
            </div>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>CONTRASEÑA</label>
            <div style={styles.inputWrapper}>
              <span style={styles.icon}>🔒</span>
              <input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} style={styles.input} required />
            </div>
          </div>

          <button type="submit" style={styles.button}>Registrar Cuenta</button>
        </form>

        <p style={styles.switchText}>
          ¿Ya tienes una cuenta? <Link to="/login" style={styles.link}>Inicia sesión aquí</Link>
        </p>
      </div>
    </div>
  );
};

const styles = {
  container: { display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#090a0f', color: '#fff', fontFamily: "'Inter', sans-serif" },
  logoContainer: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '30px' },
  logoIcon: { backgroundColor: '#6d28d9', padding: '6px 12px', borderRadius: '12px', fontSize: '20px', boxShadow: '0 0 15px rgba(109, 40, 217, 0.5)' },
  logoText: { fontSize: '24px', fontWeight: 'bold', letterSpacing: '0.5px' },
  card: { backgroundColor: '#0d0e16', border: '1px solid #161925', padding: '40px', borderRadius: '20px', width: '100%', maxWidth: '420px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' },
  title: { fontSize: '22px', fontWeight: 'bold', marginBottom: '8px', textAlign: 'left' },
  subtitle: { fontSize: '14px', color: '#71717a', marginBottom: '25px', textAlign: 'left', lineHeight: '1.4' },
  form: { display: 'flex', flexDirection: 'column', gap: '20px' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '8px' },
  label: { fontSize: '11px', fontWeight: 'bold', color: '#a1a1aa', letterSpacing: '0.5px', textAlign: 'left' },
  inputWrapper: { position: 'relative', display: 'flex', alignItems: 'center' },
  icon: { position: 'absolute', left: '15px', color: '#71717a', fontSize: '16px' },
  input: { width: '100%', padding: '14px 14px 14px 45px', borderRadius: '12px', border: '1px solid #1f2235', backgroundColor: '#141622', color: '#fff', fontSize: '14px', outline: 'none', boxSizing: 'border-box' },
  button: { width: '100%', padding: '15px', borderRadius: '12px', border: 'none', backgroundColor: '#6d28d9', color: '#fff', fontSize: '15px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(109, 40, 217, 0.3)' },
  error: { color: '#ef4444', fontSize: '13px', backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: '10px', borderRadius: '8px', marginBottom: '15px', textAlign: 'left' },
  success: { color: '#10b981', fontSize: '13px', backgroundColor: 'rgba(16, 185, 129, 0.1)', padding: '10px', borderRadius: '8px', marginBottom: '15px', textAlign: 'left' },
  switchText: { marginTop: '25px', fontSize: '12px', color: '#71717a', textAlign: 'center' },
  link: { color: '#6366f1', textDecoration: 'none', fontWeight: 'bold' }
};

export default Register;
import React, { useState, useContext } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Credenciales corporativas inválidas');
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.logoContainer}>
        <div style={styles.logoIcon}>♊</div>
        <h1 style={styles.logoText}>TechSupport <span style={{ color: '#71717a' }}>Hub</span></h1>
      </div>

      <div style={styles.card}>
        <h2 style={styles.title}>Iniciar Sesión</h2>
        <p style={styles.subtitle}>Ingresa tus credenciales corporativas para acceder a tu panel de soporte.</p>

        {error && <p style={styles.error}>{error}</p>}

        <form onSubmit={handleLogin} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>CORREO ELECTRÓNICO</label>
            <div style={styles.inputWrapper}>
              <span style={styles.icon}>✉</span>
              <input
                type="email"
                placeholder="superadmin@correo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={styles.input}
                required
              />
            </div>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>CONTRASEÑA</label>
            <div style={styles.inputWrapper}>
              <span style={styles.icon}>🔒</span>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={styles.input}
                required
              />
            </div>
          </div>

          <button type="submit" style={styles.button} disabled={loading}>
            {loading ? 'Verificando...' : 'Iniciar Sesión'}
          </button>
        </form>

        <p style={styles.switchText}>
          ¿No tienes una cuenta registrada? <Link to="/register" style={styles.link}>Regístrate aquí</Link>
        </p>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#090a0f',
    color: '#f4f4f5',
    fontFamily: "'Inter', sans-serif",
  },
  logoContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '32px',
  },
  logoIcon: {
    backgroundColor: '#6d28d9',
    padding: '10px 12px',
    borderRadius: '14px',
    fontSize: '22px',
    color: '#fff',
  },
  logoText: {
    fontSize: '26px',
    fontWeight: '700',
    color: '#f4f4f5',
    letterSpacing: '0.3px',
    margin: 0,
  },
  card: {
    backgroundColor: '#0d0e16',
    border: '1px solid #1c1e2e',
    padding: '40px 36px',
    borderRadius: '20px',
    width: '100%',
    maxWidth: '430px',
  },
  title: {
    fontSize: '24px',
    fontWeight: '700',
    marginBottom: '8px',
    marginTop: 0,
    color: '#f4f4f5',
    textAlign: 'left',
  },
  subtitle: {
    fontSize: '14px',
    color: '#71717a',
    marginBottom: '28px',
    marginTop: 0,
    lineHeight: '1.5',
    textAlign: 'left',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  label: {
    fontSize: '11px',
    fontWeight: '600',
    color: '#a1a1aa',
    letterSpacing: '0.8px',
    textTransform: 'uppercase',
  },
  inputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  icon: {
    position: 'absolute',
    left: '14px',
    color: '#52525b',
    fontSize: '16px',
    pointerEvents: 'none',
  },
  input: {
    width: '100%',
    padding: '13px 14px 13px 44px',
    borderRadius: '12px',
    border: '1px solid #1f2235',
    backgroundColor: '#141622',
    color: '#f4f4f5',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s',
  },
  button: {
    width: '100%',
    padding: '14px',
    borderRadius: '12px',
    border: 'none',
    backgroundColor: '#7c3aed',
    color: '#fff',
    fontSize: '15px',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    marginTop: '4px',
  },
  error: {
    color: '#f87171',
    fontSize: '13px',
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    border: '1px solid rgba(239, 68, 68, 0.2)',
    padding: '10px 14px',
    borderRadius: '10px',
    marginBottom: '16px',
    marginTop: 0,
    textAlign: 'left',
  },
  switchText: {
    marginTop: '24px',
    fontSize: '13px',
    color: '#71717a',
    textAlign: 'center',
  },
  link: {
    color: '#818cf8',
    textDecoration: 'none',
    fontWeight: '600',
  },
};

export default Login;
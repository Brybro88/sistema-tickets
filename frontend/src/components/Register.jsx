import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('usuario');
  const [authCode, setAuthCode] = useState('');
  const [specialties, setSpecialties] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const needsAuthCode = role === 'agente' || role === 'sysadmin';

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

  const handleCheckboxChange = (spec) => {
    if (specialties.includes(spec)) {
      setSpecialties(specialties.filter(item => item !== spec));
    } else {
      setSpecialties([...specialties, spec]);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const payload = { name, email, password, role };
      if (needsAuthCode) {
        payload.authCode = authCode;
      }
      if (role === 'agente') {
        payload.specialties = specialties;
      }
      await axios.post('http://localhost:5000/api/auth/register', payload);
      setSuccess('¡Cuenta creada con éxito!');
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al procesar el registro');
    }
  };

  const roleLabels = {
    usuario: { label: 'Usuario', desc: 'Reporta incidencias y da seguimiento a sus tickets.' },
    agente: { label: 'Agente de Soporte', desc: 'Atiende y gestiona tickets asignados.' },
    sysadmin: { label: 'Administrador', desc: 'Acceso total: usuarios, categorías y reportes.' },
  };

  return (
    <div style={styles.container}>
      <div style={styles.logoContainer}>
        <div style={styles.logoIcon}>♊</div>
        <h1 style={styles.logoText}>TechSupport <span style={{ color: '#4f4f5f' }}>Hub</span></h1>
      </div>

      <div style={styles.card}>
        <h2 style={styles.title}>Crear una cuenta</h2>
        <p style={styles.subtitle}>
          Registra tus datos institucionales para acceder al portal de soporte técnico.
        </p>

        {error && <p style={styles.error}>{error}</p>}
        {success && <p style={styles.success}>{success}</p>}

        <form onSubmit={handleRegister} style={styles.form}>
          {/* Selector de Rol */}
          <div style={styles.inputGroup}>
            <label style={styles.label}>TIPO DE CUENTA</label>
            <div style={styles.roleGrid}>
              {Object.entries(roleLabels).map(([key, { label, desc }]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => { setRole(key); setAuthCode(''); setError(''); }}
                  style={role === key ? styles.roleCardActive : styles.roleCard}
                >
                  <span style={styles.roleCardIcon}>
                    {key === 'usuario' ? '👤' : key === 'agente' ? '🛠️' : '⚙️'}
                  </span>
                  <span style={styles.roleCardLabel}>{label}</span>
                  <span style={styles.roleCardDesc}>{desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Nombre */}
          <div style={styles.inputGroup}>
            <label style={styles.label}>NOMBRE COMPLETO</label>
            <div style={styles.inputWrapper}>
              <span style={styles.icon}>👤</span>
              <input
                type="text"
                placeholder="Ej. Bastián García"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={styles.input}
                required
              />
            </div>
          </div>

          {/* Email */}
          <div style={styles.inputGroup}>
            <label style={styles.label}>CORREO INSTITUCIONAL</label>
            <div style={styles.inputWrapper}>
              <span style={styles.icon}>✉</span>
              <input
                type="email"
                placeholder="tu_usuario@itsrll.edu.mx"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={styles.input}
                required
              />
            </div>
            <span style={styles.hint}>Solo correos que contengan @itsrll</span>
          </div>

          {/* Password */}
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

          {/* Auth Code — Solo para Agente y Sysadmin */}
          {needsAuthCode && (
            <div style={styles.inputGroup}>
              <label style={styles.label}>CÓDIGO DE AUTORIZACIÓN</label>
              <div style={styles.inputWrapper}>
                <span style={styles.icon}>🔑</span>
                <input
                  type="password"
                  placeholder="Ingresa el PIN proporcionado por el administrador"
                  value={authCode}
                  onChange={(e) => setAuthCode(e.target.value)}
                  style={styles.input}
                  required
                />
              </div>
              <span style={styles.hint}>
                Solicita este código al administrador del sistema para registrarte como {roleLabels[role].label}.
              </span>
            </div>
          )}

          {/* Especialidades — Solo para Agente */}
          {role === 'agente' && (
            <div style={styles.inputGroup}>
              <label style={styles.label}>ESPECIALIDADES</label>
              <div style={styles.specialtiesWrapper}>
                {availableSpecialties.map(spec => (
                  <label key={spec} style={styles.specialtyLabel}>
                    <input
                      type="checkbox"
                      checked={specialties.includes(spec)}
                      onChange={() => handleCheckboxChange(spec)}
                      style={styles.checkbox}
                    />
                    {spec}
                  </label>
                ))}
              </div>
            </div>
          )}

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
  container: {
    display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
    minHeight: '100vh', backgroundColor: '#090a0f', color: '#fff', fontFamily: "'Inter', sans-serif",
    padding: '24px',
  },
  logoContainer: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '30px' },
  logoIcon: {
    backgroundColor: '#6d28d9', padding: '6px 12px', borderRadius: '12px',
    fontSize: '20px', boxShadow: '0 0 15px rgba(109, 40, 217, 0.5)',
  },
  logoText: { fontSize: '24px', fontWeight: 'bold', letterSpacing: '0.5px', margin: 0 },
  card: {
    backgroundColor: '#0d0e16', border: '1px solid #161925', padding: '40px',
    borderRadius: '20px', width: '100%', maxWidth: '480px',
    boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
  },
  title: { fontSize: '22px', fontWeight: 'bold', marginBottom: '8px', marginTop: 0, textAlign: 'left' },
  subtitle: {
    fontSize: '14px', color: '#71717a', marginBottom: '25px', marginTop: 0,
    textAlign: 'left', lineHeight: '1.4',
  },
  form: { display: 'flex', flexDirection: 'column', gap: '20px' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '8px' },
  label: {
    fontSize: '11px', fontWeight: 'bold', color: '#a1a1aa',
    letterSpacing: '0.5px', textAlign: 'left',
  },
  inputWrapper: { position: 'relative', display: 'flex', alignItems: 'center' },
  icon: { position: 'absolute', left: '15px', color: '#71717a', fontSize: '16px' },
  input: {
    width: '100%', padding: '14px 14px 14px 45px', borderRadius: '12px',
    border: '1px solid #1f2235', backgroundColor: '#141622', color: '#fff',
    fontSize: '14px', outline: 'none', boxSizing: 'border-box',
    transition: 'border-color 0.2s',
  },
  hint: {
    fontSize: '11px', color: '#52525b', textAlign: 'left', lineHeight: '1.3',
  },

  // --- Role selector ---
  roleGrid: {
    display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px',
  },
  roleCard: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
    padding: '12px 8px', borderRadius: '12px', border: '1.5px solid #1f2235',
    backgroundColor: '#141622', cursor: 'pointer', transition: 'all 0.2s',
    color: '#a1a1aa', textAlign: 'center',
  },
  roleCardActive: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
    padding: '12px 8px', borderRadius: '12px', border: '1.5px solid #7c3aed',
    backgroundColor: 'rgba(124, 58, 237, 0.1)', cursor: 'pointer',
    transition: 'all 0.2s', color: '#e0e0e0', textAlign: 'center',
    boxShadow: '0 0 12px rgba(124, 58, 237, 0.15)',
  },
  roleCardIcon: { fontSize: '20px' },
  roleCardLabel: { fontSize: '12px', fontWeight: '700' },
  roleCardDesc: { fontSize: '10px', lineHeight: '1.3', color: '#71717a' },

  button: {
    width: '100%', padding: '15px', borderRadius: '12px', border: 'none',
    backgroundColor: '#6d28d9', color: '#fff', fontSize: '15px', fontWeight: 'bold',
    cursor: 'pointer', transition: 'all 0.2s',
    boxShadow: '0 4px 12px rgba(109, 40, 217, 0.3)',
  },
  error: {
    color: '#ef4444', fontSize: '13px', backgroundColor: 'rgba(239, 68, 68, 0.1)',
    padding: '10px', borderRadius: '8px', marginBottom: '15px', marginTop: 0,
    textAlign: 'left',
  },
  success: {
    color: '#10b981', fontSize: '13px', backgroundColor: 'rgba(16, 185, 129, 0.1)',
    padding: '10px', borderRadius: '8px', marginBottom: '15px', marginTop: 0,
    textAlign: 'left',
  },
  switchText: { marginTop: '25px', fontSize: '12px', color: '#71717a', textAlign: 'center' },
  link: { color: '#6366f1', textDecoration: 'none', fontWeight: 'bold' },
  specialtiesWrapper: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '10px',
    padding: '14px',
    borderRadius: '12px',
    border: '1px solid #1f2235',
    backgroundColor: '#141622',
    maxHeight: '140px',
    overflowY: 'auto',
  },
  specialtyLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '12.5px',
    color: '#a1a1aa',
    cursor: 'pointer',
  },
  checkbox: {
    accentColor: '#6d28d9',
    cursor: 'pointer',
  },
};

export default Register;
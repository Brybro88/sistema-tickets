import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';       
import Register from './components/Register'; 
import TicketForm from './components/TicketForm'; // Tu formulario existente

function App() {
  // Función simple para verificar si el usuario ya inició sesión
  const isAuthenticated = () => !!localStorage.getItem('token');

  return (
    <Router>
      <Routes>
        {/* Rutas Públicas */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Ruta Protegida: Si no hay token, te rebota al login */}
        <Route 
          path="/dashboard" 
          element={isAuthenticated() ? <TicketForm /> : <Navigate to="/login" />} 
        />

        {/* Redirección por defecto si entran a cualquier otra URL */}
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;
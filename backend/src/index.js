import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { connectDB } from './config/db.js';

// Importación de las rutas de la API
import authRoutes from './routes/auth.js';
import ticketRoutes from './routes/tickets.js';
import categoryRoutes from './routes/categories.js';
import userRoutes from './routes/users.js';

// Configuración de las variables de entorno (.env)
dotenv.config();

// Inicializamos Express
const app = express();

// --- MIDDELWARES ---
// CORS permite que tu frontend (ej. localhost:5173) haga peticiones a este backend de forma segura
app.use(cors());
// Permite que el servidor entienda los datos en formato JSON que envías desde los formularios
app.use(express.json());

// --- RUTAS DE LA API ---
app.use('/api/auth', authRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/users', userRoutes);

// Ruta de prueba para verificar que el servidor responda desde el navegador
app.get('/', (req, res) => {
  res.send('🚀 Servidor del Sistema de Tickets operando correctamente con PostgreSQL.');
});

// Definimos el puerto (usará el 5000 configurado en tu .env)
const PORT = process.env.PORT || 5000;

// Función para arrancar la aplicación completa
const startServer = async () => {
  // 1. Conectamos a PostgreSQL y creamos/sincronizamos las tablas automáticamente
  await connectDB();
  
  // 2. Encendemos el servidor para escuchar las peticiones (Esto mantendrá la terminal abierta)
  app.listen(PORT, () => {
    console.log(`Servidor backend corriendo con éxito en el puerto ${PORT}`);
    console.log(`Puedes probarlo entrando a: http://localhost:${PORT}/`);
  });
};

// Ejecutamos el arranque
startServer();
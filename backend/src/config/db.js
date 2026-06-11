import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

// Inicializamos la conexión a PostgreSQL con las variables del .env
export const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres',
    logging: false, // Evita que se sature la terminal con logs de SQL puro
  }
);

export const connectDB = async () => {
  try {
    await sequelize.authenticate();
    // sync({ alter: true }) lee tus modelos de JavaScript y crea/actualiza las tablas en Postgres
    await sequelize.sync({ alter: true });
    console.log('Conectado a PostgreSQL con éxito y tablas sincronizadas');
  } catch (error) {
    console.error('Error al conectar a PostgreSQL:', error.message);
    process.exit(1);
  }
};
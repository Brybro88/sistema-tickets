import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { protect } from '../middlewares/auth.js';

const router = express.Router();

// REGISTRO DE USUARIOS
router.post('/register', async (req, res) => {
  const { name, email, password, role } = req.body;
  try {
    // Validar si el usuario ya existe en Postgres
    const userExists = await User.findOne({ where: { email } });
    if (userExists) {
      return res.status(400).json({ message: 'El correo electrónico ya está registrado' });
    }

    // Encriptar la contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Crear usuario en la base de datos
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: role || 'usuario'
    });

    // Generar Token JWT
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '30d' });

    res.status(201).json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// INICIO DE SESIÓN (LOGIN)
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    // Buscar usuario por email en SQL
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(400).json({ message: 'Credenciales inválidas (Usuario no encontrado)' });
    }

    // Verificar contraseña
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Credenciales inválidas (Contraseña incorrecta)' });
    }

    // Generar Token JWT
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '30d' });

    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// OBTENER PERFIL ACTUAL (Ruta Protegida)
router.get('/profile', protect, async (req, res) => {
  res.json(req.user);
});

export default router;
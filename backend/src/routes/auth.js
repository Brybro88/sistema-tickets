import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { protect } from '../middlewares/auth.js';

const router = express.Router();

// REGISTRO DE USUARIOS (Público — con restricciones de dominio y PIN para roles privilegiados)
router.post('/register', async (req, res) => {
  const { name, email, password, role, authCode } = req.body;
  try {
    // 1. Validar dominio de correo institucional
    const allowedDomain = process.env.ALLOWED_EMAIL_DOMAIN || '@itsrll';
    if (!email || !email.includes(allowedDomain)) {
      return res.status(400).json({
        message: `Solo se permiten correos institucionales que contengan "${allowedDomain}" (Ej: usuario${allowedDomain}.edu.mx)`
      });
    }

    // 2. Validar si el usuario ya existe en Postgres
    const userExists = await User.findOne({ where: { email } });
    if (userExists) {
      return res.status(400).json({ message: 'El correo electrónico ya está registrado' });
    }

    // 3. Si el rol solicitado es privilegiado, verificar el código de autorización
    const requestedRole = role || 'usuario';
    if (requestedRole === 'agente' || requestedRole === 'sysadmin') {
      const adminPin = process.env.ADMIN_PIN;
      if (!authCode || authCode !== adminPin) {
        return res.status(403).json({
          message: 'Código de autorización inválido. Contacta al administrador del sistema para obtener el código.'
        });
      }
    }

    // 4. Encriptar la contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 5. Crear usuario en la base de datos
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: requestedRole
    });

    // 6. Generar Token JWT
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
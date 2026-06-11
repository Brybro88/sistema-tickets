import express from 'express';
import User from '../models/User.js';
import { protect, authorize } from '../middlewares/auth.js';

const router = express.Router();

router.get('/', protect, authorize('sysadmin', 'agente'), async (req, res) => {
  try {
    const { role } = req.query;
    const where = role ? { role } : {};
    const users = await User.findAll({
      where,
      attributes: ['id', 'name', 'email', 'role']
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// Obtener todos los usuarios (solo sysadmin)
router.get('/', protect, authorize('sysadmin'), async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'name', 'email', 'role', 'createdAt']
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Cambiar rol de usuario (solo sysadmin)
router.put('/:id/role', protect, authorize('sysadmin'), async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });
    user.role = req.body.role;
    await user.save();
    res.json(user);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

export default router;
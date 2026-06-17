import express from 'express';
import User from '../models/User.js';
import { protect, authorize } from '../middlewares/auth.js';

const router = express.Router();

// Obtener usuarios (sysadmin y agentes pueden consultar, con filtro opcional por rol)
router.get('/', protect, authorize('sysadmin', 'agente'), async (req, res) => {
  try {
    const { role } = req.query;
    const where = role ? { role } : {};
    const users = await User.findAll({
      where,
      attributes: ['id', 'name', 'email', 'role', 'specialties', 'createdAt']
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

// Actualizar especialidades de un agente (solo sysadmin)
router.put('/:id/specialties', protect, authorize('sysadmin'), async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });
    
    user.specialties = req.body.specialties || [];
    await user.save();
    res.json(user);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// ELIMINAR UN USUARIO (Solo Sysadmin)
router.delete('/:id', protect, authorize('sysadmin'), async (req, res) => {
  const { sequelize } = await import('../config/db.js');
  const t = await sequelize.transaction();
  
  try {
    const user = await User.findByPk(req.params.id, { transaction: t });
    if (!user) {
      await t.rollback();
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    const Ticket = sequelize.models.Ticket;
    const Comment = sequelize.models.Comment;
    
    if (Ticket) {
      await Ticket.update({ agentId: null }, { where: { agentId: req.params.id }, transaction: t });
      await Ticket.update({ userId: null }, { where: { userId: req.params.id }, transaction: t });
    }

    if (Comment) {
      await Comment.destroy({ where: { authorId: req.params.id }, transaction: t });
    }

    await user.destroy({ transaction: t });
    await t.commit();
    res.json({ message: 'Usuario eliminado con éxito (Transacción atómica)' });
  } catch (error) {
    await t.rollback();
    res.status(500).json({ message: 'Error crítico en base de datos. Transacción revertida.' });
  }
});

export default router;
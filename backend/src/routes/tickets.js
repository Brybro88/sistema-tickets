import express from 'express';
import Ticket from '../models/Ticket.js';
import Comment from '../models/Comment.js';
import User from '../models/User.js';
import Category from '../models/Category.js';
import { protect, authorize } from '../middlewares/auth.js';
import { Op } from 'sequelize';

const router = express.Router();

// CREAR UN NUEVO TICKET
router.post('/', protect, async (req, res) => {
  const { title, description, category, subcategory, subcategoryOtherDescription } = req.body;
  try {
    const ticket = await Ticket.create({
      title,
      description,
      subcategory,
      subcategoryOtherDescription: subcategoryOtherDescription || '',
      userId: req.user.id,        // Llave foránea del creador
      categoryId: category       // Llave foránea de la categoría
    });
    res.status(201).json(ticket);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// OBTENER TODOS LOS TICKETS (Con filtros para Reportes)
router.get('/', protect, async (req, res) => {
  const { agentId, userId, categoryId, status, start_date } = req.query;
  let whereConditions = {};

  // Restricciones de Rol en SQL
  if (req.user.role === 'usuario') {
    whereConditions.userId = req.user.id; // El usuario común solo ve lo suyo
  } else if (req.user.role === 'agente' && !agentId) {
    whereConditions.agentId = req.user.id; // El agente ve por defecto los suyos
  }

  // Filtros opcionales desde el Frontend (para reportes de Administrador o Agente)
  if (agentId) whereConditions.agentId = agentId;
  if (userId) whereConditions.userId = userId;
  if (categoryId) whereConditions.categoryId = categoryId;
  if (status) whereConditions.status = status;
  if (start_date) whereConditions.createdAt = { [Op.gte]: new Date(start_date) };

  try {
    // Reemplazamos los .populate() de Mongoose por 'include' de Sequelize
    const tickets = await Ticket.findAll({
      where: whereConditions,
      include: [
        { model: User, as: 'usuario', attributes: ['name', 'email'] },
        { model: User, as: 'agente', attributes: ['name', 'email'] },
        { model: Category, as: 'categoria', attributes: ['name'] }
      ],
      order: [['createdAt', 'DESC']] // Los más nuevos primero
    });
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ACTUALIZAR ESTADO O ASIGNAR AGENTE (Solo Agentes y Sysadmins)
router.put('/:id', protect, authorize('agente', 'sysadmin'), async (req, res) => {
  const { agentId, status } = req.body;
  try {
    const ticket = await Ticket.findByPk(req.params.id);
    if (!ticket) return res.status(404).json({ message: 'Ticket no encontrado' });

    if (agentId !== undefined) ticket.agentId = agentId || null;
    if (status) ticket.status = status;

    await ticket.save();
    res.json(ticket);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// AGREGAR UN COMENTARIO A UN TICKET
router.post('/:id/comments', protect, async (req, res) => {
  const { message } = req.body;
  try {
    const comment = await Comment.create({
      ticketId: req.params.id,
      authorId: req.user.id,
      message
    });
    res.status(201).json(comment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// OBTENER COMENTARIOS DE UN TICKET SPECÍFICO
router.get('/:id/comments', protect, async (req, res) => {
  try {
    const comments = await Comment.findAll({
      where: { ticketId: req.params.id },
      include: [{ model: User, as: 'autor', attributes: ['name', 'role'] }],
      order: [['createdAt', 'ASC']] // En orden cronológico
    });
    res.json(comments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
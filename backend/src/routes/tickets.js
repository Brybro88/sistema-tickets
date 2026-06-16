import express from 'express';
import Ticket from '../models/Ticket.js';
import Comment from '../models/Comment.js';
import User from '../models/User.js';
import Category from '../models/Category.js';
import { protect, authorize } from '../middlewares/auth.js';
import { Op } from 'sequelize';
import { GoogleGenerativeAI } from '@google/generative-ai';

const router = express.Router();

// CREAR UN NUEVO TICKET (Con Auto-Triage Híbrido)
router.post('/', protect, async (req, res) => {
  const { title, description, categoryId, subcategoryId } = req.body;
  try {
    let finalAgentId = null;
    let assignedByAi = false;

    const categoryInfo = categoryId ? await Category.findByPk(categoryId) : null;
    const categoryName = categoryInfo ? categoryInfo.name : 'General';

    const agents = await User.findAll({
      where: { role: 'agente' },
      attributes: ['id', 'name', 'specialties']
    });

    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && agents.length > 0) {
      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

        const prompt = `
Eres un sistema inteligente de asignación de tickets de soporte técnico.
Analiza la siguiente información del ticket y la lista de agentes disponibles.

Ticket:
- Título: ${title}
- Descripción: ${description || 'Sin descripción detallada'}
- Categoría: ${categoryName}
- Subcategoría: ${subcategoryId || 'N/A'}

Agentes disponibles:
${JSON.stringify(agents.map(a => ({ id: a.id, specialties: a.specialties })), null, 2)}

Instrucción:
Evalúa las especialidades (specialties) de cada agente y determina cuál es el más apto para resolver este ticket.
Devuelve ÚNICAMENTE el "id" del agente seleccionado. No incluyas JSON, comillas, ni ninguna otra palabra. 
Si ningún agente es apto, devuelve exactamente la palabra "NULL".
`;

        const timeout = (ms) => new Promise((_, reject) => setTimeout(() => reject(new Error('AI Timeout')), ms));
        const result = await Promise.race([
          model.generateContent(prompt),
          timeout(10000)
        ]);

        let aiResponse = result.response.text().trim();
        aiResponse = aiResponse.replace(/[`"']/g, '').trim();

        if (aiResponse !== 'NULL' && aiResponse !== '') {
          const validAgent = agents.find(a => String(a.id) === aiResponse);
          if (validAgent) {
            finalAgentId = validAgent.id;
            assignedByAi = true;
          }
        }
      } catch (aiError) {
        console.error('[AI Assignment] Falló la auto-asignación por IA en creación:', aiError.message);
      }
    }

    const ticket = await Ticket.create({
      title,
      description: description || '',
      subcategory: subcategoryId || '',
      userId: req.user.id,
      categoryId: categoryId || null,
      agentId: finalAgentId,
      assignedByAi
    });
    
    res.status(201).json(ticket);
  } catch (error) {
    console.error('Error al crear el ticket:', error);
    res.status(400).json({ message: error.message });
  }
});



// AUTO-TRIAGE CON IA BAJO DEMANDA (Solo Sysadmin)
router.post('/:id/auto-assign-ai', protect, authorize('sysadmin'), async (req, res) => {
  try {
    const ticket = await Ticket.findByPk(req.params.id);
    if (!ticket) return res.status(404).json({ message: 'Ticket no encontrado' });

    // 1. Obtener todas las categorías y agentes con sus especialidades de la DB
    const [categories, agents] = await Promise.all([
      Category.findAll({ attributes: ['id', 'name', 'subcategories'] }),
      User.findAll({
        where: { role: 'agente' },
        attributes: ['id', 'name', 'specialties']
      })
    ]);

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ message: 'GEMINI_API_KEY no configurado en el servidor' });
    }

    if (categories.length === 0) {
      return res.status(400).json({ message: 'No hay categorías creadas en el sistema' });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `
Eres un despachador de soporte técnico inteligente. Tu trabajo es analizar el ticket entrante y categorizarlo, además de asignar al agente más apto según sus habilidades técnicas (specialties).

Detalles del Ticket Entrante:
- Título: ${ticket.title}
- Descripción: ${ticket.description}

Categorías Disponibles en la DB:
${JSON.stringify(categories, null, 2)}

Agentes Disponibles en la DB y sus Especialidades:
${JSON.stringify(agents, null, 2)}

Instrucciones Críticas:
1. Selecciona la categoría ("categoryId") que mejor se adapte al problema.
2. Selecciona el agente ("agentId") cuyas especialidades se alineen con el problema. Si ningún agente se adapta al problema, coloca "null" en "agentId".
3. Tu respuesta debe ser ÚNICAMENTE un objeto JSON con el siguiente formato exacto:
{
  "categoryId": "UUID_DE_LA_CATEGORIA",
  "agentId": "UUID_DEL_AGENTE"
}
4. NO formatees con Markdown. NO utilices \`\`\`json ni bloques de código.
5. NO incluyas explicaciones, introducciones, ni saludos. Responde solo con el objeto JSON crudo.
`;

    const timeout = (ms) => new Promise((_, reject) => setTimeout(() => reject(new Error('AI Request Timeout')), ms));
    
    // Ejecutar con timeout de 15 segundos
    const result = await Promise.race([
      model.generateContent(prompt),
      timeout(15000)
    ]);

    const aiResponse = result.response.text().trim();
    console.log('[AI Under-Demand] Respuesta cruda de la IA:', aiResponse);

    // Limpiar posible formato markdown si la IA ignora las instrucciones
    let cleanText = aiResponse.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanText);

    // Validar categoría
    const validCategory = categories.find(c => c.id === parsed.categoryId);
    if (!validCategory) {
      return res.status(500).json({ message: `La IA devolvió un categoryId inválido: "${parsed.categoryId}"` });
    }

    // Validar agente
    let assignedAgentId = null;
    if (parsed.agentId && parsed.agentId !== 'null') {
      const validAgent = agents.find(a => a.id === parsed.agentId);
      if (validAgent) {
        assignedAgentId = validAgent.id;
      }
    }

    // Actualizar ticket
    ticket.categoryId = validCategory.id;
    ticket.agentId = assignedAgentId;
    await ticket.save();

    // Buscar el ticket actualizado con relaciones para retornar al frontend
    const updatedTicket = await Ticket.findByPk(ticket.id, {
      include: [
        { model: User, as: 'usuario', attributes: ['name', 'email'] },
        { model: User, as: 'agente', attributes: ['name', 'email'] },
        { model: Category, as: 'categoria', attributes: ['name'] }
      ]
    });

    res.json(updatedTicket);
  } catch (error) {
    console.error('[AI Under-Demand] Falló la auto-asignación por IA:', error);
    res.status(500).json({ message: error.message || 'Error en el servidor de Inteligencia Artificial' });
  }
});

// OBTENER ESTADÍSTICAS DEL DASHBOARD (Solo Agentes y Sysadmins)
router.get('/stats', protect, authorize('agente', 'sysadmin'), async (req, res) => {
  try {
    const total = await Ticket.count();
    const abiertos = await Ticket.count({ where: { status: 'abierto' } });
    const enProceso = await Ticket.count({ where: { status: 'en proceso' } });
    const resueltos = await Ticket.count({ where: { status: 'cerrado' } });
    res.json({ total, abiertos, enProceso, resueltos });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// OBTENER TODOS LOS TICKETS (Con filtros para Reportes)
router.get('/', protect, async (req, res) => {
  const { agentId, userId, categoryId, status, start_date, end_date } = req.query;
  let whereConditions = {};

  // Restricciones de Rol en SQL
  if (req.user.role === 'usuario') {
    whereConditions.userId = req.user.id; // El usuario común solo ve lo suyo
  }

  // Filtros opcionales desde el Frontend (para reportes de Administrador o Agente)
  if (agentId) whereConditions.agentId = agentId;
  if (userId) whereConditions.userId = userId;
  if (categoryId) whereConditions.categoryId = categoryId;
  if (status) whereConditions.status = status;
  
  // CORRECCIÓN DE SEGURIDAD PARA AGENTES
  // Obliga a que un agente solo pueda ver y filtrar los tickets que le pertenecen a él
  if (req.user.role === 'agente') {
    whereConditions.agentId = req.user.id;
  }
  
  if (start_date || end_date) {
    whereConditions.createdAt = {};
    if (start_date) whereConditions.createdAt[Op.gte] = new Date(start_date);
    if (end_date) {
        const endDate = new Date(end_date);
        endDate.setHours(23, 59, 59, 999);
        whereConditions.createdAt[Op.lte] = endDate;
    }
  }

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
  // Acepta tanto 'message' como 'content' para compatibilidad con el frontend
  const commentText = req.body.message || req.body.content;
  const { isInternal } = req.body;
  try {
    if (!commentText || !commentText.trim()) {
      return res.status(400).json({ message: 'El comentario no puede estar vacío' });
    }
    const comment = await Comment.create({
      ticketId: req.params.id,
      authorId: req.user.id,
      message: commentText,
      isInternal: isInternal || false
    });
    // Devolvemos el comentario con los datos del autor para actualizar la UI sin re-fetch
    const fullComment = await Comment.findByPk(comment.id, {
      include: [{ model: User, as: 'autor', attributes: ['name', 'role'] }]
    });
    res.status(201).json(fullComment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// OBTENER COMENTARIOS DE UN TICKET SPECÍFICO
router.get('/:id/comments', protect, async (req, res) => {
  try {
    let whereConditions = { ticketId: req.params.id };
    
    // Si es usuario normal, ocultar los comentarios internos
    if (req.user.role === 'usuario') {
      whereConditions.isInternal = false;
    }

    const comments = await Comment.findAll({
      where: whereConditions,
      include: [{ model: User, as: 'autor', attributes: ['name', 'role'] }],
      order: [['createdAt', 'ASC']] // En orden cronológico
    });
    res.json(comments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
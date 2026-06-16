import express from 'express';
import Category from '../models/Category.js';
import { protect, authorize } from '../middlewares/auth.js';
import { sequelize } from '../config/db.js';

const router = express.Router();

// OBTENER TODAS LAS CATEGORÍAS
router.get('/', protect, async (req, res) => {
  try {
    const categories = await Category.findAll();
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ➕ CREAR UNA NUEVA CATEGORÍA (Solo Sysadmin)
router.post('/', protect, authorize('sysadmin'), async (req, res) => {
  const { name, subcategories } = req.body;
  try {
    const category = await Category.create({ 
      name, 
      subcategories: subcategories || [] 
    });
    res.status(201).json(category);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// AGREGAR UNA SUBCATEGORÍA A UNA CATEGORÍA EXISTENTE (Solo Sysadmin)
router.put('/:id/subcategory', protect, authorize('sysadmin'), async (req, res) => {
  const { subcategoryName } = req.body;
  try {
    const category = await Category.findByPk(req.params.id);
    if (!category) return res.status(404).json({ message: 'Categoría no encontrada' });

    // array_append añade un elemento al arreglo nativo de PostgreSQL
    await category.update({
      subcategories: sequelize.fn('array_append', sequelize.col('subcategories'), subcategoryName)
    });

    // Volvemos a buscar la categoría actualizada para mandarla limpia al frontend
    const updatedCategory = await Category.findByPk(req.params.id);
    res.json(updatedCategory);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// ELIMINAR UNA SUBCATEGORÍA DE UNA CATEGORÍA EXISTENTE (Solo Sysadmin)
router.delete('/:id/subcategory/:subName', protect, authorize('sysadmin'), async (req, res) => {
  try {
    const category = await Category.findByPk(req.params.id);
    if (!category) return res.status(404).json({ message: 'Categoría no encontrada' });

    const subName = req.params.subName;

    // Actualizar subcategorías filtrando la eliminada
    const updatedSubcategories = category.subcategories.filter(sub => sub !== subName);
    await category.update({ subcategories: updatedSubcategories });

    // Desasignar esta subcategoría de los tickets existentes
    const Ticket = sequelize.models.Ticket; // Acceder al modelo Ticket de forma segura sin causar ciclos de dependencia si los hubiera
    if (Ticket) {
      await Ticket.update(
        { subcategory: '' },
        { where: { categoryId: req.params.id, subcategory: subName } }
      );
    }

    const updatedCategory = await Category.findByPk(req.params.id);
    res.json(updatedCategory);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// ELIMINAR UNA CATEGORÍA COMPLETA (Solo Sysadmin)
router.delete('/:id', protect, authorize('sysadmin'), async (req, res) => {
  try {
    const category = await Category.findByPk(req.params.id);
    if (!category) return res.status(404).json({ message: 'Categoría no encontrada' });

    // Desasignar categoría y subcategoría de todos los tickets asociados
    const Ticket = sequelize.models.Ticket;
    if (Ticket) {
      await Ticket.update(
        { categoryId: null, subcategory: '' },
        { where: { categoryId: req.params.id } }
      );
    }

    await category.destroy();
    res.json({ message: 'Categoría eliminada con éxito' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

export default router;
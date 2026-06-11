import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

const Category = sequelize.define('Category', {
  id: { 
    type: DataTypes.UUID, 
    defaultValue: DataTypes.UUIDV4, 
    primaryKey: true 
  },
  name: { 
    type: DataTypes.STRING, 
    allowNull: false, 
    unique: true 
  },
  // Arreglo de textos nativo de Postgres para almacenar subcategorías
  subcategories: { 
    type: DataTypes.ARRAY(DataTypes.STRING), 
    defaultValue: [] 
  }
}, {
  timestamps: true
});

export default Category;
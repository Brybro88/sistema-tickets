import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';
import User from './User.js';
import Category from './Category.js';

const Ticket = sequelize.define('Ticket', {
  id: { 
    type: DataTypes.UUID, 
    defaultValue: DataTypes.UUIDV4, 
    primaryKey: true 
  },
  title: { 
    type: DataTypes.STRING, 
    allowNull: false 
  },
  description: { 
    type: DataTypes.TEXT, 
    allowNull: false 
  },
  status: { 
    type: DataTypes.ENUM('abierto', 'en proceso', 'cerrado'), 
    defaultValue: 'abierto' 
  },
  subcategory: { 
    type: DataTypes.STRING, 
    allowNull: false 
  },
  subcategoryOtherDescription: { 
    type: DataTypes.STRING, 
    defaultValue: '' 
  }
}, {
  timestamps: true
});

// Definición de Llaves Foráneas (Relaciones)
Ticket.belongsTo(User, { as: 'usuario', foreignKey: 'userId' });
Ticket.belongsTo(User, { as: 'agente', foreignKey: 'agentId', constraints: false }); // Puede iniciar siendo NULL
Ticket.belongsTo(Category, { as: 'categoria', foreignKey: 'categoryId' });

export default Ticket;
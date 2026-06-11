import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';
import Ticket from './Ticket.js';
import User from './User.js';

const Comment = sequelize.define('Comment', {
  id: { 
    type: DataTypes.UUID, 
    defaultValue: DataTypes.UUIDV4, 
    primaryKey: true 
  },
  message: { 
    type: DataTypes.TEXT, 
    allowNull: false 
  }
}, {
  timestamps: true
});

// Relaciones del comentario
Comment.belongsTo(Ticket, { foreignKey: 'ticketId' });
Comment.belongsTo(User, { as: 'autor', foreignKey: 'authorId' });

export default Comment;
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  let token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: 'No autorizado, no hay token' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // En Sequelize usamos findByPk (Find By Primary Key) en lugar de findById
    req.user = await User.findByPk(decoded.id, {
      attributes: { exclude: ['password'] } // No extraemos la contraseña por seguridad
    });
    
    if (!req.user) {
      return res.status(401).json({ message: 'El usuario ya no existe' });
    }
    
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token no válido' });
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: `El rol [${req.user.role}] no tiene permisos para esta acción` });
    }
    next();
  };
};
const sequelize = require('../config/database');

const User = require('./User')(sequelize);
const Blog = require('./Blog')(sequelize);
const RefreshToken = require('./RefreshToken')(sequelize);
const TunnelConfig = require('./TunnelConfig')(sequelize);
const SuspiciousActivity = require('./SuspiciousActivity')(sequelize);

// Associations
User.hasMany(Blog, { foreignKey: 'author_id', as: 'blogs' });
Blog.belongsTo(User, { foreignKey: 'author_id', as: 'author' });

User.hasMany(RefreshToken, { foreignKey: 'user_id', as: 'tokens' });
RefreshToken.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

module.exports = { sequelize, User, Blog, RefreshToken, TunnelConfig, SuspiciousActivity };

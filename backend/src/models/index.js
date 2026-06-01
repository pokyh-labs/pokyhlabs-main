const sequelize = require('../config/database');

const User               = require('./User')(sequelize);
const Blog               = require('./Blog')(sequelize);
const Project            = require('./Project')(sequelize);
const RefreshToken       = require('./RefreshToken')(sequelize);
const SuspiciousActivity = require('./SuspiciousActivity')(sequelize);
const AccessLog          = require('./AccessLog')(sequelize);
const AuthLog            = require('./AuthLog')(sequelize);
const ErrorLog           = require('./ErrorLog')(sequelize);
const Inquiry            = require('./Inquiry')(sequelize);
const Message            = require('./Message')(sequelize);

// Associations
User.hasMany(Blog, { foreignKey: 'author_id', as: 'blogs' });
Blog.belongsTo(User, { foreignKey: 'author_id', as: 'author' });

User.hasMany(RefreshToken, { foreignKey: 'user_id', as: 'tokens' });
RefreshToken.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

Inquiry.hasMany(Message, { foreignKey: 'inquiry_id', as: 'messages', onDelete: 'CASCADE' });
Message.belongsTo(Inquiry, { foreignKey: 'inquiry_id', as: 'inquiry' });

module.exports = { sequelize, User, Blog, Project, RefreshToken, SuspiciousActivity, AccessLog, AuthLog, ErrorLog, Inquiry, Message };

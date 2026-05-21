const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const { SALT_ROUNDS, MAX_LOGIN_ATTEMPTS, LOCK_DURATION_MS } = require('../config/security');

module.exports = (sequelize) => {
  const User = sequelize.define('User', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    username: { type: DataTypes.STRING(50), allowNull: false, unique: true },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: { isEmail: true },
    },
    password_hash: { type: DataTypes.STRING(255), allowNull: false },
    role: { type: DataTypes.STRING(10), defaultValue: 'editor', allowNull: false, validate: { isIn: [['admin', 'editor']] } },
    failed_login_attempts: { type: DataTypes.INTEGER, defaultValue: 0 },
    locked_until: { type: DataTypes.DATE, allowNull: true },
    last_login: { type: DataTypes.DATE, allowNull: true },
    last_login_ip: { type: DataTypes.STRING(45), allowNull: true },
  }, {
    tableName: 'users',
    hooks: {
      beforeCreate: async (user) => {
        user.password_hash = await bcrypt.hash(user.password_hash, SALT_ROUNDS);
      },
      beforeUpdate: async (user) => {
        if (user.changed('password_hash')) {
          user.password_hash = await bcrypt.hash(user.password_hash, SALT_ROUNDS);
        }
      },
    },
  });

  User.prototype.validatePassword = async function (password) {
    return bcrypt.compare(password, this.password_hash);
  };

  User.prototype.isLocked = function () {
    return this.locked_until && new Date(this.locked_until) > new Date();
  };

  User.prototype.recordFailedLogin = async function () {
    this.failed_login_attempts += 1;
    if (this.failed_login_attempts >= MAX_LOGIN_ATTEMPTS) {
      this.locked_until = new Date(Date.now() + LOCK_DURATION_MS);
    }
    await this.save();
  };

  User.prototype.resetLoginAttempts = async function (ip) {
    this.failed_login_attempts = 0;
    this.locked_until = null;
    this.last_login = new Date();
    this.last_login_ip = ip;
    await this.save();
  };

  User.prototype.toSafeJSON = function () {
    const { password_hash, failed_login_attempts, locked_until, ...safe } = this.get({ plain: true });
    return safe;
  };

  return User;
};

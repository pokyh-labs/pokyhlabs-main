const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Project = sequelize.define('Project', {
    id:          { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    title:       { type: DataTypes.STRING(255), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: false },
    tags:        { type: DataTypes.TEXT, allowNull: false, defaultValue: '[]',
                   get() { try { return JSON.parse(this.getDataValue('tags')); } catch { return []; } },
                   set(val) { this.setDataValue('tags', JSON.stringify(Array.isArray(val) ? val : [])); } },
    url:         { type: DataTypes.STRING(500), allowNull: true },
    image_url:   { type: DataTypes.STRING(500), allowNull: true },
    image_alt:   { type: DataTypes.STRING(255), allowNull: true },
    year:        { type: DataTypes.INTEGER, allowNull: false },
    status:      { type: DataTypes.STRING(10), defaultValue: 'live', allowNull: false,
                   validate: { isIn: [['live', 'wip', 'concept']] } },
    sort_order:  { type: DataTypes.INTEGER, defaultValue: 0 },
  }, {
    tableName: 'projects',
    indexes: [
      { fields: ['status'] },
      { fields: ['sort_order'] },
    ],
  });

  return Project;
};

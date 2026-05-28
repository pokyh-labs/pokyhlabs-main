const { DataTypes } = require('sequelize');
const slugify = require('slugify');

module.exports = (sequelize) => {
  const Blog = sequelize.define('Blog', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    title: { type: DataTypes.STRING(255), allowNull: false },
    slug: { type: DataTypes.STRING(300), allowNull: false, unique: true },
    content: { type: DataTypes.TEXT('long'), allowNull: false },
    excerpt: { type: DataTypes.STRING(500), allowNull: true },
    image_url: { type: DataTypes.STRING(500), allowNull: true },
    image_alt: { type: DataTypes.STRING(255), allowNull: true },
    status: { type: DataTypes.STRING(10), defaultValue: 'draft', allowNull: false, validate: { isIn: [['draft', 'published']] } },
    author_id: { type: DataTypes.INTEGER, allowNull: false },
    published_at: { type: DataTypes.DATE, allowNull: true },
    views: { type: DataTypes.INTEGER, defaultValue: 0 },
    content_format: { type: DataTypes.STRING(10), defaultValue: 'html', allowNull: false },
    content_markdown: { type: DataTypes.TEXT('long'), allowNull: true },
  }, {
    tableName: 'blogs',
    hooks: {
      beforeValidate: async (blog) => {
        if (blog.title && !blog.slug) {
          let baseSlug = slugify(blog.title, { lower: true, strict: true });
          let slug = baseSlug;
          let counter = 1;
          while (await Blog.findOne({ where: { slug }, attributes: ['id'] })) {
            slug = `${baseSlug}-${counter++}`;
          }
          blog.slug = slug;
        }
        if (blog.changed('status') && blog.status === 'published' && !blog.published_at) {
          blog.published_at = new Date();
        }
      },
    },
    indexes: [
      { fields: ['slug'] },
      { fields: ['status'] },
      { fields: ['published_at'] },
      { fields: ['author_id'] },
    ],
  });

  return Blog;
};

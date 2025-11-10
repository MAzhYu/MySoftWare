const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.MYSQL_DATABASE,
  process.env.MYSQL_USER,
  process.env.MYSQL_PASSWORD,
  {
    host: process.env.MYSQL_HOST || '127.0.0.1',
    port: process.env.MYSQL_PORT ? parseInt(process.env.MYSQL_PORT, 10) : 3306,
    dialect: 'mysql',
    logging: false
  }
);

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log(`MySQL connected: ${sequelize.options.host}:${sequelize.options.port}`);
    // Auto sync models and add new columns when model changes
    // Note: some MySQL servers (or tables with many indexes) may reject ALTER operations
    // with ER_TOO_MANY_KEYS. Try alter first, but on that specific error fall back to
    // a non-alter sync so the app can still start (schema migration should be handled
    // separately/more carefully in production).
    try {
      await sequelize.sync({ alter: true });
    } catch (syncErr) {
      const code = (syncErr && (syncErr.parent && syncErr.parent.code)) || (syncErr && syncErr.original && syncErr.original.code);
      if (code === 'ER_TOO_MANY_KEYS') {
        console.warn('Schema alter failed due to too many index keys (ER_TOO_MANY_KEYS). Skipping alter and continuing with non-alter sync.');
        await sequelize.sync();
      } else {
        throw syncErr;
      }
    }
  } catch (error) {
    console.error('Database connection failed:', error);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };

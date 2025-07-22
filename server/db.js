const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'local_chat',
  password: 'aniket',
  port: 5432,
});

module.exports = pool;

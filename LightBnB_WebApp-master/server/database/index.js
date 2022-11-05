// Connect to database

const { Pool } = require('pg');
const pool = new Pool({
  user: 'vagrant',
  password: '123',
  host: 'localhost',
  database: 'lightbnb'
});

module.exports = {
  query: (queryString, params) => {
    return pool.query(queryString, params)
  }
}
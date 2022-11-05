const properties = require('../json/properties.json');
const users = require('../json/users.json');
const db = require('./index');
const { query } = require('express');
const res = require('express/lib/response');


/// Users

/**
 * Get a single user from the database given their email.
 * @param {String} email The email of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithEmail = function(email) {

  return db.query(`SELECT * FROM users WHERE email = $1;`, [email])
    .then(response => {
      return response.rows[0];
    })
    .catch(err => {
      console.log(err)
    });
}
exports.getUserWithEmail = getUserWithEmail;

/**
 * Get a single user from the database given their id.
 * @param {string} id The id of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithId = function(id) {
  return db.query(`SELECT * FROM users WHERE id = $1;`,[id])
    .then((response) => {
      return response.rows[0];
    })
    .catch((err)=> {
      console.log(err);
    })
}
exports.getUserWithId = getUserWithId;


/**
 * Add a new user to the database.
 * @param {{name: string, password: string, email: string}} user
 * @return {Promise<{}>} A promise to the user.
 */
const addUser =  function(user) {
  
  return db.query(`
    INSERT INTO users (name, email, password)
      VALUES($1, $2, $3)
      RETURNING *;`,[user.name, user.email, user.password])
    .then((response) => {
      return response.rows[0];
    })
    .catch((err) => {
      console.log(err);
    })
}
exports.addUser = addUser;

/// Reservations

/**
 * Get all reservations for a single user.
 * @param {string} guest_id The id of the user.
 * @return {Promise<[{}]>} A promise to the reservations.
 */
const getAllReservations = function(guest_id, limit = 10) {
  return db.query(`
    SELECT reservations.*, properties.*, avg(property_reviews.rating) as average_rating
      FROM reservations
      JOIN properties ON reservations.property_id = properties.id
      JOIN property_reviews ON reservations.property_id = property_reviews.property_id
      WHERE reservations.guest_id = $1
      GROUP BY reservations.id, properties.id
      ORDER BY reservations.start_date
      LIMIT $2;`, [guest_id, limit])
    .then((response)=> {
      console.log(response.rows);
      return response.rows;
    })
    .catch((err) => {
      return err;
    });
}
exports.getAllReservations = getAllReservations;

/// Properties

/**
 * Get all properties.
 * @param {{}} options An object containing query options.
 * @param {*} limit The number of results to return.
 * @return {Promise<[{}]>}  A promise to the properties.
 */
const getAllProperties = function(options, limit = 10) {

  // 1 escaped params
  const queryParams = [];

  // 2 CORE SQL 
  let queryString = `
  SELECT properties.*, avg(property_reviews.rating) as average_rating
    FROM properties
    JOIN property_reviews ON property_reviews.property_id = properties.id
  `;
  // 3 SQL if city is filtered
  if (options.city) {
    queryParams.push(`%${options.city}%`);
    queryString += `
    WHERE city LIKE $${queryParams.length}`;
  }

  // 4 CORE SQL
  queryString += `
    GROUP BY properties.id
  `;

  // 5 SQL if rating is filtered
  if (options.minimum_rating) {
    queryParams.push(options.minimum_rating);
    queryString += `
    HAVING avg(property_reviews.rating) >= $${queryParams.length}`
  }

  // 6 SQL if minimum cost is filtered -  input will depends whether rating was also included
  if (options.minimum_price_per_night && options.minimum_rating) {
    queryParams.push(options.minimum_price_per_night * 100);
    queryString += `
    AND cost_per_night > $${queryParams.length}
    `;
  } else if (options.minimum_price_per_night) {
    queryParams.push(options.minimum_price_per_night * 100);
    queryString += `
    HAVING cost_per_night > $${queryParams.length}
    `;
  }

  // 7 SQL if maxmum cost is filtered -  input will depends whether rating or minimum was also included
  if (options.maximum_price_per_night && (options.minimum_price_per_night || options.minimum_rating)) {
    queryParams.push(options.maximum_price_per_night * 100);
    queryString += `
    AND cost_per_night < $${queryParams.length}
    `;
  } else if (options.maximum_price_per_night) {
    queryParams.push(options.maximum_price_per_night * 100);
    queryString += `
    HAVING cost_per_night < $${queryParams.length}
    `;
  }

  // 8 CORE SQL
  queryString += `
    ORDER BY cost_per_night
  `;


  // 9 SQL if a limit is included
  queryParams.push(limit);
  
  queryString += `
    LIMIT $${queryParams.length};
  `;
      
  // Execution of query
  return db.query(queryString, queryParams)
    .then((result) => {
      return result.rows;
      })
    .catch((err) => {
      console.log(err);
    });
};
exports.getAllProperties = getAllProperties;


/**
 * Add a property to the database
 * @param {{}} property An object containing all of the property details.
 * @return {Promise<{}>} A promise to the property.
 */
const addProperty = function(property) {
  let queryParams = [property.owner_id, property.title, property.description, property.thumbnail_photo_url, property.cover_photo_url, 
    property.cost_per_night, property.parking_spaces, property.number_of_bathrooms, property.number_of_bedrooms, property.country, property.street, property.city, property.province, property.post_code]
  
  let queryString = `
    INSERT INTO properties (owner_id, title, description, thumbnail_photo_url, cover_photo_url, cost_per_night, parking_spaces, number_of_bathrooms,
       number_of_bedrooms, country, street, city, province, post_code)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *;`;
  
  return db.query(queryString, queryParams)
    .then((response)=> {
      return response.rows[0];
    })
    .catch((err)=> {
      console.log(err);
    });
}
exports.addProperty = addProperty;
SELECT reservations.id, properties.title, reservations.start_date, properties.cost_per_night, avg(property_reviews.rating) as average_rating
  FROM reservations
  JOIN properties ON reservations.property_id = properties.id
  JOIN property_reviews ON reservations.property_id = property_reviews.property_id
  WHERE reservations.guest_id = 4
  GROUP BY reservations.id, properties.id
  ORDER BY reservations.start_date
  LIMIT 10;
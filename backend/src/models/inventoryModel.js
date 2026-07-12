// backend/src/models/inventoryModel.js
// DB에 진짜 쿼리를 날리는 역할. 응답 형식은 처리 안함.

const pool = require('../config/db');

// 현재 식자재 재고 전체 조회 (유통기한 포함)
async function getAllIngredients(userId) {
    const query = `
      SELECT id, name, current_stock, unit, expiration_date
      FROM ingredients
      WHERE user_id = $1
      ORDER BY name
    `;
    const result = await pool.query(query, [userId]);
    return result.rows;
}

module.exports = { getAllIngredients };
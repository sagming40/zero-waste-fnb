// backend/src/models/salesModel.js
// ⚠️ 의도적으로 트랜잭션 없이 짠 "before" 버전.
// 쿼리를 하나씩 순서대로 날린다 — 중간에 하나가 실패해도
// 이미 실행된 이전 쿼리들은 그대로 DB에 남는다 (자동 커밋되기 때문).

const pool = require('../config/db');

async function insertMenuSales(userId, saleDate, sales) {
    for (const item of sales) {
        await pool.query(
            `INSERT INTO daily_menu_sales (user_id, sale_date, menu_id, sold_qty)
             VALUES ($1, $2, $3, $4)`,
            [userId, saleDate, item.menu_id, item.sold_qty] 
        );
    }
}

async function insertWaste(userId, saleDate, wasteAmount) {
    await pool.query(
        `INSERT INTO daily_waste (user_id, sale_date, waste_amount)
         VALUES ($1, $2, $3)`,
        [userId, saleDate, wasteAmount] 
    );
}

module.exports = { insertMenuSales, insertWaste };
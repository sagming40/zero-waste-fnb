// backend/src/controllers/salesController.js

const { insertMenuSales, insertWaste } = require('../models/salesModel');

async function createSales(req, res) {
    const userId = 1; // 로그인 구현 전까지 임시 고정
    const { sale_date, sales, waste_amount } = req.body;

    try {
        await insertMenuSales(userId, sale_date, sales);    // ① 메뉴별 판매 저장
        await insertWaste(userId, sale_date, waste_amount); // ② 폐기량 저장
        res.status(201).json({ status: 'ok', message: '저장 완료' });
    } catch (err) {
      // 문제: ①은 이미 저장됐는데 ②에서 에러 나면?
      // → 이 catch는 잡아서 500 응답은 주지만, ①이 저장한 행은 이미 커밋된 채로 DB에 남는다.
      res.status(500).json({ status: 'error', message: err.message });
    }
}

module.exports = { createSales };
// backend/src/controllers/inventoryController.js
// "업무 담당자" — 요청 해석, 모델 호출 결과를 적절한 응답 형태로 변환.

const { getAllIngredients } = require('../models/inventoryModel');

async function getInventory(req, res) {
  try {
    // TODO: 로그인 기능 구현 전까지는 임시로 user_id=1 고정
    // (seed_dummy.py가 만든 '민규 베이커리&카페'가 첫 번째로 INSERT된 유저라 id=1)
    const userId = 1;

    const ingredients = await getAllIngredients(userId);
    res.json({ status: 'ok', count: ingredients.length, data: ingredients });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }  
}

module.exports = { getInventory };
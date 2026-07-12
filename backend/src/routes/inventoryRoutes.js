// backend/src/routes/inventoryRoutes.js
// URL이 어떤 경로로 가야 하는지 결정

const express = require('express');
const router = express.Router();
const { getInventory } = require('../controllers/inventoryController');

router.get('/', getInventory);

module.exports = router;

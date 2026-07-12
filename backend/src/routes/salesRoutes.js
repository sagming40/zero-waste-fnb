// backend/src/routes/salesRoutes.js

const express = require('express');
const router = express.Router();
const { createSales } = require('../controllers/salesController');

router.post('/', createSales);

module.exports = router;
// backend/server.js
// Express 서버 진입점. 
// 지금 단계 목표: "서버가 켜지고 DB에 연결되고, 요청 하나에 응답한다." 는 것만 확인

const express = require('express');
const cors = require('cors');
require('dotenv').config();

const pool = require('./src/config/db');
const inventoryRoutes = require('./src/routes/inventoryRoutes');

const app = express();
const PORT = process.env.SERVER_PORT || 4000;

// 미들웨어: 요청이 라우터에 도착하기 전 거치는 검문소 같은 것들
app.use(cors());          // React(다른 포트)에서 오는 요청 허용  
app.use(express.json());  // 요청 body를 JSON으로 자동 해석

// 헬스체크 라우트 ㅡ 서버가 살아있는 지 + DB가 붙어있는 지 확인용
app.get('/api/health', async (req, res) => {
    try {
      const result = await pool.query('SELECT NOW() AS server_time');
      res.json({
        status: 'ok',
        server_time: result.rows[0].server_time,
      });  
    } catch (err) {
      res.status(500).json({ status: 'error', message: err.message });  
    }
});

app.use('/api/inventory', inventoryRoutes);

app.listen(PORT, () => {
    console.log(`🚀 서버 실행 중: http://localhost:${PORT}`);
});

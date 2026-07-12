// backend/src/config/db.js
// PostgreSQL 커넥션 풀 설정.
// "풀(Pool)"은 매번 새로 창고 문을 여는 대신, 미리 열어둔 문 몇 개를
// 여러 요청이 돌아가며 재사용하는 방식 — 매번 문 열고 닫는 비용을 아낀다.

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,  
});

// 서버 켤 때 DB 연결이 실제로 되는지 한 번 확인 (문제 있으면 바로 로그로 알림)
pool
  .query('SELECT NOW()')
  .then((res) => {
    console.log('✅ PostgreSQL 연결 성공:', res.rows[0].now);
  })
  .catch((err) => {
    console.error('❌ PostgreSQL 연결 실패:', err.message);
  });

module.exports = pool;  

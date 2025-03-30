// pages/api/setup-database.js
import axios from 'axios';

export default async function handler(req, res) {
  try {
    await setupDatabase();
    res.status(200).json({ success: true, message: '데이터베이스 설정이 완료되었습니다.' });
  } catch (error) {
    console.error('데이터베이스 설정 오류:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

// Cloudflare API 설정
const API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const ACCOUNT_ID = '3089f656c1f39b1156a4007b0a9d9fdd'; // 올바른 계정 ID 사용
const DATABASE_ID = '4c32ba78-84f7-49bc-828b-23705e3fd163';

// API 클라이언트 생성
const apiClient = axios.create({
  baseURL: 'https://api.cloudflare.com/client/v4',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${API_TOKEN}`
  }
});

// 개별 쿼리 실행 함수
async function executeQuery(sql) {
  try {
    const response = await apiClient.post(
      `/accounts/${ACCOUNT_ID}/d1/database/${DATABASE_ID}/query`,
      {
        sql: sql,
        params: []
      }
    );
    
    console.log('쿼리 성공:', sql.substring(0, 30) + '...');
    return response.data;
  } catch (error) {
    console.error('쿼리 오류:', error.response?.data || error.message);
    throw error;
  }
}

// 데이터베이스 설정 함수
async function setupDatabase() {
  // 테이블 및 인덱스 생성을 위한 SQL 문
  const queries = [
    // coins 테이블
    `CREATE TABLE IF NOT EXISTS coins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      symbol TEXT NOT NULL UNIQUE,
      market TEXT NOT NULL,
      korean_name TEXT NOT NULL,
      english_name TEXT NOT NULL,
      is_favorite BOOLEAN DEFAULT 0,
      added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    
    // price_history 테이블
    `CREATE TABLE IF NOT EXISTS price_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      coin_id INTEGER NOT NULL,
      timestamp BIGINT NOT NULL,
      opening_price REAL NOT NULL,
      high_price REAL NOT NULL,
      low_price REAL NOT NULL,
      trade_price REAL NOT NULL,
      candle_acc_trade_volume REAL NOT NULL,
      candle_acc_trade_price REAL NOT NULL,
      candle_type TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (coin_id) REFERENCES coins(id)
    )`,
    
    // 인덱스 생성 (각각 개별적으로)
    `CREATE INDEX IF NOT EXISTS idx_coins_symbol ON coins(symbol)`,
    `CREATE INDEX IF NOT EXISTS idx_coins_favorite ON coins(is_favorite)`,
    `CREATE INDEX IF NOT EXISTS idx_price_history_coin_id ON price_history(coin_id)`,
    `CREATE INDEX IF NOT EXISTS idx_price_history_timestamp ON price_history(timestamp)`,
    `CREATE INDEX IF NOT EXISTS idx_price_history_coin_timestamp ON price_history(coin_id, timestamp)`
  ];

  // 모든 쿼리 순차적으로 실행
  for (const sql of queries) {
    await executeQuery(sql);
  }
  
  return { success: true };
}

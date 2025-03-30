import axios from 'axios';

// Cloudflare API 기본 설정
const CLOUDFLARE_API_URL = 'https://api.cloudflare.com/client/v4';
const API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID || '3089f656c1f39b1156a4007b0a9d9fdd';
const DATABASE_ID = process.env.CLOUDFLARE_D1_DATABASE_ID || '4c32ba78-84f7-49bc-828b-23705e3fd163';

// API 호출을 위한 기본 설정
const api = axios.create({
  baseURL: CLOUDFLARE_API_URL,
  headers: {
    'Authorization': `Bearer ${API_TOKEN}`,
    'Content-Type': 'application/json'
  }
});

// API 응답 에러 처리
api.interceptors.response.use(
  response => response,
  error => {
    console.error('Cloudflare API 오류:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// D1 데이터베이스 SQL 쿼리 실행
export async function executeD1Query(sql: string, params: any[] = []) {
  try {
    console.log('Executing D1 query:', sql, 'with params:', params);
    
    const response = await api.post(
      `/accounts/${ACCOUNT_ID}/d1/database/${DATABASE_ID}/query`,
      { sql, params }
    );
    
    console.log('D1 query response:', response.data);
    
    if (!response.data.success) {
      throw new Error(`D1 쿼리 오류: ${JSON.stringify(response.data.errors)}`);
    }
    
    // result가 undefined인 경우 빈 결과 객체 반환
    if (!response.data.result) {
      return { results: [] };
    }
    
    // results 속성이 없는 경우 추가
    if (!response.data.result.results) {
      response.data.result.results = [];
    }
    
    return response.data.result;
  } catch (error) {
    console.error('D1 쿼리 실행 오류:', error);
    // 오류 발생 시 빈 결과 객체 반환
    return { results: [] };
  }
}

// D1 데이터베이스 배치 쿼리 실행 (여러 쿼리 개별적으로 실행)
export async function executeD1BatchQueries(statements: { sql: string; params?: any[] }[]) {
  try {
    // 각 쿼리를 개별적으로 실행
    const results = [];
    for (const statement of statements) {
      const result = await executeD1Query(statement.sql, statement.params || []);
      results.push(result);
    }
    
    return results;
  } catch (error) {
    console.error('D1 배치 쿼리 실행 오류:', error);
    return [];
  }
}

// D1 데이터베이스 초기화 (테이블 생성)
export async function initializeDatabase() {
  const createCoinsTableQuery = `
    CREATE TABLE IF NOT EXISTS coins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      symbol TEXT NOT NULL UNIQUE,
      market TEXT NOT NULL,
      korean_name TEXT NOT NULL,
      english_name TEXT NOT NULL,
      is_favorite BOOLEAN DEFAULT 0,
      added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;
  
  const createPriceHistoryTableQuery = `
    CREATE TABLE IF NOT EXISTS price_history (
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
    )
  `;
  
  // 인덱스 생성 쿼리를 개별적으로 분리
  const createIndexQueries = [
    `CREATE INDEX IF NOT EXISTS idx_coins_symbol ON coins(symbol)`,
    `CREATE INDEX IF NOT EXISTS idx_coins_favorite ON coins(is_favorite)`,
    `CREATE INDEX IF NOT EXISTS idx_price_history_coin_id ON price_history(coin_id)`,
    `CREATE INDEX IF NOT EXISTS idx_price_history_timestamp ON price_history(timestamp)`,
    `CREATE INDEX IF NOT EXISTS idx_price_history_coin_timestamp ON price_history(coin_id, timestamp)`
  ];
  
  try {
    // 테이블 생성
    await executeD1Query(createCoinsTableQuery);
    await executeD1Query(createPriceHistoryTableQuery);
    
    // 인덱스 생성
    for (const indexQuery of createIndexQueries) {
      await executeD1Query(indexQuery);
    }
    
    console.log('데이터베이스 초기화 완료');
    return true;
  } catch (error) {
    console.error('데이터베이스 초기화 오류:', error);
    throw error;
  }
}

// 코인 추가하기
export async function addCoin(coinData: {
  symbol: string;
  market: string;
  korean_name: string;
  english_name: string;
}) {
  const { symbol, market, korean_name, english_name } = coinData;
  
  try {
    const query = `
      INSERT INTO coins (symbol, market, korean_name, english_name)
      VALUES (?, ?, ?, ?)
      ON CONFLICT (symbol)
      DO UPDATE SET
        market = excluded.market,
        korean_name = excluded.korean_name,
        english_name = excluded.english_name
    `;
    
    const result = await executeD1Query(query, [symbol, market, korean_name, english_name]);
    return result;
  } catch (error) {
    console.error('코인 추가 오류:', error);
    return { success: true };
  }
}

// 코인 북마크 토글
export async function toggleFavoriteCoin(symbol: string) {
  try {
    const query = `
      UPDATE coins
      SET is_favorite = NOT is_favorite
      WHERE symbol = ?
      RETURNING *
    `;
    
    const result = await executeD1Query(query, [symbol]);
    return result;
  } catch (error) {
    console.error('코인 북마크 토글 오류:', error);
    return { success: true };
  }
}

// 코인 목록 조회
export async function getCoins(favorites_only = false) {
  try {
    let query = 'SELECT * FROM coins';
    
    if (favorites_only) {
      query += ' WHERE is_favorite = 1';
    }
    
    query += ' ORDER BY is_favorite DESC, symbol ASC';
    
    const result = await executeD1Query(query);
    
    // result.results가 없는 경우 안전하게 처리
    if (!result || !result.results) {
      console.log('코인 목록 없음, 빈 배열 반환');
      return [];
    }
    
    console.log('코인 목록 조회 결과:', result.results);
    return result.results;
  } catch (error) {
    console.error('코인 목록 조회 오류:', error);
    return [];
  }
}

// 가격 히스토리 저장
export async function savePriceHistory(priceData: {
  coin_id: number;
  timestamp: number;
  opening_price: number;
  high_price: number;
  low_price: number;
  trade_price: number;
  candle_acc_trade_volume: number;
  candle_acc_trade_price: number;
  candle_type: 'minute' | 'day' | 'week' | 'month';
}) {
  try {
    const {
      coin_id,
      timestamp,
      opening_price,
      high_price,
      low_price,
      trade_price,
      candle_acc_trade_volume,
      candle_acc_trade_price,
      candle_type
    } = priceData;
    
    // 이미 존재하는 데이터인지 확인
    const checkQuery = `
      SELECT id FROM price_history
      WHERE coin_id = ? AND timestamp = ? AND candle_type = ?
    `;
    
    const existingResult = await executeD1Query(checkQuery, [coin_id, timestamp, candle_type]);
    
    if (existingResult.results && existingResult.results.length > 0) {
      // 이미 존재하면 업데이트
      const updateQuery = `
        UPDATE price_history
        SET
          opening_price = ?,
          high_price = ?,
          low_price = ?,
          trade_price = ?,
          candle_acc_trade_volume = ?,
          candle_acc_trade_price = ?
        WHERE coin_id = ? AND timestamp = ? AND candle_type = ?
      `;
      
      await executeD1Query(updateQuery, [
        opening_price,
        high_price,
        low_price,
        trade_price,
        candle_acc_trade_volume,
        candle_acc_trade_price,
        coin_id,
        timestamp,
        candle_type
      ]);
      
      return { updated: true, id: existingResult.results[0].id };
    } else {
      // 새로운 데이터 삽입
      const insertQuery = `
        INSERT INTO price_history (
          coin_id, timestamp, opening_price, high_price, low_price,
          trade_price, candle_acc_trade_volume, candle_acc_trade_price, candle_type
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        RETURNING id
      `;
      
      const result = await executeD1Query(insertQuery, [
        coin_id,
        timestamp,
        opening_price,
        high_price,
        low_price,
        trade_price,
        candle_acc_trade_volume,
        candle_acc_trade_price,
        candle_type
      ]);
      
      if (result.results && result.results.length > 0) {
        return { inserted: true, id: result.results[0].id };
      }
      
      return { inserted: true };
    }
  } catch (error) {
    console.error('가격 히스토리 저장 오류:', error);
    return { success: false, error: error.message };
  }
}

// 가격 히스토리 조회
export async function getPriceHistory(
  coin_id: number,
  candle_type: 'minute' | 'day' | 'week' | 'month',
  limit = 100
) {
  try {
    const query = `
      SELECT * FROM price_history
      WHERE coin_id = ? AND candle_type = ?
      ORDER BY timestamp DESC
      LIMIT ?
    `;
    
    const result = await executeD1Query(query, [coin_id, candle_type, limit]);
    
    if (!result.results) {
      return [];
    }
    
    return result.results.reverse(); // 시간순으로 정렬
  } catch (error) {
    console.error('가격 히스토리 조회 오류:', error);
    return [];
  }
}

// 코인 ID로 코인 정보 조회
export async function getCoinById(id: number) {
  try {
    const query = 'SELECT * FROM coins WHERE id = ?';
    const result = await executeD1Query(query, [id]);
    
    if (result.results && result.results.length > 0) {
      return result.results[0];
    }
    
    return null;
  } catch (error) {
    console.error('코인 정보 조회 오류:', error);
    return null;
  }
}

// 코인 심볼로 코인 정보 조회
export async function getCoinBySymbol(symbol: string) {
  try {
    const query = 'SELECT * FROM coins WHERE symbol = ?';
    const result = await executeD1Query(query, [symbol]);
    
    if (result.results && result.results.length > 0) {
      return result.results[0];
    }
    
    return null;
  } catch (error) {
    console.error('코인 정보 조회 오류:', error);
    return null;
  }
}

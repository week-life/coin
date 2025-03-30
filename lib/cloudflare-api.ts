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

// 상세 디버깅 정보 출력
console.log('=== 환경 변수 확인 ===');
console.log('API_TOKEN:', API_TOKEN ? '설정됨 (작은 보안을 위해 표시하지 않음)' : '설정되지 않음');
console.log('ACCOUNT_ID:', ACCOUNT_ID);
console.log('DATABASE_ID:', DATABASE_ID);

// D1 데이터베이스 SQL 쿼리 실행
export async function executeD1Query(sql: string, params: any[] = []) {
  try {
    console.log('Executing D1 query:', sql, 'with params:', params);
    console.log('API URL:', `${CLOUDFLARE_API_URL}/accounts/${ACCOUNT_ID}/d1/database/${DATABASE_ID}/query`);
    
    // API 토큰이 없는 경우 처리
    if (!API_TOKEN) {
      console.error('Cloudflare API 토큰이 없습니다. 환경 변수를 확인해주세요.');
      return { results: [] };
    }
    
    const response = await api.post(
      `/accounts/${ACCOUNT_ID}/d1/database/${DATABASE_ID}/query`,
      { sql, params }
    );
    
    console.log('D1 query response status:', response.status);
    console.log('D1 query response:', JSON.stringify(response.data, null, 2));
    
    if (!response.data.success) {
      console.error('API 응답이 실패했습니다:', response.data.errors || '오류 정보 없음');
      throw new Error(`D1 쿼리 오류: ${JSON.stringify(response.data.errors)}`);
    }
    
    // result가 없는 경우 처리
    if (!response.data.result) {
      console.log('API 응답에 result가 없습니다. 빈 배열을 반환합니다.');
      return { results: [] };
    }
    
    // result가 배열인 경우 처리 (Cloudflare API 응답 구조)
    if (Array.isArray(response.data.result)) {
      console.log('API 응답의 result가 배열입니다. 처리합니다.');
      
      // 배열의 첫 번째 요소 사용
      if (response.data.result.length > 0) {
        const firstResult = response.data.result[0];
        
        // results 속성이 없는 경우 추가
        if (!firstResult.results) {
          console.log('API 응답에 results 배열이 없습니다. 빈 배열을 추가합니다.');
          firstResult.results = [];
        }
        
        console.log('Query results:', firstResult.results);
        return firstResult;
      }
    }
    
    // 다른 응답 구조인 경우 처리
    console.log('예상하지 못한 API 응답 구조입니다. 빈 결과를 반환합니다.');
    console.log('Unexpected response structure:', response.data.result);
    return { results: [] };
  } catch (error: any) {
    console.error('D1 쿼리 실행 오류:', error);
    console.error('Error details:', error.message);
    if (error.response) {
      console.error('Error response:', error.response.data);
      console.error('Error status:', error.response.status);
    }
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
  console.log('데이터베이스 초기화 시작...');
  
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
    console.log('coins 테이블 생성 시도...');
    await executeD1Query(createCoinsTableQuery);
    
    console.log('price_history 테이블 생성 시도...');
    await executeD1Query(createPriceHistoryTableQuery);
    
    // 인덱스 생성
    console.log('인덱스 생성 시도...');
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
    console.log('코인 목록 조회 시작...');
    let query = 'SELECT * FROM coins';
    
    if (favorites_only) {
      console.log('즐겨찾기 필터 적용');
      query += ' WHERE is_favorite = 1';
    }
    
    query += ' ORDER BY is_favorite DESC, symbol ASC';
    
    const result = await executeD1Query(query);
    console.log('코인 목록 조회 결과 (raw):', result);
    
    // result.results가 없는 경우 안전하게 처리
    if (!result) {
      console.log('코인 목록 없음 (result가 undefined), 빈 배열 반환');
      return [];
    }
    
    if (!result.results) {
      console.log('코인 목록 없음 (result.results가 undefined), 빈 배열 반환');
      return [];
    }
    
    console.log('코인 목록 조회 결과 (개수):', result.results.length);
    console.log('코인 목록 첫 몇 개의 아이템:', result.results.slice(0, 3));
    return result.results;
  } catch (error: any) {
    console.error('코인 목록 조회 오류:', error);
    console.error('Error details:', error.message);
    if (error.response) {
      console.error('Error response:', error.response.data);
    }
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
  } catch (error: any) {
    console.error('가격 히스토리 저장 오류:', error);
    return { success: false, error: error.message || '알 수 없는 오류' };
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

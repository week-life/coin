-- 코인 정보 테이블
CREATE TABLE IF NOT EXISTS coins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  symbol TEXT NOT NULL UNIQUE,
  market TEXT NOT NULL,
  korean_name TEXT NOT NULL,
  english_name TEXT NOT NULL,
  is_favorite BOOLEAN DEFAULT 0,
  added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 가격 이력 테이블
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
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_coins_symbol ON coins(symbol);
CREATE INDEX IF NOT EXISTS idx_coins_favorite ON coins(is_favorite);
CREATE INDEX IF NOT EXISTS idx_price_history_coin_id ON price_history(coin_id);
CREATE INDEX IF NOT EXISTS idx_price_history_timestamp ON price_history(timestamp);
CREATE INDEX IF NOT EXISTS idx_price_history_coin_timestamp ON price_history(coin_id, timestamp);

import axios from 'axios';

// 업비트 API 데이터 타입 정의
interface UpbitTicker {
  market: string;
  trade_date: string;
  trade_time: string;
  trade_timestamp: number;
  opening_price: number;
  high_price: number;
  low_price: number;
  trade_price: number;
  prev_closing_price: number;
  change: string;
  change_price: number;
  change_rate: number;
  signed_change_price: number;
  signed_change_rate: number;
  trade_volume: number;
  acc_trade_price: number;
  acc_trade_price_24h: number;
  acc_trade_volume: number;
  acc_trade_volume_24h: number;
  highest_52_week_price?: number;
  highest_52_week_date?: string;
  lowest_52_week_price?: number;
  lowest_52_week_date?: string;
  timestamp?: number;
}

interface UpbitCandle {
  market: string;
  candle_date_time_utc: string;
  candle_date_time_kst: string;
  opening_price: number;
  high_price: number;
  low_price: number;
  trade_price: number;
  timestamp: number;
  candle_acc_trade_price: number;
  candle_acc_trade_volume: number;
  prev_closing_price: number;
  change_price: number;
  change_rate: number;
}

// 업비트 API 기본 URL
const UPBIT_API_URL = 'https://api.upbit.com/v1';

// 에러 로깅 및 예외 처리 함수
const logAndThrowError = (error: any, message: string) => {
  console.error(message, error);
  
  // axios 오류인 경우
  if (error.response) {
    console.error('Response data:', error.response.data);
    console.error('Response status:', error.response.status);
    throw new Error(`API Error: ${error.response.data?.error?.message || error.message}`);
  }
  
  // 네트워크 오류
  if (error.request) {
    throw new Error(`Network error: ${error.message}`);
  }
  
  // 기타 오류
  throw error;
};

// 마켓 코드 조회
export async function getMarkets() {
  try {
    const response = await axios.get(`${UPBIT_API_URL}/market/all`, {
      params: { isDetails: 'true' }
    });
    
    return response.data;
  } catch (error) {
    logAndThrowError(error, '마켓 코드 조회 오류:');
    return []; // TypeScript를 위한 반환값
  }
}

// 출력용 티커 데이터 형식 변환
const formatTickerData = (data: any[]): UpbitTicker[] => {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return [];
  }
  
  return data.map(item => ({
    market: item.market,
    trade_date: item.trade_date,
    trade_time: item.trade_time,
    trade_timestamp: item.timestamp,
    opening_price: item.opening_price,
    high_price: item.high_price,
    low_price: item.low_price,
    trade_price: item.trade_price,
    prev_closing_price: item.prev_closing_price,
    change: item.change,
    change_price: item.change_price,
    change_rate: item.change_rate,
    signed_change_price: item.signed_change_price,
    signed_change_rate: item.signed_change_rate,
    trade_volume: item.trade_volume,
    acc_trade_price: item.acc_trade_price,
    acc_trade_price_24h: item.acc_trade_price_24h,
    acc_trade_volume: item.acc_trade_volume,
    acc_trade_volume_24h: item.acc_trade_volume_24h
  }));
};

// 현재가 정보 조회
export async function getTicker(markets: string): Promise<UpbitTicker[]> {
  try {
    console.log('업비트 API 호출:', `${UPBIT_API_URL}/ticker?markets=${markets}`);
    
    const response = await axios.get(`${UPBIT_API_URL}/ticker`, {
      params: { markets }
    });
    
    return formatTickerData(response.data);
  } catch (error) {
    logAndThrowError(error, '현재가 정보 조회 오류:');
    return []; // TypeScript를 위한 반환값
  }
}

// 분 캔들 조회
export async function getMinuteCandles(market: string, unit: 1 | 3 | 5 | 10 | 15 | 30 | 60 | 240, count: number = 200): Promise<UpbitCandle[]> {
  try {
    const response = await axios.get(`${UPBIT_API_URL}/candles/minutes/${unit}`, {
      params: { market, count }
    });
    
    return response.data;
  } catch (error) {
    logAndThrowError(error, '분 캔들 조회 오류:');
    return []; // TypeScript를 위한 반환값
  }
}

// 일 캔들 조회
export async function getDayCandles(market: string, count: number = 200): Promise<UpbitCandle[]> {
  try {
    const response = await axios.get(`${UPBIT_API_URL}/candles/days`, {
      params: { market, count }
    });
    
    return response.data;
  } catch (error) {
    logAndThrowError(error, '일 캔들 조회 오류:');
    return []; // TypeScript를 위한 반환값
  }
}

// 주 캔들 조회
export async function getWeekCandles(market: string, count: number = 200): Promise<UpbitCandle[]> {
  try {
    const response = await axios.get(`${UPBIT_API_URL}/candles/weeks`, {
      params: { market, count }
    });
    
    return response.data;
  } catch (error) {
    logAndThrowError(error, '주 캔들 조회 오류:');
    return []; // TypeScript를 위한 반환값
  }
}

// 월 캔들 조회
export async function getMonthCandles(market: string, count: number = 200): Promise<UpbitCandle[]> {
  try {
    const response = await axios.get(`${UPBIT_API_URL}/candles/months`, {
      params: { market, count }
    });
    
    return response.data;
  } catch (error) {
    logAndThrowError(error, '월 캔들 조회 오류:');
    return []; // TypeScript를 위한 반환값
  }
}

// 호가 정보 조회
export async function getOrderbook(markets: string) {
  try {
    const response = await axios.get(`${UPBIT_API_URL}/orderbook`, {
      params: { markets }
    });
    
    return response.data;
  } catch (error) {
    logAndThrowError(error, '호가 정보 조회 오류:');
    return []; // TypeScript를 위한 반환값
  }
}

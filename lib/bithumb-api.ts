import axios from 'axios';

// 빗썸 API 데이터 타입 정의
interface BithumbTicker {
  market: string;
  opening_price: number;
  closing_price: number;
  min_price: number;
  max_price: number;
  units_traded: number;
  acc_trade_value: number;
  prev_closing_price: number;
  units_traded_24H: number;
  acc_trade_value_24H: number;
  fluctate_24H: number;
  fluctate_rate_24H: number;
  date?: string;
}

interface BithumbResponse<T> {
  status: string;
  message?: string;
  data: T;
}

// 빗썸 API 기본 URL
const BITHUMB_API_URL = 'https://api.bithumb.com/public';

// 안전한 데이터 반환 함수
const safeReturn = <T>(defaultValue: T) => {
  return (error: any) => {
    console.error('빗썸 API 오류:', error);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
    return defaultValue;
  };
};

// 마켓 정보 조회
export async function getAllMarkets() {
  try {
    const response = await axios.get<BithumbResponse<Record<string, any>>>(`${BITHUMB_API_URL}/ticker/ALL_KRW`);
    
    if (response.data.status !== '0000') {
      throw new Error(`API Error: ${response.data.message}`);
    }
    
    // 마켓 정보를 객체에서 배열 형태로 변환
    const markets = Object.keys(response.data.data)
      .filter(key => key !== 'date')
      .map(symbol => ({
        symbol,
        market: `${symbol}_KRW`,
        korean_name: symbol,
        english_name: symbol
      }));
    
    return markets;
  } catch (error) {
    console.error('마켓 정보 조회 에러:', error);
    return [];
  }
}

// 분 캔들 조회
export async function getMinuteCandles(symbol: string, unit: 1 | 3 | 5 | 10 | 30, count: number = 200) {
  try {
    const response = await axios.get(`${BITHUMB_API_URL}/candlestick/${symbol}_KRW/${unit}m`);
    
    if (response.data.status !== '0000') {
      throw new Error(`API Error: ${response.data.message}`);
    }
    
    // 캔들 데이터 처리 (API에 맞게 변환)
    return response.data.data.slice(0, count).map((candle: any[]) => ({
      timestamp: candle[0],
      opening_price: parseFloat(candle[1]),
      high_price: parseFloat(candle[2]),
      low_price: parseFloat(candle[3]),
      closing_price: parseFloat(candle[4]),
      volume: parseFloat(candle[5])
    }));
  } catch (error) {
    return safeReturn([])(error);
  }
}

// 일 캔들 조회
export async function getDayCandles(symbol: string, count: number = 200) {
  try {
    const response = await axios.get(`${BITHUMB_API_URL}/candlestick/${symbol}_KRW/24h`);
    
    if (response.data.status !== '0000') {
      throw new Error(`API Error: ${response.data.message}`);
    }
    
    return response.data.data.slice(0, count).map((candle: any[]) => ({
      timestamp: candle[0],
      opening_price: parseFloat(candle[1]),
      high_price: parseFloat(candle[2]),
      low_price: parseFloat(candle[3]),
      closing_price: parseFloat(candle[4]),
      volume: parseFloat(candle[5])
    }));
  } catch (error) {
    return safeReturn([])(error);
  }
}

// 현재가 정보 조회
export async function getTicker(symbols: string) {
  try {
    // 심볼 목록을 반콤으로 구분하여 각각 처리
    const symbolList = symbols.split(',').map(s => s.trim());
    const result = [];
    
    // 모든 티커 정보 조회
    const response = await axios.get(`${BITHUMB_API_URL}/ticker/ALL_KRW`);
    
    if (response.data.status !== '0000') {
      throw new Error(`API Error: ${response.data.message}`);
    }
    
    // 각 심볼에 대한 티커 정보 추출
    for (const symbol of symbolList) {
      if (response.data.data[symbol]) {
        const tickerData = response.data.data[symbol];
        result.push({
          market: symbol,  // 심볼 정보 추가
          opening_price: parseFloat(tickerData.opening_price),
          closing_price: parseFloat(tickerData.closing_price),
          min_price: parseFloat(tickerData.min_price),
          max_price: parseFloat(tickerData.max_price),
          units_traded: parseFloat(tickerData.units_traded),
          acc_trade_value: parseFloat(tickerData.acc_trade_value),
          prev_closing_price: parseFloat(tickerData.prev_closing_price),
          units_traded_24H: parseFloat(tickerData.units_traded_24H),
          acc_trade_value_24H: parseFloat(tickerData.acc_trade_value_24H),
          fluctate_24H: parseFloat(tickerData.fluctate_24H),
          fluctate_rate_24H: parseFloat(tickerData.fluctate_rate_24H)
        });
      }
    }
    
    return result;
  } catch (error) {
    console.error('현재가 정보 조회 에러:', error);
    return [];
  }
}

// 호가 정보 조회
export async function getOrderbook(symbol: string) {
  try {
    const response = await axios.get(`${BITHUMB_API_URL}/orderbook/${symbol}_KRW`);
    
    if (response.data.status !== '0000') {
      throw new Error(`API Error: ${response.data.message}`);
    }
    
    return response.data.data;
  } catch (error) {
    return safeReturn({})(error);
  }
}

// 전체 거래소 통계 조회
export async function getTransactionHistory(symbol: string, count: number = 20) {
  try {
    const response = await axios.get(`${BITHUMB_API_URL}/transaction_history/${symbol}_KRW`, {
      params: { count }
    });
    
    if (response.data.status !== '0000') {
      throw new Error(`API Error: ${response.data.message}`);
    }
    
    return response.data.data;
  } catch (error) {
    return safeReturn([])(error);
  }
}

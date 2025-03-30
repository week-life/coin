import axios from 'axios';

// 빗썸 API 기본 URL
const BITHUMB_API_URL = 'https://api.bithumb.com/v1';

// 마켓 정보 조회
export async function getAllMarkets(isDetails = false) {
  try {
    const response = await axios.get(`${BITHUMB_API_URL}/market/all`, {
      params: { isDetails }
    });
    
    if (response.data.status !== '0000') {
      throw new Error(`API Error: ${response.data.message}`);
    }
    
    return response.data.data;
  } catch (error) {
    console.error('마켓 정보 조회 에러:', error);
    throw error;
  }
}

// 분 캔들 조회
export async function getMinuteCandles({ market, unit = 1, to, count = 200 }: { 
  market: string;
  unit?: 1 | 3 | 5 | 10 | 15 | 30 | 60 | 240;
  to?: string;
  count?: number;
}) {
  try {
    const response = await axios.get(`${BITHUMB_API_URL}/candles/minutes/${unit}`, {
      params: { market, to, count }
    });
    
    if (response.data.status !== '0000') {
      throw new Error(`API Error: ${response.data.message}`);
    }
    
    return response.data.data;
  } catch (error) {
    console.error('분 캔들 조회 에러:', error);
    throw error;
  }
}

// 일 캔들 조회
export async function getDayCandles({ market, to, count = 200, convertingPriceUnit }: {
  market: string;
  to?: string;
  count?: number;
  convertingPriceUnit?: string;
}) {
  try {
    const response = await axios.get(`${BITHUMB_API_URL}/candles/days`, {
      params: { market, to, count, convertingPriceUnit }
    });
    
    if (response.data.status !== '0000') {
      throw new Error(`API Error: ${response.data.message}`);
    }
    
    return response.data.data;
  } catch (error) {
    console.error('일 캔들 조회 에러:', error);
    throw error;
  }
}

// 주 캔들 조회
export async function getWeekCandles({ market, to, count = 200 }: {
  market: string;
  to?: string;
  count?: number;
}) {
  try {
    const response = await axios.get(`${BITHUMB_API_URL}/candles/weeks`, {
      params: { market, to, count }
    });
    
    if (response.data.status !== '0000') {
      throw new Error(`API Error: ${response.data.message}`);
    }
    
    return response.data.data;
  } catch (error) {
    console.error('주 캔들 조회 에러:', error);
    throw error;
  }
}

// 월 캔들 조회
export async function getMonthCandles({ market, to, count = 200 }: {
  market: string;
  to?: string;
  count?: number;
}) {
  try {
    const response = await axios.get(`${BITHUMB_API_URL}/candles/months`, {
      params: { market, to, count }
    });
    
    if (response.data.status !== '0000') {
      throw new Error(`API Error: ${response.data.message}`);
    }
    
    return response.data.data;
  } catch (error) {
    console.error('월 캔들 조회 에러:', error);
    throw error;
  }
}

// 현재가 정보 조회
export async function getTicker(markets: string) {
  try {
    const response = await axios.get(`${BITHUMB_API_URL}/ticker`, {
      params: { markets }
    });
    
    if (response.data.status !== '0000') {
      throw new Error(`API Error: ${response.data.message}`);
    }
    
    return response.data.data;
  } catch (error) {
    console.error('현재가 정보 조회 에러:', error);
    throw error;
  }
}

// 체결 내역 조회
export async function getTradesTicks({ market, to, count = 1, cursor, daysAgo }: {
  market: string;
  to?: string;
  count?: number;
  cursor?: string;
  daysAgo?: number;
}) {
  try {
    const response = await axios.get(`${BITHUMB_API_URL}/trades/ticks`, {
      params: { market, to, count, cursor, daysAgo }
    });
    
    if (response.data.status !== '0000') {
      throw new Error(`API Error: ${response.data.message}`);
    }
    
    return response.data.data;
  } catch (error) {
    console.error('체결 내역 조회 에러:', error);
    throw error;
  }
}

// 호가 정보 조회
export async function getOrderbook(markets: string) {
  try {
    const response = await axios.get(`${BITHUMB_API_URL}/orderbook`, {
      params: { markets }
    });
    
    if (response.data.status !== '0000') {
      throw new Error(`API Error: ${response.data.message}`);
    }
    
    return response.data.data;
  } catch (error) {
    console.error('호가 정보 조회 에러:', error);
    throw error;
  }
}

// 경보제 조회
export async function getWarnings() {
  try {
    const response = await axios.get(`${BITHUMB_API_URL}/market/virtual_asset_warning`);
    
    if (response.data.status !== '0000') {
      throw new Error(`API Error: ${response.data.message}`);
    }
    
    return response.data.data;
  } catch (error) {
    console.error('경보제 조회 에러:', error);
    throw error;
  }
}

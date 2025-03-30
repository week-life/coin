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
  
  // UI 호환성을 위한 필드 (필드명 매핑용)
  trade_price?: number;       // closing_price와 동일
  signed_change_rate?: number; // fluctate_rate_24H/100과 동일
  high_price?: number;        // max_price와 동일
  low_price?: number;         // min_price와 동일
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
    console.log('빗썸 마켓 정보 조회 시작...');
    const response = await axios.get<BithumbResponse<Record<string, any>>>(`${BITHUMB_API_URL}/ticker/ALL_KRW`);
    console.log('빗썸 마켓 정보 응답:', JSON.stringify(response.data).substring(0, 500) + '...');
    
    if (response.data.status !== '0000') {
      throw new Error(`API Error: ${response.data.message}`);
    }
    
    // 마켓 정보를 객체에서 배열 형태로 변환
    const markets = Object.keys(response.data.data)
      .filter(key => key !== 'date')
      .map(symbol => ({
        symbol,
        market: `KRW-${symbol}`, // 변경: 빗썸 형식에 맞춤
        korean_name: symbol,
        english_name: symbol
      }));
    
    console.log('검출된 마켓 수:', markets.length);
    return markets;
  } catch (error) {
    console.error('마켓 정보 조회 에러:', error);
    return [];
  }
}

// 분 캔들 조회
export async function getMinuteCandles(symbol: string, unit: 1 | 3 | 5 | 10 | 30, count: number = 200) {
  try {
    console.log(`빗썸 ${symbol} ${unit}분 캔들 조회 시작...`);
    const response = await axios.get(`${BITHUMB_API_URL}/candlestick/${symbol}_KRW/${unit}m`);
    console.log('캔들 데이터 응답:', JSON.stringify(response.data).substring(0, 500) + '...');
    
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
    console.log(`빗썸 ${symbol} 일간 캔들 조회 시작...`);
    const response = await axios.get(`${BITHUMB_API_URL}/candlestick/${symbol}_KRW/24h`);
    console.log('일간 캔들 데이터 응답:', JSON.stringify(response.data).substring(0, 500) + '...');
    
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
    console.log(`빗썸 현재가 정보 조회 시작... 심볼: ${symbols}`);
    const symbolList = symbols.split(',').map(s => s.trim().toUpperCase());
    const result = [];
    
    // 모든 티커 정보 조회
    const response = await axios.get(`${BITHUMB_API_URL}/ticker/ALL_KRW`);
    console.log('티커 응답:', JSON.stringify(response.data).substring(0, 500) + '...');
    
    if (response.data.status !== '0000') {
      throw new Error(`API Error: ${response.data.message}`);
    }
    
    // 응답 구조 확인
    const allData = response.data.data;
    console.log('사용 가능한 코인 심볼:', Object.keys(allData).filter(key => key !== 'date'));
    
    // 이전에 주어진 심볼 중에 없는 경우를 대비하여 임시 심볼 설정
    if (symbolList.length === 0 || !allData[symbolList[0]]) {
      const availableSymbols = Object.keys(allData).filter(key => key !== 'date');
      if (availableSymbols.length > 0) {
        symbolList.push(availableSymbols[0]);
        console.log(`주어진 심볼이 없거나 유효하지 않아 첫 번째 사용 가능한 심볼로 대체: ${symbolList[0]}`);
      }
    }
    
    // 각 심볼에 대한 티커 정보 추출
    for (const symbol of symbolList) {
      console.log(`심볼 ${symbol} 처리 중...`);
      if (allData[symbol]) {
        const tickerData = allData[symbol];
        const formattedData = {
          market: symbol,  // 심볼 정보 추가
          opening_price: parseFloat(tickerData.opening_price) || 0,
          closing_price: parseFloat(tickerData.closing_price) || 0,
          min_price: parseFloat(tickerData.min_price) || 0,
          max_price: parseFloat(tickerData.max_price) || 0,
          units_traded: parseFloat(tickerData.units_traded) || 0,
          acc_trade_value: parseFloat(tickerData.acc_trade_value) || 0,
          prev_closing_price: parseFloat(tickerData.prev_closing_price) || 0,
          units_traded_24H: parseFloat(tickerData.units_traded_24H) || 0,
          acc_trade_value_24H: parseFloat(tickerData.acc_trade_value_24H) || 0,
          fluctate_24H: parseFloat(tickerData.fluctate_24H) || 0,
          fluctate_rate_24H: parseFloat(tickerData.fluctate_rate_24H) || 0,
          
          // 프론트엔드 호환성을 위한 변환 필드 추가
          trade_price: parseFloat(tickerData.closing_price) || 0,
          signed_change_rate: parseFloat(tickerData.fluctate_rate_24H) / 100 || 0,
          high_price: parseFloat(tickerData.max_price) || 0,
          low_price: parseFloat(tickerData.min_price) || 0
        };
        console.log(`${symbol} 데이터:`, formattedData);
        result.push(formattedData);
      } else {
        console.log(`${symbol} 심볼에 대한 데이터가 없습니다.`);
      }
    }
    
    console.log('최종 결과:');
    console.log(result);
    return result;
  } catch (error) {
    console.error('현재가 정보 조회 에러:', error);
    return [];
  }
}

// 호가 정보 조회
export async function getOrderbook(symbol: string) {
  try {
    console.log(`빗썸 ${symbol} 호가 정보 조회 시작...`);
    const response = await axios.get(`${BITHUMB_API_URL}/orderbook/${symbol}_KRW`);
    console.log('호가 정보 응답:', JSON.stringify(response.data).substring(0, 500) + '...');
    
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
    console.log(`빗썸 ${symbol} 거래 내역 조회 시작...`);
    const response = await axios.get(`${BITHUMB_API_URL}/transaction_history/${symbol}_KRW`, {
      params: { count }
    });
    console.log('거래 내역 응답:', JSON.stringify(response.data).substring(0, 500) + '...');
    
    if (response.data.status !== '0000') {
      throw new Error(`API Error: ${response.data.message}`);
    }
    
    return response.data.data;
  } catch (error) {
    return safeReturn([])(error);
  }
}

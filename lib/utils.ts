import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// 천 단위 구분자 포맷팅 함수
export function formatNumber(value: number): string {
  return new Intl.NumberFormat('ko-KR').format(value);
}

// 날짜 포맷팅 함수
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

// 퍼센트 포맷팅 함수
export function formatPercent(value: number): string {
  return `${(value * 100).toFixed(2)}%`;
}

// 타임스탬프를 날짜 문자열로 변환
export function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

// UTC 시간을 KST로 변환
export function utcToKst(dateString: string): string {
  const date = new Date(dateString);
  const kstDate = new Date(date.getTime() + 9 * 60 * 60 * 1000); // UTC+9
  return kstDate.toISOString();
}

// 이동평균 계산 함수
export function calculateMA(prices: number[], period: number): number[] {
  return prices.map((_, i) => {
    if (i < period - 1) return 0;
    const slice = prices.slice(i - period + 1, i + 1);
    return slice.reduce((sum, price) => sum + price, 0) / period;
  });
}

// 상대강도지수(RSI) 계산 함수
export function calculateRSI(prices: number[], period = 14): number[] {
  const changes = [];
  for (let i = 1; i < prices.length; i++) {
    changes.push(prices[i] - prices[i - 1]);
  }

  const rsiValues = [0]; // 첫 데이터는 계산 불가능
  
  for (let i = 1; i < prices.length; i++) {
    if (i < period) {
      rsiValues.push(0);
      continue;
    }
    
    let sumGain = 0;
    let sumLoss = 0;
    
    for (let j = i - period; j < i; j++) {
      const change = changes[j];
      if (change > 0) {
        sumGain += change;
      } else {
        sumLoss += Math.abs(change);
      }
    }
    
    if (sumLoss === 0) {
      rsiValues.push(100);
    } else {
      const rs = sumGain / sumLoss;
      const rsi = 100 - (100 / (1 + rs));
      rsiValues.push(rsi);
    }
  }
  
  return rsiValues;
}

// 볼린저 밴드 계산 함수
export function calculateBollingerBands(prices: number[], period = 20, multiplier = 2): { 
  upper: number[]; 
  middle: number[]; 
  lower: number[] 
} {
  const middle = calculateMA(prices, period);
  const upper = [];
  const lower = [];
  
  for (let i = 0; i < prices.length; i++) {
    if (i < period - 1) {
      upper.push(0);
      lower.push(0);
      continue;
    }
    
    const slice = prices.slice(i - period + 1, i + 1);
    const avg = slice.reduce((sum, price) => sum + price, 0) / period;
    const squareDiffSum = slice.reduce((sum, price) => sum + Math.pow(price - avg, 2), 0);
    const stdDev = Math.sqrt(squareDiffSum / period);
    
    upper.push(middle[i] + multiplier * stdDev);
    lower.push(middle[i] - multiplier * stdDev);
  }
  
  return { upper, middle, lower };
}

// MACD 계산 함수
export function calculateMACD(prices: number[], shortPeriod = 12, longPeriod = 26, signalPeriod = 9): {
  macd: number[];
  signal: number[];
  histogram: number[];
} {
  const shortEMA = calculateEMA(prices, shortPeriod);
  const longEMA = calculateEMA(prices, longPeriod);
  
  const macd = shortEMA.map((value, i) => value - longEMA[i]);
  const signal = calculateEMA(macd, signalPeriod);
  const histogram = macd.map((value, i) => value - signal[i]);
  
  return { macd, signal, histogram };
}

// 지수이동평균(EMA) 계산 함수
export function calculateEMA(prices: number[], period: number): number[] {
  const ema = [prices[0]]; // 첫 값은 단순 가격
  const multiplier = 2 / (period + 1);
  
  for (let i = 1; i < prices.length; i++) {
    ema.push(prices[i] * multiplier + ema[i - 1] * (1 - multiplier));
  }
  
  return ema;
}

// 가격 변화율 계산 함수
export function calculatePriceChange(currentPrice: number, previousPrice: number): number {
  if (previousPrice === 0) return 0;
  return (currentPrice - previousPrice) / previousPrice;
}

// 거래량 변화율 계산 함수
export function calculateVolumeChange(currentVolume: number, previousVolume: number): number {
  if (previousVolume === 0) return 0;
  return (currentVolume - previousVolume) / previousVolume;
}

// 이동평균 수렴/발산(MACD) 신호
export function getMACDSignal(macd: number, signal: number, previousMACD: number, previousSignal: number): string {
  if (macd > signal && previousMACD <= previousSignal) {
    return 'buy'; // 황금 교차 (골든 크로스)
  } else if (macd < signal && previousMACD >= previousSignal) {
    return 'sell'; // 죽음 교차 (데드 크로스)
  }
  return 'hold';
}

// RSI 신호
export function getRSISignal(rsi: number): string {
  if (rsi < 30) {
    return 'buy'; // 과매도
  } else if (rsi > 70) {
    return 'sell'; // 과매수
  }
  return 'hold';
}

// 볼린저 밴드 신호
export function getBollingerBandsSignal(price: number, upper: number, lower: number, middle: number): string {
  if (price <= lower) {
    return 'buy'; // 하단 밴드 터치 (매수 신호)
  } else if (price >= upper) {
    return 'sell'; // 상단 밴드 터치 (매도 신호)
  }
  return 'hold';
}

// 기술적 분석으로부터 종합 신호 도출
export function getTechnicalSignal(signals: { [key: string]: string }): string {
  const signalCount = {
    buy: 0,
    sell: 0,
    hold: 0
  };
  
  Object.values(signals).forEach(signal => {
    signalCount[signal as keyof typeof signalCount]++;
  });
  
  if (signalCount.buy > signalCount.sell && signalCount.buy > signalCount.hold) {
    return 'buy';
  } else if (signalCount.sell > signalCount.buy && signalCount.sell > signalCount.hold) {
    return 'sell';
  }
  return 'hold';
}

import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

const BINANCE_API_BASE_URL = 'https://api.binance.com/api/v3';

const intervalMapping = {
  '1s': '1s',
  '15m': '15m',
  '1h': '1h',
  '4h': '4h',
  '1d': '1d',
  '1w': '1w',
  '1M': '1M'
};

const intervalToMs = {
  '1s': 1000,
  '15m': 15 * 60 * 1000,
  '1h': 60 * 60 * 1000,
  '4h': 4 * 60 * 60 * 1000,
  '1d': 24 * 60 * 60 * 1000,
  '1w': 7 * 24 * 60 * 60 * 1000,
  '1M': 30 * 24 * 60 * 60 * 1000
};

export default async function handler(
  req: NextApiRequest, 
  res: NextApiResponse
) {
  const { symbol, timeframe = '1d' } = req.query;

  if (!symbol || typeof symbol !== 'string') {
    return res.status(400).json({ error: '유효하지 않은 심볼입니다.' });
  }

  const interval = intervalMapping[timeframe as keyof typeof intervalMapping] || '1d';
  const intervalInMs = intervalToMs[timeframe as keyof typeof intervalToMs];

  try {
    // 코인의 최초 거래 시점 찾기
    const exchangeInfoResponse = await axios.get(`${BINANCE_API_BASE_URL}/exchangeInfo`);
    const symbolInfo = exchangeInfoResponse.data.symbols.find((s: any) => s.symbol === symbol.toUpperCase());
    
    if (!symbolInfo) {
      return res.status(404).json({ error: '해당 심볼을 찾을 수 없습니다.' });
    }

    const firstTradeTime = symbolInfo.orderTypes ? Date.parse(symbolInfo.orderTypes[0].time) : Date.now() - (365 * 24 * 60 * 60 * 1000);

    // 모든 과거 데이터 수집
    let allCandles: any[] = [];
    let startTime = firstTradeTime;
    const now = Date.now();

    while (startTime < now) {
      const response = await axios.get(`${BINANCE_API_BASE_URL}/klines`, {
        params: {
          symbol: symbol.toUpperCase(),
          interval: interval,
          startTime: startTime,
          limit: 1000  // Binance API의 최대 제한
        }
      });

      const candles = response.data;
      
      if (candles.length === 0) break;

      allCandles = allCandles.concat(candles);
      
      // 마지막 캔들의 종료 시간으로 다음 시작 시간 설정
      startTime = parseInt(candles[candles.length - 1][0]) + intervalInMs;
    }

    const processedCandles = allCandles.map((candle: any) => ({
      timestamp: parseInt(candle[0]),
      opening_price: parseFloat(candle[1]),
      high_price: parseFloat(candle[2]),
      low_price: parseFloat(candle[3]),
      trade_price: parseFloat(candle[4]),
      candle_acc_trade_volume: parseFloat(candle[5])
    }));

    res.status(200).json(processedCandles);
  } catch (error) {
    console.error('캔들 데이터 가져오기 실패:', error);
    res.status(500).json({ error: '데이터를 가져오는 중 오류가 발생했습니다.' });
  }
}

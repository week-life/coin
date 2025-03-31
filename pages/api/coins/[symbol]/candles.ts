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

export default async function handler(
  req: NextApiRequest, 
  res: NextApiResponse
) {
  const { symbol, timeframe = '1d' } = req.query;

  if (!symbol || typeof symbol !== 'string') {
    return res.status(400).json({ error: '유효하지 않은 심볼입니다.' });
  }

  const interval = intervalMapping[timeframe as keyof typeof intervalMapping] || '1d';

  try {
    // Binance API에서 최대한 많은 히스토리 데이터 가져오기
    const response = await axios.get(`${BINANCE_API_BASE_URL}/klines`, {
      params: {
        symbol: symbol.toUpperCase(),
        interval: interval,
        limit: 1000  // Binance API의 최대 제한
      }
    });

    const candleData = response.data.map((candle: any) => ({
      timestamp: parseInt(candle[0]),
      opening_price: parseFloat(candle[1]),
      high_price: parseFloat(candle[2]),
      low_price: parseFloat(candle[3]),
      trade_price: parseFloat(candle[4]),
      candle_acc_trade_volume: parseFloat(candle[5])
    }));

    res.status(200).json(candleData);
  } catch (error) {
    console.error('캔들 데이터 가져오기 실패:', error);
    res.status(500).json({ error: '데이터를 가져오는 중 오류가 발생했습니다.' });
  }
}

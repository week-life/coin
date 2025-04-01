import { CoinData, ChartData, CoinTickerData } from '@/types/coin';
import { preprocessChartData } from '@/lib/utils';

const BINANCE_API_BASE = 'https://api.binance.com/api/v3';

export class CoinService {
  static async fetchCoins(symbols: string[] = ['BTCUSDT', 'ETHUSDT']): Promise<CoinData[]> {
    try {
      const tickers = await Promise.all(
        symbols.map(symbol => 
          fetch(`${BINANCE_API_BASE}/ticker/24hr?symbol=${symbol}`)
            .then(res => res.json())
        )
      );

      return tickers.map((ticker, index) => ({
        id: symbols[index],
        symbol: ticker.symbol,
        market: 'Binance',
        korean_name: this.getKoreanName(ticker.symbol),
        english_name: this.getEnglishName(ticker.symbol),
        is_favorite: false,
        current_price: parseFloat(ticker.lastPrice),
        change_rate: parseFloat(ticker.priceChangePercent) / 100,
        change_price: parseFloat(ticker.priceChange)
      }));
    } catch (error) {
      console.error('Failed to fetch coins:', error);
      return [];
    }
  }

  static async fetchChartData(
    symbol: string, 
    interval: string = '1d', 
    limit: number = 100
  ): Promise<ChartData[]> {
    try {
      const response = await fetch(
        `${BINANCE_API_BASE}/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`
      );
      const rawData = await response.json();
      return preprocessChartData(rawData);
    } catch (error) {
      console.error('Failed to fetch chart data:', error);
      return [];
    }
  }

  static async searchCoins(query: string): Promise<CoinData[]> {
    const allCoins = await this.fetchCoins();
    return allCoins.filter(coin => 
      coin.symbol.toLowerCase().includes(query.toLowerCase()) ||
      coin.korean_name.toLowerCase().includes(query.toLowerCase()) ||
      coin.english_name.toLowerCase().includes(query.toLowerCase())
    );
  }

  private static getKoreanName(symbol: string): string {
    const names: {[key: string]: string} = {
      'BTCUSDT': '비트코인',
      'ETHUSDT': '이더리움',
      'BNBUSDT': '바이낸스 코인',
      'ADAUSDT': '에이다',
      'DOGEUSDT': '도지코인'
    };
    return names[symbol] || symbol;
  }

  private static getEnglishName(symbol: string): string {
    const names: {[key: string]: string} = {
      'BTCUSDT': 'Bitcoin',
      'ETHUSDT': 'Ethereum',
      'BNBUSDT': 'Binance Coin',
      'ADAUSDT': 'Cardano',
      'DOGEUSDT': 'Dogecoin'
    };
    return names[symbol] || symbol;
  }
}

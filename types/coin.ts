export type Market = 'Binance' | 'Upbit' | 'Bithumb' | 'Coinone';

export interface CoinData {
  id: string;
  symbol: string;
  market: Market;
  korean_name: string;
  english_name: string;
  is_favorite: boolean;
  current_price: number | null;
  change_rate: number | null;
  change_price: number | null;
}

export interface ChartData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export interface CoinChartProps {
  symbol: string;
  data?: ChartData[];
  interval?: '1m' | '5m' | '15m' | '30m' | '1h' | '4h' | '1d' | '1w';
}

export interface CoinListProps {
  initialCoins?: CoinData[];
  favoritesOnly?: boolean;
  coins?: CoinData[];
  isLoading?: boolean;
  error?: string | null;
  onSelectCoin?: (symbol: string) => void;
}

export interface CoinTickerData {
  symbol: string;
  price: number;
  changeRate: number;
  volume: number;
}

export interface CoinDetailProps {
  symbol: string;
}

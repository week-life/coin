export interface CoinData {
  id: number;
  symbol: string;
  market: string;
  korean_name: string;
  english_name: string;
  is_favorite: boolean;
  current_price?: number;
  change_rate?: number;
}

export interface ChartData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

export interface CoinChartProps {
  symbol: string;
  data?: ChartData[];
}

export interface CoinListProps {
  initialCoins?: CoinData[];
  favoritesOnly?: boolean;
  coins?: CoinData[];
  isLoading?: boolean;
  error?: string | null;
  onSelectCoin?: (symbol: string) => void;
}

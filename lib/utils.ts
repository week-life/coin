import { CoinData, ChartData } from '@/types/coin';

export function formatNumber(value: number, locale: string = 'ko-KR', options?: Intl.NumberFormatOptions): string {
  const defaultOptions: Intl.NumberFormatOptions = {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 8
  };

  return new Intl.NumberFormat(locale, { ...defaultOptions, ...options }).format(value);
}

export function formatPercent(value: number): string {
  return new Intl.NumberFormat('ko-KR', {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
}

export function preprocessChartData(rawData: any[]): ChartData[] {
  return rawData.map(candle => ({
    time: parseInt(candle[0]) / 1000,
    open: parseFloat(candle[1]),
    high: parseFloat(candle[2]),
    low: parseFloat(candle[3]),
    close: parseFloat(candle[4]),
    volume: parseFloat(candle[5])
  }));
}

export function calculatePriceChange(current: number, previous: number): number {
  return (current - previous) / previous;
}

export function sortCoins(coins: CoinData[], sortBy: keyof CoinData = 'current_price', ascending: boolean = false): CoinData[] {
  return [...coins].sort((a, b) => {
    const valueA = a[sortBy] ?? 0;
    const valueB = b[sortBy] ?? 0;
    return ascending 
      ? (valueA as number) - (valueB as number)
      : (valueB as number) - (valueA as number);
  });
}

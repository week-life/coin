import { useState, useEffect, useCallback } from 'react';
import { CoinService } from '@/services/coinService';
import { CoinData, ChartData } from '@/types/coin';

export function useCoinData() {
  const [coins, setCoins] = useState<CoinData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCoins = useCallback(async () => {
    try {
      setLoading(true);
      const fetchedCoins = await CoinService.fetchCoins();
      setCoins(fetchedCoins);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : '코인 데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCoins();
    const intervalId = setInterval(fetchCoins, 30000); // 30초마다 새로고침
    return () => clearInterval(intervalId);
  }, [fetchCoins]);

  const searchCoins = useCallback(async (query: string) => {
    try {
      const searchResults = await CoinService.searchCoins(query);
      return searchResults;
    } catch (err) {
      console.error('코인 검색 중 오류:', err);
      return [];
    }
  }, []);

  return {
    coins,
    loading,
    error,
    fetchCoins,
    searchCoins
  };
}

export function useCoinChart(symbol: string = 'BTCUSDT', interval: string = '1d') {
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchChartData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await CoinService.fetchChartData(symbol, interval);
      setChartData(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : '차트 데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, [symbol, interval]);

  useEffect(() => {
    fetchChartData();
    const intervalId = setInterval(fetchChartData, 60000); // 1분마다 새로고침
    return () => clearInterval(intervalId);
  }, [fetchChartData]);

  return {
    chartData,
    loading,
    error,
    fetchChartData
  };
}

'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { Star, StarOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatNumber } from '@/lib/utils';
import { createChart, ColorType } from 'lightweight-charts';

interface Coin {
  id: number;
  symbol: string;
  market: string;
  korean_name: string;
  english_name: string;
  is_favorite: boolean;
  current_price?: number;
  change_rate?: number;
}

interface CoinListProps {
  initialCoins?: Coin[];
  favoritesOnly?: boolean;
}

export default function CoinList({ initialCoins = [], favoritesOnly = false }: CoinListProps) {
  const [coins, setCoins] = useState<Coin[]>(initialCoins);
  const [loading, setLoading] = useState<boolean>(initialCoins.length === 0);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('');
  const chartRef = useRef<HTMLDivElement>(null);

  // 바이낸스 API에서 코인 데이터 가져오기
  const fetchCoins = async () => {
    try {
      setLoading(true);
      console.log('코인 목록을 불러오는 중...');
      const response = await fetch(`https://api.binance.com/api/v3/ticker/24hr`);
      
      if (!response.ok) {
        throw new Error('코인 목록을 불러오는데 실패했습니다.');
      }
      
      const data = await response.json();
      // 바이낸스 API 데이터 형식에 맞게 변환
      const processedCoins = data.map((coin: any) => ({
        id: Math.random(), // 바이낸스 API에 고유 ID가 없어서 랜덤 ID 생성
        symbol: coin.symbol,
        market: 'Binance',
        korean_name: coin.symbol,
        english_name: coin.symbol,
        is_favorite: false,
        current_price: parseFloat(coin.lastPrice),
        change_rate: parseFloat(coin.priceChangePercent) / 100
      }));

      setCoins(processedCoins);
      setError(null);
    } catch (err) {
      setError((err as Error).message);
      console.error('코인 목록 조회 에러:', err);
    } finally {
      setLoading(false);
    }
  };

  // 코인 차트 렌더링
  const renderChart = (symbol: string) => {
    if (chartRef.current) {
      // 기존 차트 초기화
      chartRef.current.innerHTML = '';

      const chart = createChart(chartRef.current, {
        width: chartRef.current.clientWidth,
        height: 300,
        layout: {
          background: { type: ColorType.Solid, color: 'white' },
          textColor: 'black',
        },
        grid: {
          vertLines: { color: 'rgba(197, 203, 206, 0.5)' },
          horzLines: { color: 'rgba(197, 203, 206, 0.5)' },
        },
        crosshair: {
          mode: 1,
        },
        rightPriceScale: {
          borderColor: 'rgba(197, 203, 206, 0.8)',
        },
        timeScale: {
          borderColor: 'rgba(197, 203, 206, 0.8)',
        },
      });

      // 캔들 데이터 가져오기
      const fetchCandleData = async () => {
        try {
          const response = await fetch(`https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=1d&limit=30`);
          const data = await response.json();
          
          const candleSeries = chart.addCandlestickSeries({
            upColor: 'red',
            downColor: 'blue',
            borderVisible: false,
            wickUpColor: 'red',
            wickDownColor: 'blue',
          });

          const formattedData = data.map((candle: any) => ({
            time: parseInt(candle[0]) / 1000, // 밀리초를 초로 변환
            open: parseFloat(candle[1]),
            high: parseFloat(candle[2]),
            low: parseFloat(candle[3]),
            close: parseFloat(candle[4]),
          }));

          candleSeries.setData(formattedData);
        } catch (error) {
          console.error('캔들 데이터 가져오기 실패:', error);
        }
      };

      fetchCandleData();
    }
  };

  // 최초 마운트 시 코인 목록 가져오기
  useEffect(() => {
    if (initialCoins.length === 0) {
      fetchCoins();
    }
    
    // 가격 정보 주기적 업데이트
    const fetchPrices = async () => {
      try {
        const response = await fetch(`https://api.binance.com/api/v3/ticker/24hr`);
        const priceData = await response.json();
        
        setCoins(prevCoins => {
          return prevCoins.map(coin => {
            const updatedCoin = priceData.find((data: any) => data.symbol === coin.symbol);
            
            if (updatedCoin) {
              return {
                ...coin,
                current_price: parseFloat(updatedCoin.lastPrice),
                change_rate: parseFloat(updatedCoin.priceChangePercent) / 100,
              };
            }
            return coin;
          });
        });
      } catch (err) {
        console.error('가격 정보 조회 에러:', err);
      }
    };
    
    fetchPrices();
    const intervalId = setInterval(fetchPrices, 30000); // 30초마다 가격 정보 업데이트
    
    return () => clearInterval(intervalId);
  }, [initialCoins.length]);

  // 필터링된 코인 목록
  const filteredCoins = coins.filter(
    coin =>
      coin.symbol.toLowerCase().includes(filter.toLowerCase()) ||
      coin.korean_name.toLowerCase().includes(filter.toLowerCase()) ||
      coin.english_name.toLowerCase().includes(filter.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center my-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4 my-4">
        <div className="flex">
          <div className="text-red-700">
            <p>{error}</p>
          </div>
        </div>
        <div className="mt-4">
          <Button onClick={fetchCoins}>다시 시도</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <h2 className="text-2xl font-bold">
          {favoritesOnly ? '즐겨찾기 코인' : '코인 목록'}
        </h2>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="코인 검색..."
            className="px-3 py-2 border rounded-md"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
          <Button variant="outline" onClick={fetchCoins}>
            새로고침
          </Button>
        </div>
      </div>

      {filteredCoins.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">
            {filter ? `"${filter}"에 대한 검색 결과가 없습니다.` : '코인이 없습니다.'}
          </p>
        </div>
      ) : (
        <div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    즐겨찾기
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    코인
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    심볼
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    현재가
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    변동률
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    마켓
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCoins.map((coin) => (
                  <tr key={coin.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button>
                        <StarOff className="h-5 w-5 text-gray-400" />
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button onClick={() => renderChart(coin.symbol)}>
                        {coin.korean_name}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{coin.symbol}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {coin.current_price ? formatNumber(coin.current_price) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {coin.change_rate !== undefined ? (
                        <span
                          className={`${
                            coin.change_rate > 0
                              ? 'text-green-600'
                              : coin.change_rate < 0
                              ? 'text-red-600'
                              : 'text-gray-500'
                          }`}
                        >
                          {(coin.change_rate * 100).toFixed(2)}%
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{coin.market}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div ref={chartRef} className="w-full h-[300px] mt-4"></div>
        </div>
      )}
    </div>
  );
}

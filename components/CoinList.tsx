'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Star, StarOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatNumber } from '@/lib/utils';

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

  // 코인 목록 조회
  const fetchCoins = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/coins${favoritesOnly ? '?favorites=true' : ''}`);
      
      if (!response.ok) {
        throw new Error('코인 목록을 불러오는데 실패했습니다.');
      }
      
      const data = await response.json();
      setCoins(data);
      setError(null);
    } catch (err) {
      setError((err as Error).message);
      console.error('코인 목록 조회 에러:', err);
    } finally {
      setLoading(false);
    }
  };

  // 코인 즐겨찾기 토글
  const toggleFavorite = async (symbol: string) => {
    try {
      const response = await fetch('/api/coins/favorite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ symbol }),
      });
      
      if (!response.ok) {
        throw new Error('즐겨찾기 설정에 실패했습니다.');
      }
      
      // 데이터를 새로 가져오는 대신 상태 업데이트
      setCoins(prevCoins =>
        prevCoins.map(coin =>
          coin.symbol === symbol ? { ...coin, is_favorite: !coin.is_favorite } : coin
        )
      );
      
      // 즐겨찾기만 보기 모드에서 즐겨찾기 해제한 경우 해당 코인 제거
      if (favoritesOnly) {
        setCoins(prevCoins =>
          prevCoins.filter(coin => !(coin.symbol === symbol && coin.is_favorite))
        );
      }
    } catch (err) {
      console.error('즐겨찾기 토글 에러:', err);
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
        const symbols = coins.map(coin => coin.symbol).join(',');
        if (symbols) {
          const response = await fetch(`/api/coins/prices?symbols=${symbols}`);
          
          if (!response.ok) {
            throw new Error('가격 정보를 불러오는데 실패했습니다.');
          }
          
          const priceData = await response.json();
          
          setCoins(prevCoins =>
            prevCoins.map(coin => ({
              ...coin,
              current_price: priceData[coin.symbol]?.trade_price || coin.current_price,
              change_rate: priceData[coin.symbol]?.signed_change_rate || coin.change_rate,
            }))
          );
        }
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
          {favoritesOnly && (
            <p className="mt-2">
              <Link href="/coins" className="text-blue-500 hover:underline">
                전체 코인 목록 보기
              </Link>
            </p>
          )}
        </div>
      ) : (
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
                    <button onClick={() => toggleFavorite(coin.symbol)}>
                      {coin.is_favorite ? (
                        <Star className="h-5 w-5 text-yellow-400" />
                      ) : (
                        <StarOff className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Link href={`/coins/${coin.symbol}`} className="text-blue-500 hover:underline">
                      {coin.korean_name}
                    </Link>
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
      )}
    </div>
  );
}

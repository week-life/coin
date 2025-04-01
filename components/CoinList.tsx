'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Star, StarOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatNumber } from '@/lib/utils';
import { CoinData, CoinListProps } from '@/types/coin';

const CoinList: React.FC<CoinListProps> = ({ 
  initialCoins = [], 
  favoritesOnly = false,
  coins,
  isLoading = false,
  error = null,
  onSelectCoin = () => {}
}) => {
  const [localCoins, setLocalCoins] = useState<CoinData[]>(initialCoins);
  const [filteredCoins, setFilteredCoins] = useState<CoinData[]>([]);
  const [loading, setLoading] = useState<boolean>(isLoading);
  const [localError, setLocalError] = useState<string | null>(error);
  const [filter, setFilter] = useState<string>('');
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);

  // 코인 데이터 동기화
  useEffect(() => {
    if (coins) {
      setLocalCoins(coins);
    }
  }, [coins]);

  // 로딩 상태 동기화
  useEffect(() => {
    setLoading(isLoading);
  }, [isLoading]);

  // 에러 상태 동기화
  useEffect(() => {
    setLocalError(error);
  }, [error]);

  // 필터링 로직
  useEffect(() => {
    const filtered = localCoins.filter(coin => {
      const matchesFilter = 
        coin.symbol.toLowerCase().includes(filter.toLowerCase()) ||
        coin.korean_name.toLowerCase().includes(filter.toLowerCase()) ||
        coin.english_name.toLowerCase().includes(filter.toLowerCase());

      const matchesFavoriteFilter = !favoritesOnly || coin.is_favorite;

      return matchesFilter && matchesFavoriteFilter;
    });

    setFilteredCoins(filtered);
  }, [localCoins, filter, favoritesOnly]);

  // 코인 선택 핸들러
  const handleCoinSelect = useCallback((symbol: string) => {
    setSelectedSymbol(symbol);
    onSelectCoin(symbol);
  }, [onSelectCoin]);

  // 즐겨찾기 토글
  const toggleFavorite = useCallback((symbol: string) => {
    setLocalCoins(prev => 
      prev.map(coin => 
        coin.symbol === symbol 
          ? { ...coin, is_favorite: !coin.is_favorite } 
          : coin
      )
    );
  }, []);

  // 로딩 상태
  if (loading) {
    return (
      <div className="flex justify-center my-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // 에러 상태
  if (localError) {
    return (
      <div className="rounded-md bg-red-50 p-4 my-4">
        <div className="flex">
          <div className="text-red-700">
            <p>{localError}</p>
          </div>
        </div>
        <div className="mt-4">
          <Button onClick={() => setLocalError(null)}>닫기</Button>
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
          <Button variant="outline">새로고침</Button>
          <Button>코인 추가</Button>
        </div>
      </div>

      {filteredCoins.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">
            {filter ? `"${filter}"에 대한 검색 결과가 없습니다.` : '코인이 없습니다.'}
          </p>
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
                    <button onClick={() => handleCoinSelect(coin.symbol)}>
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
      )}
    </div>
  );
};

export default CoinList;

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

interface MarketInfo {
  market: string;
  korean_name: string;
  english_name: string;
  market_warning?: string;
}

export default function AddCoinForm() {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [markets, setMarkets] = useState<MarketInfo[]>([]);
  const [filteredMarkets, setFilteredMarkets] = useState<MarketInfo[]>([]);
  const [selectedMarket, setSelectedMarket] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  // 모든 마켓 정보 조회
  const fetchMarkets = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/markets');
      
      if (!response.ok) {
        throw new Error('마켓 정보를 불러오는데 실패했습니다.');
      }
      
      const data = await response.json();
      setMarkets(data);
      setFilteredMarkets(data);
      setError(null);
    } catch (err) {
      setError((err as Error).message);
      console.error('마켓 정보 조회 에러:', err);
    } finally {
      setLoading(false);
    }
  };

  // 코인 추가
  const addCoin = async () => {
    if (!selectedMarket) {
      setError('코인을 선택해주세요.');
      return;
    }
    
    try {
      setLoading(true);
      setSuccess(null);
      setError(null);
      
      const selectedMarketInfo = markets.find(m => m.market === selectedMarket);
      
      if (!selectedMarketInfo) {
        throw new Error('선택한 코인 정보를 찾을 수 없습니다.');
      }
      
      const response = await fetch('/api/coins', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          symbol: selectedMarket,
          market: selectedMarketInfo.market.split('-')[0], // KRW-BTC에서 KRW 추출
          korean_name: selectedMarketInfo.korean_name,
          english_name: selectedMarketInfo.english_name,
        }),
      });
      
      if (!response.ok) {
        throw new Error('코인 추가에 실패했습니다.');
      }
      
      setSuccess(`${selectedMarketInfo.korean_name}(${selectedMarket}) 코인이 추가되었습니다.`);
      setSelectedMarket('');
    } catch (err) {
      setError((err as Error).message);
      console.error('코인 추가 에러:', err);
    } finally {
      setLoading(false);
    }
  };

  // 검색어에 따른 마켓 필터링
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredMarkets(markets);
    } else {
      const term = searchTerm.toLowerCase();
      const filtered = markets.filter(
        market =>
          market.market.toLowerCase().includes(term) ||
          market.korean_name.toLowerCase().includes(term) ||
          market.english_name.toLowerCase().includes(term)
      );
      setFilteredMarkets(filtered);
    }
  }, [searchTerm, markets]);

  // 최초 마운트 시 마켓 정보 가져오기
  useEffect(() => {
    fetchMarkets();
  }, []);

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">코인 추가</h2>
      
      {error && (
        <div className="p-4 bg-red-100 border border-red-300 rounded text-red-800">
          {error}
        </div>
      )}
      
      {success && (
        <div className="p-4 bg-green-100 border border-green-300 rounded text-green-800">
          {success}
        </div>
      )}
      
      <div className="space-y-4">
        <div>
          <label htmlFor="searchTerm" className="block text-sm font-medium mb-1">
            코인 검색
          </label>
          <input
            id="searchTerm"
            type="text"
            className="w-full p-2 border rounded"
            placeholder="코인 이름, 심볼 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div>
          <label htmlFor="selectedMarket" className="block text-sm font-medium mb-1">
            추가할 코인 선택
          </label>
          {loading && <p className="text-gray-500">로딩 중...</p>}
          {!loading && filteredMarkets.length === 0 ? (
            <p className="text-gray-500">검색 결과가 없습니다.</p>
          ) : (
            <select
              id="selectedMarket"
              className="w-full p-2 border rounded"
              value={selectedMarket}
              onChange={(e) => setSelectedMarket(e.target.value)}
            >
              <option value="">선택하세요</option>
              {filteredMarkets.map((market) => (
                <option key={market.market} value={market.market}>
                  {market.korean_name} ({market.market})
                  {market.market_warning === 'CAUTION' ? ' - 유의' : ''}
                </option>
              ))}
            </select>
          )}
        </div>
        
        <div className="flex justify-end">
          <Button
            onClick={addCoin}
            disabled={loading || !selectedMarket}
          >
            {loading ? '처리 중...' : '코인 추가'}
          </Button>
        </div>
      </div>
    </div>
  );
}

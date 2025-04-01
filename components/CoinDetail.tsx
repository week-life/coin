'use client';

import React, { useState, useEffect } from 'react';
import { CoinData } from '@/types/coin';
import { CoinService } from '@/services/coinService';
import { formatNumber, formatPercent } from '@/lib/utils';
import CoinChart from './CoinChart';
import { Star, StarOff } from 'lucide-react';

interface CoinDetailProps {
  symbol: string;
}

const CoinDetail: React.FC<CoinDetailProps> = ({ symbol }) => {
  const [coinData, setCoinData] = useState<CoinData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState<boolean>(false);

  useEffect(() => {
    const fetchCoinData = async () => {
      try {
        setLoading(true);
        const coins = await CoinService.fetchCoins();
        const selectedCoin = coins.find(coin => coin.symbol === symbol);
        
        if (selectedCoin) {
          setCoinData(selectedCoin);
          setIsFavorite(selectedCoin.is_favorite);
        } else {
          setError('코인 정보를 찾을 수 없습니다.');
        }
      } catch (err) {
        setError('데이터를 불러오는 중 오류가 발생했습니다.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchCoinData();
  }, [symbol]);

  const toggleFavorite = () => {
    setIsFavorite(!isFavorite);
    // TODO: 실제 즐겨찾기 토글 로직 구현
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-500 mt-10">
        {error}
      </div>
    );
  }

  if (!coinData) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <h1 className="text-3xl font-bold">
            {coinData.korean_name} ({coinData.symbol})
          </h1>
          <button onClick={toggleFavorite}>
            {isFavorite ? (
              <Star className="h-6 w-6 text-yellow-400" />
            ) : (
              <StarOff className="h-6 w-6 text-gray-400" />
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">시세 정보</h2>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>현재가</span>
              <span className="font-bold">
                {coinData.current_price ? formatNumber(coinData.current_price) : '-'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>변동률</span>
              <span 
                className={`font-bold ${
                  coinData.change_rate && coinData.change_rate > 0 
                    ? 'text-green-600' 
                    : 'text-red-600'
                }`}
              >
                {coinData.change_rate ? formatPercent(coinData.change_rate) : '-'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>거래소</span>
              <span>{coinData.market}</span>
            </div>
          </div>
        </div>

        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">추가 정보</h2>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>한글 이름</span>
              <span>{coinData.korean_name}</span>
            </div>
            <div className="flex justify-between">
              <span>영문 이름</span>
              <span>{coinData.english_name}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <CoinChart symbol={symbol} />
      </div>
    </div>
  );
};

export default CoinDetail;

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Star, StarOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import CoinChart from '@/components/CoinChart';
import { formatNumber, formatPercent, formatTimestamp } from '@/lib/utils';

interface CoinInfo {
  id: number;
  symbol: string;
  market: string;
  korean_name: string;
  english_name: string;
  is_favorite: boolean;
}

interface TickerInfo {
  market: string;
  trade_price: number;
  signed_change_rate: number;
  signed_change_price: number;
  acc_trade_volume_24h: number;
  acc_trade_price_24h: number;
  high_price: number;
  low_price: number;
  prev_closing_price: number;
  timestamp: number;
}

export default function CoinDetailPage({ params }: { params: { symbol: string } }) {
  const { symbol } = params;
  const [coinInfo, setCoinInfo] = useState<CoinInfo | null>(null);
  const [tickerInfo, setTickerInfo] = useState<TickerInfo | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // 코인 정보 로드
  useEffect(() => {
    const fetchCoinInfo = async () => {
      try {
        setLoading(true);
        
        // 코인 정보 조회
        const coinResponse = await fetch(`/api/coins?symbols=${symbol}`);
        
        if (!coinResponse.ok) {
          throw new Error('코인 정보를 불러오는데 실패했습니다.');
        }
        
        const coinsData = await coinResponse.json();
        const coinData = coinsData.find((coin: CoinInfo) => coin.symbol === symbol);
        
        if (!coinData) {
          throw new Error('코인 정보를 찾을 수 없습니다.');
        }
        
        setCoinInfo(coinData);
        
        // 현재가 정보 조회
        const tickerResponse = await fetch(`/api/coins/prices?symbols=${symbol}`);
        
        if (!tickerResponse.ok) {
          throw new Error('현재가 정보를 불러오는데 실패했습니다.');
        }
        
        const tickerData = await tickerResponse.json();
        setTickerInfo(tickerData[symbol] || null);
        
        setError(null);
      } catch (err) {
        setError((err as Error).message);
        console.error('코인 정보 로드 에러:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCoinInfo();
    
    // 정기적으로 가격 정보 업데이트
    const intervalId = setInterval(async () => {
      try {
        const tickerResponse = await fetch(`/api/coins/prices?symbols=${symbol}`);
        
        if (tickerResponse.ok) {
          const tickerData = await tickerResponse.json();
          setTickerInfo(tickerData[symbol] || null);
        }
      } catch (error) {
        console.error('가격 정보 업데이트 에러:', error);
      }
    }, 10000); // 10초마다 업데이트
    
    return () => clearInterval(intervalId);
  }, [symbol]);

  // 즐겨찾기 토글
  const toggleFavorite = async () => {
    if (!coinInfo) return;
    
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
      
      setCoinInfo(prev => prev ? { ...prev, is_favorite: !prev.is_favorite } : null);
    } catch (err) {
      console.error('즐겨찾기 토글 에러:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center my-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !coinInfo) {
    return (
      <div className="rounded-md bg-red-50 p-4 my-4">
        <div className="flex">
          <div className="text-red-700">
            <p>{error || '코인 정보를 찾을 수 없습니다.'}</p>
          </div>
        </div>
        <div className="mt-4">
          <Button asChild>
            <Link href="/">코인 목록으로 돌아가기</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center space-x-2">
        <Button variant="outline" size="sm" asChild>
          <Link href="/">
            <ArrowLeft className="h-4 w-4 mr-1" />
            돌아가기
          </Link>
        </Button>
      </div>
      
      <div className="flex flex-col md:flex-row justify-between items-start gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold">{coinInfo.korean_name}</h1>
            <span className="text-gray-500">({coinInfo.symbol})</span>
            <button onClick={toggleFavorite} className="ml-2">
              {coinInfo.is_favorite ? (
                <Star className="h-6 w-6 text-yellow-400" />
              ) : (
                <StarOff className="h-6 w-6 text-gray-400" />
              )}
            </button>
          </div>
          <p className="text-gray-500">{coinInfo.english_name} · {coinInfo.market} 마켓</p>
        </div>
        
        {tickerInfo && (
          <div className="bg-white rounded-lg shadow p-4 w-full md:w-auto">
            <div className="flex justify-between items-center gap-8">
              <div>
                <p className="text-sm text-gray-500">현재가</p>
                <p className="text-2xl font-bold">{formatNumber(tickerInfo.trade_price)} 원</p>
                <p className={`${
                  tickerInfo.signed_change_rate > 0
                    ? 'text-green-600'
                    : tickerInfo.signed_change_rate < 0
                    ? 'text-red-600'
                    : 'text-gray-500'
                }`}>
                  {formatPercent(tickerInfo.signed_change_rate)} ({formatNumber(tickerInfo.signed_change_price)})
                </p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">고가</p>
                <p className="font-semibold text-green-600">{formatNumber(tickerInfo.high_price)}</p>
                <p className="text-sm text-gray-500">저가</p>
                <p className="font-semibold text-red-600">{formatNumber(tickerInfo.low_price)}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">거래량(24h)</p>
                <p className="font-semibold">{formatNumber(tickerInfo.acc_trade_volume_24h)}</p>
                <p className="text-sm text-gray-500">거래대금(24h)</p>
                <p className="font-semibold">{formatNumber(Math.round(tickerInfo.acc_trade_price_24h))} 원</p>
              </div>
            </div>
            
            <p className="text-xs text-gray-400 text-right mt-2">
              {tickerInfo.timestamp ? `업데이트: ${formatTimestamp(tickerInfo.timestamp)}` : ''}
            </p>
          </div>
        )}
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-4">
        <CoinChart symbol={symbol} />
      </div>
    </div>
  );
}

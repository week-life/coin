// components/CoinList.tsx

'use client';

import React from 'react';
import { Star, StarOff } from 'lucide-react'; // 아이콘 라이브러리 (lucide-react 가정)
import { formatNumber } from '@/lib/utils'; // 숫자 포맷 유틸리티 (경로 확인 필요)

// Coin 데이터 타입 정의 (실제 데이터 구조에 맞게 조정 필요)
export interface Coin {
  symbol: string;
  korean_name: string;
  market: string; // 예: KRW-BTC
  current_price?: number;
  change_rate?: number; // 예: 0.05 (5%), -0.02 (-2%)
  is_favorite?: boolean; // 즐겨찾기 여부
  // 필요에 따라 다른 속성 추가 가능 (거래량 등)
}

interface CoinListProps {
  coins: Coin[]; // 코인 데이터 배열
  isLoading: boolean; // 로딩 상태
  error: string | null; // 오류 메시지
  toggleFavorite: (symbol: string) => void; // 즐겨찾기 토글 함수
  onSelectCoin: (symbol: string) => void; // 코인 선택 시 호출될 함수 (차트 렌더링 트리거)
}

export default function CoinList({
  coins,
  isLoading,
  error,
  toggleFavorite,
  onSelectCoin,
}: CoinListProps) {

  // 로딩 상태 처리
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // 오류 상태 처리
  if (error) {
    return (
      <div className="text-center py-10 text-red-500">
        <p>데이터를 불러오는 중 오류가 발생했습니다:</p>
        <p>{error}</p>
        {/* 필요시 재시도 버튼 추가 */}
      </div>
    );
  }

  // 데이터가 없는 경우 처리
  if (!coins || coins.length === 0) {
    return <div className="text-center py-10 text-gray-500">표시할 코인 정보가 없습니다.</div>;
  }

  // 데이터 표시
  return (
    <div className="overflow-x-auto relative shadow-md sm:rounded-lg">
      <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
        <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
          <tr>
            {/* 테이블 헤더 */}
            <th scope="col" className="px-6 py-3">
              즐겨찾기
            </th>
            <th scope="col" className="px-6 py-3">
              이름
            </th>
            <th scope="col" className="px-6 py-3">
              심볼
            </th>
            <th scope="col" className="px-6 py-3">
              현재가
            </th>
            <th scope="col" className="px-6 py-3">
              변동률 (24h)
            </th>
            <th scope="col" className="px-6 py-3">
              마켓
            </th>
          </tr>
        </thead>
        <tbody>
          {/* 코인 목록 반복 렌더링 */}
          {coins.map((coin) => (
            <tr
              key={coin.symbol} // 각 행에 고유한 key 필요
              className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
            >
              {/* 즐겨찾기 버튼 */}
              <td className="px-6 py-4"> {/* <---- 버튼을 td로 감싸는 것이 중요! */}
                <button onClick={() => toggleFavorite(coin.symbol)} className="p-1">
                  {coin.is_favorite ? (
                    <Star className="h-5 w-5 text-yellow-400" fill="currentColor" /> // 채워진 별
                  ) : (
                    <StarOff className="h-5 w-5 text-gray-400" /> // 빈 별 (또는 Star 아이콘 테두리만)
                  )}
                </button>
              </td>
              {/* 코인 이름 (클릭 시 차트 선택) */}
              <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900 dark:text-white">
                <button onClick={() => onSelectCoin(coin.symbol)} className="hover:underline">
                  {coin.korean_name}
                </button>
              </td>
              {/* 심볼 */}
              <td className="px-6 py-4 whitespace-nowrap">{coin.symbol}</td>
              {/* 현재가 */}
              <td className="px-6 py-4 whitespace-nowrap">
                {coin.current_price !== undefined && coin.current_price !== null
                  ? formatNumber(coin.current_price)
                  : '-'}
              </td>
              {/* 변동률 */}
              <td className="px-6 py-4 whitespace-nowrap">
                {coin.change_rate !== undefined && coin.change_rate !== null ? (
                  <span
                    className={`${
                      coin.change_rate > 0
                        ? 'text-green-600' // 상승
                        : coin.change_rate < 0
                        ? 'text-red-600'   // 하락
                        : 'text-gray-500'  // 보합
                    }`}
                  >
                    {(coin.change_rate * 100).toFixed(2)}%
                  </span>
                ) : (
                  '-'
                )}
              </td>
              {/* 마켓 */}
              <td className="px-6 py-4 whitespace-nowrap">{coin.market}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    // 참고: 차트 렌더링 부분은 이 컴포넌트가 아니라,
    // 이 컴포넌트를 사용하는 부모 컴포넌트(예: app/page.tsx)에서
    // onSelectCoin으로 받은 symbol을 이용해 CoinChart 컴포넌트를 렌더링하는 것이 일반적입니다.
    // 만약 이 컴포넌트 내부에 차트가 있었다면, 그 부분은 여기에 포함되지 않았습니다.
  );
}

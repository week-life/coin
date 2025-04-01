//app/favorites/page.tsx
'use client';

import CoinList from '@/components/CoinList';
import { useCoinData } from '@/hooks/useCoinData'; // useCoinData 훅 임포트

export default function FavoritesPage() {
  // useCoinData 훅 사용
  const {
    allCoins,       // 전체 코인 목록 (훅에서 제공해야 함)
    isLoading,
    error,
    toggleFavorite,
    selectCoin,     // 코인 선택 함수 (차트용, 이름은 훅에 따라 다를 수 있음)
  } = useCoinData(); // 필요한 모든 상태와 함수를 훅에서 가져옵니다.

  // 즐겨찾기된 코인만 필터링
  // 'allCoins' 와 'is_favorite' 상태가 useCoinData 훅에서 관리된다고 가정
  const favoriteCoins = allCoins.filter(coin => coin.is_favorite);

  const handleSelectCoin = (symbol: string) => {
    selectCoin(symbol);
    // 필요시 즐겨찾기 페이지에서도 차트 표시 로직 추가
    console.log("Selected coin on favorites page:", symbol);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">즐겨찾는 코인</h1>
        <p className="text-gray-600 dark:text-gray-400">
          즐겨찾기로 등록한 코인 목록입니다.
        </p>
      </div>

      {/* CoinList 컴포넌트에 필터링된 데이터와 필요한 props 전달 */}
      <CoinList
        coins={favoriteCoins} // 필터링된 즐겨찾기 코인 목록 전달
        isLoading={isLoading}
        error={error}
        toggleFavorite={toggleFavorite}
        onSelectCoin={handleSelectCoin} // 이름 클릭 시 핸들러 연결
        // favoritesOnly prop 제거!
      />

      {/* 즐겨찾기 페이지에도 차트 표시가 필요하다면 여기에 CoinChart 컴포넌트 추가 */}
      {/* 예:
      {selectedSymbol && (
        <div className="mt-8">
           <CoinChart symbol={selectedSymbol} />
        </div>
      )}
      */}
    </div>
  );
}

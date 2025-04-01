// app/favorites/page.tsx

'use client';

import React, { useState } from 'react';
// --- tsconfig.json의 paths 설정을 기반으로 @/ 별칭 사용 ---
import CoinCard from '@/components/CoinCard';
import useCoinData from '@/hooks/useCoinData';
import { useFavoriteStore } from '@/store/useFavoriteStore';
import { CoinData } from '@/types/coin';
import Pagination from '@/components/Pagination';
import LoadingSpinner from '@/components/LoadingSpinner';

const FavoritesPage: React.FC = () => {
  const { favorites, toggleFavorite } = useFavoriteStore();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const favoriteCoinIds = Array.from(favorites);

  // 데이터 로딩 (페이지 파라미터 확인 필요 - 여기서는 예시로 1 사용)
  const { data, error, isLoading } = useCoinData(1);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 text-center mt-10">
        데이터를 불러오는 중 오류가 발생했습니다: {error.message}
      </div>
    );
  }

  // 즐겨찾기 필터링
  const favoriteCoins = data
    ? data.filter((coin: CoinData) => favoriteCoinIds.includes(coin.id))
    : [];

  // 페이지네이션 계산
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = favoriteCoins.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6 text-center">즐겨찾기 목록</h1>
      {favoriteCoins.length === 0 ? (
        <p className="text-center text-gray-500">즐겨찾기한 코인이 없습니다.</p>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {currentItems.map((coin) => (
              <CoinCard
                key={coin.id}
                coin={coin}
                isFavorite={favorites.has(coin.id)}
                onToggleFavorite={toggleFavorite}
              />
            ))}
          </div>
          {favoriteCoins.length > itemsPerPage && (
            <Pagination
              currentPage={currentPage}
              totalItems={favoriteCoins.length}
              itemsPerPage={itemsPerPage}
              onPageChange={handlePageChange}
            />
          )}
        </>
      )}
    </div>
  );
};

export default FavoritesPage;

'use client';

import React, { useState } from 'react';
// 모든 로컬 import를 상대 경로로 수정
import CoinCard from '../../components/CoinCard';
import useCoinData from '../../hooks/useCoinData';
import { useFavoriteStore } from '../../store/useFavoriteStore';
import { CoinData } from '../../types/coin'; // CoinData 타입 import 경로도 수정
import Pagination from '../../components/Pagination';
import LoadingSpinner from '../../components/LoadingSpinner';

const FavoritesPage: React.FC = () => {
  const { favorites, toggleFavorite } = useFavoriteStore();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // 즐겨찾기 목록에 있는 코인 ID만 필터링
  const favoriteCoinIds = Array.from(favorites);

  // useCoinData 훅을 사용하여 코인 데이터를 가져옵니다.
  // 즐겨찾기 페이지에서는 필요한 데이터만 필터링해야 합니다.
  // 여기서는 예시로 첫 페이지만 가져오고 클라이언트 측에서 필터링합니다.
  // 실제 구현 시에는 API 최적화 또는 여러 페이지 로드가 필요할 수 있습니다.
  const { data, error, isLoading } = useCoinData(1); // 예시: 첫 페이지만 로드

  // 로딩 상태 처리
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  // 에러 상태 처리
  if (error) {
    return (
      <div className="text-red-500 text-center mt-10">
        데이터를 불러오는 중 오류가 발생했습니다: {error.message}
      </div>
    );
  }

  // 즐겨찾기된 코인 데이터만 필터링
  const favoriteCoins = data
    ? data.filter((coin: CoinData) => favoriteCoinIds.includes(coin.id))
    : [];

  // 현재 페이지에 표시할 코인 계산
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
          {favoriteCoins.length > itemsPerPage && ( // 페이지네이션은 아이템이 페이지당 개수보다 많을 때만 표시
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

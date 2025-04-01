'use client';

import React, { useState } from 'react';
import CoinCard from '@/components/CoinCard';
// import useCoinData from '@/hooks/useCoinData'; // <- 기존 problematic 코드
import useCoinData from '../../hooks/useCoinData'; // <- 수정된 코드 (상대 경로 사용)
import { useFavoriteStore } from '@/store/useFavoriteStore';
import { CoinData } from '@/types/coin';
import Pagination from '@/components/Pagination';
import LoadingSpinner from '@/components/LoadingSpinner'; // 로딩 스피너 컴포넌트 임포트

const FavoritesPage: React.FC = () => {
  const { favorites, toggleFavorite } = useFavoriteStore();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // 즐겨찾기 목록에 있는 코인 ID만 필터링
  const favoriteCoinIds = Array.from(favorites);

  // useCoinData 훅을 사용하여 모든 코인 데이터를 가져옵니다.
  // 즐겨찾기 페이지에서는 페이지네이션이 필요 없을 수 있으므로,
  // 일단 모든 데이터를 가져오거나 (API가 지원한다면)
  // 또는 여러 페이지를 순회하며 즐겨찾기 항목을 찾아야 할 수 있습니다.
  // 여기서는 예시로 첫 페이지만 가져오고, 클라이언트 측에서 필터링합니다.
  // 실제 사용 사례에 따라 API 호출 방식 조정이 필요할 수 있습니다.
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
          <Pagination
            currentPage={currentPage}
            totalItems={favoriteCoins.length}
            itemsPerPage={itemsPerPage}
            onPageChange={handlePageChange}
          />
        </>
      )}
    </div>
  );
};

export default FavoritesPage;

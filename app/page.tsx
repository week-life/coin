// app/page.tsx

'use client'; // 클라이언트 컴포넌트 유지

import React, { useState } from 'react';
import CoinCard from '@/components/CoinCard'; // CoinCard import 유지
import useCoinData from '@/hooks/useCoinData'; // useCoinData import 유지
// import { useFavoriteStore } from '@/store/useFavoriteStore'; // Favorite Store import 삭제
import { CoinData } from '@/types/coin'; // CoinData 타입 import 유지
import Pagination from '@/components/Pagination'; // Pagination import 유지
import LoadingSpinner from '@/components/LoadingSpinner'; // LoadingSpinner import 유지

const HomePage: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; // 페이지당 아이템 수

  // useFavoriteStore 훅 사용 부분 완전 삭제
  // const { favorites, toggleFavorite } = useFavoriteStore();

  // useCoinData 훅을 사용하여 코인 데이터를 가져옵니다. (페이지 번호 전달)
  const { data, error, isLoading } = useCoinData(currentPage);

  // 현재 페이지에 표시할 코인 계산 (데이터가 로드된 후)
  // useCoinData가 페이지네이션된 데이터를 반환한다고 가정
  // 만약 useCoinData가 전체 데이터를 반환한다면, 여기서 slice 로직 필요
  const currentItems = data || []; // useCoinData가 해당 페이지 데이터만 반환한다고 가정

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
    // 페이지 변경 시 스크롤을 맨 위로 이동 (선택 사항)
    window.scrollTo(0, 0);
  };

  // 총 아이템 수 계산 (API 응답 구조에 따라 달라질 수 있음)
  // 여기서는 예시로 고정값을 사용하나, 실제로는 API에서 총 개수를 받아와야 함
  // 또는 useCoinData 훅이 총 개수 정보를 반환하도록 수정 필요
  const totalItems = 100; // <<-- 중요: 이 값은 실제 API 응답의 총 코인 개수로 대체해야 합니다.

  return (
    <main className="container mx-auto p-4">
      <h1 className="text-3xl font-bold text-center my-8 text-gray-900 dark:text-white">
        실시간 코인 시세
      </h1>

      {isLoading && ( // 로딩 상태 표시
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner />
        </div>
      )}

      {error && ( // 에러 상태 표시
        <div className="text-center text-red-500 mt-10">
          데이터를 불러오는 중 오류가 발생했습니다: {error.message}
          <p className="text-sm text-gray-500">잠시 후 다시 시도해주세요.</p>
        </div>
      )}

      {!isLoading && !error && data && ( // 데이터 로딩 완료 및 에러 없을 때
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
            {/* CoinCard에 isFavorite, onToggleFavorite prop 전달 부분 삭제 */}
            {currentItems.map((coin: CoinData) => (
              <CoinCard
                key={coin.id}
                coin={coin}
              />
            ))}
          </div>

          {/* 페이지네이션 컴포넌트 */}
          {totalItems > itemsPerPage && ( // 아이템이 페이지당 개수보다 많을 때만 페이지네이션 표시
            <Pagination
              currentPage={currentPage}
              totalItems={totalItems} // <<-- 중요: 실제 총 아이템 수 필요
              itemsPerPage={itemsPerPage}
              onPageChange={handlePageChange}
            />
          )}
        </>
      )}
       {!isLoading && !error && (!data || data.length === 0) && ( // 데이터가 없을 때 (로딩 후)
         <p className="text-center text-gray-500 mt-10">표시할 코인 정보가 없습니다.</p>
       )}
    </main>
  );
};

export default HomePage;

// app/page.tsx

'use client';

import React, { useState } from 'react';
// import CoinCard from '@/components/CoinCard'; // <- 이 import 삭제
import CoinList from '@/components/CoinList'; // <- CoinList import 추가
import useCoinData from '@/hooks/useCoinData';
// import { useFavoriteStore } from '@/store/useFavoriteStore'; // Favorite Store import 삭제
import { CoinData } from '@/types/coin';
import Pagination from '@/components/Pagination';
import LoadingSpinner from '@/components/LoadingSpinner';

const HomePage: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; // 페이지당 아이템 수 (CoinList와 일치해야 할 수 있음)

  // useFavoriteStore 훅 사용 부분 완전 삭제

  // useCoinData 훅을 사용하여 코인 데이터를 가져옵니다. (페이지 번호 전달)
  const { data, error, isLoading } = useCoinData(currentPage);

  // 현재 페이지에 표시할 코인 데이터 (CoinList에 전달)
  const currentItems = data || []; // useCoinData가 해당 페이지 데이터만 반환한다고 가정

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
    window.scrollTo(0, 0);
  };

  // 총 아이템 수 계산 (API 응답 구조에 따라 달라질 수 있음)
  // 여기서는 예시로 고정값을 사용하나, 실제로는 API에서 총 개수를 받아와야 함
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
          {/* --- CoinCard 직접 렌더링 대신 CoinList 사용 --- */}
          {/*
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
            {currentItems.map((coin: CoinData) => (
              <CoinCard
                key={coin.id}
                coin={coin}
              />
            ))}
          </div>
           */}
          {/* CoinList 컴포넌트에 코인 데이터 전달 */}
          <div className="mb-8"> {/* CoinList를 감싸는 div 추가 (선택 사항) */}
            <CoinList coins={currentItems} /> {/* coins prop 이름은 CoinList 내부 구현에 맞춰야 할 수 있음 */}
          </div>
          {/* --- CoinList 사용 끝 --- */}


          {/* 페이지네이션 컴포넌트 */}
          {totalItems > itemsPerPage && (
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

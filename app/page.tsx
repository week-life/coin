// app/page.tsx (최종 수정 제안)

'use client';

// React 및 사용자님이 사용하시는 상태/로직 관련 훅 import (예시)
import React, { useState, useEffect } from 'react';

// --- 존재하는 로컬 파일 import (안정성을 위해 상대 경로 사용) ---
import CoinList from '../components/CoinList'; // ../components/CoinList.tsx 확인
import { CoinData } from '../types/coin';     // ../types/coin.ts 확인

// --- 존재하지 않는 파일 import 제거 ---
// import useCoinData from '../hooks/useCoinData'; // 또는 '@/hooks/useCoinData'
// import Pagination from '../components/Pagination'; // 또는 '@/components/Pagination'
// import LoadingSpinner from '../components/LoadingSpinner'; // 또는 '@/components/LoadingSpinner'


const HomePage: React.FC = () => {
  // ==================================================================
  // == 사용자님의 기존 상태 관리 및 데이터 로딩 로직이 여기에 유지됩니다 ==
  // ==================================================================
  const [currentPage, setCurrentPage] = useState(1); // 예시 상태
  const [data, setData] = useState<CoinData[]>([]);      // 예시 상태
  const [isLoading, setIsLoading] = useState<boolean>(true);  // 예시 상태
  const [error, setError] = useState<Error | null>(null); // 예시 상태
  const [totalItems, setTotalItems] = useState(0);      // 예시 상태 (페이지네이션용)
  const itemsPerPage = 10;                           // 예시 상태

  useEffect(() => {
    // --- 사용자님의 실제 API 호출 로직 ---
    const fetchData = async () => {
       setIsLoading(true);
       setError(null);
       try {
         // 사용자님의 코드를 여기에 그대로 두세요
         // (예: fetch, 상태 업데이트 등)

       } catch (err) {
         setError(err instanceof Error ? err : new Error('Error fetching data'));
       } finally {
         setIsLoading(false);
       }
    };
    fetchData();
  }, [currentPage]); // 사용자님의 의존성 배열

  // 페이지 변경 핸들러 (임시 버튼용)
  const handlePageChange = (pageNumber: number) => {
    const newPage = Math.max(1, pageNumber);
    setCurrentPage(newPage);
    window.scrollTo(0, 0);
  };
  // ==================================================================
  // == 사용자 로직 끝 ==
  // ==================================================================


  return (
    <main className="container mx-auto p-4">
      <h1 className="text-3xl font-bold text-center my-8 text-gray-900 dark:text-white">
        실시간 코인 시세
      </h1>

      {/* --- LoadingSpinner 대신 간단한 UI --- */}
      {isLoading && (
        <div className="flex justify-center items-center h-64">
          <p>로딩 중...</p>
        </div>
      )}

      {error && ( // 에러 표시는 유지
        <div className="text-center text-red-500 mt-10">
          데이터를 불러오는 중 오류가 발생했습니다: {error.message}
        </div>
      )}

      {!isLoading && !error && data && ( // 데이터 로딩 완료 시
        <>
          {/* CoinList에 데이터 전달 */}
          <div className="mb-8">
            <CoinList
              coins={data} // 실제 데이터 전달
              isLoading={false} // 로딩 상태는 여기서 관리
              error={null}     // 에러 상태는 여기서 관리
              onSelectCoin={(symbol) => console.log('Selected:', symbol)} // 실제 핸들러 필요
             />
          </div>

          {/* --- Pagination 대신 임시 버튼 --- */}
           <div className="flex justify-center space-x-2 mt-4">
             <button
               onClick={() => handlePageChange(currentPage - 1)}
               disabled={currentPage <= 1 || isLoading}
               className="px-4 py-2 bg-gray-300 rounded disabled:opacity-50"
             >
               이전
             </button>
             <span className="px-4 py-2">페이지 {currentPage}</span>
             <button
               onClick={() => handlePageChange(currentPage + 1)}
               disabled={isLoading || (totalItems > 0 && currentPage * itemsPerPage >= totalItems)}
               className="px-4 py-2 bg-gray-300 rounded disabled:opacity-50"
             >
               다음
             </button>
           </div>
        </>
      )}
       {!isLoading && !error && (!data || data.length === 0) && ( // 데이터 없을 때
         <p className="text-center text-gray-500 mt-10">표시할 코인 정보가 없습니다.</p>
       )}
    </main>
  );
};

export default HomePage;

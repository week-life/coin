'use client';

import React, { useState } from 'react';
import CoinList from '@/components/CoinList';
import CoinChart from '@/components/CoinChart';
import { CoinData } from '@/types/coin';
import { useCoinData } from '@/hooks/useCoinData';
import { useFavorites } from '@/hooks/useFavorites';

export default function HomePage() {
  const { coins, loading, error } = useCoinData();
  const { toggleFavorite, isFavorite } = useFavorites();
  const [selectedSymbol, setSelectedSymbol] = useState<string>('BTCUSDT');

  const handleCoinSelect = (symbol: string) => {
    setSelectedSymbol(symbol);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white shadow-md rounded-lg p-4">
        <h1 className="text-2xl font-bold mb-4">코인 대시보드</h1>
        <CoinChart symbol={selectedSymbol} />
      </div>

      <div className="bg-white shadow-md rounded-lg p-4">
        <CoinList 
          coins={coins}
          isLoading={loading}
          error={error}
          onSelectCoin={handleCoinSelect}
        />
      </div>
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import { useFavorites } from '@/hooks/useFavorites';
import { CoinService } from '@/services/coinService';
import { CoinData } from '@/types/coin';
import CoinList from '@/components/CoinList';

export default function FavoritesPage() {
  const { favorites } = useFavorites();
  const [favoriteCoins, setFavoriteCoins] = useState<CoinData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFavoriteCoins = async () => {
      try {
        setLoading(true);
        const allCoins = await CoinService.fetchCoins();
        const filteredCoins = allCoins.filter(coin => 
          favorites.includes(coin.symbol)
        );
        setFavoriteCoins(filteredCoins);
      } catch (error) {
        console.error('즐겨찾기 코인 로딩 실패:', error);
      } finally {
        setLoading(false);
      }
    };

    if (favorites.length > 0) {
      fetchFavoriteCoins();
    } else {
      setFavoriteCoins([]);
      setLoading(false);
    }
  }, [favorites]);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">즐겨찾기 코인</h1>
      
      <CoinList 
        coins={favoriteCoins} 
        isLoading={loading}
        favoritesOnly={true}
      />
    </div>
  );
}

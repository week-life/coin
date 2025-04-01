import { useState, useEffect } from 'react';
import { CoinData } from '@/types/coin';

const FAVORITES_KEY = 'coin_favorites';

export function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>([]);

  // 로컬 스토리지에서 즐겨찾기 로드
  useEffect(() => {
    const storedFavorites = localStorage.getItem(FAVORITES_KEY);
    if (storedFavorites) {
      setFavorites(JSON.parse(storedFavorites));
    }
  }, []);

  // 즐겨찾기 토글
  const toggleFavorite = (symbol: string) => {
    setFavorites(prev => {
      const newFavorites = prev.includes(symbol)
        ? prev.filter(s => s !== symbol)
        : [...prev, symbol];
      
      // 로컬 스토리지에 저장
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(newFavorites));
      
      return newFavorites;
    });
  };

  // 특정 코인의 즐겨찾기 상태 확인
  const isFavorite = (symbol: string) => {
    return favorites.includes(symbol);
  };

  // 즐겨찾기 목록 가져오기
  const getFavorites = () => {
    return favorites;
  };

  return {
    favorites,
    toggleFavorite,
    isFavorite,
    getFavorites
  };
}

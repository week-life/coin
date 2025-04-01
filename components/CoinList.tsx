'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { Star, StarOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatNumber } from '@/lib/utils';
import { createChart, ColorType, IChartApi } from 'lightweight-charts';

// 기존 코드 유지...

export default function CoinList({ initialCoins = [], favoritesOnly = false }: CoinListProps) {
  // 기존 코드 유지...
}

'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { Star, StarOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatNumber } from '@/lib/utils';
import { createChart, ColorType, IChartApi } from 'lightweight-charts';

// (이전 코드 모두 유지)

          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  즐겨찾기
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  코인
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  심볼
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  현재가
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  변동률
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  마켓
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCoins.map((coin) => (
                <tr key={coin.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button onClick={() => toggleFavorite(coin.symbol)}>
                      {coin.is_favorite ? (
                        <Star className="h-5 w-5 text-yellow-400" />
                      ) : (
                        <StarOff className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button onClick={() => renderChart(coin.symbol)}>
                      {coin.korean_name}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{coin.symbol}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {coin.current_price ? formatNumber(coin.current_price) : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {coin.change_rate !== undefined ? (
                      <span
                        className={`${
                          coin.change_rate > 0
                            ? 'text-green-600'
                            : coin.change_rate < 0
                            ? 'text-red-600'
                            : 'text-gray-500'
                        }`}
                      >
                        {(coin.change_rate * 100).toFixed(2)}%
                      </span>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{coin.market}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-6 space-y-2">
          <h3 className="text-xl font-bold">{selectedSymbol} 차트</h3>
          <p className="text-sm text-gray-500">MA(20, 50), MACD, RSI 지표가 포함되어 있습니다.</p>
          <div ref={chartRef} className="w-full h-[700px] border rounded"></div>
        </div>
      </div>
    </div>
  );
}

'use client';

// (이전 코드 동일)

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
      )}
    </div>
  );
}

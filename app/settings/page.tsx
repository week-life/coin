'use client';

import React, { useState, useEffect } from 'react';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function SettingsPage() {
  const [darkMode, setDarkMode] = useState(false);
  const [currency, setCurrency] = useState('USD');
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  useEffect(() => {
    // 초기 설정 불러오기
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    const savedCurrency = localStorage.getItem('currency') || 'USD';
    const savedNotifications = localStorage.getItem('notifications') === 'true';

    setDarkMode(savedDarkMode);
    setCurrency(savedCurrency);
    setNotificationsEnabled(savedNotifications);
  }, []);

  const handleDarkModeToggle = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('darkMode', String(newDarkMode));
    
    // 다크 모드 적용 로직 (필요한 경우)
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleCurrencyChange = (value: string) => {
    setCurrency(value);
    localStorage.setItem('currency', value);
  };

  const handleNotificationsToggle = () => {
    const newNotificationsState = !notificationsEnabled;
    setNotificationsEnabled(newNotificationsState);
    localStorage.setItem('notifications', String(newNotificationsState));
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">설정</h1>

      <div className="space-y-6">
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">디스플레이</h2>
          <div className="flex justify-between items-center">
            <span>다크 모드</span>
            <Switch 
              checked={darkMode}
              onCheckedChange={handleDarkModeToggle}
            />
          </div>
        </div>

        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">통화</h2>
          <Select value={currency} onValueChange={handleCurrencyChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="통화 선택" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="USD">미국 달러 (USD)</SelectItem>
              <SelectItem value="KRW">한국 원 (KRW)</SelectItem>
              <SelectItem value="EUR">유로 (EUR)</SelectItem>
              <SelectItem value="JPY">일본 엔 (JPY)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">알림</h2>
          <div className="flex justify-between items-center">
            <span>푸시 알림 활성화</span>
            <Switch 
              checked={notificationsEnabled}
              onCheckedChange={handleNotificationsToggle}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

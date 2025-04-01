'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  Star, 
  LineChart, 
  Settings 
} from 'lucide-react';

const navItems = [
  { href: '/', label: '홈', icon: Home },
  { href: '/favorites', label: '즐겨찾기', icon: Star },
  { href: '/chart', label: '차트', icon: LineChart },
  { href: '/settings', label: '설정', icon: Settings }
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white shadow-lg z-50">
      <div className="flex justify-around py-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link 
              key={item.href} 
              href={item.href}
              className={`flex flex-col items-center ${
                isActive 
                  ? 'text-blue-600' 
                  : 'text-gray-500 hover:text-blue-400'
              }`}
            >
              <Icon 
                className={`h-6 w-6 ${
                  isActive ? 'scale-110' : ''
                }`} 
              />
              <span className="text-xs mt-1">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

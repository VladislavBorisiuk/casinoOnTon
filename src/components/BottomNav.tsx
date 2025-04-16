import { useNavigate, useLocation } from 'react-router-dom';
import React from 'react';
import { FaDice, FaUser, FaCoins } from 'react-icons/fa';

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { icon: <FaDice />, label: 'Игра', path: '/' },
    { icon: <FaUser />, label: 'Профиль', path: '/profile' },
    { icon: <FaCoins />, label: 'Стейкинг', path: '/staking' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-gray-800 flex justify-around items-center z-10 border-t border-gray-700">
      {navItems.map((item) => (
        <button
          key={item.path}
          onClick={() => navigate(item.path)}
          className={`flex flex-col items-center text-sm ${
            location.pathname === item.path ? 'text-yellow-400' : 'text-white'
          }`}
        >
          {item.icon}
          {item.label}
        </button>
      ))}
    </nav>
  );
}

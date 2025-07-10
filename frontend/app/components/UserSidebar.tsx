"use client";
import { useState } from 'react';
import Link from 'next/link';
import { FiMenu, FiHome, FiFolder, FiTool, FiPhone, FiSettings, FiLogOut } from 'react-icons/fi';
import { useAuth } from '@/app/contexts/AuthContext';

const navItems = [
  { label: 'Dashboard', icon: <FiHome />, href: '/user' },
  { label: 'Projects', icon: <FiFolder />, href: '/user/projects' },
  { label: 'Tools', icon: <FiTool />, href: '/user/tools' },
  { label: 'Call History', icon: <FiPhone />, href: '/user/call-history' },
  { label: 'Settings', icon: <FiSettings />, href: '/user/settings' },
];

export default function UserSidebar({ collapsed: initialCollapsed = false }: { collapsed?: boolean }) {
  const [collapsed, setCollapsed] = useState(initialCollapsed);
  const { logout } = useAuth();

  return (
    <aside
      className={`h-screen bg-[var(--primary-blue)] text-white flex flex-col transition-all duration-300 ${collapsed ? 'w-20' : 'w-64'} shadow-lg`}
    >
      <div className="flex items-center justify-between px-4 py-5 border-b border-blue-700">
        <span className={`text-2xl font-bold tracking-tight transition-all duration-300 ${collapsed ? 'hidden' : 'block'}`}>Askimo</span>
        <button
          className="text-white text-2xl focus:outline-none"
          onClick={() => setCollapsed((c) => !c)}
          aria-label="Toggle sidebar"
        >
          <FiMenu />
        </button>
      </div>
      <nav className="flex-1 flex flex-col gap-2 mt-4">
        {navItems.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className={`flex items-center gap-4 px-4 py-3 rounded-lg hover:bg-[var(--accent-teal)] transition-colors duration-200 ${collapsed ? 'justify-center' : ''}`}
          >
            <span className="text-xl">{item.icon}</span>
            {!collapsed && <span className="font-medium">{item.label}</span>}
          </Link>
        ))}
      </nav>
      <div className="mt-auto mb-4 px-4">
        <button
          onClick={logout}
          className={`flex items-center gap-4 w-full px-4 py-3 rounded-lg hover:bg-[var(--accent-teal)] text-white font-medium transition-colors duration-200 ${collapsed ? 'justify-center' : ''}`}
        >
          <span className="text-xl"><FiLogOut /></span>
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
} 
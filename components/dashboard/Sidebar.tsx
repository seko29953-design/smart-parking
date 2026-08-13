'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { 
  LayoutDashboard, 
  BarChart3, 
  Users, 
  Settings, 
  FolderKanban, 
  LogOut,
  X 
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  onLogout: () => void;
}

const navItems = [
  { label: 'ផ្ទាំងគ្រប់គ្រង', href: '/dashboard', icon: LayoutDashboard },
  { label: 'ចំណត', href: '/dashboard/parkings', icon: BarChart3 },
  { label: 'ការវិភាគ', href: '/dashboard/analytics', icon: BarChart3 },
  { label: 'គម្រោងនានា', href: '/dashboard/projects', icon: FolderKanban },
  { label: 'អ្នកប្រើប្រាស់', href: '/dashboard/users', icon: Users },
  { label: 'ការកំណត់', href: '/dashboard/settings', icon: Settings },
];

const mobileSidebarVariants: Variants = {
  closed: {
    x: '-100%',
    transition: { duration: 0.2, ease: 'easeInOut' },
  },
  open: {
    x: '0%',
    transition: { duration: 0.2, ease: 'easeInOut' },
  },
};

const backdropVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.15 } },
};

export default function Sidebar({ isOpen, setIsOpen, onLogout }: SidebarProps) {
  const pathname = usePathname();

  const SidebarContent = () => (
    <div className="flex h-full flex-col justify-between p-4 bg-white">
      <div>
        {/* Top Branding Header */}
        <div className="flex items-center justify-between px-2 py-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-[#216bc4] flex items-center justify-center text-white font-bold text-lg shrink-0">
              P
            </div>
            <span className="font-semibold text-base sm:text-lg text-slate-800 truncate">
              ប្រព័ន្ធគ្រប់គ្រងចំណត
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 md:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="mt-6 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                  isActive
                    ? 'bg-[#216bc4] text-white'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer Logout Button */}
      <div className="border-t border-slate-100 pt-4">
        <button
          type="button"
          onClick={onLogout}
          className="flex w-full items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg text-slate-600 hover:bg-rose-50 hover:text-rose-600 transition-colors"
        >
          <LogOut className="h-5 w-5 shrink-0 text-rose-500" />
          <span>ចាកចេញ</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* 1. DESKTOP SIDEBAR (Static Fixed) */}
      <aside className="hidden md:block fixed top-0 left-0 z-40 h-full w-64 border-r border-slate-200 bg-white">
        <SidebarContent />
      </aside>

      {/* 2. MOBILE DRAWER WITH BACKDROP */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              variants={backdropVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs md:hidden"
              onClick={() => setIsOpen(false)}
            />

            {/* Sliding Drawer */}
            <motion.aside
              key="mobile-sidebar"
              variants={mobileSidebarVariants}
              initial="closed"
              animate="open"
              exit="closed"
              className="fixed top-0 left-0 z-50 h-full w-64 border-r border-slate-200 bg-white shadow-2xl md:hidden"
            >
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Menu, 
  Bell, 
  Search, 
  User as UserIcon, 
  LogOut, 
  Settings, 
  UserCheck, 
  CheckCircle2, 
  AlertCircle, 
  Clock 
} from 'lucide-react';

interface User {
  user_id: number;
  username: string;
  email: string;
  role: string;
  created_at: string;
}

interface HeaderProps {
  onMenuClick: () => void;
  user: User | null;
  onLogout: () => void;
}

export default function Header({ onMenuClick, user, onLogout }: HeaderProps) {
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const notificationRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        notificationRef.current && 
        !notificationRef.current.contains(event.target as Node)
      ) {
        setIsNotificationOpen(false);
      }
      if (
        profileRef.current && 
        !profileRef.current.contains(event.target as Node)
      ) {
        setIsProfileOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleNotification = () => {
    setIsNotificationOpen((prev) => !prev);
    setIsProfileOpen(false);
  };

  const toggleProfile = () => {
    setIsProfileOpen((prev) => !prev);
    setIsNotificationOpen(false);
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/80 px-3 sm:px-4 md:px-6 backdrop-blur-md">
      {/* Left side: Mobile Toggle & Search */}
      <div className="flex items-center gap-2 sm:gap-4 flex-1">
        <button
          type="button"
          onClick={onMenuClick}
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 md:hidden transition-colors"
          aria-label="Open sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="relative w-full max-w-[180px] sm:max-w-xs md:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            placeholder="ស្វែងរក..."
            className="h-9 w-full rounded-lg bg-slate-100 pl-9 pr-4 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#216bc4] transition-all"
          />
        </div>
      </div>

      {/* Right side: Notifications & Profile */}
      <div className="flex items-center gap-1 sm:gap-3">
        {/* Notification Container */}
        <div className="relative" ref={notificationRef}>
          <button
            type="button"
            onClick={toggleNotification}
            className="relative rounded-lg p-2 text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500" />
          </button>

          {/* Notifications Dropdown */}
          <AnimatePresence>
            {isNotificationOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                className="absolute right-[-50px] sm:right-0 mt-2 w-[280px] sm:w-80 rounded-xl border border-slate-200 bg-white p-3 shadow-lg z-50"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-2 px-1">
                  <h3 className="font-semibold text-slate-800 text-xs sm:text-sm">ការជូនដំណឹង (Notifications)</h3>
                  <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] sm:text-xs font-medium text-[#216bc4]">
                    3 New
                  </span>
                </div>

                <div className="mt-2 space-y-1 max-h-64 overflow-y-auto">
                  <div className="flex items-start gap-3 rounded-lg p-2 text-xs hover:bg-slate-50 transition-colors cursor-pointer">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-slate-800">Project status updated</p>
                      <p className="text-slate-500 mt-0.5">AdminPortal design phase completed.</p>
                      <span className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                        <Clock className="h-3 w-3" /> 5m ago
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 rounded-lg p-2 text-xs hover:bg-slate-50 transition-colors cursor-pointer">
                    <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-slate-800">System Storage Warning</p>
                      <p className="text-slate-500 mt-0.5">Server storage reached 85% capacity.</p>
                      <span className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                        <Clock className="h-3 w-3" /> 1h ago
                      </span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-2 mt-2 text-center">
                  <button className="text-xs font-medium text-[#216bc4] hover:underline">
                    មើលការជូនដំណឹងទាំងអស់
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* User Profile Container */}
        <div className="relative border-l border-slate-200 pl-2 sm:pl-3" ref={profileRef}>
          <button
            type="button"
            onClick={toggleProfile}
            className="flex items-center gap-2 rounded-lg p-1 hover:bg-slate-100 transition-colors text-left"
          >
            <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-blue-100 text-[#216bc4] font-semibold shrink-0">
              <UserIcon className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <div className="hidden md:block">
              <p className="text-sm font-semibold text-slate-800 leading-tight">
                {user?.username || 'User'}
              </p>
              <p className="text-xs text-slate-500 capitalize">{user?.role || 'Guest'}</p>
            </div>
          </button>

          {/* User Profile Dropdown */}
          <AnimatePresence>
            {isProfileOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                className="absolute right-0 mt-2 w-48 sm:w-56 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg z-50"
              >
                <div className="px-3 py-2 border-b border-slate-100">
                  <p className="text-xs sm:text-sm font-semibold text-slate-800 truncate">
                    {user?.username || 'User'}
                  </p>
                  <p className="text-[10px] sm:text-xs text-slate-500 truncate">
                    {user?.email || ''}
                  </p>
                </div>

                <div className="space-y-0.5 mt-1">
                  <button 
                    type="button" 
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors"
                  >
                    <UserCheck className="h-4 w-4 text-slate-500" />
                    <span>ព័ត៌មានផ្ទាល់ខ្លួន</span>
                  </button>

                  <button 
                    type="button" 
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors"
                  >
                    <Settings className="h-4 w-4 text-slate-500" />
                    <span>ការកំណត់គណនី</span>
                  </button>
                </div>

                <div className="border-t border-slate-100 pt-1 mt-1">
                  <button 
                    type="button" 
                    onClick={onLogout}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors"
                  >
                    <LogOut className="h-4 w-4 text-rose-600" />
                    <span>ចាកចេញ</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
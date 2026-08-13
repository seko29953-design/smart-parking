'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import Sidebar from '@/components/dashboard/Sidebar';
import Header from '@/components/dashboard/Header';

const API_BASE_URL = 'http://localhost:5000';

export interface User {
  user_id: number;
  username: string;
  email: string;
  role: string;
  created_at: string;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');

      if (!token) {
        setIsAuthenticated(false);
        setIsLoading(false);
        router.replace('/login');
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': token,
          },
        });

        const data = await response.json();

        if (response.ok && data.success && data.user) {
          setUser(data.user);
          setIsAuthenticated(true);
        } else {
          localStorage.removeItem('token');
          setIsAuthenticated(false);
          router.replace('/login');
        }
      } catch (error) {
        console.error('Failed to verify session:', error);
        localStorage.removeItem('token');
        setIsAuthenticated(false);
        router.replace('/login');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    setUser(null);
    router.replace('/login');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#fdfcfc] px-4">
        <Loader2 className="w-8 h-8 text-[#216bc4] animate-spin mb-2" />
        <p className="text-sm text-slate-500 font-medium">កំពុងផ្ទៀងផ្ទាត់សិទ្ធិ...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#fdfcfc] text-slate-900">
      {/* Sidebar Nav */}
      <Sidebar 
        isOpen={sidebarOpen} 
        setIsOpen={setSidebarOpen} 
        onLogout={handleLogout} 
      />

      {/* Main Container Area */}
      <div className="flex flex-col md:pl-64 min-h-screen transition-all duration-300">
        {/* Top Header */}
        <Header 
          onMenuClick={() => setSidebarOpen(true)} 
          user={user} 
          onLogout={handleLogout} 
        />

        {/* Page Content Body */}
        <main className="flex-1 p-3 sm:p-4 md:p-6 lg:p-8 w-full max-w-full overflow-x-hidden">
          <div className="mx-auto max-w-7xl w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
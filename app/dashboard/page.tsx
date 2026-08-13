"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Car,
  Bike,
  Ticket,
  CheckCircle2,
  Clock,
  RefreshCw,
  MoreHorizontal,
  Check,
  AlertCircle
} from 'lucide-react';

interface ParkingTicket {
  ticket_id: number;
  entry_time: string;
  exit_time: string | null;
  location: string;
  vehicle_type: 'Car' | 'Motorcycle' | string;
  plate_number: string;
  image_path: string;
  raw_ocr: string;
  total_fee: string | number;
  status: 'ACTIVE' | 'PAID' | string;
  created_at: string;
}

export default function ParkingDashboardPage() {
  const [tickets, setTickets] = useState<ParkingTicket[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Track which ticket menu is open
  const [activeMenuId, setActiveMenuId] = useState<number | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  // Close dropdown when clicking outside
  const menuRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch API Data
  const fetchTickets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:5000/api/tickets');
      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }
      const result = await response.json();
      if (result.success && Array.isArray(result.data)) {
        setTickets(result.data);
      } else {
        throw new Error('Invalid data format received');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to connect to API');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  // Handle Updating Ticket Status
  const handleStatusUpdate = async (ticketId: number, newStatus: string) => {
    setUpdatingId(ticketId);
    try {
      const response = await fetch(`http://localhost:5000/api/tickets/${ticketId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error(`Failed to update status (HTTP ${response.status})`);
      }

      setTickets((prevTickets) =>
        prevTickets.map((t) =>
          t.ticket_id === ticketId ? { ...t, status: newStatus } : t
        )
      );
      setActiveMenuId(null);
    } catch (err: any) {
      alert(`Error updating ticket #${ticketId}: ${err.message}`);
    } finally {
      setUpdatingId(null);
    }
  };

  const getImageUrl = (imagePath: string | null) => {
    if (!imagePath) return '';
    const fileName = imagePath.split(/[/\\]/).pop();
    return `http://localhost:5000/uploads/${fileName}`;
  };

  const metrics = useMemo(() => {
    const totalTickets = tickets.length;
    const activeParked = tickets.filter((t) => t.status === 'ACTIVE').length;
    const paidTickets = tickets.filter((t) => t.status === 'PAID').length;
    const totalRevenue = tickets.reduce((acc, curr) => acc + Number(curr.total_fee || 0), 0);

    return { totalTickets, activeParked, paidTickets, totalRevenue };
  }, [tickets]);

  const filteredTickets = useMemo(() => {
    return tickets.filter((ticket) => {
      const matchesSearch =
        ticket.ticket_id.toString().includes(searchTerm) ||
        ticket.plate_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.vehicle_type.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === 'All' || ticket.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [tickets, searchTerm, statusFilter]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatusFilter(e.target.value);
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(filteredTickets.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentData = filteredTickets.slice(startIndex, startIndex + itemsPerPage);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-amber-500/10 text-amber-700 border-amber-300/60';
      case 'PAID':
        return 'bg-emerald-500/10 text-emerald-700 border-emerald-300/60';
      default:
        return 'bg-slate-500/10 text-slate-700 border-slate-300/60';
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const statCards = [
    { labelKh: 'យានយន្តកំពុងចត', labelEn: 'Active Vehicles', value: metrics.activeParked.toString(), icon: Clock, color: 'text-amber-600 bg-amber-50 border-amber-100' },
    { labelKh: 'សំបុត្រសរុប', labelEn: 'Total Tickets', value: metrics.totalTickets.toString(), icon: Ticket, color: 'text-blue-600 bg-blue-50 border-blue-100' },
    { labelKh: 'ទូទាត់រួចរាល់', labelEn: 'Completed Payments', value: metrics.paidTickets.toString(), icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
    { labelKh: 'ចំណូលសរុប', labelEn: 'Total Revenue', value: `$${metrics.totalRevenue.toFixed(2)}`, icon: Car, color: 'text-violet-600 bg-violet-50 border-violet-100' },
  ];

  return (
    <div className="space-y-8 bg-slate-50/60 min-h-screen  font-['Kantumruy_Pro',system-ui,sans-serif] text-slate-800 antialiased">
      {/* Header Banner */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold  text-slate-900 leading-snug">
            ប្រព័ន្ធគ្រប់គ្រងការចតយានយន្ត
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            ពិនិត្យមើលទិន្នន័យចតយានយន្ត ផ្លាកលេខ និងការទូទាត់ប្រាក់ភ្លាមៗ
          </p>
        </div>
        <button
          onClick={fetchTickets}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200/80 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw className={`h-3.5 w-3.5 text-slate-500 ${loading ? 'animate-spin' : ''}`} />
          <span>ធ្វើបច្ចុប្បន្នភាព</span>
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div
              key={i}
              className="relative overflow-hidden rounded-2xl border border-slate-200/70 bg-white/80 p-5 shadow-xs backdrop-blur-md transition-all hover:shadow-md hover:-translate-y-0.5"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-700">{stat.labelKh}</p>
                  <p className="text-[10px] font-sans text-slate-400">{stat.labelEn}</p>
                </div>
                <div className={`rounded-xl border p-2.5 ${stat.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-2xl font-extrabold font-sans text-slate-900 ">
                  {stat.value}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Error Alert */}
      {error && (
        <div className="flex items-center gap-3 rounded-2xl bg-rose-50/80 border border-rose-200/80 p-4 text-xs font-medium text-rose-700 backdrop-blur-xs">
          <AlertCircle className="h-5 w-5 shrink-0 text-rose-500" />
          <span>
            <strong>មានបញ្ហាក្នុងការតភ្ជាប់:</strong> {error}. Express API unreachable.
          </span>
        </div>
      )}

      {/* Data Table Section */}
      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
        {/* Table Controls */}
        <div className="p-5 border-b border-slate-100 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white/50">
          <div>
            <h2 className="text-sm font-bold text-slate-900">កំណត់ត្រាចតយានយន្ត</h2>
            <p className="text-[11px] text-slate-400">ប្រវត្តិផ្លាកលេខ និងពេលវេលាចេញចូល</p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative flex-1 sm:w-64">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="ស្វែងរក ID ឬ ផ្លាកលេខ..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/60 py-2 pl-9 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#216bc4] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#216bc4]/10 transition-all font-sans"
              />
            </div>

            <select
              value={statusFilter}
              onChange={handleStatusChange}
              className="rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-1 text-xs font-medium text-slate-700 focus:border-[#216bc4] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#216bc4]/10 transition-all cursor-pointer"
            >
              <option value="All">ស្ថានភាពទាំងអស់</option>
              <option value="ACTIVE">ACTIVE (កំពុងចត)</option>
              <option value="PAID">PAID (ទូទាត់រួច)</option>
            </select>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="border-b border-slate-100 bg-slate-50/80 text-[11px] font-bold text-slate-500">
              <tr>
                <th className='p-2'>អត្តលេខសំបុត្រ</th>
                <th className='p-2'>ប្រភេទ/ផ្លាកលេខ</th>
                <th className='p-2'>ស្ថានភាព</th>
                <th className='p-2'>ម៉ោងចូល</th>
                <th className='p-2'>ម៉ោងចេញ</th>
                <th className='p-2'>រូបថតផ្លាកលេខ</th>
                <th className='p-2'>តម្លៃសរុប ($)</th>
                <th className='p-2'>សកម្មភាព</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-16 text-center text-xs text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="h-5 w-5 animate-spin text-slate-400" />
                      <span>កំពុងទាញយកទិន្នន័យ...</span>
                    </div>
                  </td>
                </tr>
              ) : currentData.length > 0 ? (
                currentData.map((ticket) => (
                  <tr
                    key={ticket.ticket_id}
                    className="hover:bg-slate-50/80 transition-colors group"
                  >
                    {/* Ticket ID */}
                    <td className="p-2 font-mono font-bold text-[#216bc4]">
                      #{ticket.ticket_id}
                    </td>

                    {/* Vehicle & Plate Badge */}
                    <td className="p-2">

                      <div className="p-2 text-xs font-medium font-sans text-slate-600 whitespace-nowrap">
                        កំពង់ស្ពឺ 2AA-7799
                      </div>


                    </td>

                    {/* Status Pill */}
                    <td className="p-2">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold rounded-full border ${getStatusBadge(
                          ticket.status
                        )}`}
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-current" />
                        {ticket.status}
                      </span>
                    </td>

                    {/* Timestamps */}
                    <td className="p-2 text-xs font-medium font-sans text-slate-600 whitespace-nowrap">
                      {formatDate(ticket.entry_time)}
                    </td>
                    <td className="p-2 text-xs font-medium font-sans text-slate-400 whitespace-nowrap">
                      {formatDate(ticket.exit_time)}
                    </td>

                    {/* Image Preview */}
                    <td className="p-2 whitespace-nowrap">
                      {ticket.image_path ? (
                        <div className="relative group/img h-9 w-16 overflow-hidden  border border-slate-200 bg-slate-100 shadow-2xs">
                          <img
                            src={getImageUrl(ticket.image_path)}
                            alt={`Plate ${ticket.plate_number}`}
                            className="h-full w-full object-cover transition-transform duration-200 group-hover/img:scale-110"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-300">គ្មានរូបថត</span>
                      )}
                    </td>

                    {/* Total Fee */}
                    <td className="p-2 text-right font-bold font-sans text-slate-900 whitespace-nowrap">
                      ${Number(ticket.total_fee || 0).toFixed(2)}
                    </td>

                    {/* Actions Menu */}
                    <td className="p-2 text-center relative">
                      <button
                        onClick={() =>
                          setActiveMenuId(
                            activeMenuId === ticket.ticket_id ? null : ticket.ticket_id
                          )
                        }
                        disabled={updatingId === ticket.ticket_id}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-all active:scale-90 focus:outline-none focus:ring-2 focus:ring-slate-200 cursor-pointer"
                      >
                        {updatingId === ticket.ticket_id ? (
                          <RefreshCw className="h-4 w-4 animate-spin text-slate-500" />
                        ) : (
                          <MoreHorizontal className="h-4 w-4" />
                        )}
                      </button>

                      {/* Dropdown Menu Modal with Smooth Animations */}
                      {activeMenuId === ticket.ticket_id && (
                        <div
                          ref={menuRef}
                          className="absolute right-6 top-11 z-30 w-48 rounded-xl border border-slate-200/90 bg-white/95 p-1.5 shadow-xl backdrop-blur-md transition-all animate-in fade-in-0 zoom-in-95 duration-150 origin-top-right"
                        >
                          <div className="px-2.5 py-1 text-[10px] font-bold   text-slate-400">
                            ប្តូរស្ថានភាព
                          </div>

                          <button
                            onClick={() => handleStatusUpdate(ticket.ticket_id, 'PAID')}
                            disabled={ticket.status === 'PAID'}
                            className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs font-semibold text-emerald-700 hover:bg-emerald-50 active:scale-95 disabled:opacity-40 disabled:hover:bg-transparent transition-all cursor-pointer"
                          >
                            <span>កែជា PAID</span>
                            {ticket.status === 'PAID' && <Check className="h-3.5 w-3.5" />}
                          </button>

                          <button
                            onClick={() => handleStatusUpdate(ticket.ticket_id, 'ACTIVE')}
                            disabled={ticket.status === 'ACTIVE'}
                            className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs font-semibold text-amber-700 hover:bg-amber-50 active:scale-95 disabled:opacity-40 disabled:hover:bg-transparent transition-all cursor-pointer"
                          >
                            <span>កែជា ACTIVE</span>
                            {ticket.status === 'ACTIVE' && <Check className="h-3.5 w-3.5" />}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-xs text-slate-400">
                    មិនមានទិន្នន័យដែលត្រូវនឹងការស្វែងរកឡើយ។
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Table Pagination Footer */}
        <div className="border-t border-slate-100 bg-slate-50/50 px-6 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            បង្ហាញពី{' '}
            <span className="font-semibold font-sans text-slate-800">
              {filteredTickets.length === 0 ? 0 : startIndex + 1}
            </span>{' '}
            ដល់{' '}
            <span className="font-semibold font-sans text-slate-800">
              {Math.min(startIndex + itemsPerPage, filteredTickets.length)}
            </span>{' '}
            នៃ{' '}
            <span className="font-semibold font-sans text-slate-800">{filteredTickets.length}</span> កំណត់ត្រា
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1 || loading}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-2xs hover:bg-slate-50 active:scale-95 disabled:opacity-40 transition-all cursor-pointer"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              ថយក្រោយ
            </button>
            <div className="px-2 font-medium font-sans text-slate-600">
              <span className="text-slate-900 font-bold">{currentPage}</span> / {totalPages}
            </div>
            <button
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages || totalPages === 0 || loading}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-2xs hover:bg-slate-50 active:scale-95 disabled:opacity-40 transition-all cursor-pointer"
            >
              បន្ទាប់
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
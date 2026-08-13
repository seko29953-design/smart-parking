'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { 
  Camera, 
  Car, 
  Search, 
  Plus, 
  Maximize2, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  X, 
  LogOut,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from 'lucide-react';

// Interfaces
interface ParkingSpot {
  id: string;
  zone: string;
  status: 'available' | 'occupied' | 'reserved';
  licensePlate?: string;
}

interface ParkingTicket {
  id: string;
  ticketNo: string;
  licensePlate: string;
  vehicleType: string;
  spotId: string;
  entryTime: string;
  status: 'active' | 'completed';
  fee: number;
}

interface CameraFeed {
  id: string;
  name: string;
  location: string;
  status: 'online' | 'offline';
  streamUrl: string;
}

// Strictly Typed Framer Motion Variants
const backdropVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const modalVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95, y: 10 },
  visible: { 
    opacity: 1, 
    scale: 1, 
    y: 0, 
    transition: { type: 'spring', stiffness: 300, damping: 25 } 
  },
  exit: { opacity: 0, scale: 0.95, y: 10, transition: { duration: 0.15 } },
};

// Initial Mock Data
const MOCK_CAMERAS: CameraFeed[] = [
  { id: 'cam-1', name: 'ច្រកចូល A (Gate A Entrance)', location: 'Zone A', status: 'online', streamUrl: 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=600&q=80' },
  { id: 'cam-2', name: 'ច្រកចេញ B (Gate B Exit)', location: 'Zone B', status: 'online', streamUrl: 'https://images.unsplash.com/photo-1590674899484-d5640e854abe?auto=format&fit=crop&w=600&q=80' },
  { id: 'cam-3', name: 'កាមេរ៉ា Zone C (Zone C Overview)', location: 'Zone C', status: 'online', streamUrl: 'https://images.unsplash.com/photo-1573348722427-f1d6819fdf98?auto=format&fit=crop&w=600&q=80' },
  { id: 'cam-4', name: 'កាមេរ៉ា Zone D (VIP Zone)', location: 'Zone D', status: 'offline', streamUrl: '' },
];

const MOCK_SPOTS: ParkingSpot[] = [
  { id: 'A-01', zone: 'A', status: 'occupied', licensePlate: '2ABC-1234' },
  { id: 'A-02', zone: 'A', status: 'available' },
  { id: 'A-03', zone: 'A', status: 'reserved' },
  { id: 'A-04', zone: 'A', status: 'occupied', licensePlate: '2XYZ-5678' },
  { id: 'B-01', zone: 'B', status: 'available' },
  { id: 'B-02', zone: 'B', status: 'available' },
  { id: 'B-03', zone: 'B', status: 'occupied', licensePlate: '2PP-8888' },
  { id: 'B-04', zone: 'B', status: 'available' },
];

const MOCK_TICKETS: ParkingTicket[] = [
  { id: 't1', ticketNo: 'T-10029', licensePlate: '2ABC-1234', vehicleType: 'Car', spotId: 'A-01', entryTime: '2026-08-07T07:30:00', status: 'active', fee: 2.5 },
  { id: 't2', ticketNo: 'T-10030', licensePlate: '2XYZ-5678', vehicleType: 'Car', spotId: 'A-04', entryTime: '2026-08-07T08:15:00', status: 'active', fee: 1.5 },
  { id: 't3', ticketNo: 'T-10031', licensePlate: '2PP-8888', vehicleType: 'SUV', spotId: 'B-03', entryTime: '2026-08-07T08:45:00', status: 'active', fee: 1.0 },
  { id: 't4', ticketNo: 'T-10025', licensePlate: '1AA-9999', vehicleType: 'Car', spotId: 'A-02', entryTime: '2026-08-07T05:00:00', status: 'completed', fee: 5.0 },
  { id: 't5', ticketNo: 'T-10024', licensePlate: '2BB-1111', vehicleType: 'Motorcycle', spotId: 'C-01', entryTime: '2026-08-07T04:20:00', status: 'completed', fee: 0.5 },
  { id: 't6', ticketNo: 'T-10023', licensePlate: '2CC-2222', vehicleType: 'Car', spotId: 'C-02', entryTime: '2026-08-07T03:10:00', status: 'completed', fee: 4.0 },
  { id: 't7', ticketNo: 'T-10022', licensePlate: '2DD-3333', vehicleType: 'SUV', spotId: 'D-01', entryTime: '2026-08-07T02:00:00', status: 'completed', fee: 6.0 },
  { id: 't8', ticketNo: 'T-10021', licensePlate: '2EE-4444', vehicleType: 'Car', spotId: 'D-02', entryTime: '2026-08-07T01:30:00', status: 'completed', fee: 3.5 },
  { id: 't9', ticketNo: 'T-10020', licensePlate: '2FF-5555', vehicleType: 'Car', spotId: 'A-03', entryTime: '2026-08-06T23:00:00', status: 'completed', fee: 8.0 },
];

export default function ParkingPage() {
  // State Management
  const [spots] = useState<ParkingSpot[]>(MOCK_SPOTS);
  const [tickets, setTickets] = useState<ParkingTicket[]>(MOCK_TICKETS);
  const [cameras] = useState<CameraFeed[]>(MOCK_CAMERAS);

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [ticketFilter, setTicketFilter] = useState<'all' | 'active' | 'completed'>('all');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  // Modal Controls
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [expandedCam, setExpandedCam] = useState<CameraFeed | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<ParkingTicket | null>(null);

  // New Entry Form State
  const [newEntry, setNewEntry] = useState({
    licensePlate: '',
    vehicleType: 'Car',
    spotId: 'A-02',
  });

  // Entry Handler
  const handleCreateEntry = (e: React.FormEvent) => {
    e.preventDefault();
    const newTicket: ParkingTicket = {
      id: `t-${Date.now()}`,
      ticketNo: `T-${Math.floor(10000 + Math.random() * 90000)}`,
      licensePlate: newEntry.licensePlate.toUpperCase(),
      vehicleType: newEntry.vehicleType,
      spotId: newEntry.spotId,
      entryTime: new Date().toISOString(),
      status: 'active',
      fee: 1.0,
    };

    setTickets([newTicket, ...tickets]);
    setIsEntryModalOpen(false);
    setNewEntry({ licensePlate: '', vehicleType: 'Car', spotId: 'A-02' });
  };

  // Complete Ticket (Vehicle Exit)
  const handleCheckoutTicket = () => {
    if (!selectedTicket) return;
    setTickets(tickets.map((t) => t.id === selectedTicket.id ? { ...t, status: 'completed' } : t));
    setIsCheckoutModalOpen(false);
    setSelectedTicket(null);
  };

  // Filtered Tickets Data
  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      const matchesSearch = t.licensePlate.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            t.ticketNo.toLowerCase().includes(searchTerm.toLowerCase());
      if (ticketFilter === 'all') return matchesSearch;
      return matchesSearch && t.status === ticketFilter;
    });
  }, [tickets, searchTerm, ticketFilter]);

  // Pagination Calculations
  const totalItems = filteredTickets.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;

  // Paginated Tickets Slice
  const paginatedTickets = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredTickets.slice(startIndex, startIndex + pageSize);
  }, [filteredTickets, currentPage, pageSize]);

  // Handlers for Filters with Reset Page
  const handleFilterChange = (filter: 'all' | 'active' | 'completed') => {
    setTicketFilter(filter);
    setCurrentPage(1);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPageSize(Number(e.target.value));
    setCurrentPage(1);
  };

  // Calculate Parking Statistics
  const totalOccupied = spots.filter(s => s.status === 'occupied').length;
  const totalAvailable = spots.filter(s => s.status === 'available').length;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            ប្រព័ន្ធគ្រប់គ្រងការចតរថយន្ត (Parking Operations)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            ត្រួតពិនិត្យការចតរថយន្ត មើលកាមេរ៉ាសុវត្ថិភាព និងគ្រប់គ្រងសំបុត្រចូល-ចេញ។
          </p>
        </div>

        <button
          onClick={() => setIsEntryModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#216bc4] px-4 py-2.5 text-sm font-medium text-white shadow-xs hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>កត់ត្រារថយន្តចូល (Check-In)</span>
        </button>
      </div>

      {/* KPI Stats Widgets */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">កន្លែងទំនេរ (Available)</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">{totalAvailable}</div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">កំពុងចត (Occupied)</span>
            <Car className="h-4 w-4 text-amber-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">{totalOccupied}</div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">សំបុត្រសកម្ម (Active Tickets)</span>
            <Clock className="h-4 w-4 text-blue-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">
            {tickets.filter(t => t.status === 'active').length}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium">កាមេរ៉ាដំណើការ (Live Cameras)</span>
            <Camera className="h-4 w-4 text-purple-500" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900">
            {cameras.filter(c => c.status === 'online').length}/{cameras.length}
          </div>
        </div>
      </div>

      {/* SECTION 1: Camera Feed Section */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2 text-slate-800 font-bold text-base">
            <Camera className="h-5 w-5 text-[#216bc4]" />
            <h2>កាមេរ៉ាសុវត្ថិភាពផ្ទាល់ (Live Security Cameras)</h2>
          </div>
          <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full font-medium">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            LIVE
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {cameras.map((cam) => (
            <div 
              key={cam.id} 
              className="relative group overflow-hidden rounded-lg border border-slate-200 bg-slate-900 aspect-video flex items-center justify-center"
            >
              {cam.status === 'online' ? (
                <>
                  <img 
                    src={cam.streamUrl} 
                    alt={cam.name} 
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 p-2.5 flex flex-col justify-between">
                    <div className="flex justify-between items-center">
                      <span className="bg-black/60 backdrop-blur-md text-white text-[10px] px-2 py-0.5 rounded font-mono">
                        {cam.location}
                      </span>
                      <span className="flex h-2 w-2 rounded-full bg-emerald-400"></span>
                    </div>
                    <div className="flex justify-between items-center text-white">
                      <span className="text-xs font-medium truncate">{cam.name}</span>
                      <button 
                        onClick={() => setExpandedCam(cam)}
                        className="p-1 hover:bg-white/20 rounded transition-colors"
                        title="ពង្រីក (Maximize)"
                      >
                        <Maximize2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center gap-2 text-slate-500 text-xs">
                  <AlertCircle className="h-6 w-6 text-rose-500" />
                  <span>កាមេរ៉ាដាច់ការតភ្ជាប់</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 2: Interactive Parking Grid */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="font-bold text-slate-800 text-base flex items-center gap-2">
            <Car className="h-5 w-5 text-[#216bc4]" />
            ស្ថានភាពទីតាំងចត (Parking Spot Map)
          </h2>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-emerald-500"></span> ទំនេរ</span>
            <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-amber-500"></span> កំពុងចត</span>
            <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-slate-300"></span> កក់ទុក</span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {spots.map((spot) => (
            <div
              key={spot.id}
              className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all ${
                spot.status === 'available'
                  ? 'border-emerald-200 bg-emerald-50/50 text-emerald-800'
                  : spot.status === 'occupied'
                  ? 'border-amber-200 bg-amber-50/50 text-amber-900'
                  : 'border-slate-200 bg-slate-100 text-slate-500'
              }`}
            >
              <span className="text-xs font-mono font-bold">{spot.id}</span>
              <Car className={`h-6 w-6 my-1 ${
                spot.status === 'available' ? 'text-emerald-500' : spot.status === 'occupied' ? 'text-amber-600' : 'text-slate-400'
              }`} />
              <span className="text-[10px] font-semibold">
                {spot.status === 'occupied' ? spot.licensePlate : spot.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 3: Parking Tickets Table with Pagination */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => handleFilterChange('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                ticketFilter === 'all' ? 'bg-[#216bc4] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              ទាំងអស់ (All)
            </button>
            <button
              onClick={() => handleFilterChange('active')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                ticketFilter === 'active' ? 'bg-[#216bc4] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              កំពុងចត (Active)
            </button>
            <button
              onClick={() => handleFilterChange('completed')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                ticketFilter === 'completed' ? 'bg-[#216bc4] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              បានចេញរួច (Completed)
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="ស្វែងរកផ្លាកលេខ/សំបុត្រ..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-4 text-xs text-slate-800 focus:border-[#216bc4] focus:outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-700 font-semibold uppercase text-[11px]">
              <tr>
                <th className="px-4 py-3">លេខសំបុត្រ</th>
                <th className="px-4 py-3">ស្លាកលេខរថយន្ត</th>
                <th className="px-4 py-3">ប្រភេទ vehicle</th>
                <th className="px-4 py-3">ទីតាំង (Spot)</th>
                <th className="px-4 py-3">ម៉ោងចូល (Entry)</th>
                <th className="px-4 py-3">ស្ថានភាព</th>
                <th className="px-4 py-3 text-right">សកម្មភាព</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedTickets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                    មិនមានទិន្នន័យសំបុត្រឡើយ
                  </td>
                </tr>
              ) : (
                paginatedTickets.map((ticket) => (
                  <tr key={ticket.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3.5 font-mono font-semibold text-slate-900">{ticket.ticketNo}</td>
                    <td className="px-4 py-3.5 font-bold text-blue-600">{ticket.licensePlate}</td>
                    <td className="px-4 py-3.5 text-slate-600">{ticket.vehicleType}</td>
                    <td className="px-4 py-3.5 font-mono">{ticket.spotId}</td>
                    <td className="px-4 py-3.5 text-slate-500 text-xs">
                      {new Date(ticket.entryTime).toLocaleTimeString('km-KH', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        ticket.status === 'active' 
                          ? 'bg-amber-50 text-amber-700 border border-amber-200' 
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}>
                        {ticket.status === 'active' ? 'កំពុងចត' : 'បានចេញ'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      {ticket.status === 'active' && (
                        <button
                          onClick={() => {
                            setSelectedTicket(ticket);
                            setIsCheckoutModalOpen(true);
                          }}
                          className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-emerald-700 transition-colors"
                        >
                          <LogOut className="h-3.5 w-3.5" />
                          <span>ទូទាត់/ចេញ</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION FOOTER CONTROL */}
        <div className="flex flex-col sm:flex-row items-center justify-between border-t border-slate-100 px-4 py-3 gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span>បង្ហាញ (Show)</span>
            <select
              value={pageSize}
              onChange={handlePageSizeChange}
              className="rounded-md border border-slate-200 bg-white py-1 px-2 text-xs font-medium text-slate-700 focus:outline-none focus:border-[#216bc4]"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
            </select>
            <span>ជួរ (items) | សរុប {totalItems}</span>
          </div>

          <div className="flex items-center gap-1">
            <span className="mr-2 text-slate-600 font-medium">
              ទំព័រ {currentPage} នៃ {totalPages}
            </span>

            {/* First Page */}
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="rounded-md p-1.5 border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
              title="First Page"
            >
              <ChevronsLeft className="h-4 w-4" />
            </button>

            {/* Previous Page */}
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="rounded-md p-1.5 border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
              title="Previous Page"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            {/* Page Number Buttons */}
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`h-7 w-7 rounded-md font-medium text-xs transition-colors ${
                  currentPage === page
                    ? 'bg-[#216bc4] text-white'
                    : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {page}
              </button>
            ))}

            {/* Next Page */}
            <button
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="rounded-md p-1.5 border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
              title="Next Page"
            >
              <ChevronRight className="h-4 w-4" />
            </button>

            {/* Last Page */}
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="rounded-md p-1.5 border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
              title="Last Page"
            >
              <ChevronsRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* MODALS */}
      <AnimatePresence>
        {isEntryModalOpen && (
          <motion.div
            key="entry-modal"
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs"
          >
            <motion.div
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <Car className="h-5 w-5 text-[#216bc4]" />
                  កត់ត្រារថយន្តចូល (Check-In Vehicle)
                </h3>
                <button onClick={() => setIsEntryModalOpen(false)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleCreateEntry} className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ផ្លាកលេខរថយន្ត (License Plate)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ឧ. 2ABC-1234"
                    value={newEntry.licensePlate}
                    onChange={(e) => setNewEntry({ ...newEntry, licensePlate: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 p-2.5 text-sm font-semibold uppercase text-slate-800 focus:border-[#216bc4] focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">ប្រភេទយានយន្ត</label>
                    <select
                      value={newEntry.vehicleType}
                      onChange={(e) => setNewEntry({ ...newEntry, vehicleType: e.target.value })}
                      className="w-full rounded-lg border border-slate-200 p-2.5 text-xs text-slate-800 focus:outline-none"
                    >
                      <option value="Car">Car (ឡានតូច)</option>
                      <option value="SUV">SUV / Pick-up</option>
                      <option value="Motorcycle">Motorcycle (ម៉ូតូ)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">ជ្រើសរើសកន្លែងចត</label>
                    <select
                      value={newEntry.spotId}
                      onChange={(e) => setNewEntry({ ...newEntry, spotId: e.target.value })}
                      className="w-full rounded-lg border border-slate-200 p-2.5 text-xs text-slate-800 focus:outline-none"
                    >
                      {spots.filter(s => s.status === 'available').map(s => (
                        <option key={s.id} value={s.id}>{s.id} (Zone {s.zone})</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsEntryModalOpen(false)}
                    className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
                  >
                    បោះបង់
                  </button>
                  <button
                    type="submit"
                    className="rounded-lg bg-[#216bc4] px-4 py-2 text-xs font-medium text-white hover:bg-blue-700"
                  >
                    រក្សាទុកទិន្នន័យ (Check-In)
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isCheckoutModalOpen && selectedTicket && (
          <motion.div
            key="checkout-modal"
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs"
          >
            <motion.div
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-emerald-600" />
                  ទូទាត់ប្រាក់ និងចេញ (Check-Out)
                </h3>
                <button onClick={() => setIsCheckoutModalOpen(false)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-4 space-y-3 text-xs">
                <div className="flex justify-between border-b pb-2">
                  <span className="text-slate-500">ស្លាកលេខ:</span>
                  <span className="font-bold text-slate-900">{selectedTicket.licensePlate}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-slate-500">លេខសំបុត្រ:</span>
                  <span className="font-mono text-slate-900">{selectedTicket.ticketNo}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-slate-500">តម្លៃត្រូវទូទាត់:</span>
                  <span className="font-bold text-lg text-emerald-600">${selectedTicket.fee.toFixed(2)}</span>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <button
                  onClick={() => setIsCheckoutModalOpen(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
                >
                  បោះបង់
                </button>
                <button
                  onClick={handleCheckoutTicket}
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-medium text-white hover:bg-emerald-700"
                >
                  បញ្ជាក់ការទូទាត់ (Complete)
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {expandedCam && (
          <motion.div
            key="cam-modal"
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
          >
            <motion.div
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="relative w-full max-w-4xl overflow-hidden rounded-2xl bg-slate-950 p-2 shadow-2xl"
            >
              <div className="flex items-center justify-between p-2 text-white border-b border-slate-800 mb-2">
                <span className="font-semibold text-sm">{expandedCam.name}</span>
                <button onClick={() => setExpandedCam(null)} className="rounded-lg p-1 hover:bg-slate-800">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <img src={expandedCam.streamUrl} alt="Expanded Camera" className="w-full h-auto rounded-xl max-h-[75vh] object-cover" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
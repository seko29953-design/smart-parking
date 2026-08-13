'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { 
  Plus, 
  Search, 
  Eye, 
  Edit, 
  Trash2, 
  X, 
  UserPlus, 
  ShieldCheck, 
  ShieldAlert, 
  Loader2,
  CheckCircle2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from 'lucide-react';

const API_BASE_URL = 'http://localhost:5000';

interface User {
  user_id: number;
  username: string;
  email: string;
  role: string;
  created_at: string;
}

// Strongly typed Framer Motion Variants
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

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Pagination State
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(5);

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Form State for Adding User
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'user',
  });
  const [submitLoading, setSubmitLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Initial Fetch
  useEffect(() => {
    fetchUsers();
  }, []);

  // Reset pagination on search or items per page change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, itemsPerPage]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/api/users`, {
        headers: { Authorization: token || '' }
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || data);
      } else {
        // Fallback demo data
        setUsers([
          { user_id: 1, username: 'admin_seko', email: 'admin@parking.com', role: 'admin', created_at: '2026-08-06T09:38:28.922Z' },
          { user_id: 2, username: 'operator_01', email: 'operator01@parking.com', role: 'operator', created_at: '2026-08-07T02:15:10.000Z' },
          { user_id: 3, username: 'john_doe', email: 'john@example.com', role: 'user', created_at: '2026-08-05T11:20:00.000Z' },
          { user_id: 4, username: 'sarah_smith', email: 'sarah@example.com', role: 'operator', created_at: '2026-08-04T14:45:12.000Z' },
          { user_id: 5, username: 'alex_king', email: 'alex@example.com', role: 'user', created_at: '2026-08-03T08:10:05.000Z' },
          { user_id: 6, username: 'david_lee', email: 'david@example.com', role: 'user', created_at: '2026-08-02T16:30:22.000Z' },
          { user_id: 7, username: 'mora_sok', email: 'mora@parking.com', role: 'admin', created_at: '2026-08-01T10:00:00.000Z' },
        ]);
      }
    } catch {
      setUsers([
        { user_id: 1, username: 'admin_seko', email: 'admin@parking.com', role: 'admin', created_at: '2026-08-06T09:38:28.922Z' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Handle Add User Submit -> POST http://localhost:5000/api/auth/register
  const handleAddUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitLoading(true);
    setStatusMessage(null);

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok || data.success) {
        setStatusMessage({ type: 'success', text: 'បង្កើតអ្នកប្រើប្រាស់ជោគជ័យ!' });
        
        const newUser: User = data.user || {
          user_id: Date.now(),
          username: formData.username,
          email: formData.email,
          role: formData.role,
          created_at: new Date().toISOString(),
        };
        setUsers((prev) => [newUser, ...prev]);

        setTimeout(() => {
          setIsAddModalOpen(false);
          setFormData({ username: '', email: '', password: '', role: 'user' });
          setStatusMessage(null);
        }, 1000);
      } else {
        setStatusMessage({ 
          type: 'error', 
          text: data.message || 'បរាជ័យក្នុងការបង្កើតអ្នកប្រើប្រាស់' 
        });
      }
    } catch (err) {
      console.error(err);
      setStatusMessage({ 
        type: 'error', 
        text: 'មិនអាចតភ្ជាប់ទៅកាន់ម៉ាស៊ីនបម្រើ (Server Error)' 
      });
    } finally {
      setSubmitLoading(false);
    }
  };

  // Filter users based on search
  const filteredUsers = users.filter((u) =>
    u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination Calculations
  const totalItems = filteredUsers.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const currentUsers = filteredUsers.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
            គ្រប់គ្រងអ្នកប្រើប្រាស់ (Users Management)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            គ្រប់គ្រងគណនី និងសិទ្ធិចូលប្រើប្រាស់ប្រព័ន្ធរបស់អ្នក។
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#216bc4] px-4 py-2.5 text-sm font-medium text-white shadow-xs hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>បន្ថែមអ្នកប្រើប្រាស់ (Add User)</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-3 shadow-xs">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="ស្វែងរកតាមឈ្មោះ, អ៊ីមែល ឬតួនាទី..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-4 text-xs sm:text-sm text-slate-800 focus:border-[#216bc4] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#216bc4] transition-all"
          />
        </div>
        
        {/* Items per page Selector */}
        <div className="flex items-center gap-2 text-xs text-slate-600 w-full sm:w-auto justify-between sm:justify-end">
          <span>បង្ហាញក្នុងមួយទំព័រ:</span>
          <select
            value={itemsPerPage}
            onChange={(e) => setItemsPerPage(Number(e.target.value))}
            className="h-8 rounded-lg border border-slate-200 bg-slate-50 px-2 text-xs text-slate-800 focus:border-[#216bc4] focus:outline-none"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>
      </div>

      {/* Users Table Card */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
        {loading ? (
          <div className="flex min-h-[300px] flex-col items-center justify-center gap-2">
            <Loader2 className="h-7 w-7 animate-spin text-[#216bc4]" />
            <span className="text-sm font-medium text-slate-500">កំពុងទាញយកទិន្នន័យ...</span>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm text-slate-600">
                <thead className="border-b border-slate-200 bg-slate-50 text-slate-700 font-semibold uppercase">
                  <tr>
                    <th className="px-4 py-3.5">ID</th>
                    <th className="px-4 py-3.5">ឈ្មោះអ្នកប្រើ (Username)</th>
                    <th className="px-4 py-3.5">អ៊ីមែល (Email)</th>
                    <th className="px-4 py-3.5">តួនាទី (Role)</th>
                    <th className="px-4 py-3.5">កាលបរិច្ឆេទបង្កើត</th>
                    <th className="px-4 py-3.5 text-right">សកម្មភាព (Action)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {currentUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                        មិនមានទិន្នន័យអ្នកប្រើប្រាស់ត្រូវបានរកឃើញឡើយ
                      </td>
                    </tr>
                  ) : (
                    currentUsers.map((user) => (
                      <tr key={user.user_id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-3.5 font-medium text-slate-900">#{user.user_id}</td>
                        <td className="px-4 py-3.5 font-semibold text-slate-800">
                          <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-[#216bc4] font-bold text-xs uppercase">
                              {user.username.substring(0, 2)}
                            </div>
                            {user.username}
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-slate-600">{user.email}</td>
                        <td className="px-4 py-3.5">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
                              user.role === 'admin'
                                ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                : user.role === 'operator'
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : 'bg-slate-100 text-slate-700 border border-slate-200'
                            }`}
                          >
                            {user.role === 'admin' ? (
                              <ShieldCheck className="h-3 w-3" />
                            ) : (
                              <ShieldAlert className="h-3 w-3" />
                            )}
                            {user.role}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-slate-500 text-xs">
                          {new Date(user.created_at).toLocaleDateString('km-KH', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </td>
                        <td className="px-4 py-3.5 text-right relative">
                          <div className="inline-flex items-center gap-1">
                            <button
                              onClick={() => {
                                setSelectedUser(user);
                                setIsViewModalOpen(true);
                              }}
                              className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-blue-600 transition-colors"
                              title="មើលព័ត៌មាន (View)"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedUser(user);
                                setIsEditModalOpen(true);
                              }}
                              className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-amber-600 transition-colors"
                              title="កែប្រែ (Edit)"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedUser(user);
                                setIsDeleteModalOpen(true);
                              }}
                              className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-rose-600 transition-colors"
                              title="លុប (Delete)"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="flex flex-col sm:flex-row items-center justify-between border-t border-slate-200 bg-white px-4 py-3 gap-3">
              <div className="text-xs text-slate-500">
                បង្ហាញ <span className="font-semibold text-slate-800">{totalItems === 0 ? 0 : startIndex + 1}</span> ដល់{' '}
                <span className="font-semibold text-slate-800">{endIndex}</span> នៃ{' '}
                <span className="font-semibold text-slate-800">{totalItems}</span> លទ្ធផល
              </div>

              <div className="flex items-center gap-1">
                {/* First Page */}
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent"
                >
                  <ChevronsLeft className="h-4 w-4" />
                </button>
                {/* Previous Page */}
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                {/* Page Numbers */}
                <div className="flex items-center gap-1 px-2">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`h-7 w-7 rounded-lg text-xs font-medium transition-colors ${
                        currentPage === page
                          ? 'bg-[#216bc4] text-white'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>

                {/* Next Page */}
                <button
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
                {/* Last Page */}
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent"
                >
                  <ChevronsRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ==================== ANIMATED ADD USER MODAL ==================== */}
      <AnimatePresence>
        {isAddModalOpen && (
          <motion.div
            key="add-modal"
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
                <div className="flex items-center gap-2 text-[#216bc4]">
                  <UserPlus className="h-5 w-5" />
                  <h3 className="text-lg font-bold text-slate-800">បន្ថែមអ្នកប្រើប្រាស់ថ្មី</h3>
                </div>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {statusMessage && (
                <div
                  className={`mt-4 flex items-center gap-2 rounded-lg p-3 text-xs font-medium ${
                    statusMessage.type === 'success'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}
                >
                  {statusMessage.type === 'success' ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                  ) : (
                    <AlertCircle className="h-4 w-4 shrink-0" />
                  )}
                  <span>{statusMessage.text}</span>
                </div>
              )}

              <form onSubmit={handleAddUserSubmit} className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ឈ្មោះអ្នកប្រើប្រាស់ (Username)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ឧ. admin_seko"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 p-2.5 text-sm text-slate-800 focus:border-[#216bc4] focus:outline-none focus:ring-1 focus:ring-[#216bc4]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    អ៊ីមែល (Email)
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="ឧ. admin@parking.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 p-2.5 text-sm text-slate-800 focus:border-[#216bc4] focus:outline-none focus:ring-1 focus:ring-[#216bc4]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ពាក្យសម្ងាត់ (Password)
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 p-2.5 text-sm text-slate-800 focus:border-[#216bc4] focus:outline-none focus:ring-1 focus:ring-[#216bc4]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    តួនាទី (Role)
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 p-2.5 text-sm text-slate-800 focus:border-[#216bc4] focus:outline-none focus:ring-1 focus:ring-[#216bc4]"
                  >
                    <option value="user">User</option>
                    <option value="operator">Operator</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
                  >
                    បោះបង់
                  </button>
                  <button
                    type="submit"
                    disabled={submitLoading}
                    className="inline-flex items-center gap-2 rounded-lg bg-[#216bc4] px-4 py-2 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {submitLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    <span>រក្សាទុក (Save)</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ==================== ANIMATED VIEW USER MODAL ==================== */}
      <AnimatePresence>
        {isViewModalOpen && selectedUser && (
          <motion.div
            key="view-modal"
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
                <h3 className="text-base font-bold text-slate-800">ព័ត៌មានលម្អិតអ្នកប្រើប្រាស់</h3>
                <button onClick={() => setIsViewModalOpen(false)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="mt-4 space-y-3 text-xs sm:text-sm">
                <div>
                  <span className="text-slate-400 block text-[11px]">ID</span>
                  <span className="font-semibold text-slate-800">#{selectedUser.user_id}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Username</span>
                  <span className="font-semibold text-slate-800">{selectedUser.username}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Email</span>
                  <span className="font-semibold text-slate-800">{selectedUser.email}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Role</span>
                  <span className="font-semibold capitalize text-[#216bc4]">{selectedUser.role}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Created At</span>
                  <span className="text-slate-700">{new Date(selectedUser.created_at).toLocaleString('km-KH')}</span>
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setIsViewModalOpen(false)}
                  className="rounded-lg bg-slate-100 px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-200"
                >
                  បិទ
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ==================== ANIMATED EDIT USER MODAL ==================== */}
      <AnimatePresence>
        {isEditModalOpen && selectedUser && (
          <motion.div
            key="edit-modal"
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
                <h3 className="text-base font-bold text-slate-800">កែប្រែព័ត៌មានអ្នកប្រើប្រាស់</h3>
                <button onClick={() => setIsEditModalOpen(false)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setIsEditModalOpen(false);
                }}
                className="mt-4 space-y-4"
              >
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ឈ្មោះអ្នកប្រើប្រាស់ (Username)
                  </label>
                  <input
                    type="text"
                    defaultValue={selectedUser.username}
                    className="w-full rounded-lg border border-slate-200 p-2.5 text-sm text-slate-800 focus:border-[#216bc4] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    អ៊ីមែល (Email)
                  </label>
                  <input
                    type="email"
                    defaultValue={selectedUser.email}
                    className="w-full rounded-lg border border-slate-200 p-2.5 text-sm text-slate-800 focus:border-[#216bc4] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    តួនាទី (Role)
                  </label>
                  <select
                    defaultValue={selectedUser.role}
                    className="w-full rounded-lg border border-slate-200 p-2.5 text-sm text-slate-800 focus:border-[#216bc4] focus:outline-none"
                  >
                    <option value="user">User</option>
                    <option value="operator">Operator</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
                  >
                    បោះបង់
                  </button>
                  <button
                    type="submit"
                    className="rounded-lg bg-[#216bc4] px-4 py-2 text-xs font-medium text-white hover:bg-blue-700"
                  >
                    រក្សាទុកការកែប្រែ
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ==================== ANIMATED DELETE USER MODAL ==================== */}
      <AnimatePresence>
        {isDeleteModalOpen && selectedUser && (
          <motion.div
            key="delete-modal"
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
              <div className="flex items-center gap-3 text-rose-600">
                <AlertCircle className="h-6 w-6 shrink-0" />
                <h3 className="text-base font-bold">តើអ្នកពិតជាចង់លុបអ្នកប្រើប្រាស់នេះមែនទេ?</h3>
              </div>
              <p className="mt-2 text-xs text-slate-500">
                សកម្មភាពនេះមិនអាចត្រឡប់ក្រោយបានទេសម្រាប់គណនី <strong className="text-slate-800">{selectedUser.username}</strong>.
              </p>
              <div className="mt-6 flex justify-end gap-2">
                <button
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
                >
                  បោះបង់
                </button>
                <button
                  onClick={() => {
                    setUsers((prev) => prev.filter((u) => u.user_id !== selectedUser.user_id));
                    setIsDeleteModalOpen(false);
                  }}
                  className="rounded-lg bg-rose-600 px-4 py-2 text-xs font-medium text-white hover:bg-rose-700"
                >
                  លុបចេញ
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
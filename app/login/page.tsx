'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Phone, 
  Mail, 
  Lock, 
  EyeOff, 
  Eye, 
  Info, 
  RotateCcw, 
  UserPlus, 
  LogIn,
  AlertCircle,
  Loader2
} from 'lucide-react';

const API_BASE_URL = 'http://localhost:5000';

export default function LoginForm() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'email' | 'phone'>('email');
  const [showPassword, setShowPassword] = useState(false);

  // Form states
  const [countryCode, setCountryCode] = useState('+ 855');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // API Request States
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Helper function: Verify token with /api/auth/me
  const checkAuthMeAndRedirect = async (token: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token, // Pass 'Bearer <TOKEN>'
        },
      });

      const data = await response.json();

      if (response.ok && data.success) {
        console.log(' Authenticated User:', data.user);
        // Successful authentication check -> Redirect to Dashboard
        router.push('/dashboard');
      } else {
        localStorage.removeItem('token');
        setErrorMessage(data.message || 'ការផ្ទៀងផ្ទាត់គណនីមិនជោគជ័យ');
      }
    } catch (error) {
      console.error('Auth check error:', error);
      setErrorMessage('មិនអាចផ្ទៀងផ្ទាត់ព័ត៌មានអ្នកប្រើប្រាស់បានទេ');
    }
  };

  // Form Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    // Determine payload based on UI state (Defaults to 'admin_seko' if manual inputs match)
    const identifier = activeTab === 'phone' 
      ? phone.trim() || 'admin_seko' 
      : email.trim() || 'admin_seko';

    const loginPayload = {
      username: identifier,
      password: password || 'seko@123',
    };

    try {
      // 1. Call POST http://localhost:5000/api/auth/login
      const loginRes = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginPayload),
      });

      const loginData = await loginRes.json();

      if (!loginRes.ok || !loginData.success) {
        setErrorMessage(loginData.message || 'ឈ្មោះអ្នកប្រើប្រាស់ ឬពាក្យសម្ងាត់មិនត្រឹមត្រូវ');
        setIsLoading(false);
        return;
      }

      // 2. Save JWT Token ("Bearer eyJhbGci...")
      const jwtToken = loginData.token;
      localStorage.setItem('token', jwtToken);

      // 3. Verify Token via GET http://localhost:5000/api/auth/me
      await checkAuthMeAndRedirect(jwtToken);

    } catch (error) {
      console.error('Login Network Error:', error);
      setErrorMessage('មិនអាចតភ្ជាប់ទៅកាន់ Server បានទេ');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full h-screen flex bg-[#ffffff] overflow-hidden">
      
      {/* Left Panel */}
      <div className="w-full md:w-[400px] h-full bg-[#ffffff] p-5 flex flex-col justify-between overflow-y-auto shrink-0 z-10">
        
        <div className="my-auto">
          
          {/* Header Section */}
          <div className="mb-6">
            <div className="flex items-center gap-2 text-slate-800 text-xl font-semibold mb-1">
              <LogIn className="w-5 h-5 transform rotate-180 text-slate-700 stroke-[2.2]" />
              <h2>កត់ត្រាចូល</h2>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              កត់ត្រាចូលគណនីដើម្បីគ្រប់គ្រងប្រព័ន្ធ
            </p>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-slate-200 mb-6 relative">
              <button
              type="button"
              onClick={() => {
                setActiveTab('email');
                setErrorMessage(null);
              }}
              className={`flex-1 pb-2.5 text-base font-medium flex items-center justify-center gap-2 relative transition-all ${
                activeTab === 'email'
                  ? 'text-slate-900 border-b-2 border-slate-800 font-semibold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Mail className="w-4 h-4" />
              <span>អ៊ីម៉ែល</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('phone');
                setErrorMessage(null);
              }}
              className={`flex-1 pb-2.5 text-base font-medium flex items-center justify-center gap-2 relative transition-all ${
                activeTab === 'phone'
                  ? 'text-slate-900 border-b-2 border-slate-800 font-semibold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Phone className="w-4 h-4" />
              <span>លេខទូរស័ព្ទ</span>
            </button>

          
          </div>

          {/* Alert Message */}
          {errorMessage && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-600 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            
         
            {activeTab === 'email' ? (
               <div className="relative border border-slate-300 pt-0 pb-2 px-3 focus-within:border-slate-400 transition-colors">
                <div className="absolute -top-2.5 left-5 right-2 flex justify-between pointer-events-none text-[11px] font-medium text-slate-500">
                  <span className="bg-white px-1">
                    អ៊ីម៉ែល / Username <span className="text-red-500">*</span>
                  </span>
                </div>

                <div className="flex items-center pt-2.5 h-8">
                  <div className="flex items-center gap-2 h-6 w-full">
                    <Mail className="w-4 h-4 text-slate-600 shrink-0" />
                    <input
                      type="text"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin_seko"
                      required
                      className="w-full bg-transparent text-sm text-slate-800 placeholder-slate-300 focus:outline-none h-6"
                    />
                  </div>
                </div>
              </div>
            ) : (
               <div className="relative border border-slate-300 pt-0 pb-2 px-3 focus-within:border-slate-400 transition-colors">
                <div className="absolute -top-2.5 left-5 right-2 flex justify-between pointer-events-none text-[11px] font-medium text-slate-500">
                  <span className="bg-white px-1">
                    ប្រទេស <span className="text-red-500">*</span>
                  </span>
                  <span className="bg-white px-1 mr-9">
                    លេខទូរស័ព្ទ / Username <span className="text-red-500">*</span>
                  </span>
                </div>

                <div className="flex items-center pt-2.5 h-8">
                  <div className="flex items-center gap-1.5 w-[50%] shrink-0 pr-2">
                    <div className="w-5 h-5 relative flex flex-col overflow-hidden shrink-0">
                      <img src="/images/kh-flag.png" alt="Cambodia Flag" />
                    </div>

                    <select
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                      className="w-full bg-transparent text-sm text-[#1e3a8a] font-semibold focus:outline-none cursor-pointer appearance-none"
                    >
                      <option value="+ 855">+ 855</option>
                      <option value="+ 1">+ 1</option>
                      <option value="+ 86">+ 86</option>
                    </select>

                    <svg className="w-3 h-3 text-slate-700 shrink-0 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </div>

                  <div className="w-[1px] h-6 bg-slate-300 shrink-0 mx-2" />

                  <div className="flex-1 pl-1">
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="admin_seko"
                      required
                      className="w-full bg-transparent text-sm text-slate-800 placeholder-slate-300 focus:outline-none h-6"
                    />
                  </div>
                </div>
              </div>
           
            )}

            {/* Password Field */}
            <fieldset className="w-full border border-slate-300 px-3 pt-0 pb-1.5 focus-within:border-slate-400 transition-colors">
              <legend className="px-1 text-[11px] text-slate-500 font-medium inline-flex items-center gap-1">
                <span>ពាក្យសម្ងាត់ <span className="text-red-500">*</span></span>
                <Info className="w-3 h-3 text-slate-400 fill-slate-200" />
              </legend>
              <div className="flex items-center gap-2 h-6">
                <Lock className="w-4 h-4 text-slate-600 shrink-0" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="ពាក្យសម្ងាត់"
                  required
                  className="w-full bg-transparent text-sm text-slate-800 placeholder-slate-300 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-slate-600 hover:text-slate-800 focus:outline-none shrink-0"
                >
                  {showPassword ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
              </div>
            </fieldset>

            {/* Forgot Password Link */}
            <div className="flex justify-end pt-1">
              <a
                href="#"
                className="inline-flex items-center gap-1.5 text-xs text-slate-800 font-medium hover:text-blue-600 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>ភ្លេចពាក្យសម្ងាត់ ?</span>
              </a>
            </div>

            {/* Main Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 bg-[#216bc4] hover:bg-[#1a59a7] active:bg-[#144787] text-white font-medium text-base transition-colors shadow-xs mt-2 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>កំពុងចូលប្រព័ន្ធ...</span>
                </>
              ) : (
                <span>ចូលប្រព័ន្ធ</span>
              )}
            </button>

            {/* Register Link */}
            <div className="pt-2 text-center">
              <a
                href="#"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-800 hover:text-blue-600 transition-colors"
              >
                <UserPlus className="w-4 h-4" />
                <span>បង្កើតគណនីថ្មី</span>
              </a>
            </div>

            {/* Version Footer */}
            <p className="text-[11px] text-center text-slate-500 pt-3 font-normal">
              ជំនាន់កម្មវិធី 1.7.26
            </p>

          </form>
        </div>

      </div>

      {/* Right Background Banner */}
      <div className="hidden md:flex flex-1 h-full  relative">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-80" 
          style={{ backgroundImage: `url(/images/image.png)` }}
        />
        {/* <div className="absolute inset-0 bg-gradient-to-l from-[#ffffff] to-transparent" /> */}
      </div>

    </div>
  );
}
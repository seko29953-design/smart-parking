"use client";
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';

// Product Data Structure
interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  rating: number;
  image: string;
  description: string;
  isNew?: boolean;
}

interface CartItem extends Product {
  quantity: number;
}

const PRODUCTS: Product[] = [
  {
    id: 1,
    name: 'Wireless Noise-Canceling Headphones',
    category: 'Electronics',
    price: 299.99,
    rating: 4.8,
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=600',
    description: 'High-fidelity wireless audio with active noise cancellation and 30-hour battery life.',
    isNew: true,
  },
  {
    id: 2,
    name: 'Minimalist Mechanical Keyboard',
    category: 'Electronics',
    price: 149.50,
    rating: 4.6,
    image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&q=80&w=600',
    description: 'Tactile mechanical switches housed in a sleek aluminum frame with customizable RGB lighting.',
  },
  {
    id: 3,
    name: 'Smart Fitness Watch',
    category: 'Electronics',
    price: 199.00,
    rating: 4.5,
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=600',
    description: 'Track health metrics, GPS workouts, and daily activity with an AMOLED display.',
  },
  {
    id: 4,
    name: 'Ergonomic Leather Chair',
    category: 'Furniture',
    price: 420.00,
    rating: 4.9,
    image: 'https://images.unsplash.com/photo-1580481072645-022f9a6d8310?auto=format&fit=crop&q=80&w=600',
    description: 'Premium lumbar support crafted with breathable top-grain leather for long working hours.',
    isNew: true,
  },
  {
    id: 5,
    name: 'Ceramic Pour-Over Coffee Set',
    category: 'Home & Kitchen',
    price: 65.00,
    rating: 4.7,
    image: 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?auto=format&fit=crop&q=80&w=600',
    description: 'Handcrafted ceramic dripper with thermal carafe for artisanal morning coffee brews.',
  },
  {
    id: 6,
    name: 'Stainless Steel Water Bottle',
    category: 'Home & Kitchen',
    price: 35.00,
    rating: 4.4,
    image: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&q=80&w=600',
    description: 'Double-wall vacuum insulation keeps drinks cold for 24 hours or hot for 12 hours.',
  },
];

const CATEGORIES = ['All', 'Electronics', 'Furniture', 'Home & Kitchen'];

// Strictly Typed Animation Variants
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 0.4, ease: 'easeOut' } 
  },
};

export default function ProductShowcase() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'featured' | 'low-high' | 'high-low'>('featured');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  // Cart & Drawer State
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  
  // Auth State
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [isSignInOpen, setIsSignInOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Dynamic cart calculations
  const totalCartCount = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.quantity, 0),
    [cartItems]
  );

  const cartSubtotal = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cartItems]
  );

  // Filter and Sort Logic
  const filteredProducts = useMemo(() => {
    return PRODUCTS.filter((product) => {
      const matchesCategory =
        selectedCategory === 'All' || product.category === selectedCategory;
      const matchesSearch = product.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    }).sort((a, b) => {
      if (sortBy === 'low-high') return a.price - b.price;
      if (sortBy === 'high-low') return b.price - a.price;
      return a.id - b.id;
    });
  }, [selectedCategory, searchTerm, sortBy]);

  // Cart Handlers
  const handleAddToCart = (product: Product) => {
    setCartItems((prevItems) => {
      const existing = prevItems.find((item) => item.id === product.id);
      if (existing) {
        return prevItems.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prevItems, { ...product, quantity: 1 }];
    });
  };

  const handleUpdateQuantity = (id: number, delta: number) => {
    setCartItems((prevItems) =>
      prevItems
        .map((item) => {
          if (item.id === id) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter((item): item is CartItem => item !== null)
    );
  };

  const handleRemoveItem = (id: number) => {
    setCartItems((prevItems) => prevItems.filter((item) => item.id !== id));
  };

  // Auth Handlers
  const handleSignInSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && password) {
      setIsSignedIn(true);
      setIsSignInOpen(false);
      setEmail('');
      setPassword('');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* --- Top Navigation Header --- */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <motion.div 
              whileHover={{ rotate: 10, scale: 1.05 }}
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#216bc4] text-white font-bold text-xl shadow-xs"
            >
              S
            </motion.div>
            <span className="text-xl font-bold tracking-tight text-slate-900">Storefront</span>
          </div>

          {/* Search Bar */}
          <div className="relative w-full max-w-md hidden sm:block">
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-md border border-slate-200 bg-slate-100 py-2 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
            />
            <svg
              className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-3">
            {isSignedIn ? (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsSignedIn(false)}
                className="flex items-center gap-2 rounded-lg p-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                title="Click to Sign Out"
              >
                <div className="h-8 w-8 rounded-full bg-[#216bc4] text-white flex items-center justify-center font-bold text-xs shadow-xs">
                  JD
                </div>
                <span className="hidden md:inline text-slate-800">John Doe</span>
              </motion.button>
            ) : (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => setIsSignInOpen(true)}
                className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs transition-colors hover:bg-slate-50"
              >
                Sign In
              </motion.button>
            )}

            {/* Cart Button with Animated Badge */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.92 }}
              onClick={() => setIsCartOpen(true)}
              className="relative flex items-center justify-center rounded-lg bg-slate-100 p-2.5 text-slate-700 hover:bg-slate-200 transition-colors"
              aria-label="Open Cart"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
              </svg>
              <AnimatePresence>
                {totalCartCount > 0 && (
                  <motion.span
                    key={totalCartCount}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                    className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#216bc4] text-[10px] font-bold text-white shadow-xs"
                  >
                    {totalCartCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          </div>
        </div>
      </header>

      {/* --- Main Content Section --- */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Banner Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-10 rounded-2xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 p-8 text-white shadow-xl sm:p-12"
        >
          <div className="max-w-xl">
            <span className="rounded-full bg-indigo-500/30 px-3 py-1 text-xs font-semibold text-indigo-200 border border-indigo-400/30">
              Summer Collection 2026
            </span>
            <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-5xl">
              Elevate Your Daily Essentials.
            </h1>
            <p className="mt-3 text-sm text-indigo-100/80 sm:text-base">
              Discover high-quality tech gear, home decor, and lifestyle products curated for modern living.
            </p>
          </div>
        </motion.div>

        {/* Filters and Controls */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <motion.button
                key={cat}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedCategory(cat)}
                className={`rounded-full px-4 py-1.5 text-xs font-medium transition-all ${
                  selectedCategory === cat
                    ? 'bg-[#216bc4] text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                {cat}
              </motion.button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-slate-500">Sort by:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="rounded-lg border border-slate-200 bg-white py-1.5 px-3 text-xs text-slate-700 focus:border-indigo-500 focus:outline-none"
            >
              <option value="featured">Featured</option>
              <option value="low-high">Price: Low to High</option>
              <option value="high-low">Price: High to Low</option>
            </select>
          </div>
        </div>

        {/* Product Grid */}
        <AnimatePresence mode="wait">
          {filteredProducts.length > 0 ? (
            <motion.div
              key={selectedCategory + searchTerm + sortBy}
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
            >
              {filteredProducts.map((product) => (
                <motion.div
                  key={product.id}
                  variants={itemVariants}
                  whileHover={{ y: -6 }}
                  className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs transition-shadow duration-200 hover:shadow-xl"
                >
                  <div className="relative aspect-4/3 overflow-hidden bg-slate-100">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
                    />
                    {product.isNew && (
                      <span className="absolute left-3 top-3 rounded-full bg-emerald-500 px-2.5 py-0.5 text-[10px] font-bold text-white shadow-xs">
                        NEW
                      </span>
                    )}
                    <motion.button
                      initial={{ opacity: 0, y: 10 }}
                      whileHover={{ scale: 1.02 }}
                      onClick={() => setSelectedProduct(product)}
                      className="absolute inset-x-4 bottom-4 hidden rounded-xl bg-white/90 py-2.5 text-xs font-semibold text-slate-900 shadow-md backdrop-blur-xs group-hover:block transition-all"
                    >
                      Quick View
                    </motion.button>
                  </div>

                  <div className="flex flex-1 flex-col p-5">
                    <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                      <span>{product.category}</span>
                      <div className="flex items-center gap-1 font-semibold text-amber-500">
                        ★ <span>{product.rating}</span>
                      </div>
                    </div>

                    <h3 className="text-base font-semibold text-slate-900 line-clamp-1">
                      {product.name}
                    </h3>

                    <p className="mt-1 text-xs text-slate-500 line-clamp-2 flex-1">
                      {product.description}
                    </p>

                    <div className="mt-4 flex items-center justify-between pt-3 border-t border-slate-100">
                      <span className="text-lg font-bold text-slate-900">
                        ${product.price.toFixed(2)}
                      </span>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleAddToCart(product)}
                        className="rounded-lg bg-[#216bc4] px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 transition-colors"
                      >
                        Add to Cart
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-20 text-center"
            >
              <p className="text-slate-400">No products found matching your search.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* --- Sign-In Animated Modal --- */}
      <AnimatePresence>
        {isSignInOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSignInOpen(false)}
              className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs"
            />

            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', stiffness: 350, damping: 25 }}
              className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white p-6 shadow-2xl z-10"
            >
              <button
                onClick={() => setIsSignInOpen(false)}
                className="absolute right-4 top-4 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              >
                ✕
              </button>

              <div className="mb-6 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-[#216bc4]">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-slate-900">Sign in to Storefront</h2>
                <p className="mt-1 text-xs text-slate-500">Welcome back! Please enter your details.</p>
              </div>

              <form onSubmit={handleSignInSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Email address</label>
                  <input
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Password</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div className="flex items-center justify-between text-xs">
                  <label className="flex items-center gap-2 text-slate-600">
                    <input type="checkbox" className="rounded border-slate-300 text-[#216bc4] focus:ring-indigo-500" />
                    Remember me
                  </label>
                  <a href="#" className="font-semibold text-[#216bc4] hover:underline">Forgot password?</a>
                </div>

                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  className="w-full rounded-xl bg-[#216bc4] py-3 text-xs font-semibold text-white shadow-md hover:bg-indigo-700 transition-colors"
                >
                  Sign In
                </motion.button>
              </form>

              <div className="mt-6 text-center text-xs text-slate-500">
                Don't have an account?{' '}
                <a href="#" className="font-semibold text-[#216bc4] hover:underline">Sign up</a>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- Shopping Cart Slide-Over Drawer --- */}
      <AnimatePresence>
        {isCartOpen && (
          <div className="fixed inset-0 z-50 overflow-hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            />

            <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                className="w-screen max-w-md bg-white shadow-2xl flex flex-col"
              >
                <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                  <h2 className="text-base font-semibold text-slate-900">Shopping Cart</h2>
                  <button
                    onClick={() => setIsCartOpen(false)}
                    className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                  >
                    ✕
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  <AnimatePresence initial={false}>
                    {cartItems.length > 0 ? (
                      cartItems.map((item) => (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="flex items-center gap-4 rounded-xl border border-slate-100 p-3 shadow-2xs overflow-hidden"
                        >
                          <img
                            src={item.image}
                            alt={item.name}
                            className="h-16 w-16 rounded-lg object-cover bg-slate-100"
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="text-xs font-semibold text-slate-900 truncate">
                              {item.name}
                            </h4>
                            <p className="text-xs font-bold text-slate-900 mt-1">
                              ${(item.price * item.quantity).toFixed(2)}
                            </p>

                            <div className="mt-2 flex items-center gap-2">
                              <button
                                onClick={() => handleUpdateQuantity(item.id, -1)}
                                className="h-6 w-6 rounded border border-slate-200 text-xs text-slate-600 hover:bg-slate-100"
                              >
                                -
                              </button>
                              <span className="text-xs font-medium text-slate-800">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => handleUpdateQuantity(item.id, 1)}
                                className="h-6 w-6 rounded border border-slate-200 text-xs text-slate-600 hover:bg-slate-100"
                              >
                                +
                              </button>
                            </div>
                          </div>

                          <button
                            onClick={() => handleRemoveItem(item.id)}
                            className="text-xs text-rose-500 hover:text-rose-700 font-medium"
                          >
                            Remove
                          </button>
                        </motion.div>
                      ))
                    ) : (
                      <div className="flex h-full flex-col items-center justify-center text-center py-12">
                        <svg className="h-12 w-12 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                        </svg>
                        <p className="mt-3 text-xs text-slate-500">Your shopping cart is empty.</p>
                      </div>
                    )}
                  </AnimatePresence>
                </div>

                {cartItems.length > 0 && (
                  <div className="border-t border-slate-200 p-6 space-y-4">
                    <div className="flex justify-between text-sm font-semibold text-slate-900">
                      <span>Subtotal</span>
                      <span>${cartSubtotal.toFixed(2)}</span>
                    </div>
                    <p className="text-xs text-slate-400">Shipping and taxes calculated at checkout.</p>
                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full rounded-xl bg-[#216bc4] py-3 text-xs font-semibold text-white shadow-md hover:bg-indigo-700 transition-colors"
                    >
                      Checkout Now
                    </motion.button>
                  </div>
                )}
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* --- Quick View Animated Modal --- */}
      <AnimatePresence>
        {selectedProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedProduct(null)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
            />

            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full max-w-2xl overflow-hidden rounded-2xl bg-white p-6 shadow-2xl z-10"
            >
              <button
                onClick={() => setSelectedProduct(null)}
                className="absolute right-4 top-4 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              >
                ✕
              </button>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div className="aspect-square overflow-hidden rounded-xl bg-slate-100">
                  <img
                    src={selectedProduct.image}
                    alt={selectedProduct.name}
                    className="h-full w-full object-cover"
                  />
                </div>

                <div className="flex flex-col justify-between">
                  <div>
                    <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">
                      {selectedProduct.category}
                    </span>
                    <h2 className="mt-1 text-xl font-bold text-slate-900">
                      {selectedProduct.name}
                    </h2>
                    <div className="mt-2 flex items-center gap-1 text-sm font-semibold text-amber-500">
                      ★ {selectedProduct.rating} <span className="text-slate-400 text-xs">(128 reviews)</span>
                    </div>
                    <p className="mt-4 text-xs text-slate-600 leading-relaxed">
                      {selectedProduct.description}
                    </p>
                  </div>

                  <div className="mt-6 border-t border-slate-100 pt-4">
                    <div className="mb-4 text-2xl font-bold text-slate-900">
                      ${selectedProduct.price.toFixed(2)}
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        handleAddToCart(selectedProduct);
                        setSelectedProduct(null);
                      }}
                      className="w-full rounded-xl bg-[#216bc4] py-3 text-xs font-semibold text-white shadow-md transition-colors hover:bg-indigo-700"
                    >
                      Add to Cart
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/logo.png';

const EyeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
    <circle cx="12" cy="12" r="3"></circle>
  </svg>
);

const EyeOffIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
    <line x1="1" y1="1" x2="23" y2="23"></line>
  </svg>
);

export default function LoginPage() {
  const { login, error, setError, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password.');
      return;
    }
    await login(email, password);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 font-sans px-4 select-none">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-100 p-8 flex flex-col transition-all">
        {/* Brand/Header (60% White Card Base, 30% Orange Highlight branding, 10% slate description text) */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mb-4 border border-orange-100 p-2 shadow-sm">
            <img src={logo} alt="ASA Philippines Foundation Inc." className="object-contain w-full h-full" />
          </div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Budgeting System</h2>
          <p className="text-slate-500 text-sm mt-1">Sign in to manage and review branch metrics</p>
        </div>

        {/* Error notification banner */}
        {error && (
          <div className="bg-red-50 text-red-600 border border-red-200 rounded-xl px-4 py-3 text-sm font-semibold mb-6 animate-shake">
            ⚠️ {error}
          </div>
        )}

        {/* Form elements styled with high elegance */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-800 placeholder-slate-400 bg-slate-50/50 outline-none transition-all focus:bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-500/15"
              placeholder="e.g. yourname@asaphil.org"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              autoComplete="email"
              required
            />
          </div>
          
          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Password
            </label>
            <div className="relative w-full">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                className="w-full border border-slate-200 rounded-xl pl-4 pr-11 py-3 text-sm font-medium text-slate-800 placeholder-slate-400 bg-slate-50/50 outline-none transition-all focus:bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-500/15"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                autoComplete="current-password"
                required
              />
              <button 
                type="button" 
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-orange-500 transition-colors p-1 rounded-md" 
                onClick={() => setShowPassword(!showPassword)}
                tabIndex="-1"
              >
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-sm py-3.5 rounded-xl shadow-lg shadow-orange-500/10 hover:shadow-orange-500/25 active:scale-[0.98] transition-all flex items-center justify-center disabled:opacity-50 disabled:pointer-events-none mt-2" 
            disabled={loading}
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                <span>Signing In...</span>
              </div>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <div className="mt-8 border-t border-slate-100 pt-5 text-center text-xs font-semibold text-slate-400">
          For support, contact ASA IT Helpdesk
        </div>
      </div>
    </div>
  );
}

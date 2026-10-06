import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Card } from '../../components/atoms/Card';
import { Button } from '../../components/atoms/Button';
import { IconDroplet, IconAlertCircle, IconLock, IconMail } from '@tabler/icons-react';

export function LoginView() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [loginInput, setLoginInput] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginInput.trim() || !password) return;

    setIsLoading(true);
    setErrorMessage(null);

    try {
      await login({ login: loginInput.trim(), password });

      // Determine redirection based on login email/account
      const val = loginInput.toLowerCase();
      if (val.includes('admin')) {
        navigate('/admin/dashboard');
      } else if (val.includes('staff')) {
        navigate('/staff/tasks');
      } else {
        navigate('/customer/home');
      }
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { message?: string } } };
      setErrorMessage(apiErr.response?.data?.message || 'Invalid credentials. Please verify your email/password.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemoSelect = (role: 'admin' | 'staff' | 'customer') => {
    if (role === 'admin') {
      setLoginInput('admin@siwass.gov');
      setPassword('password123');
    } else if (role === 'staff') {
      setLoginInput('staff@siwass.gov');
      setPassword('password123');
    } else {
      setLoginInput('maria@example.com');
      setPassword('password123');
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col justify-between p-4 sm:p-6 text-black text-[10px]">
      {/* Top Banner */}
      <header className="flex items-center justify-between border-b border-black/15 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-6 px-2 items-center justify-center rounded bg-[#1E6FD9] text-white font-bold text-[10px] uppercase tracking-wider">
            AquaTrack
          </div>
          <span className="font-bold text-black uppercase tracking-wider">
            Sinacaban Water District (SIWASS)
          </span>
        </div>
        <div className="text-black/60 hidden sm:block">
          Official Municipal Public Utility Gateway
        </div>
      </header>

      {/* Main Login Card */}
      <div className="w-full max-w-sm mx-auto my-8">
        <Card className="p-6 border border-black/15 shadow-sm space-y-4">
          <div className="text-center space-y-1">
            <div className="w-10 h-10 rounded-full bg-[#F0F6FD] border border-black/20 flex items-center justify-center mx-auto text-[#1E6FD9]">
              <IconDroplet size={20} />
            </div>
            <h1 className="text-[10px] font-bold text-black uppercase tracking-wider">
              Institutional Account Sign In
            </h1>
            <p className="text-[10px] text-black/60">
              Access your administrative, field technician, or consumer portal.
            </p>
          </div>

          {errorMessage && (
            <div className="p-2.5 bg-[#F0F6FD] border border-black rounded text-[10px] text-black flex items-center gap-2">
              <IconAlertCircle size={14} className="text-[#1E6FD9] shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-[10px] font-bold text-black uppercase mb-1">
                Email or Account Number
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="admin@siwass.gov or account number"
                  className="w-full pl-7 pr-3 py-2 text-[10px] bg-white text-black border border-black rounded outline-none focus:border-[#1E6FD9]"
                  value={loginInput}
                  onChange={(e) => setLoginInput(e.target.value)}
                  required
                />
                <IconMail size={12} className="absolute left-2.5 top-2.5 text-black/50" />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-black uppercase mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  placeholder="••••••••"
                  className="w-full pl-7 pr-3 py-2 text-[10px] bg-white text-black border border-black rounded outline-none focus:border-[#1E6FD9]"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <IconLock size={12} className="absolute left-2.5 top-2.5 text-black/50" />
              </div>
            </div>

            <Button
              variant="primary"
              type="submit"
              className="w-full py-2"
              isLoading={isLoading}
            >
              Sign In to Portal
            </Button>
          </form>

          {/* Quick Demo Pre-fills */}
          <div className="border-t border-black/15 pt-3 space-y-1.5">
            <span className="text-[10px] font-bold text-black uppercase block text-center">
              Quick Live Demonstrations:
            </span>
            <div className="grid grid-cols-3 gap-1">
              <button
                type="button"
                onClick={() => handleQuickDemoSelect('admin')}
                className="py-1 px-1 bg-[#F0F6FD] hover:bg-[#1E6FD9] hover:text-white text-black border border-black rounded text-[10px] font-bold transition-colors"
              >
                Admin
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemoSelect('staff')}
                className="py-1 px-1 bg-[#F0F6FD] hover:bg-[#1E6FD9] hover:text-white text-black border border-black rounded text-[10px] font-bold transition-colors"
              >
                Staff
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemoSelect('customer')}
                className="py-1 px-1 bg-[#F0F6FD] hover:bg-[#1E6FD9] hover:text-white text-black border border-black rounded text-[10px] font-bold transition-colors"
              >
                Customer
              </button>
            </div>
          </div>

          {/* Registration link */}
          <div className="text-center pt-2 border-t border-black/10">
            <span className="text-black/60">New water consumer? </span>
            <Link
              to="/register"
              className="text-[#1E6FD9] font-bold underline"
            >
              Register Household
            </Link>
          </div>
        </Card>
      </div>

      {/* Footer */}
      <footer className="border-t border-black/15 pt-3 text-center text-black/50 text-[10px]">
        Sinacaban Water Works System (SIWASS) · Municipality of Sinacaban, Misamis Occidental
      </footer>
    </div>
  );
}

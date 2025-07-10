"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import { jwtDecode } from "jwt-decode";
import { useRouter } from 'next/navigation';

const LoginRegisterPage = () => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  // Login state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // Registration state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirm, setRegConfirm] = useState('');
  // Shared state
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, token, isAuthenticated } = useAuth();
  const router = useRouter();

  // Redirect after login/register based on role
  useEffect(() => {
    if (isAuthenticated && token) {
      try {
        const decoded = jwtDecode(token);
        console.log('Decoded token in useEffect:', decoded);
        if (decoded && typeof decoded === 'object' && 'role' in decoded) {
          if (decoded.role === 'admin') {
            console.log('Redirecting to /admin');
            router.push('/admin');
          } else {
            console.log('Redirecting to /user');
            router.push('/user');
          }
        } else {
          console.log('Redirecting to /user (no role in token)');
          router.push('/user');
        }
      } catch (e) {
        console.log('Error decoding token, redirecting to /user');
        router.push('/user');
      }
    }
  }, [isAuthenticated, token, router]);

  // Login handler
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const res = await fetch('http://localhost:8080/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to login');
      if (data.token) {
        login(data.token);
        // Redirect is now handled in useEffect
      } else {
        throw new Error('Login failed: No token received.');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Registration handler
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!regName || !regEmail || !regPassword || !regConfirm) {
      setError('All fields are required.');
      return;
    }
    if (regPassword !== regConfirm) {
      setError('Passwords do not match.');
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch('http://localhost:8080/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: regName, email: regEmail, password: regPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to register');
      if (data.token) {
        login(data.token);
        // Redirect is now handled in useEffect
      } else {
        setMode('login');
        setError('Registration successful! Please log in.');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[var(--background)] font-sans">
      <div className="w-full max-w-md p-8 space-y-6 bg-[var(--accent-white)] rounded-2xl shadow-xl">
        <div className="flex justify-center mb-4 gap-4">
          <button
            className={`px-4 py-2 rounded-lg font-bold transition text-[var(--primary-blue)] ${mode === 'login' ? 'bg-[var(--accent-teal)] text-white' : 'bg-[var(--accent-white)]'}`}
            onClick={() => { setMode('login'); setError(''); }}
            disabled={mode === 'login'}
          >
            Login
          </button>
          <button
            className={`px-4 py-2 rounded-lg font-bold transition text-[var(--primary-blue)] ${mode === 'register' ? 'bg-[var(--accent-teal)] text-white' : 'bg-[var(--accent-white)]'}`}
            onClick={() => { setMode('register'); setError(''); }}
            disabled={mode === 'register'}
          >
            Register
          </button>
        </div>
        {mode === 'login' ? (
          <>
            <h1 className="text-2xl font-bold text-center text-[var(--primary-blue)]">Login to Askimo</h1>
            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label htmlFor="email" className="text-sm font-medium text-[var(--primary-blue)]">Email</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 mt-1 border border-gray-200 rounded-md shadow-sm focus:outline-none focus:ring-[var(--primary-blue)] focus:border-[var(--primary-blue)] bg-[var(--accent-white)] text-[var(--primary-blue)]"
                />
              </div>
              <div>
                <label htmlFor="password" className="text-sm font-medium text-[var(--primary-blue)]">Password</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 mt-1 border border-gray-200 rounded-md shadow-sm focus:outline-none focus:ring-[var(--primary-blue)] focus:border-[var(--primary-blue)] bg-[var(--accent-white)] text-[var(--primary-blue)]"
                />
              </div>
              {error && <p className="text-sm text-center text-red-600">{error}</p>}
              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full px-4 py-2 font-medium text-white bg-[var(--primary-blue)] rounded-md hover:bg-[var(--accent-teal)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--primary-blue)] disabled:bg-gray-400"
                >
                  {isLoading ? 'Logging in...' : 'Login'}
                </button>
              </div>
            </form>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-center text-[var(--primary-blue)]">Register for Askimo</h1>
            <form onSubmit={handleRegister} className="space-y-6">
              <div>
                <label htmlFor="regName" className="text-sm font-medium text-[var(--primary-blue)]">Name</label>
                <input
                  id="regName"
                  name="regName"
                  type="text"
                  required
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  className="w-full px-3 py-2 mt-1 border border-gray-200 rounded-md shadow-sm focus:outline-none focus:ring-[var(--primary-blue)] focus:border-[var(--primary-blue)] bg-[var(--accent-white)] text-[var(--primary-blue)]"
                />
              </div>
              <div>
                <label htmlFor="regEmail" className="text-sm font-medium text-[var(--primary-blue)]">Email</label>
                <input
                  id="regEmail"
                  name="regEmail"
                  type="email"
                  required
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  className="w-full px-3 py-2 mt-1 border border-gray-200 rounded-md shadow-sm focus:outline-none focus:ring-[var(--primary-blue)] focus:border-[var(--primary-blue)] bg-[var(--accent-white)] text-[var(--primary-blue)]"
                />
              </div>
              <div>
                <label htmlFor="regPassword" className="text-sm font-medium text-[var(--primary-blue)]">Password</label>
                <input
                  id="regPassword"
                  name="regPassword"
                  type="password"
                  required
                  minLength={6}
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  className="w-full px-3 py-2 mt-1 border border-gray-200 rounded-md shadow-sm focus:outline-none focus:ring-[var(--primary-blue)] focus:border-[var(--primary-blue)] bg-[var(--accent-white)] text-[var(--primary-blue)]"
                />
              </div>
              <div>
                <label htmlFor="regConfirm" className="text-sm font-medium text-[var(--primary-blue)]">Confirm Password</label>
                <input
                  id="regConfirm"
                  name="regConfirm"
                  type="password"
                  required
                  minLength={6}
                  value={regConfirm}
                  onChange={(e) => setRegConfirm(e.target.value)}
                  className="w-full px-3 py-2 mt-1 border border-gray-200 rounded-md shadow-sm focus:outline-none focus:ring-[var(--primary-blue)] focus:border-[var(--primary-blue)] bg-[var(--accent-white)] text-[var(--primary-blue)]"
                />
              </div>
              {error && <p className="text-sm text-center text-red-600">{error}</p>}
              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full px-4 py-2 font-medium text-white bg-[var(--primary-blue)] rounded-md hover:bg-[var(--accent-teal)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--primary-blue)] disabled:bg-gray-400"
                >
                  {isLoading ? 'Registering...' : 'Register'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default LoginRegisterPage;

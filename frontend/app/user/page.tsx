"use client";
import { useState, useEffect } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import LoadingSkeleton from '../components/LoadingSkeleton';

export default function UserDashboard() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [agents, setAgents] = useState([]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/auth');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="w-full max-w-5xl mx-auto py-12 px-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-10">
          <div>
            <LoadingSkeleton width="300px" height="40px" className="mb-2" />
            <LoadingSkeleton width="250px" height="24px" />
          </div>
          <LoadingSkeleton width="160px" height="48px" />
        </div>
        <div className="bg-[var(--accent-white)] rounded-xl shadow-md p-8">
          <LoadingSkeleton width="180px" height="32px" className="mb-6" />
          <div className="flex flex-col gap-4">
            <LoadingSkeleton width="100%" height="24px" />
            <LoadingSkeleton width="100%" height="24px" />
            <LoadingSkeleton width="100%" height="24px" />
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Or a loading spinner
  }

  return (
    <div className="w-full max-w-5xl mx-auto py-12 px-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-10">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-[var(--primary-blue)] mb-2">Welcome to your Dashboard</h1>
          <p className="text-lg text-gray-700">Manage your AI voice agents and tools here.</p>
        </div>
        <button className="px-6 py-3 rounded-lg bg-[var(--primary-blue)] text-white font-bold shadow-md hover:bg-[var(--accent-teal)] hover:text-white transition text-lg mt-4 md:mt-0">
          + Create Agent
        </button>
      </div>
      <div className="bg-[var(--accent-white)] rounded-xl shadow-md p-8">
        <h2 className="text-2xl font-bold text-[var(--primary-blue)] mb-6">Your Agents</h2>
        {agents.length === 0 ? (
          <div className="text-gray-500 text-center py-12">
            <p className="text-lg">You haven&apos;t created any agents yet.</p>
            <p className="mt-2">Click &quot;Create Agent&quot; to get started!</p>
          </div>
        ) : (
          <ul>
            {/* Map agents here */}
          </ul>
        )}
      </div>
    </div>
  );
} 
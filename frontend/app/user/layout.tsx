"use client";
import '../globals.css';
import UserSidebar from '../components/UserSidebar';

export default function UserLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--background)] font-sans flex">
      <UserSidebar />
      <main className="flex-1 flex flex-col items-center justify-center min-h-[80vh] px-4">
        {children}
      </main>
    </div>
  );
} 
"use client";
import Link from "next/link";

export default function AdminWelcomePage() {
  return (
    <div className="flex flex-col items-center justify-center h-full py-20">
      <h1 className="text-4xl font-bold mb-4">Welcome to the Admin Dashboard</h1>
      <p className="mb-8 text-lg text-gray-600">Manage users, agents, and tools from the links below.</p>
      <div className="flex gap-6">
        <Link href="/admin/users" className="px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 transition">Users</Link>
        <Link href="/admin/agents" className="px-6 py-3 bg-green-600 text-white rounded hover:bg-green-700 transition">Agents</Link>
        <Link href="/admin/tools" className="px-6 py-3 bg-purple-600 text-white rounded hover:bg-purple-700 transition">Tools</Link>
      </div>
    </div>
  );
} 
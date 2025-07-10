import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';

const Sidebar = () => {
  const { logout } = useAuth();
  return (
    <aside className="w-64 bg-gray-800 text-white p-4">
      <h2 className="text-2xl font-bold mb-8">Admin</h2>
      <nav>
        <ul>
          <li className="mb-4">
            <Link href="/admin/users" className="block p-2 rounded hover:bg-gray-700">
              Users
            </Link>
          </li>
          <li className="mb-4">
            <Link href="/admin/agents" className="block p-2 rounded hover:bg-gray-700">
              Agents
            </Link>
          </li>
          <li className="mb-4">
            <Link href="/admin/tools" className="block p-2 rounded hover:bg-gray-700">
              Tools
            </Link>
          </li>
        </ul>
      </nav>
      <button
        onClick={logout}
        className="mt-8 w-full p-2 bg-red-600 rounded hover:bg-red-700 transition font-semibold"
      >
        Logout
      </button>
    </aside>
  );
};

export default Sidebar; 
import Link from 'next/link';

const Sidebar = () => {
  return (
    <aside className="w-64 bg-gray-800 text-white p-4">
      <h2 className="text-2xl font-bold mb-8">Admin</h2>
      <nav>
        <ul>
          <li className="mb-4">
            <Link href="/users" className="block p-2 rounded hover:bg-gray-700">
              Users
            </Link>
          </li>
          <li className="mb-4">
            <Link href="/agents" className="block p-2 rounded hover:bg-gray-700">
              Agents
            </Link>
          </li>
          <li className="mb-4">
            <Link href="/tools" className="block p-2 rounded hover:bg-gray-700">
              Tools
            </Link>
          </li>
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar; 
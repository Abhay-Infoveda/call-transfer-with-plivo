import Sidebar from './Sidebar';
import Header from './Header';

const MainLayout = ({ children, title }: { children: React.ReactNode, title: string }) => {
  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header title={title} />
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default MainLayout; 
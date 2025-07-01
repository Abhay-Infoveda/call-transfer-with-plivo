const Header = ({ title }: { title: string }) => {
  return (
    <header className="bg-white shadow-sm p-4">
      <h1 className="text-2xl font-semibold text-gray-800">{title}</h1>
    </header>
  );
};

export default Header; 
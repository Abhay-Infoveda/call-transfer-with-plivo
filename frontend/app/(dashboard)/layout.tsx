'use client';

import MainLayout from "@/app/components/MainLayout";
import withAuth from "@/app/components/withAuth";
import { usePathname } from "next/navigation";

const DashboardLayout = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const pathname = usePathname();
  
  const getTitle = () => {
    if (pathname.includes('/users')) return 'User Management';
    if (pathname.includes('/agents')) return 'Agent Management';
    if (pathname.includes('/tools')) return 'Tool Management';
    return 'Dashboard';
  }

  return (
    <MainLayout title={getTitle()}>
      {children}
    </MainLayout>
  );
}

export default withAuth(DashboardLayout); 
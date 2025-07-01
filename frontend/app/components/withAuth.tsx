'use client';

import { useAuth } from '@/app/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const withAuth = <P extends object>(Component: React.ComponentType<P>) => {
  const AuthComponent = (props: P) => {
    const { isAuthenticated, isLoading } = useAuth();
    const router = useRouter();
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
      setIsMounted(true);
    }, []);

    useEffect(() => {
      if (isMounted && !isLoading && !isAuthenticated) {
        router.push('/login');
      }
    }, [isAuthenticated, isLoading, isMounted, router]);

    if (isLoading || !isMounted) {
      // Render a static loader that matches on server and client
      return (
         <div className="flex justify-center items-center h-screen">
          <div>Loading...</div>
        </div>
      );
    }

    if (!isAuthenticated) {
      // This will be rendered briefly before the redirect kicks in
      return (
         <div className="flex justify-center items-center h-screen">
          <div>Redirecting to login...</div>
        </div>
      );
    }
    
    return <Component {...props} />;
  };
  return AuthComponent;
};

export default withAuth; 
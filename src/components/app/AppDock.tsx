
'use client';

import { VscGraph, VscCalendar, VscPackage, VscComment } from 'react-icons/vsc';
import { useRouter } from 'next/navigation';
import Dock from './Dock';
import { usePathname } from 'next/navigation';
import { useUser } from '@/firebase';

export default function AppDock() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isUserLoading } = useUser();

  const publicRoutes = ['/login', '/signup', '/', '/about', '/contact'];
  const isPublicRoute = publicRoutes.includes(pathname);

  if (isPublicRoute || !user || isUserLoading) {
    return null;
  }

  const items = [
    { icon: <VscGraph size={24} />, label: 'Dashboard', onClick: () => router.push('/dashboard') },
    { icon: <VscCalendar size={24} />, label: 'Monthly Report', onClick: () => router.push('/report') },
    { icon: <VscPackage size={24} />, label: 'Inventory', onClick: () => router.push('/inventory') },
    { icon: <VscComment size={24} />, label: 'Chat', onClick: () => router.push('/chat') },
  ];

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 md:hidden">
      <Dock 
        items={items}
        panelHeight={60}
        baseItemSize={44}
        magnification={20}
        className="backdrop-blur-md bg-background/70 border border-border rounded-full shadow-lg"
      />
    </div>
  );
}

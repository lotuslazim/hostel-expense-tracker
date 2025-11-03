
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
  const isChatPage = pathname === '/chat';

  if (isPublicRoute || !user || isUserLoading) {
    return null;
  }
    
  if(isChatPage) {
    return null;
  }

  const items = [
    { icon: <VscGraph size={24} />, label: 'Dashboard', onClick: () => router.push('/dashboard') },
    { icon: <VscCalendar size={24} />, label: 'Report', onClick: () => router.push('/report') },
    { icon: <VscPackage size={24} />, label: 'Inventory', onClick: () => router.push('/inventory') },
    { icon: <VscComment size={24} />, label: 'Chat', onClick: () => router.push('/chat') },
  ];

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
      <Dock 
        items={items}
        panelHeight={70}
        baseItemSize={60}
        magnification={20}
        className="backdrop-blur-md bg-black/50 border border-white/10 rounded-full shadow-lg text-white"
      />
    </div>
  );
}

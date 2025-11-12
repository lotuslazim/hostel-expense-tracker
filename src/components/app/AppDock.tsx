
'use client';

import { VscGraph, VscCalendar, VscPackage, VscComment } from 'react-icons/vsc';
import { useRouter } from 'next/navigation';
import Dock from './Dock';
import { usePathname } from 'next/navigation';
import { useUser, useDoc } from '@/firebase';
import { useUnreadMessages } from '@/hooks/useUnreadMessages';
import { useState, useEffect, useMemo } from 'react';
import { doc } from 'firebase/firestore';
import { firestore } from '@/firebase/config';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useIsMobile } from '@/hooks/use-mobile';

export default function AppDock() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isUserLoading } = useUser();
  const isMobile = useIsMobile();
  const [isVisible, setIsVisible] = useState(true);
  
  const userDocRef = useMemo(() => {
    if (!user) return null;
    return doc(firestore, 'users', user.uid);
  }, [user]);

  const { data: userData } = useDoc(userDocRef);
  const groupId = userData?.groupId;
  
  const { unreadCount } = useUnreadMessages(groupId, user?.uid);

  useEffect(() => {
    // On desktop, the dock is always visible
    if (!isMobile) {
      setIsVisible(true);
      return;
    }

    // On mobile, hide the dock after a delay, and show on scroll
    let scrollTimeout: NodeJS.Timeout | null = null;

    const handleScroll = () => {
      setIsVisible(true);
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
      }
      scrollTimeout = setTimeout(() => {
          setIsVisible(false);
        }, 3000);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // Initial hide timer
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
      }
    };
  }, [isMobile]);


  const publicRoutes = ['/login', '/signup', '/', '/about', '/contact'];
  const isPublicRoute = publicRoutes.includes(pathname);
  
  if (isPublicRoute || !user || isUserLoading || pathname === '/chat') {
    return null;
  }

  const items = [
    { href: '/dashboard', icon: <VscGraph size={28} />, label: 'Dashboard', onClick: () => router.push('/dashboard') },
    { href: '/report', icon: <VscCalendar size={28} />, label: 'Report', onClick: () => router.push('/report') },
    { href: '/inventory', icon: <VscPackage size={28} />, label: 'Inventory', onClick: () => router.push('/inventory') },
    { 
      href: '/chat',
      icon: (
        <div className="relative">
          <VscComment size={28} />
          {unreadCount > 0 && (
             <Badge className="absolute -top-1 -right-2 h-5 w-5 flex items-center justify-center rounded-full bg-destructive text-destructive-foreground p-0 text-xs">
              {unreadCount}
            </Badge>
          )}
        </div>
      ), 
      label: 'Chat', 
      onClick: () => router.push('/chat') 
    },
  ];
  
  const activeItem = items.find(item => pathname.startsWith(item.href));

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 block">
       <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <Dock 
              items={items}
              magnification={isMobile ? 0 : 24}
              className="yellow-gradient-bg text-primary-foreground border-none"
              activeHref={activeItem?.href}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

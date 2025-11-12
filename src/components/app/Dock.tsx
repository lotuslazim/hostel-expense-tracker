
'use client';

import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import React, { useRef, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';
import { useIsMobile } from '@/hooks/use-mobile';

type DockItemData = {
  href: string;
  icon: ReactNode;
  label?: string;
  onClick?: () => void;
};

type DockProps = {
  items: DockItemData[];
  magnification?: number;
  className?: string;
  activeHref?: string;
};

function DockItem({
  item,
  mouseX,
  baseItemSize,
  magnification,
  isActive,
}: {
  item: DockItemData;
  mouseX: any;
  baseItemSize: number;
  magnification: number;
  isActive: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  const distance = useTransform(mouseX, (val) => {
    const bounds = ref.current?.getBoundingClientRect();
    return bounds ? val - bounds.x - bounds.width / 2 : Infinity;
  });

  const widthSync = useTransform(
    distance,
    [-baseItemSize, 0, baseItemSize],
    [40, 40 + magnification, 40]
  );
  const width = useSpring(widthSync, {
    mass: 0.1,
    stiffness: 150,
    damping: 12,
  });

  const showLabel = isMobile ? isActive : true;

  return (
    <motion.div
      ref={ref}
      style={isMobile ? {} : { width }}
      onClick={item.onClick}
      className={cn(
        "flex items-center justify-center gap-2 px-3 py-2 cursor-pointer rounded-full transition-colors duration-200 ease-out",
        isActive ? 'bg-muted text-foreground' : 'hover:bg-muted/50'
      )}
      whileTap={{ scale: 0.95 }}
    >
      <motion.div 
        className="flex items-center justify-center w-7 h-7"
        style={!isMobile ? { scale: useSpring(useTransform(width, [40, 80], [1, 1.25])) } : {}}
      >
        {item.icon}
      </motion.div>
      {showLabel && (
          <motion.span 
            layout="position"
            className="text-sm font-medium whitespace-nowrap"
          >
            {item.label}
          </motion.span>
        )}
    </motion.div>
  );
}

export default function Dock({
  items,
  magnification = 24,
  className,
  activeHref,
}: DockProps) {
  const mouseX = useMotionValue(Infinity);
  const isMobile = useIsMobile();

  return (
    <motion.div
      onMouseMove={(e) => mouseX.set(e.pageX)}
      onMouseLeave={() => mouseX.set(Infinity)}
      className={cn(
        "flex items-end h-14 gap-2 p-2 rounded-full",
        className
      )}
    >
      {items.map((item) => (
        <DockItem
          key={item.href}
          item={item}
          mouseX={mouseX}
          baseItemSize={isMobile ? 0 : 120} // Disable magnification on mobile
          magnification={magnification}
          isActive={activeHref === item.href}
        />
      ))}
    </motion.div>
  );
}


'use client';

import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import React, { useRef, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';

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

  const distance = useTransform(mouseX, (val) => {
    const bounds = ref.current?.getBoundingClientRect();
    return bounds ? val - bounds.x - bounds.width / 2 : 0;
  });

  // Apply a subtle scale effect on hover instead of width change
  const scaleSync = useTransform(distance, [-100, 0, 100], [1, 1.15, 1]);
  const scale = useSpring(scaleSync, { mass: 0.1, stiffness: 150, damping: 12 });

  return (
    <motion.div
      ref={ref}
      style={{ scale }}
      onClick={item.onClick}
      className={cn(
        "flex items-center justify-center gap-2 px-4 py-2 cursor-pointer group rounded-full transition-colors duration-200 ease-out",
        isActive ? 'bg-primary-foreground/20' : 'hover:bg-primary-foreground/10'
      )}
      whileTap={{ scale: 0.95 }}
    >
      <div className="flex items-center justify-center w-6 h-6">
        {item.icon}
      </div>
      {item.label && (
          <span className="text-sm font-medium whitespace-nowrap">
            {item.label}
          </span>
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

  return (
    <motion.div
      onMouseMove={(e) => mouseX.set(e.pageX)}
      onMouseLeave={() => mouseX.set(Infinity)}
      className={cn(
        "flex items-end justify-center gap-2 p-2 rounded-full",
        className
      )}
    >
      {items.map((item) => (
        <DockItem
          key={item.href}
          item={item}
          mouseX={mouseX}
          baseItemSize={120} // Increased base size to accommodate text
          magnification={magnification}
          isActive={activeHref === item.href}
        />
      ))}
    </motion.div>
  );
}

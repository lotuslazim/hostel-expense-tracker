
'use client';

import { motion, useMotionValue, useSpring, useTransform, type MotionValue } from 'framer-motion';
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
  mouseX: MotionValue<number>;
  baseItemSize: number;
  magnification: number;
  isActive: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const distance = useTransform(mouseX, (val) => {
    const bounds = ref.current?.getBoundingClientRect();
    return bounds ? val - bounds.x - bounds.width / 2 : Infinity;
  });

  const widthSync = useTransform(
    distance,
    [-baseItemSize, 0, baseItemSize],
    [60, 60 + magnification, 60] // Adjusted base width
  );
  const width = useSpring(widthSync, {
    mass: 0.1,
    stiffness: 150,
    damping: 12,
  });

  return (
    <motion.div
      ref={ref}
      style={{ width }}
      onClick={item.onClick}
      className={cn(
        "flex flex-col items-center justify-center gap-1 pt-2 pb-1 cursor-pointer rounded-xl transition-colors duration-200 ease-out",
        isActive ? 'bg-black/10' : 'hover:bg-black/5'
      )}
      whileTap={{ scale: 0.95 }}
    >
      <motion.div 
        className="flex items-center justify-center w-7 h-7"
        style={{ scale: useSpring(useTransform(width, [60, 100], [1, 1.25])) }}
      >
        {item.icon}
      </motion.div>
      <span className={cn(
          "text-[10px] font-medium whitespace-nowrap transition-colors",
          isActive ? "text-white" : ""
        )}
      >
        {item.label}
      </span>
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
        "flex items-end h-16 gap-2 p-2 rounded-2xl",
        className
      )}
    >
      {items.map((item) => (
        <DockItem
          key={item.href}
          item={item}
          mouseX={mouseX}
          baseItemSize={120}
          magnification={magnification}
          isActive={activeHref === item.href}
        />
      ))}
    </motion.div>
  );
}

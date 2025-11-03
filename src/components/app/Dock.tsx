
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

  const widthSync = useTransform(distance, [-magnification, 0, magnification], [baseItemSize, baseItemSize + magnification, baseItemSize]);
  const width = useSpring(widthSync, { mass: 0.1, stiffness: 150, damping: 12 });

  return (
    <motion.div
      ref={ref}
      style={{ width }}
      onClick={item.onClick}
      className={cn(
        "flex flex-col items-center justify-center cursor-pointer group transition-transform duration-200 ease-out",
        isActive ? 'font-bold -translate-y-2' : 'hover:-translate-y-1'
      )}
      whileTap={{ scale: 0.9, y: 2 }}
    >
      <div className="flex items-center justify-center w-full h-full p-2 rounded-full">
        {item.icon}
      </div>
      {item.label && (
          <motion.span
            className="text-xs whitespace-nowrap block"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
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
  const baseItemSize = 56;
  const panelHeight = baseItemSize + magnification;

  return (
    <motion.div
      onMouseMove={(e) => mouseX.set(e.pageX)}
      onMouseLeave={() => mouseX.set(Infinity)}
      style={{ height: `${panelHeight}px` }}
      className={cn(
        "flex items-end justify-center gap-2 pb-2 px-4 rounded-full",
        className
      )}
    >
      {items.map((item) => (
        <DockItem
          key={item.href}
          item={item}
          mouseX={mouseX}
          baseItemSize={baseItemSize}
          magnification={magnification}
          isActive={activeHref === item.href}
        />
      ))}
    </motion.div>
  );
}

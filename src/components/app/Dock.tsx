
'use client';

import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import React, { useRef, ReactNode } from 'react';
import { cn } from '@/lib/utils';

type DockItemData = {
  icon: ReactNode;
  label?: string;
  onClick?: () => void;
};

type DockProps = {
  items: DockItemData[];
  panelHeight?: number;
  baseItemSize?: number;
  magnification?: number;
  className?: string;
};

function DockItem({
  item,
  mouseX,
  baseItemSize,
  magnification,
}: {
  item: DockItemData;
  mouseX: any;
  baseItemSize: number;
  magnification: number;
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
      className="flex flex-col items-center justify-center cursor-pointer text-center"
    >
      <div className="w-full h-full flex items-center justify-center relative">
        {item.icon}
      </div>
      {item.label && (
          <span
            className="text-xs opacity-80 group-hover:opacity-100 transition-opacity"
            style={{ marginTop: '4px' }}
          >
            {item.label}
          </span>
        )}
    </motion.div>
  );
}

export default function Dock({
  items,
  panelHeight = 80,
  baseItemSize = 56,
  magnification = 24,
  className,
}: DockProps) {
  const mouseX = useMotionValue(Infinity);

  return (
    <motion.div
      onMouseMove={(e) => mouseX.set(e.pageX)}
      onMouseLeave={() => mouseX.set(Infinity)}
      style={{ height: `${panelHeight}px` }}
      className={cn(
        "flex items-center justify-center gap-4 p-4",
        className
      )}
    >
      {items.map((item, index) => (
        <DockItem
          key={index}
          item={item}
          mouseX={mouseX}
          baseItemSize={baseItemSize}
          magnification={magnification}
        />
      ))}
    </motion.div>
  );
}

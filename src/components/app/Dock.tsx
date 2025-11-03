
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
      className="aspect-square flex items-center justify-center rounded-full cursor-pointer"
    >
      <div className="w-full h-full flex items-center justify-center relative">
        {item.icon}
        {item.label && (
          <motion.div
            className="absolute bottom-full mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded"
            initial={{ opacity: 0, y: 10 }}
            whileHover={{ opacity: 1, y: 0 }}
          >
            {item.label}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

export default function Dock({
  items,
  panelHeight = 68,
  baseItemSize = 40,
  magnification = 60,
  className,
}: DockProps) {
  const mouseX = useMotionValue(Infinity);

  return (
    <motion.div
      onMouseMove={(e) => mouseX.set(e.pageX)}
      onMouseLeave={() => mouseX.set(Infinity)}
      style={{ height: `${panelHeight}px` }}
      className={cn(
        'flex items-end justify-center gap-2 pb-2 px-4',
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

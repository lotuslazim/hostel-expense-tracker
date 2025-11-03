"use client";

import React, { useRef, useMemo, ElementType } from 'react';
import { useInView } from 'react-intersection-observer';
import { cn } from '@/lib/utils';

type SplitTextProps<T extends ElementType> = {
  as?: T;
  text: string;
  className?: string;
  initial?: React.CSSProperties;
} & Omit<React.ComponentPropsWithoutRef<T>, 'as'>;

export function SplitText<T extends ElementType = 'div'>({
  as,
  text,
  className,
  initial,
  ...props
}: SplitTextProps<T>) {
  const Component = as || 'div';
  const { ref } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const characters = useMemo(() => text.split('').map((char, index) => {
    // Replace space with a non-breaking space to maintain layout
    return char === ' ' ? '\u00A0' : char;
  }), [text]);

  return (
    <Component ref={ref} className={cn("flex justify-center", className)} {...props}>
      {characters.map((char, index) => (
        <span
          key={index}
          className="char"
          style={initial}
        >
          {char}
        </span>
      ))}
    </Component>
  );
}

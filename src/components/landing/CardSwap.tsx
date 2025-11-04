
"use client";

import React, { useState, useEffect, Children, isValidElement } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Individual Card component
export const Card = ({ children }: { children: React.ReactNode }) => {
    return <div className="card-swap-card">{children}</div>;
};


// CardSwap container component
interface CardSwapProps {
  children: React.ReactNode;
  cardDistance?: number;
  verticalDistance?: number;
  delay?: number;
  pauseOnHover?: boolean;
}

export const CardSwap: React.FC<CardSwapProps> = ({
  children,
  cardDistance = 60,
  verticalDistance = 70,
  delay = 5000,
  pauseOnHover = true,
}) => {
  const cards = Children.toArray(children).filter(isValidElement);
  const [index, setIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (pauseOnHover && isHovered) {
      return;
    }

    const interval = setInterval(() => {
      setIndex(prevIndex => (prevIndex + 1) % cards.length);
    }, delay);

    return () => clearInterval(interval);
  }, [cards.length, delay, isHovered, pauseOnHover]);

  const getStyle = (cardIndex: number) => {
    const relativeIndex = (cardIndex - index + cards.length) % cards.length;
    
    if (relativeIndex >= 3) { // Only show top 3 cards
        return { opacity: 0, y: verticalDistance, scale: 0.8, zIndex: 0 };
    }

    const y = -relativeIndex * verticalDistance;
    const scale = 1 - relativeIndex * 0.05;
    const zIndex = cards.length - relativeIndex;

    return {
      opacity: 1,
      y,
      scale,
      zIndex,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 30,
      },
    };
  };

  return (
    <div
      className="card-swap-container"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <AnimatePresence>
        {cards.map((card, i) => (
          <motion.div
            key={i}
            initial={getStyle(i)}
            animate={getStyle(i)}
            exit={{ opacity: 0, y: 100, scale: 0.8 }}
            className="card-swap-card"
          >
            {card}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

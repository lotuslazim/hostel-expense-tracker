
"use client";

import { useEffect, useRef, useState } from "react";
import { Logo } from "@/components/icons/logo";
import Link from "next/link";
import { cn } from "@/lib/utils";

const navItems = [
    { label: "Home", href: "/" },
    { label: "About", href: "/about" },
    { label: "Contact", href: "/contact" }
];

export function LandingHeader() {
  const navRef = useRef<HTMLDivElement>(null);
  const itemsRef = useRef<(HTMLLIElement | null)[]>([]);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [initialPositionSet, setInitialPositionSet] = useState(false);

  useEffect(() => {
    const navElement = navRef.current;
    if (!navElement) return;
    
    let anim: any = null;

    const animateIndicator = (from: number, to: number) => {
        if (anim) cancelAnimationFrame(anim);

        const start = Date.now();

        const step = () => {
            const elapsed = Date.now() - start;
            const progress = Math.min(elapsed / 400, 1); // 400ms duration
            const ease = 1 - Math.pow(1 - progress, 3); // Ease out cubic

            const currentX = from + (to - from) * ease;
            const y = -20 * Math.sin(progress * Math.PI); // Gentle bounce

            navElement.style.setProperty('--indicator-x', `${currentX}px`);
            navElement.style.setProperty('--indicator-y', `${y}px`);

            if (progress < 1) {
                anim = requestAnimationFrame(step);
            }
        };

        anim = requestAnimationFrame(step);
    };

    const getItemCenter = (item: HTMLLIElement) => {
      const navRect = navElement.getBoundingClientRect();
      const itemRect = item.getBoundingClientRect();
      return itemRect.left - navRect.left + itemRect.width / 2;
    };
    
    const handleMouseEnter = (index: number) => {
        const item = itemsRef.current[index];
        if (!item) return;

        const currentPos = parseFloat(navElement.style.getPropertyValue('--indicator-x')) || getItemCenter(item);
        const targetPos = getItemCenter(item);
        
        animateIndicator(currentPos, targetPos);
        navElement.classList.add("show-indicator");
    };

    const handleMouseLeave = () => {
      if (activeIndex !== null) {
          const activeItem = itemsRef.current[activeIndex];
          if(activeItem) {
            const currentPos = parseFloat(navElement.style.getPropertyValue('--indicator-x'));
            const targetPos = getItemCenter(activeItem);
            animateIndicator(currentPos, targetPos);
          }
      } else {
        navElement.classList.remove("show-indicator");
      }
    };
    
    const handleClick = (index: number) => {
        setActiveIndex(index);
        const item = itemsRef.current[index];
        if (item) {
             const currentPos = parseFloat(navElement.style.getPropertyValue('--indicator-x'));
             const targetPos = getItemCenter(item);
             animateIndicator(currentPos, targetPos);
        }
    };

    itemsRef.current.forEach((item, index) => {
        if (item) {
            item.addEventListener('mouseenter', () => handleMouseEnter(index));
            item.addEventListener('click', () => handleClick(index));
        }
    });
    
    navElement.addEventListener('mouseleave', handleMouseLeave);
    
    if(!initialPositionSet && itemsRef.current[0]) {
        const firstItemCenter = getItemCenter(itemsRef.current[0] as HTMLLIElement);
        navElement.style.setProperty('--indicator-x', `${firstItemCenter}px`);
        setInitialPositionSet(true);
    }
    
    return () => {
      if (anim) cancelAnimationFrame(anim);
       itemsRef.current.forEach((item, index) => {
        if (item) {
            item.removeEventListener('mouseenter', () => handleMouseEnter(index));
            item.removeEventListener('click', () => handleClick(index));
        }
      });
      if(navElement) {
        navElement.removeEventListener('mouseleave', handleMouseLeave);
      }
    };
  }, [activeIndex, initialPositionSet]);

  return (
    <nav ref={navRef} className="landing-nav group">
        <ul>
            {navItems.map((item, index) => (
                <li key={item.label} ref={(el) => (itemsRef.current[index] = el)}>
                    <Link
                        href={item.href}
                        className={cn(
                            "nav-link",
                            activeIndex === index && "active"
                        )}
                    >
                        {item.label}
                    </Link>
                </li>
            ))}
        </ul>
    </nav>
  );
}

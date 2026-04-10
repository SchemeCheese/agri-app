// src/components/home/BannerSlider.tsx
'use client'; 
import React, { useCallback } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import Fade from 'embla-carousel-fade';

export const BannerSlider = () => {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [Autoplay({ delay: 5000 }), Fade()]);
  
  const images = [
     'https://images.unsplash.com/photo-1688014456825-4f66cb015281?q=80&w=1740&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', 
     'https://images.unsplash.com/photo-1720105447193-583011440aaa?q=80&w=1748&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', 
     'https://images.unsplash.com/photo-1707971892483-707b0360f963?q=80&w=1740&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
     'https://images.unsplash.com/photo-1610348725531-843dff563e2c?q=80&w=1740&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
     'https://images.unsplash.com/photo-1545898073-346e42dc7357?q=80&w=1740&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
     'https://images.unsplash.com/photo-1464226184884-fa280b87c399?q=80&w=1740&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
     'https://images.unsplash.com/photo-1651346846962-713719196b8d?q=80&w=1740&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
     'https://images.unsplash.com/photo-1567547981970-2a44cc30cf66?q=80&w=1931&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
     'https://images.unsplash.com/photo-1538826051293-02b4da7acc5f?q=80&w=1760&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
     'https://images.unsplash.com/photo-1575218823251-f9d243b6f720?q=80&w=1740&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
     'https://images.unsplash.com/photo-1600618202813-ee7fca1fcc2b?q=80&w=1740&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
     'https://images.unsplash.com/photo-1654248568738-5f0c7c1cd1fa?q=80&w=1740&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'
  ];

  return (
    <div className="overflow-hidden relative h-[600px] sm:h-[720px]" ref={emblaRef}>
      <div className="flex h-full">
        {images.map((src, index) => (
          <div className="relative flex-[0_0_100%] h-full" key={index}>
            <img
              src={src}
              alt={`Banner Nông Sản ${index + 1}`}
              className="w-full h-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-black/30"></div>
          </div>
        ))}
      </div>
    </div>
  );
};
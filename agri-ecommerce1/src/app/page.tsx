// src/app/page.tsx
'use client';
import React, { useState, useEffect } from 'react';
import { Header } from '@/components/layouts/Header';
import { Footer } from '@/components/layouts/Footer';
import { BannerSlider } from '@/components/home/BannerSlider';
import { SearchBar } from '@/components/home/SearchBar';
import { ProductList } from '@/components/home/ProductList';
import { Gallery } from '@/components/home/Gallery';
import { Promotions } from '@/components/home/Promotions';
import { useTranslation } from '@/hooks/useTranslation';
import { TopSearches } from '@/components/home/TopSearches';
import { TopShops } from '@/components/home/TopShops';
import { DailySuggestions } from '@/components/home/DailySuggestions';
import { ChatWidget } from '@/components/home/ChatWidget';

const LOGO_LIGHT = '/logos/agri-connect-large-light.svg';
const LOGO_DARK = '/logos/agri-connect-large-dark.svg';

export default function HomePage() {
  const { t } = useTranslation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [logoSrc, setLogoSrc] = useState(LOGO_LIGHT);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      if (scrollPosition > 50) {
        setIsScrolled(true);
        setLogoSrc(LOGO_DARK);
      } else {
        setIsScrolled(false);
        setLogoSrc(LOGO_LIGHT);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="font-sans antialiased">
      <Header isScrolled={isScrolled} logoSrc={logoSrc} />

      <main>
        <section className="relative">
          <BannerSlider />
          <div className="absolute inset-x-0 bottom-10 sm:bottom-20 z-10 px-4">
            <SearchBar />
            <div className="text-center mt-6">
              <button className="bg-white/90 text-green-700 font-semibold px-8 py-3 rounded-full shadow-md hover:bg-white transition-colors text-sm uppercase tracking-wide">
                {t('explore')}
              </button>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-32"></div>
        </section>

        <TopSearches />

        <ProductList />

        <TopShops />

        <Promotions />

        < DailySuggestions />

        <Gallery />

        < ChatWidget />


      </main>

      <Footer />
    </div>
  );
};
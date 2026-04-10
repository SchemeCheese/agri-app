// src/hooks/useTranslation.ts
"use client";
import { useState } from "react";

// --- Định nghĩa kiểu dữ liệu cho translations ---
type TranslationContent = { [key: string]: string | TranslationContent }; // Cho phép nested objects
type NamespaceTranslations = { [namespace: string]: TranslationContent };
type TranslationsType = {
  [language: string]: NamespaceTranslations;
};

// --- Mock i18n Hook ---
export const useTranslation = (namespace = "common") => {
  // --- Sử dụng kiểu TranslationsType ---
  const translations: TranslationsType = {
    vi: {
      common: {
        search: "Tìm kiếm",
        product_placeholder: "Tìm kiếm nông sản...",
        filters: "Bộ lọc",
        category: "Danh mục",
        origin: "Nguồn gốc",
        season: "Mùa vụ",
        price_range: "Khoảng giá",
        apply_filters: "Áp dụng",
        all_categories: "Tất cả danh mục",
        all_origins: "Tất cả nguồn gốc",
        all_seasons: "Tất cả mùa vụ",
        min_price: "Giá thấp nhất",
        max_price: "Giá cao nhất",
        cart: "Giỏ hàng",
        login_register: "Đăng nhập / Đăng ký",
        home: "Trang chủ",
        products: "Sản phẩm",
        about: "Giới thiệu",
        contact: "Liên hệ",
        explore: "Khám phá ngay",
      },
    },
    en: {
      common: {
        search: "Search",
        product_placeholder: "Search for produce...",
        filters: "Filters",
        category: "Category",
        origin: "Origin",
        season: "Season",
        price_range: "Price Range",
        apply_filters: "Apply Filters",
        all_categories: "All Categories",
        all_origins: "All Origins",
        all_seasons: "All Seasons",
        min_price: "Min Price",
        max_price: "Max Price",
        cart: "Cart",
        login_register: "Login / Register",
        home: "Home",
        products: "Products",
        about: "About Us",
        contact: "Contact",
        explore: "Explore Now",
      },
    },
  };

  // --- Định nghĩa kiểu cho state ngôn ngữ ---
  const [language, setLanguage] = useState<"vi" | "en">("vi"); // Chỉ cho phép 'vi' hoặc 'en'

  // --- Sửa lỗi 'any' cho options và result ---
  const t = (
    key: string,
    options?: { replace?: Record<string, string | number> }
  ) => {
    const keys = key.split(".");
    // --- Ép kiểu result để TypeScript hiểu ---
    let result: string | TranslationContent | undefined =
      translations[language]?.[namespace];

    for (const k of keys) {
      if (typeof result === "object" && result !== null && k in result) {
        result = result[k];
      } else {
        return key; // Fallback
      }
    }

    if (typeof result === "string" && options?.replace) {
      Object.entries(options.replace).forEach(([placeholder, value]) => {
        result = (result as string).replace(
          `{{${placeholder}}}`,
          String(value)
        );
      });
    }

    // --- Đảm bảo trả về string hoặc key ---
    return typeof result === "string" ? result : key;
  };

  return { t, currentLanguage: language, changeLanguage: setLanguage };
};

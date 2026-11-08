import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Translation resources
const resources = {
    en: {
      translation: {
        "discover": "Discover the best products for you!",
        "shopNow": "Shop Now",
        "featuredProducts": "Featured Products",
        "chooseSubCategories": "Choose SubCategories, Then Press Search...",

        //Homepage
        "appName": "Buffallo Burger Restaurant",
        "searchButton": "Search",
        "searchBoxLabel": "Search Products",
        "newProducts": "New Products",
        "TopSellingProducts":"TOP SELLING",
        "searchResuls": "Search Results",
        "welcome": "Welcome",
        "guest": "Guest",

        //Header
        "orderByPhone": "Order",
        "login": "Sign In",
        "register": "Sign Up",
        "logout": "Logout",
        "emailto": "Email"

      },
    },
    ar: {
      translation: {
        "discover": "اكتشف أفضل المنتجات لك!",
        "shopNow": "تسوق الآن",
        "featuredProducts": "منتجات مميزة",
        "chooseSubCategories": "اختر الفئات الفرعية، ثم اضغط على البحث...",

        //Homepage
        "appName": "مطعم اللحم البقري",
        "searchButton": "بحث",
        "searchBoxLabel": "البحث عن منتجات",
        "newProducts": "منتجات جديدة",
        "TopSellingProducts": "الاكثر مبيعا",
        "searchResuls": "نتائج البحث",
        "welcome": "مرحبًا،",
        "guest": "ضيف",

        //Header
        "orderByPhone": "اطلب",
        "login": "تسجيل دخول",
        "register": "حساب جديد",
        "logout": "خروج",
        "emailto": "البريد"
      },
    },
};

i18n
  .use(LanguageDetector) // Automatically detects the user's language
  .use(initReactI18next) // Passes i18n instance to react-i18next
  .init({
    resources,
    fallbackLng: 'en', // Default language
    interpolation: {
      escapeValue: false, // React already escapes by default
    },
  });

export default i18n;
  
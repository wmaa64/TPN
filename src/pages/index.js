import React, {useState, useEffect} from "react";
import { NextSeo } from "next-seo";
import { useTranslation } from "react-i18next";
import Dashboard from "./dashboard";


const Home = () => {
  const { i18n } = useTranslation();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);

      useEffect(() => {
          setMounted(true);
      }, []);



    if (!mounted) return null; // 🔥 prevents hydration error

    const isRTL = i18n.language === "ar"; // true if Arabic

return (
<>
  <NextSeo
    title="Dermatology, Skin Care, and Laser Clinic "
    description="Great dermatology services for your skin health."
  />

  <Dashboard /> 
    
</>

);

};

export default Home;

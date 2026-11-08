// Header.js
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Flag from 'react-world-flags';
import { useStateContext } from "../../context/StateContext";
import { AiOutlineShopping } from "react-icons/ai";
import i18n from '../i18n';
import Link from "next/link";
import { useRouter } from 'next/router';

const Header = () => {
  const { t} = useTranslation();
  
  const { userInfo, setUserInfo, logoutUser } = useStateContext();
  
  const language = i18n.language;
  const router = useRouter();
  
  const [mounted, setMounted] = useState(false);
  
  //const [language, setLanguage] = useState('en');

  useEffect(() => {
        setMounted(true);
    }, []);

  useEffect(() => {
    // Load userInfo from localStorage if available
    const storedUserInfo = localStorage.getItem('userInfo');
    storedUserInfo ? setUserInfo(JSON.parse(storedUserInfo)) : setUserInfo(null);
  }, []);

  if (!mounted) return null; // 🔥 prevents hydration error

  const isRTL = i18n.language === "ar"; // true if Arabic

  
  const toggleLanguage = () => {
    const next = language === 'en' ? 'ar' : 'en';
    i18n.changeLanguage(next);
    
    // optional: save preference
    localStorage.setItem('lang', next);
  };

  return (
    <div className='headerContainerStyle' dir={isRTL ? "rtl" : "ltr"} >
      
      {/* Left: language toggle */}
      <div className='leftStyle'>
        <button className="langButtonStyle"
          type="button"
          onClick={toggleLanguage}
          aria-label="Toggle language"
          title={language === 'en' ? 'Switch to Arabic' : 'Switch to English'}

        >
          {language === 'en' ? (
            <div  className='flagwrapper'>
              <Flag code="EG" className='flag' />
              <span >AR</span>
            </div>
          ) : (
            <div className='flagwrapper'>
              <Flag code="US" className='flag' />
              <span >EN</span>
            </div>
          )}
        </button>
      </div>

      {/* Center: logo */}
      <div className='centerStyle'>
        
          <img className='logoStyle'
            src="/images/TpnLogo.png"
            alt="Tpn logo"
            width={200}
            height={100}
          />
        
      </div>

      
      {/* Right: user welcome */}
      <div className='rightStyle'>  

        <div  className='sign-wrapper'>

          {userInfo ? (
              <button onClick={logoutUser} >
                  {t("logout")}
              </button>
          ) : (
              <div>
                  <Link href="/login">
                      <button >{t("login")}</button>
                  </Link>
                  <span> - </span>
                  <Link href="/users/register">
                      <button >{t("register")}</button>
                  </Link>
              </div>
          )}
          
          {userInfo ? (
              <div className="user-info" >
                  <span>{t("welcome") + "  "}</span>
                  <strong>{userInfo.FullName}</strong>
              </div>
          ) : (
              <div className="user-info">{t("guest")}</div>
          )}

        </div>

      </div>
    </div>
  );
};

export default Header;

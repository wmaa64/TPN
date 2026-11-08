import React, {useState, useEffect} from "react";
import Link from "next/link";
import { useStateContext } from "../../../context/StateContext";
import { AiFillInstagram, AiOutlineTwitter, AiFillFacebook, AiOutlineWhatsApp } from "react-icons/ai";
import { useTranslation } from "react-i18next";


const Footer = () => {
    const { i18n } = useTranslation();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null; // 🔥 prevents hydration error

    const isRTL = i18n.language === "ar"; // true if Arabic

  return (
    <>
        <div className="footerContainer" dir={isRTL ? "rtl" : "ltr"} >
            <div className="footerContent">
                <div>
                    {/*}
                    <Link href="/delivery">{isRTL? "التوصيل" : "Delivery"}</Link>
                    <Link href="/privacy">{isRTL? "الخصوصية" : "Privacy"}</Link>
                    <Link href="/terms">{isRTL? "شروط وقواعد البيع" : "Terms and Conditions of Sale"}</Link>*/}
                    <Link href="/contact">{isRTL? "التواصل معنا" : "Contact Us"}</Link>
                </div>
                <div>{isRTL?  "التواصل wmaa64@yahoo.com: " : "Contact: wmaa64@yahoo.com"}</div>
            </div>
                
            <div className="iconContainer">
                
                <div className="icons">
                    <a href="https://www.facebook.com/InformationSystemForLaserClinic/" target="_blank" rel="noopener noreferrer">
                        <AiFillFacebook    color="#1877F2" className="social-media-icon" /> {/* Facebook */}
                    </a>
                    <a href="https://wa.me/201001452251" target="_blank" rel="noopener noreferrer">
                        <AiOutlineWhatsApp color="#25D366" className="social-media-icon" /> {/* WhatsApp */}
                    </a>
                </div>
            </div>
        </div>
        <p className="copyright">{isRTL? "2006 جميع الحقوق محفوظة لـ EgSoftPro " : "2026 EgSoftPro All rights reserved"}</p>

    </>
  );
};

export default Footer;

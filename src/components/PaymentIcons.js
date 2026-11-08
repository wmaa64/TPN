import React, {useState, useEffect} from "react";
import Image from "next/image";
import { useTranslation } from "react-i18next";

const PaymentIcons = () => {
    const { i18n } = useTranslation();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null; // 🔥 prevents hydration error

    const isRTL = i18n.language === "ar"; // true if Arabic

  return (
    <div className="payment-icons">
      <span className="visually-hidden">{isRTL? "طرق الدفع" : "Payment Methods" }</span>
      <ul className="payment-icons list--inline site-footer__icon-list">
        <li className="payment-icon ">
          <span style={{ color: "#caa34d" }} >{isRTL? "انستابى: " : "Instapay: " }</span>
          <Image
            src="/images/instapay.jpg"   // put the logo in public folder
            alt="Instapay"
            width={24}
            height={24}
          />
          <span style={{ color: "#caa34d" }} > +2 01005126629</span>
        </li>
        <li className="payment-icon">
          <span style={{ color: "#caa34d" }} >{isRTL? "فودافون كاش: " : "Vodafone Cash: " }</span>
          <Image
            src="/images/VodafoneCash.jpg"   // put the logo in public folder
            alt="VodafoneCash"
            width={40}
            height={40}
          />
          <span style={{ color: "#caa34d" }} > +2 01005126629</span>

        </li>
        <li className="payment-icon">
          <span style={{ color: "blueviolet" }} >{isRTL? "عند الاستلام" : "On Delivery" }</span>
        </li>
      </ul>
    </div>
  );
};

export default PaymentIcons;
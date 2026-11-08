import { React, useEffect, useState } from "react";
import Head from "next/head";
import Header from "../components/Header"
import NavBar  from "./NavBar";
import Footer from "./Footer/Footer";
import { useTranslation } from "react-i18next";

import { useStateContext } from "../../context/StateContext";
import { useRouter } from "next/router"


const Layout = ({ children }) => {
    const { i18n } = useTranslation();
    const [mounted, setMounted] = useState(false);
 
    const { userInfo } = useStateContext();

    const router = useRouter();

    // Use optional chaining (?) to prevent crashing, and double-check
    const isRTL = i18n?.language?.startsWith("ar") || false; 

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!userInfo) {
            router.push("/");
        }
    }, [userInfo]);

    // The language detector reads browser preferences, which are unavailable
    // during SSR. Wait until hydration completes before rendering language-
    // dependent layout components (header, navigation, and page content).
    if (!mounted) return null;

    
return (
    <>
        <Head>
            <meta charSet="UTF-8" />
            <meta name="viewport" content="width=device-width" />
            <link rel="apple-touch-icon" sizes="180x180" href="/favicon/apple-touch-icon.png" />
            <link rel="icon" type="image/png" sizes="32x32" href="/favicon/favicon-32x32.png" />
            <link rel="icon" type="image/png" sizes="16x16" href="/favicon/favicon-16x16.png" />
            <link rel="manifest" href="/site.webmanifest" />
            <link rel="mask-icon" href="/favicon/safari-pinned-tab.svg" color="#5bbad5" />
            <meta name="msapplication-TileColor" content="#da532c" />
            <meta name="theme-color" content="#ffffff" />
            <meta name="next-head-count" content="10" />
        </Head>

        <div className="stick-area" >
            <Header />
        </div>

        <div className="app-layout" dir={isRTL ? "rtl" : "ltr"}>

            <aside className="app-navbar" >
                <NavBar />
            </aside>

            <div className="app-content" >

                <main className="main-container">
                    {children}
                </main>

                <footer>
                    <Footer />
                </footer>

            </div>

        </div>

    </>
);

};

export default Layout;

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useStateContext } from "../../context/StateContext";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/router";
import {
    LayoutDashboard,
    Users,
    CalendarDays,
    Stethoscope,
    Gift,
    Package,
    Wallet,
    BarChart3,
    Settings,
    UserCog,
    BriefcaseBusiness,
    Tags,
    Wrench,
    Percent,
    Monitor,
    MapPinned,
    ScanLine,
    ClipboardList,
    CreditCard,
    Building,
} from "lucide-react";

const NavBar = () => {

    const { t } = useTranslation();
    const { userInfo } = useStateContext();

    const [subcategories, setSubcategories] = useState([]);
    const [loading, setLoading] = useState(true);

    const { i18n } = useTranslation();

    const [search, setSearch] = useState("");
    const [open, setOpen] = useState(false);
    const [mounted, setMounted] = useState(false);

    // =====================================================
    // OPEN / CLOSED MENUS
    // =====================================================

    const [openMenus, setOpenMenus] = useState({});

    const router = useRouter();


    // =====================================================
    // MOUNTED
    // =====================================================

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;


    // =====================================================
    // LANGUAGE
    // =====================================================

    const isRTL = i18n.language === "ar";


    // =====================================================
    // GENERIC MENU TOGGLE
    // =====================================================

    const toggleMenu = (menuName) => {

        setOpenMenus((prev) => ({
            ...prev,
            [menuName]: !prev[menuName],
        }));

    };


    // =====================================================
    // NAVBAR MENU CONFIGURATION
    // =====================================================

    const menuItems = [

        // -------------------------------------------------
        // DASHBOARD
        // -------------------------------------------------

        {
            type: "link",
            name: "dashboard",
            href: "/dashboard",
            labelEn: "DashBoard",
            labelAr: "لوحة المعلومات",
            icon: LayoutDashboard,
            roleIDs: [1,2,3,5, 9, 10, 11],
        },


        // -------------------------------------------------
        // PRESCRIBE ORDER
        // -------------------------------------------------

        {
            type: "link",
            name: "prescribeOrder",
            href: "/prescribeOrder",
            labelEn: "Prescribe Order",
            labelAr: "طلب وصفة",
            icon: CalendarDays,
            roleIDs: [1,2, 5, 10, 11],
        },

        // -------------------------------------------------
        // QUERIES
        // -------------------------------------------------

        {
            type: "menu",
            name: "queries",
            labelEn: "Queries",
            labelAr: "الاستعلامات",
            icon: BarChart3,
            roleIDs: [1,2,5,9, 10, 11],

            children: [
                {
                    href: "/revenue",
                    labelEn: "Revenue for Period",
                    labelAr: "إيرادات عن فترة",
                    icon: BarChart3,
                    roleIDs: [1,9, 10, 11],
                },

                {
                    href: "/doctorRevenue",
                    labelEn: "Doctor Revenue",
                    labelAr: "إيرادات الطبيب",
                    icon: Percent,
                    roleIDs: [1,9, 10, 11],
                },

            ]
        },


        // =================================================
        // SETTINGS
        // =================================================

        {
            type: "menu",
            name: "settings",
            labelEn: "Settings",
            labelAr: "الاعدادات",
            icon: Settings,
            roleIDs: [1],

            children: [

                {
                    href: "/roles",
                    labelEn: "Roles",
                    labelAr: "الوظائف",
                    icon: BriefcaseBusiness,
                    roleIDs: [1],
                },

                {
                    href: "/users",
                    labelEn: "Users",
                    labelAr: "المستخدمين",
                    icon: UserCog,
                    roleIDs: [1, 5],
                },

                            {
                    href: "/companies",
                    labelEn: "Companies",
                    labelAr: "الشركات",
                    icon: Building,
                    roleIDs: [1, 5],
                },


            ],
        },

    ];


    // =====================================================
    // RENDER
    // =====================================================

    return (

        <div className="navbar-container" dir={isRTL ? "rtl" : "ltr"}>

            <h4>{isRTL ? "مركز التغذية الوريدية الكاملة" : "Total Parenteral Nutrition Center"}</h4>

            {userInfo && (
                
                <div className="subcategory-menu">

                    {menuItems.map((item) => {

                        const isAllowed = item.roleIDs.includes(Number(userInfo?.RoleID));
                        
                        // NORMAL LINK  =====================================
                        if (item.type === "link") {
                            return (
                                <Link key={item.name} href={isAllowed ? item.href : "#"} 
                                    className={`subcategory-link ${!isAllowed ? "disabled" : ""}`}
                                >
                                    {item.icon && <item.icon size={18} strokeWidth={2} className="linkicon" />}
                                    <span>{isRTL ? item.labelAr : item.labelEn}</span>
                                </Link>
                            );
                        }

                        // MENU WITH CHILDREN  =====================================
                        if (item.type === "menu") {

                            const isOpen =  !!openMenus[item.name];

                            return (

                                <React.Fragment   key={item.name}  >

                                    {/* PARENT BUTTON  --------------------------------- */}
                                    <button type="button" className="subcategory-link"
                                        onClick={() => toggleMenu(item.name)}
                                    >
                                        <span className="menu-label">
                                            {item.icon && <item.icon size={18} strokeWidth={2} className="linkicon" />}
                                            <span>{isRTL ? item.labelAr : item.labelEn }</span>
                                        </span>
                                        <span className="menu-arrow">{isOpen ? "▲"  : "▼" }</span>

                                    </button>

                                    {/* CHILDREN  --------------------------------- */}
                                    {isOpen && (

                                        <div className="menu-submenu">

                                            {item.children.map((child) => {
                                                
                                                const isAllowed = child.roleIDs.includes(Number(userInfo?.RoleID));

                                                return (
                                                    <Link  key={child.href}  href={isAllowed ? child.href : "#"}
                                                        className={`subcategory-link ${!isAllowed ? "disabled" : ""}`} 
                                                    >
                                                        {child.icon && <child.icon size={17} strokeWidth={2} 
                                                            className="linkicon" />}
                                                        <span>{isRTL ? child.labelAr : child.labelEn}</span>
                                                    </Link>
                                                )}
                                            )}

                                        </div>

                                    )}

                                </React.Fragment>

                            );

                        }

                        return null;

                    })}

                </div>
            )}

        </div>

    );

};

export default NavBar;






/*
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useStateContext } from "../../context/StateContext";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/router";

const NavBar = () => {
    const { t } = useTranslation();
    const { userInfo } = useStateContext();
    const [subcategories, setSubcategories] = useState([]);
    const [loading, setLoading] = useState(true);

    const { i18n } = useTranslation();
    const [search, setSearch] = useState("");
    const [open, setOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const router = useRouter();
    
    const [openMenus, setOpenMenus] = useState({});


    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null; // 🔥 prevents hydration error

    const isRTL = i18n.language === "ar"; // true if Arabic


const handleSearch = (e) => {
    e.preventDefault();

    if (!search.trim()) return;

    router.push(`/search?q=${encodeURIComponent(search)}`);
};

const toggleMenu = (menuName) => {

    setOpenMenus((prev) => ({
        ...prev,
        [menuName]: !prev[menuName],
    }));

};
  
return (

<div className="navbar-container"  dir={isRTL ? "rtl" : "ltr"}>
    
    <h5>{isRTL ? "عيادة الجلدية" : "Dermatology Clinic" }</h5>

    <div className="subcategory-menu">
        <Link key="1" href="/patients" className="subcategory-link" >
            {isRTL ? "المرضى" : "Patients" }
        </Link>
        <Link key="2" href="/patients" className="subcategory-link" >
            {isRTL ? "الجلسات" : "Sessions" }
        </Link>
        <Link key="3" href="/patients" className="subcategory-link" >
            {isRTL ? "الحسابات" : "Accounts" }
        </Link>
        <Link key="4" href="/patients" className="subcategory-link" >
            {isRTL ? "الحجوزات" : "Appointments" }
        </Link>
        <Link key="5" href="/patients" className="subcategory-link" >
            {isRTL ? "الحجز السريع" : "Fast Appointements" }
        </Link>
        <Link key="6" href="/patients" className="subcategory-link" >
            {isRTL ? "الاستعلامات" : "Queries" }
        </Link>
        
        
        <button type="button" className="subcategory-link"
            onClick={() => toggleMenu("settings")}
        >
            <span>{isRTL ? "الاعدادات" : "Settings" }</span>
            <span className="menu-arrow">{openMenus.settings ? "▲" : "▼"  }</span>
        </button>


        

            {openMenus.settings && (
                <div className="menu-submenu" >

                    
                    <Link  href="/roles" className="menu-submenu-link"  >
                        {isRTL ? "الوظائف" : "Roles" }
                    </Link>

                    
                    <Link href="/users"   className="menu-submenu-link"  >
                        {isRTL  ? "المستخدمين"  : "Users" }
                    </Link>

                </div>)}

    </div>

</div>

);

}
export default NavBar;
*/

import { useEffect, useState } from "react";
import { useLocation, NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FiBarChart2, FiBookOpen, FiCalendar, FiHelpCircle, FiHome, FiInfo, FiLogIn, FiMap, FiMenu, FiX } from "react-icons/fi";
import Header from "./Header";
import Footer from "./Footer";
import "./Layout.css";

const sidebarItems = [
    { path: "/", label: "navigation.home", icon: FiHome, end: true },
    { path: "/dashboard", label: "navigation.dashboard", icon: FiBarChart2, end: true },
    { path: "/advance-booking", label: "header.advanceBooking", icon: FiCalendar },
    { path: "/our-nurseries", label: "dashboard.nurseriesAcrossNation", icon: FiMap },
    { path: "/documentation", label: "header.userGuides", icon: FiBookOpen },
    { path: "/about-us", label: "header.aboutUs", icon: FiInfo },
    { path: "/faqs", label: "header.faqs", icon: FiHelpCircle },
    { path: "/login/national", label: "navigation.login", icon: FiLogIn },
];

function Layout({ children }) {
    const { pathname } = useLocation();
    const { t } = useTranslation();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const isHome = pathname === "/";

    useEffect(() => {
        setSidebarOpen(false);
    }, [pathname]);

    useEffect(() => {
        if (!sidebarOpen) return undefined;

        const closeOnEscape = (event) => {
            if (event.key === "Escape") setSidebarOpen(false);
        };

        document.addEventListener("keydown", closeOnEscape);
        return () => document.removeEventListener("keydown", closeOnEscape);
    }, [sidebarOpen]);

    return (
        <>
            <Header />
            {isHome ? (
                <main id="main-content" tabIndex="-1">{children}</main>
            ) : (
                <div className={`app-shell${sidebarOpen ? " app-shell--sidebar-open" : ""}`}>
                    {sidebarOpen && (
                        <button
                            type="button"
                            className="app-shell__backdrop"
                            aria-label={t("accessibility.closeSidebar")}
                            onClick={() => setSidebarOpen(false)}
                        />
                    )}
                    <aside
                        id="app-sidebar"
                        className={`app-sidebar${sidebarOpen ? " app-sidebar--open" : ""}`}
                        aria-label={t("accessibility.dashboardSidebar")}
                        aria-hidden={!sidebarOpen}
                    >
                        <div className="app-sidebar__brand">
                            <span className="app-sidebar__brand-icon" aria-hidden="true">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.4 19 2c1 2 2 4.1 2 9 0 4.97-4.03 9-9 9z" />
                                    <path d="M12 20v-8" />
                                </svg>
                            </span>
                            <span>
                                <strong>{t("dashboard.smartForestry")}</strong>
                                <small>हरित-SANKALP</small>
                            </span>
                            <button
                                type="button"
                                className="app-sidebar__close"
                                aria-label={t("accessibility.closeSidebar")}
                                onClick={() => setSidebarOpen(false)}
                            >
                                <FiX aria-hidden="true" />
                            </button>
                        </div>
                        <nav className="app-sidebar__nav" aria-label={t("accessibility.dashboardSidebar")}>
                            {sidebarItems.map(({ path, label, icon: Icon, end }) => (
                                <NavLink
                                    key={path}
                                    to={path}
                                    end={end}
                                    className={({ isActive }) => {
                                        const selected = isActive || (path === "/login/national" && pathname.startsWith("/login/"));
                                        return `app-sidebar__link${selected ? " is-active" : ""}`;
                                    }}
                                    onClick={() => setSidebarOpen(false)}
                                >
                                    <Icon aria-hidden="true" />
                                    <span>{t(label)}</span>
                                </NavLink>
                            ))}
                        </nav>
                    </aside>
                    <div className="app-shell__content">
                        <div className="app-shell__toolbar">
                            <button
                                type="button"
                                className="app-shell__toggle"
                                aria-controls="app-sidebar"
                                aria-expanded={sidebarOpen}
                                aria-label={sidebarOpen ? t("accessibility.closeSidebar") : t("accessibility.openSidebar")}
                                onClick={() => setSidebarOpen((isOpen) => !isOpen)}
                            >
                                {sidebarOpen ? <FiX aria-hidden="true" /> : <FiMenu aria-hidden="true" />}
                                <span className="app-shell__toggle-tooltip">
                                    {sidebarOpen ? t("accessibility.closeSidebar") : t("accessibility.openSidebar")}
                                </span>
                            </button>
                        </div>
                        <main id="main-content" tabIndex="-1">{children}</main>
                    </div>
                </div>
            )}
            <Footer />
        </>
    );
}

export default Layout;
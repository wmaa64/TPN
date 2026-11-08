import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/router";
import { toast } from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { useStateContext } from "../../context/StateContext";


const Dashboard = () => {

    const { i18n } = useTranslation();
    const router = useRouter();

    const {
        userInfo,
        logoutUser,
        loadingUser
    } = useStateContext();


    const [loading, setLoading] = useState(true);

    const [dashboardData, setDashboardData] = useState({
        summary: {
            ordersToday: 0,
            centerOrdersToday: 0,
            externalOrdersToday: 0,
            externalHospitalsToday: 0,
            totalVolumeToday: 0,
        },
        todayOrders: [],
        hospitalDemand: [],
    });

    const isRTL = i18n.language === "ar"; // true if Arabic

    // =====================================================
    // CHECK LOGIN
    // =====================================================

    useEffect(() => {

        if (loadingUser) {
            return;
        }

        
        if (!userInfo) {
            router.replace("/login");
            return;
        }
        

    }, [loadingUser, userInfo, router]);


    // =====================================================
    // LOAD DASHBOARD DATA
    // =====================================================

    const loadDashboard = useCallback(async () => {
        try {
            setLoading(true);

            const response = await fetch("/api/dashboard");

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Failed to load dashboard data."
                );
            }

            setDashboardData({
                summary: {
                    ordersToday: Number(data.summary?.ordersToday || 0),
                    centerOrdersToday: Number(data.summary?.centerOrdersToday || 0),
                    externalOrdersToday: Number(data.summary?.externalOrdersToday || 0),
                    externalHospitalsToday: Number(data.summary?.externalHospitalsToday || 0),
                    totalVolumeToday: Number(data.summary?.totalVolumeToday || 0),
                },
                todayOrders: Array.isArray(data.todayOrders) ? data.todayOrders : [],
                hospitalDemand: Array.isArray(data.hospitalDemand) ? data.hospitalDemand : [],
            });
        } catch (error) {
            console.error("Error loading dashboard:", error);

            toast.error(
                error.message || "Unable to load dashboard"
            );
        } finally {
            setLoading(false);
        }
    }, []);

    // =====================================================
    // LOAD DASHBOARD DATA
    // =====================================================

    useEffect(() => {
        if (loadingUser || !userInfo) return;
        loadDashboard();
    }, [loadingUser, userInfo, loadDashboard]);

    // =====================================================
    // WAIT FOR USER
    // =====================================================

    if (loadingUser || !userInfo) {

        return (
            <div className="dashboard-loading">
                Loading ClinicPro...
            </div>
        );
    }


    // =====================================================
    // DASHBOARD PAGE RENDER
    // =====================================================

    return (

        <div className="dashboard-page">


            {/* =================================================
                HEADER
               ================================================= */}

            <div className="dashboard-header">

                <div>
                    <h1>{isRTL ? "لوحة مركز التغذية الوريدية" : "Parenteral Center Dashboard"}</h1>
                    <p>{isRTL ? "نظرة يومية على طلبات التحضير للمركز والمستشفيات الخارجية" : "Daily preparation demand for the center and external hospitals."}</p>
                </div>


                <div className="dashboard-user">

                    <div className="dashboard-user-info">

                        <span className="dashboard-user-name">
                            {userInfo.FullName}
                        </span>

                        <span className="dashboard-user-role">{isRTL ? "طاقم مركز التحضير" : "Preparation center team"}</span>

                    </div>


                    <button
                        className="dashboard-logout"
                        onClick={() => {

                            logoutUser();

                            router.replace("/login");

                        }}
                    >
                        {isRTL ? "تسجيل الخروج" : "Logout"}
                    </button>

                </div>

            </div>


            {/* =================================================
                STATISTICS
               ================================================= */}

            <div className="dashboard-stats">
                <div className="dashboard-stat-card">
                    <div className="stat-icon">📄</div>
                    <div><span className="stat-title">{isRTL ? "الطلبات اليوم" : "Orders received today"}</span><strong className="stat-value">{dashboardData.summary.ordersToday}</strong></div>
                </div>
                <div className="dashboard-stat-card">
                    <div className="stat-icon">🏥</div>
                    <div><span className="stat-title">{isRTL ? "طلبات المستشفى المركزي" : "Center hospital orders"}</span><strong className="stat-value">{dashboardData.summary.centerOrdersToday}</strong></div>
                </div>
                <div className="dashboard-stat-card">
                    <div className="stat-icon">🌐</div>
                    <div><span className="stat-title">{isRTL ? "طلبات المستشفيات الخارجية" : "External hospital orders"}</span><strong className="stat-value">{dashboardData.summary.externalOrdersToday}</strong></div>
                </div>
                <div className="dashboard-stat-card">
                    <div className="stat-icon">🏨</div>
                    <div><span className="stat-title">{isRTL ? "المستشفيات المخدومة اليوم" : "External hospitals served"}</span><strong className="stat-value">{dashboardData.summary.externalHospitalsToday}</strong></div>
                </div>
                <div className="dashboard-stat-card">
                    <div className="stat-icon">🧪</div>
                    <div><span className="stat-title">{isRTL ? "الحجم المحسوب للتحضير" : "Calculated preparation volume"}</span><strong className="stat-value">{Number(dashboardData.summary.totalVolumeToday).toLocaleString(isRTL ? "ar-EG" : "en-US", { maximumFractionDigits: 2 })} ml</strong></div>
                </div>

            </div>

            {/* =================================================
                QUICK ACTIONS
               ================================================= */}

            <div className="dashboard-section">

                <div className="dashboard-section-title">
                    <h2>{isRTL ? "الإجراءات السريعة" : "Quick Actions"}</h2>
                </div>


                <div className="quick-actions">
                    <button onClick={() => router.push("/prescribeOrder")} className="quick-action">
                        <span className="quick-action-icon">🧪</span>
                        <span>{isRTL ? "طلبات الوصفات" : "Prescribe orders"}</span>
                    </button>
                    <button onClick={() => router.push("/patients")} className="quick-action">
                        <span className="quick-action-icon">👤</span>
                        <span>{isRTL ? "سجلات المرضى" : "Patient records"}</span>
                    </button>
                    <button onClick={loadDashboard} className="quick-action" disabled={loading}>
                        <span className="quick-action-icon">↻</span>
                        <span>{loading ? (isRTL ? "جارٍ التحديث…" : "Refreshing…") : (isRTL ? "تحديث بيانات العمل" : "Refresh work overview")}</span>
                    </button>

                </div>

            </div>

            {/* =================================================
                MAIN CONTENT
               ================================================= */}

            <div className="dashboard-columns">
                <div className="dashboard-panel">
                    <div className="panel-header">
                        <h2>{isRTL ? "طلبات التحضير اليوم" : "Today's preparation requests"}</h2>
                        <button onClick={() => router.push("/prescribeOrder")}>{isRTL ? "كل الطلبات" : "Open order desk"}</button>
                    </div>
                    {loading ? <div className="dashboard-empty">{isRTL ? "جارٍ تحميل الطلبات…" : "Loading requests…"}</div>
                    : dashboardData.todayOrders.length === 0 ? (
                        <div className="dashboard-empty">
                            <div className="empty-icon">🧪</div>
                            <p>{isRTL ? "لا توجد طلبات تحضير اليوم" : "No preparation requests today"}</p>
                        </div>
                    ) : (
                        <div className="dashboard-work-list">
                            {dashboardData.todayOrders.map((order) => (
                                <div className="dashboard-work-order" key={order.PRESCRIBE_ORDER_ID}>
                                    <div className="dashboard-work-order-main">
                                        <strong>{order.PES_NAME}</strong>
                                        <span>{order.HospitalName} · {isRTL ? "الوزن" : "Weight"}: {order.PES_WEIGHT} kg</span>
                                    </div>
                                    <div className="dashboard-work-order-meta">
                                        <strong>#{order.REQUEST_NO || order.PRESCRIBE_ORDER_ID}</strong>
                                        <span>{Number(order.VolumeToPrepare || 0).toLocaleString(isRTL ? "ar-EG" : "en-US", { maximumFractionDigits: 2 })} ml</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="dashboard-panel">
                    <div className="panel-header">
                        <h2>{isRTL ? "طلبات المستشفيات الخارجية" : "External hospital demand"}</h2>
                        <span className="dashboard-panel-caption">{isRTL ? "اليوم" : "Today"}</span>
                    </div>
                    {loading ? <div className="dashboard-empty">{isRTL ? "جارٍ تحميل الطلبات…" : "Loading demand…"}</div>
                    : dashboardData.hospitalDemand.length === 0 ? (
                        <div className="dashboard-empty">
                            <div className="empty-icon">🏥</div>
                            <p>{isRTL ? "لا توجد طلبات من مستشفيات خارجية اليوم" : "No external hospital requests today"}</p>
                        </div>
                    ) : (
                        <div className="dashboard-demand-list">
                            {dashboardData.hospitalDemand.map((hospital) => (
                                <div className="dashboard-demand-row" key={hospital.COMP_CODE || hospital.HospitalName}>
                                    <div>
                                        <strong>{hospital.HospitalName}</strong>
                                        <span>{hospital.OrdersToday} {isRTL ? "طلب" : hospital.OrdersToday === 1 ? "order" : "orders"}</span>
                                    </div>
                                    <strong>{Number(hospital.VolumeToday || 0).toLocaleString(isRTL ? "ar-EG" : "en-US", { maximumFractionDigits: 2 })} ml</strong>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

            </div>

        </div>
    );
}

export default Dashboard;

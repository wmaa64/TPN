import React, { createContext, useContext, useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { useRouter } from "next/router";

const Context = createContext();
const DAY_MS = 24 * 60 * 60 * 1000;

export const StateContext = ({ children }) => {
  const [userInfo, setUserInfo] = useState(null);
  const [sessionReady, setSessionReady] = useState(false);
  const router = useRouter();

  // Restore only a login-history session that the server still considers active.
  useEffect(() => {
    let cancelled = false;
    const restoreSession = async () => {
      try {
        const storedValue = localStorage.getItem("userInfo");
        if (!storedValue) return;
        const storedUser = JSON.parse(storedValue);
        if (!storedUser?.UserID || !storedUser?.LoginHistoryID) {
          localStorage.removeItem("userInfo");
          return;
        }

        const response = await fetch("/api/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ UserID: storedUser.UserID, LoginHistoryID: storedUser.LoginHistoryID }),
        });
        const data = await response.json();
        if (!response.ok || !data.active) {
          localStorage.removeItem("userInfo");
          return;
        }
        if (!cancelled) setUserInfo({ ...storedUser, SessionExpiresAt: data.SessionExpiresAt });
      } catch (error) {
        console.error("Unable to restore login session:", error);
        localStorage.removeItem("userInfo");
      } finally {
        if (!cancelled) setSessionReady(true);
      }
    };
    restoreSession();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (userInfo) localStorage.setItem("userInfo", JSON.stringify(userInfo));
    else if (sessionReady) localStorage.removeItem("userInfo");
  }, [userInfo, sessionReady]);

  const loginUser = (user) => {
    const loggedInUser = {
      UserID: user.UserID,
      UserName: user.UserName,
      FullName: user.FullName,
      RoleID: user.RoleID,
      LoginHistoryID: user.LoginHistoryID || null,
      SessionExpiresAt: user.SessionExpiresAt || null,
    };
    setUserInfo(loggedInUser);
    setSessionReady(true);
    localStorage.setItem("userInfo", JSON.stringify(loggedInUser));
  };

  const logoutUser = () => {
    const currentUser = userInfo;
    if (currentUser?.LoginHistoryID) {
      fetch("/api/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ LoginHistoryID: currentUser.LoginHistoryID, UserID: currentUser.UserID }),
        keepalive: true,
      }).catch((error) => console.error("Logout history request failed:", error));
    }
    setUserInfo(null);
    localStorage.removeItem("userInfo");
    toast.success("Logged out successfully!");
    router.push("/");
  };

  // Enforce the fixed 24-hour login lifetime in the browser and recheck on tab return.
  useEffect(() => {
    if (!userInfo?.SessionExpiresAt || !userInfo?.LoginHistoryID) return undefined;
    const expiresAt = new Date(userInfo.SessionExpiresAt).getTime();
    if (!Number.isFinite(expiresAt)) {
      logoutUser();
      return undefined;
    }

    const checkSession = async () => {
      if (Date.now() >= expiresAt) {
        logoutUser();
        return;
      }
      try {
        const response = await fetch("/api/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ UserID: userInfo.UserID, LoginHistoryID: userInfo.LoginHistoryID }),
        });
        const data = await response.json();
        if (!response.ok || !data.active) logoutUser();
      } catch (error) {
        console.error("Login session check failed:", error);
      }
    };

    const timer = window.setTimeout(checkSession, Math.max(0, Math.min(expiresAt - Date.now(), DAY_MS)));
    window.addEventListener("focus", checkSession);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("focus", checkSession);
    };
  }, [userInfo?.UserID, userInfo?.LoginHistoryID, userInfo?.SessionExpiresAt]);

  return (
    <Context.Provider value={{ userInfo, setUserInfo, loginUser, logoutUser, sessionReady }}>
      {children}
    </Context.Provider>
  );
};

export const useStateContext = () => useContext(Context);

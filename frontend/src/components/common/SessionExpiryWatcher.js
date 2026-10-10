import { useEffect } from "react";
import {
  AUTH_SESSION_CHANGED,
  clearAuthSession,
  getAccessTokenExpirationTime,
} from "../../services/authSession";

const MAX_TIMEOUT = 2_147_000_000;

function SessionExpiryWatcher() {
  useEffect(() => {
    let timeoutId;
    const redirectHome = () => {
      if (window.location.pathname !== "/") {
        window.location.replace("/");
      }
    };

    const scheduleExpiry = () => {
      window.clearTimeout(timeoutId);
      const token = localStorage.getItem("accessToken");
      const expirationTime = getAccessTokenExpirationTime(token);
      if (!expirationTime) return;

      const remainingTime = expirationTime - Date.now();
      if (remainingTime <= 0) {
        clearAuthSession();
        redirectHome();
        return;
      }

      timeoutId = window.setTimeout(
        scheduleExpiry,
        Math.min(remainingTime, MAX_TIMEOUT)
      );
    };

    const handleStorage = (event) => {
      if (event.key === "accessToken" && !event.newValue) {
        clearAuthSession();
        redirectHome();
        return;
      }
      scheduleExpiry();
    };

    scheduleExpiry();
    window.addEventListener(AUTH_SESSION_CHANGED, scheduleExpiry);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.clearTimeout(timeoutId);
      window.removeEventListener(AUTH_SESSION_CHANGED, scheduleExpiry);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  return null;
}

export default SessionExpiryWatcher;

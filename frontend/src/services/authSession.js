export const AUTH_SESSION_CHANGED = "harit-sankalp-auth-session-changed";

export function getAccessTokenExpirationTime(token) {
  const payloadPart = token?.split(".")[1];
  if (!payloadPart) return null;

  try {
    const normalizedPayload = payloadPart
      .replace(/-/g, "+")
      .replace(/_/g, "/")
      .padEnd(Math.ceil(payloadPart.length / 4) * 4, "=");
    const payload = JSON.parse(window.atob(normalizedPayload));
    return Number.isFinite(payload.exp) ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

function notifySessionChanged() {
  window.dispatchEvent(new Event(AUTH_SESSION_CHANGED));
}

export function storeAuthSession(data) {
  if (data.access) {
    localStorage.setItem("accessToken", data.access);
  } else {
    localStorage.removeItem("accessToken");
  }

  if (data.refresh) {
    localStorage.setItem("refreshToken", data.refresh);
  } else {
    localStorage.removeItem("refreshToken");
  }

  if (data.user) {
    localStorage.setItem("userData", JSON.stringify(data.user));
  } else {
    localStorage.removeItem("userData");
  }

  notifySessionChanged();
}

export function clearAuthSession() {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("userData");
  notifySessionChanged();
}

import {
  AUTH_SESSION_CHANGED,
  clearAuthSession,
  getAccessTokenExpirationTime,
  storeAuthSession,
} from "./authSession";

const createToken = (payload) => {
  const encodedPayload = window.btoa(JSON.stringify(payload))
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
  return `header.${encodedPayload}.signature`;
};

describe("workflow authentication session", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test("reads the JWT expiry as milliseconds", () => {
    expect(getAccessTokenExpirationTime(createToken({ exp: 1_800_000_000 })))
      .toBe(1_800_000_000_000);
  });

  test("returns null for a token without a valid expiry", () => {
    expect(getAccessTokenExpirationTime("not-a-token")).toBeNull();
    expect(getAccessTokenExpirationTime(createToken({ exp: "later" }))).toBeNull();
  });

  test("stores a login response and notifies the expiry watcher", () => {
    const onChange = jest.fn();
    window.addEventListener(AUTH_SESSION_CHANGED, onChange);

    storeAuthSession({
      access: "access-token",
      refresh: "refresh-token",
      user: { workflow_role: "ro" },
    });

    expect(localStorage.getItem("accessToken")).toBe("access-token");
    expect(localStorage.getItem("refreshToken")).toBe("refresh-token");
    expect(JSON.parse(localStorage.getItem("userData"))).toEqual({ workflow_role: "ro" });
    expect(onChange).toHaveBeenCalledTimes(1);
    window.removeEventListener(AUTH_SESSION_CHANGED, onChange);
  });

  test("clears only authentication data when the session expires", () => {
    localStorage.setItem("accessToken", "access-token");
    localStorage.setItem("refreshToken", "refresh-token");
    localStorage.setItem("userData", "{}");
    localStorage.setItem("selectedLanguage", "hi");

    clearAuthSession();

    expect(localStorage.getItem("accessToken")).toBeNull();
    expect(localStorage.getItem("refreshToken")).toBeNull();
    expect(localStorage.getItem("userData")).toBeNull();
    expect(localStorage.getItem("selectedLanguage")).toBe("hi");
  });
});

import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import "./Login.css";
import { useLocation, useNavigate } from "react-router-dom";
import { FiUser, FiLock, FiEye, FiEyeOff, FiRefreshCw } from "react-icons/fi";
import api from "../../services/api";
import { storeAuthSession } from "../../services/authSession";
import { useToast } from "../../components/common/ToastProvider";
import sankalpLogo from "../../assets/images/sankalp.png";

function Login() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate(); 
  const notify = useToast();
  const role = location.pathname.split("/").pop().toUpperCase();
  const isROLogin = role === "RO";
  const isSilviculturistLogin = role === "SILVICULTURIST";
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [registrationOptions, setRegistrationOptions] = useState({
    states: [],
    designations: [],
  });
  const [registrationLoading, setRegistrationLoading] = useState(false);
  const [registration, setRegistration] = useState({
    fname: "",
    lname: "",
    state_id: "",
    designation_id: "",
    aadhaar_number: "",
    contact_number: "",
    confirm_password: "",
  });
  
  const [captchaText, setCaptchaText] = useState("");
  const [captchaInput, setCaptchaInput] = useState("");

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const generateCaptcha = () => {
    const chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let captcha = "";
    for (let i = 0; i < 6; i++) {
      captcha += chars[Math.floor(Math.random() * chars.length)];
    }
    setCaptchaText(captcha);
  };

  useEffect(() => {
    generateCaptcha();
  }, []);

  useEffect(() => {
    if (!isRegistering) return undefined;
    let active = true;
    setRegistrationLoading(true);
    api.get("auth/silviculturist-register/")
      .then(({ data }) => {
        if (active) {
          setRegistrationOptions({
            states: data.states || [],
            designations: data.designations || [],
          });
        }
      })
      .catch((error) => {
        notify(error.message || t("login.serverUnavailable"), "error");
      })
      .finally(() => {
        if (active) setRegistrationLoading(false);
      });
    return () => {
      active = false;
    };
  }, [isRegistering, notify, t]);

  const setRegistrationField = (field, value) => {
    setRegistration((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (e) => {
  e.preventDefault();

  if (!isRegistering && !isROLogin && captchaInput !== captchaText) {
    notify(t('login.captchaMismatch'), "error");
    generateCaptcha();
    setCaptchaInput("");
    return;
  }

    if (isRegistering) {
      try {
        const { data } = await api.post("auth/silviculturist-register/", {
          ...registration,
          emailid: email,
          password,
        });
        notify(data.message, "success");
        setIsRegistering(false);
        setRegistration({
          fname: "",
          lname: "",
          state_id: "",
          designation_id: "",
          aadhaar_number: "",
          contact_number: "",
          confirm_password: "",
        });
        setEmail("");
        setPassword("");
      } catch (error) {
        const responseError = error.response?.data?.error;
        notify(
          typeof responseError === "string"
            ? responseError
            : error.message || t("login.serverUnavailable"),
          "error"
        );
      }
      return;
    }

    // const loginData = {
    //   userid: email, 
    //   password: password,
    //   captcha_token:captchaText
    // };
  const loginData = isROLogin || isSilviculturistLogin
  ? {
      userid: email,
      password: password,
      ...(!isROLogin && { captcha_token: captchaText })
    }
  : {
      username: email,
      password: password,
      role: role.toLowerCase()
    };
    

    try {
      const endpoint = isROLogin
        ? "auth/ro-login/"
        : isSilviculturistLogin
          ? "auth/silviculturist-login/"
          : "auth/parivesh-login/";
      const { data } = await api.post(endpoint, loginData);

      storeAuthSession(data);
      navigate("/internal/dashboard");
    } catch (error) {
      const responseError = error.response?.data?.error;
      notify(
        typeof responseError === "string"
          ? responseError
          : error.message || t("login.serverUnavailable"),
        "error"
      );
    }
  };
 
 


  return (
    <div className="login-page">
      
      {/* --- HARIT SANKALP Animated Background Elements --- */}
      <div className="floating-leaves">
        <span className="leaf">🍃</span>
        <span className="leaf">🌿</span>
        <span className="leaf">🍀</span>
        <span className="leaf">🍃</span>
      </div>

      <div className="login-card">
        <img className="login-brand-mark" src={sankalpLogo} alt={t("home.portalName")} />
        <div className="login-header">
          <h2>{t('login.title')}</h2>
          <p>{t('login.subtitle')}</p>
        </div>

        <form onSubmit={handleSubmit}>
          {!isSilviculturistLogin && (
            <label className="login-role-select">
              <span>{t("login.roleSelection")}</span>
              <select
                value={role.toLowerCase()}
                onChange={(event) => navigate(`/login/${event.target.value}`)}
              >
                {["national", "state", "circle", "dfo", "ro"].map((item) => (
                  <option value={item} key={item}>{t(`workflow.roles.${item}`)}</option>
                ))}
              </select>
            </label>
          )}
          {isRegistering && (
            <div className="input-group">
              <FiUser className="input-icon" />
              <input
                type="text"
                placeholder={t("workflow.admin.firstName")}
                value={registration.fname}
                onChange={(event) => setRegistrationField("fname", event.target.value)}
                required
              />
            </div>
          )}
          {isRegistering && (
            <div className="input-group">
              <FiUser className="input-icon" />
              <input
                type="text"
                placeholder={t("workflow.admin.lastName")}
                value={registration.lname}
                onChange={(event) => setRegistrationField("lname", event.target.value)}
                required
              />
            </div>
          )}
          {isRegistering && (
            <label className="login-role-select">
              <span>{t("workflow.fields.state")}</span>
              <select
                value={registration.state_id}
                onChange={(event) => setRegistrationField("state_id", event.target.value)}
                required
                disabled={registrationLoading}
              >
                <option value="">{t("workflow.selectOption")}</option>
                {registrationOptions.states.map((item) => (
                  <option value={item.state_id} key={item.state_id}>{item.state_name}</option>
                ))}
              </select>
            </label>
          )}
          {isRegistering && (
            <label className="login-role-select">
              <span>{t("workflow.admin.designation")}</span>
              <select
                value={registration.designation_id}
                onChange={(event) => setRegistrationField("designation_id", event.target.value)}
                required
                disabled={registrationLoading}
              >
                <option value="">{t("workflow.selectOption")}</option>
                {registrationOptions.designations.map((item) => (
                  <option value={item.id} key={item.id}>{item.name}</option>
                ))}
              </select>
            </label>
          )}
          {isRegistering && (
            <div className="input-group">
              <FiUser className="input-icon" />
              <input
                type="password"
                inputMode="numeric"
                autoComplete="off"
                maxLength={12}
                pattern="[0-9]{12}"
                placeholder={t("login.aadhaarNumber")}
                value={registration.aadhaar_number}
                onChange={(event) => setRegistrationField(
                  "aadhaar_number",
                  event.target.value.replace(/\D/g, "").slice(0, 12)
                )}
                required
              />
            </div>
          )}
          {isRegistering && (
            <div className="input-group">
              <FiUser className="input-icon" />
              <input
                type="tel"
                inputMode="numeric"
                maxLength={10}
                pattern="[0-9]{10}"
                placeholder={t("workflow.admin.contactNumber")}
                value={registration.contact_number}
                onChange={(event) => setRegistrationField(
                  "contact_number",
                  event.target.value.replace(/\D/g, "").slice(0, 10)
                )}
              />
            </div>
          )}
          <div className="input-group">
            <FiUser className="input-icon" />
            <input
              type="email"
              placeholder={t('login.email')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <FiLock className="input-icon" />
            <input
              type={!isRegistering && showPassword ? "text" : "password"}
              placeholder={t('login.password')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={isRegistering ? 8 : undefined}
              required
            />
            {!isRegistering && (
              <button
                type="button"
                className="password-toggle"
                onClick={togglePasswordVisibility}
                aria-label={showPassword ? t('login.hidePassword') : t('login.showPassword')}
              >
                {showPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            )}
          </div>
          {isRegistering && (
            <div className="input-group">
              <FiLock className="input-icon" />
              <input
                type="password"
                placeholder={t("workflow.admin.confirmPassword")}
                value={registration.confirm_password}
                onChange={(event) => setRegistrationField(
                  "confirm_password",
                  event.target.value
                )}
                minLength={8}
                required
              />
            </div>
          )}

          {!isROLogin && !isRegistering && (
            <div className="captcha-container" style={{ display: "flex", gap: "10px", margin: "15px 0" }}>
            <input 
              type="text" 
              placeholder={t('login.enterCaptcha')}
              value={captchaInput}
              onChange={(e) => setCaptchaInput(e.target.value)}
              required
              style={{ flex: 1, padding: "10px", border: "1px solid #ccc", borderRadius: "4px" }}
            />
            <button
              type="button"
              className="captcha-code"
              onClick={generateCaptcha}
              title={t('login.refreshCaptcha')}
              aria-label={t('login.refreshCaptcha')}
            >
              {captchaText}
              <FiRefreshCw aria-hidden="true" />
            </button>
            </div>
          )}

          {isSilviculturistLogin && (
            <button
              type="button"
              className="submit-btn"
              onClick={() => setIsRegistering((current) => !current)}
            >
              {t(isRegistering ? "login.backToLogin" : "login.registerSilviculturist")}
            </button>
          )}
          <button
            type="submit"
            className="submit-btn"
            disabled={isRegistering && registrationLoading}
          >
            {isRegistering
              ? t("login.submitRegistration")
              : t('login.submit', {
                role: t(`header.${role === "LOGIN" ? "apo" : role.toLowerCase()}`)
              })}
          </button>
          
         
        </form>
      </div>
    </div>
  );
}

export default Login;

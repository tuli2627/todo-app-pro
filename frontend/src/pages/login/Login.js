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

  const handleSubmit = async (e) => {
  e.preventDefault();

  if (!isROLogin && captchaInput !== captchaText) {
    notify(t('login.captchaMismatch'), "error");
    generateCaptcha();
    setCaptchaInput("");
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
              type={showPassword ? "text" : "password"}
              placeholder={t('login.password')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button 
              type="button" 
              className="password-toggle" 
              onClick={togglePasswordVisibility}
              aria-label={showPassword ? t('login.hidePassword') : t('login.showPassword')}
            >
              {showPassword ? <FiEyeOff /> : <FiEye />}
            </button>
          </div>

          {!isROLogin && (
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

          <button type="submit" className="submit-btn">
            {t('login.submit', {
              role: t(`header.${role === "LOGIN" ? "apo" : role.toLowerCase()}`)
            })}
          </button>
          
         
        </form>
      </div>
    </div>
  );
}

export default Login;

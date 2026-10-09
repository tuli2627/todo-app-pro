import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import "./Login.css";
import { useLocation, useNavigate } from "react-router-dom";
import { FiUser, FiLock, FiEye, FiEyeOff } from "react-icons/fi";
import api from "../../services/api";

function Login() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate(); 
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
    alert(t('login.captchaMismatch'));
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

      localStorage.setItem("accessToken", data.access);
      if (data.refresh) {
        localStorage.setItem("refreshToken", data.refresh);
      }
      if (data.user) {
        localStorage.setItem("userData", JSON.stringify(data.user));
      }
      navigate("/dashboard");
    } catch (error) {
      const responseError = error.response?.data?.error;
      alert(
        typeof responseError === "string"
          ? responseError
          : error.message || t("login.serverUnavailable")
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
        <div className="login-header">
          <h2>{t('login.title')}</h2>
          <p>{t('login.subtitle')}</p>
        </div>

        <form onSubmit={handleSubmit}>
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
            <div 
              onClick={generateCaptcha}
              title={t('login.refreshCaptcha')}
              style={{ 
                background: "linear-gradient(45deg, #d3d3d3, #9e9e9e)", 
                color: "#000",
                fontWeight: "bold",
                letterSpacing: "4px",
                padding: "10px 20px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                userSelect: "none",
                borderRadius: "4px",
                textDecoration: "line-through" 
              }}
            >
              {captchaText}
              </div>
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

import React, { useState, useEffect } from "react";
import "./Login.css";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { FiUser, FiLock, FiEye, FiEyeOff } from "react-icons/fi";

function Login() {
  const location = useLocation();
  const navigate = useNavigate(); 
  const role = location.pathname.split("/").pop().toUpperCase();
  
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

    if (captchaInput !== captchaText) {
      alert("CAPTCHA does not match. Please try again.");
      generateCaptcha(); 
      setCaptchaInput(""); 
      return;
    }

    const loginData = {
      userid: email, 
      password: password,
      captcha_token:captchaText
    };

    try {
      const response = await fetch("http://127.0.0.1:8000/api/auth/login/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginData),
      });
      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("accessToken", data.access);
        localStorage.setItem("refreshToken", data.refresh);
        navigate("/dashboard"); 
      } else {
        alert(data.error || "Failed to login");
      }
    } catch (error) {
      alert("Server is unreachable right now.");
    }
  };
 
 

  // // 1. Add states to track inputs
  // const [username, setUsername] = useState('');
  // const [password, setPassword] = useState('');
  // const [enteredCaptcha, setEnteredCaptcha] = useState('');
  // const [errorMessage, setErrorMessage] = useState('');
  
  // const generatedCaptcha = 'x9H2m'; // The fixed captcha from your screenshot

  // // 2. Add the submit function
  // const handleLogin = (e) => {
  //   e.preventDefault();
  //   setErrorMessage('');

  //   if (enteredCaptcha !== generatedCaptcha) {
  //     setErrorMessage('Invalid CAPTCHA');
  //     return;
  //   }
    
  //   if (role === 'national' && (username !== 'NationalAdmin' || password !== 'SecurePass123!')) {
  //     setErrorMessage('Invalid username or password');
  //     return;
  //   }
    
  //   navigate('/dashboard'); // Success redirect
  // };

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
          <h2>Login</h2>
          <p>Access your account</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <FiUser className="input-icon" />
            <input 
              type="email" 
              placeholder="Email Id" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <FiLock className="input-icon" />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button 
              type="button" 
              className="password-toggle" 
              onClick={togglePasswordVisibility}
            >
              {showPassword ? <FiEyeOff /> : <FiEye />}
            </button>
          </div>

          <div className="captcha-container" style={{ display: "flex", gap: "10px", margin: "15px 0" }}>
            <input 
              type="text" 
              placeholder="Enter Captcha" 
              value={captchaInput}
              onChange={(e) => setCaptchaInput(e.target.value)}
              required
              style={{ flex: 1, padding: "10px", border: "1px solid #ccc", borderRadius: "4px" }}
            />
            <div 
              onClick={generateCaptcha}
              title="Click to refresh CAPTCHA"
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

          <button type="submit" className="submit-btn">
            Login using Digital {role === "LOGIN" ? "APO" : role} Credentials
          </button>
          
          <div style={{ textAlign: "center", marginTop: "20px", fontSize: "14px" }}>
            Don't have an account?{" "}
            <Link to="/registration" style={{ color: "#218838", fontWeight: "bold", textDecoration: "none" }}>
              Registration
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Login;
// import React, { useState, useEffect } from 'react';
// import { useLocation, useNavigate } from 'react-router-dom';

// const Login = () => {
//   const location = useLocation();
//   const navigate = useNavigate(); // Hook to redirect pages
  
//   const role = location.pathname.split('/').pop(); 

//   // Form states
//   const [username, setUsername] = useState('');
//   const [password, setPassword] = useState('');
  
//   // CAPTCHA states (Assuming you have logic that sets a generated string)
//   const [generatedCaptcha, setGeneratedCaptcha] = useState('x9H2m'); // Example fixed CAPTCHA
//   const [enteredCaptcha, setEnteredCaptcha] = useState('');
  
//   // Error state for displaying invalid messages
//   const [errorMessage, setErrorMessage] = useState('');

//   // Fixed credentials for the National portal
//   const FIXED_NATIONAL_USER = 'NationalAdmin';
//   const FIXED_NATIONAL_PASS = 'SecurePass123!';

//   useEffect(() => {
//     // Clear errors and inputs when switching between roles (e.g., from /national to /state)
//     setErrorMessage('');
//     setUsername('');
//     setPassword('');
//     setEnteredCaptcha('');
//   }, [role]);

//   const handleLogin = (e) => {
//     e.preventDefault();
    
//     // Clear any previous error before running checks
//     setErrorMessage('');

//     // 1. Validate CAPTCHA first
//     if (enteredCaptcha !== generatedCaptcha) {
//       setErrorMessage('Invalid CAPTCHA');
//       return; // Stops the function from proceeding
//     }

//     // 2. Validate specific role credentials
//     if (role === 'national') {
//       if (username !== FIXED_NATIONAL_USER) {
//         setErrorMessage('Invalid username');
//         return;
//       }
      
//       if (password !== FIXED_NATIONAL_PASS) {
//         setErrorMessage('Invalid password');
//         return;
//       }
//     } else {
//       // Logic for other roles (State, DFO, etc.) would go here.
//       // For now, let's just do a dummy check or leave it open
//       if (!username || !password) {
//         setErrorMessage('Invalid username or password');
//         return;
//       }
//     }

//     // 3. If all checks pass: Show logged in & Redirect
//     alert(`Successfully logged in to the ${role.toUpperCase()} portal!`);
    
//     // Redirect the user to the Dashboard page
//     navigate('/dashboard');
//   };

//   return (
//     <div className="glass-card">
//       <h2>{role.toUpperCase()} LOGIN</h2>
      
//       {/* Display the error message if it exists */}
//       {errorMessage && <p style={{ color: 'red', fontWeight: 'bold' }}>{errorMessage}</p>}
      
//       <form onSubmit={handleLogin}>
//         <div>
//           <label>Username</label>
//           <input 
//             type="text" 
//             value={username} 
//             onChange={(e) => setUsername(e.target.value)} 
//             required
//           />
//         </div>
        
//         <div>
//           <label>Password</label>
//           <input 
//             type="password" 
//             value={password} 
//             onChange={(e) => setPassword(e.target.value)} 
//             required
//           />
//         </div>
        
//         {/* CAPTCHA Section */}
//         <div style={{ marginTop: '15px' }}>
//           <label>CAPTCHA: <strong>{generatedCaptcha}</strong></label>
//           <br/>
//           <input 
//             type="text" 
//             placeholder="Enter CAPTCHA"
//             value={enteredCaptcha} 
//             onChange={(e) => setEnteredCaptcha(e.target.value)} 
//             required
//           />
//         </div>

//         <button type="submit" style={{ marginTop: '20px' }}>Login</button>
//       </form>
//     </div>
//   );
// };

// export default Login;
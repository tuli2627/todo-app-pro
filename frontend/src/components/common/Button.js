import React from "react";
import "./Button.css";

/**
 * variant: 'primary' | 'danger' | 'ghost'
 */
function Button({ children, onClick, variant = "primary", type = "button", disabled = false }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`btn btn-${variant}`}
    >
      {children}
    </button>
  );
}

export default Button;

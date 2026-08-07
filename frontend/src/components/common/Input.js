import React from "react";
import "./Input.css";

function Input({ value, onChange, onKeyDown, placeholder, autoFocus = false }) {
  return (
    <input
      className="input"
      value={value}
      onChange={onChange}
      onKeyDown={onKeyDown}
      placeholder={placeholder}
      autoFocus={autoFocus}
    />
  );
}

export default Input;

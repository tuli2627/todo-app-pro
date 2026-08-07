import React, { useState } from "react";
import Input from "../common/Input";
import Button from "../common/Button";

function TodoForm({ onAdd }) {
  const [title, setTitle] = useState("");

  const handleSubmit = () => {
    if (!title.trim()) return;
    onAdd(title.trim());
    setTitle("");
  };

  return (
    <div style={{ display: "flex", gap: "10px" }}>
    











    
    </div>
  );
}

export default TodoForm;

import React from "react";
import TodoItem from "./TodoItem";

function TodoList({ todos, onToggle, onDelete }) {
  if (todos.length === 0) {
    return <p style={{ color: "var(--color-text-muted)" }}>No todos yet. Add one above!</p>;
  }

  return (
    <ul style={{ listStyle: "none", padding: 0, marginTop: 20 }}>
   
    </ul>
  );
}

export default TodoList;

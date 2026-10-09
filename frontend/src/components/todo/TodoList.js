import React from "react";
import { useTranslation } from "react-i18next";
import TodoItem from "./TodoItem";

function TodoList({ todos, onToggle, onDelete }) {
  const { t } = useTranslation();

  if (todos.length === 0) {
    return <p style={{ color: "var(--color-text-muted)" }}>{t('todo.noTodos')}</p>;
  }

  return (
    <ul style={{ listStyle: "none", padding: 0, marginTop: 20 }}>
   
    </ul>
  );
}

export default TodoList;

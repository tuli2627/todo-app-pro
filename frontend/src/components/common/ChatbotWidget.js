import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { FiMessageCircle, FiSend, FiX } from "react-icons/fi";
import api from "../../services/api";
import "./ChatbotWidget.css";

const getInitialMessage = (t) => ({
  id: "welcome",
  role: "assistant",
  text: t("chatbot.greeting"),
});

function ChatbotWidget() {
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const listRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    if (messages.length === 0) setMessages([getInitialMessage(t)]);
    inputRef.current?.focus();
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [open, messages.length, t]);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, sending]);

  const sendMessage = async (message = input) => {
    const text = message.trim();
    if (!text || sending) return;
    setInput("");
    setError("");
    setMessages((current) => [...current, {
      id: `user-${Date.now()}`,
      role: "user",
      text,
    }]);
    setSending(true);
    try {
      const { data } = await api.post("chatbot/message/", {
        message: text,
        language: i18n.resolvedLanguage || i18n.language || "en",
      });
      setMessages((current) => [...current, {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        text: t(data.answer_key, {
          ...(data.variables || {}),
          stateText: data.variables?.state ? ` (${data.variables.state})` : "",
        }),
        results: data.results || [],
      }]);
    } catch (requestError) {
      setError(requestError.message || t("chatbot.error"));
    } finally {
      setSending(false);
    }
  };

  const suggestions = [
    "chatbot.suggestions.services",
    "chatbot.suggestions.nurseries",
    "chatbot.suggestions.progress",
  ];

  return (
    <div className="chatbot-widget">
      {open && (
        <section className="chatbot-panel" aria-label={t("chatbot.title")}>
          <header className="chatbot-panel__header">
            <span className="chatbot-panel__avatar" aria-hidden="true"><FiMessageCircle /></span>
            <span className="chatbot-panel__heading">
              <strong>{t("chatbot.title")}</strong>
            </span>
            <button type="button" onClick={() => setOpen(false)} aria-label={t("common.close")}>
              <FiX aria-hidden="true" />
            </button>
          </header>
          <div className="chatbot-panel__messages" ref={listRef} role="log" aria-live="polite" aria-relevant="additions">
            {messages.map((message) => (
              <article className={`chatbot-message chatbot-message--${message.role}`} key={message.id}>
                <p>{message.text}</p>
                {message.results?.length > 0 && (
                  <div className="chatbot-results">
                    {message.results.map((item) => (
                      <article className="chatbot-result" key={item.id}>
                        <strong>{item.name}</strong>
                        <span>{[item.district, item.state].filter(Boolean).join(", ")}</span>
                        {item.location && <span>{item.location}</span>}
                        {item.propagation_type && <span>{t("chatbot.propagation")}: {item.propagation_type}</span>}
                        {item.contact_person && <span>{t("chatbot.contact")}: {item.contact_person}</span>}
                        {item.phone && <a href={`tel:${item.phone}`}>{item.phone}</a>}
                        {item.latitude && item.longitude && (
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${item.latitude},${item.longitude}`)}`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            {t("chatbot.openMap")}
                          </a>
                        )}
                        <a href={item.url}>{t("chatbot.openNurseries")}</a>
                      </article>
                    ))}
                  </div>
                )}
              </article>
            ))}
            {messages.length === 1 && (
              <div className="chatbot-suggestions">
                {suggestions.map((key) => (
                  <button
                    type="button"
                    key={key}
                    disabled={sending}
                    onClick={() => sendMessage(t(key))}
                  >
                    {t(key)}
                  </button>
                ))}
              </div>
            )}
            {sending && <p className="chatbot-panel__typing">{t("chatbot.thinking")}</p>}
            {error && <p className="chatbot-panel__error" role="alert">{error}</p>}
          </div>
          <form className="chatbot-panel__composer" onSubmit={(event) => {
            event.preventDefault();
            sendMessage();
          }}>
            <input
              ref={inputRef}
              value={input}
              maxLength={500}
              onChange={(event) => setInput(event.target.value)}
              placeholder={t("chatbot.placeholder")}
              aria-label={t("chatbot.placeholder")}
            />
            <button type="submit" disabled={sending || !input.trim()} aria-label={t("chatbot.send")}>
              <FiSend aria-hidden="true" />
            </button>
          </form>
        </section>
      )}
      <button
        type="button"
        className="chatbot-launcher"
        aria-label={open ? t("chatbot.close") : t("chatbot.open")}
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        {open ? <FiX aria-hidden="true" /> : <FiMessageCircle aria-hidden="true" />}
        <span>{open ? t("chatbot.close") : t("chatbot.open")}</span>
      </button>
    </div>
  );
}

export default ChatbotWidget;

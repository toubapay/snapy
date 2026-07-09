import { useEffect, useRef, useState } from "react";
import { api } from "../api";
import { getBuyerId } from "../hooks/useAuth";

function timeAgo(ts) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return "à l'instant";
  const m = Math.floor(s / 60);
  if (m < 60) return `il y a ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `il y a ${h} h`;
  return `il y a ${Math.floor(h / 24)} j`;
}

export default function ChatModal({ open, product, auth, onClose }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const messagesRef = useRef(null);

  const mySenderId = auth?.phone || getBuyerId();

  useEffect(() => {
    if (!open || !product) return;
    setMessages([]);
    let cancelled = false;

    async function poll() {
      try {
        const data = await api.chat(product.id);
        if (!cancelled) setMessages(data.messages);
      } catch {
        /* silent — polling, no need to surface transient errors */
      }
    }
    poll();
    const timer = setInterval(poll, 2500);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [open, product]);

  useEffect(() => {
    if (messagesRef.current) messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
  }, [messages]);

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape" && open) onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !product) return null;

  const isSeller = mySenderId === product.sellerPhone;

  async function handleSend(e) {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    setInput("");
    try {
      await api.sendChat(product.id, mySenderId, text);
      const data = await api.chat(product.id);
      setMessages(data.messages);
    } catch {
      /* if it fails, the message just won't appear — user can retry */
    }
  }

  return (
    <div
      className="chat-modal"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="chat-panel">
        <div className="chat-head">
          <div className="chat-head-info">
            <span className="chat-vendor">{isSeller ? "Vous discutez en tant que vendeur" : product.vendorId}</span>
            <span className="chat-product">{product.name}</span>
          </div>
          <button type="button" className="cam-icon-btn" aria-label="Fermer le chat" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="chat-messages" ref={messagesRef}>
          {messages.map((m) => {
            const mine = m.senderId === mySenderId;
            return (
              <div key={m.id} className={`msg ${mine ? "mine" : "theirs"}`}>
                <span className="msg-bubble">{m.text}</span>
                <span className="msg-meta">
                  {mine ? "Vous" : m.role === "seller" ? "Vendeur" : m.senderId} · {timeAgo(m.createdAt)}
                </span>
              </div>
            );
          })}
        </div>
        <form className="chat-form" onSubmit={handleSend}>
          <input
            className="chatInput"
            type="text"
            maxLength={500}
            placeholder="Écrire un message…"
            autoComplete="off"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button className="chatSend" type="submit" aria-label="Envoyer">
            ➤
          </button>
        </form>
      </div>
    </div>
  );
}

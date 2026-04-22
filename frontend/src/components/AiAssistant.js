import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, Sparkles, FlaskConical } from "lucide-react";
import api from "../utils/api";

const SUGGESTIONS = [
  "What is VIX?",
  "Explain contango in one line",
  "Long vs short volatility?",
  "When does VIX usually spike?",
];

export default function AiAssistant() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hi! I'm SimuBot — your volatility trading tutor. Ask me anything about VIX, VXN, contango, or how to read the simulator. This is a simulation — no real money is ever at risk.",
    },
  ]);
  const [sessionId, setSessionId] = useState(null);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, open]);

  const send = async (text) => {
    const message = (text ?? input).trim();
    if (!message || sending) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", content: message }]);
    setSending(true);
    try {
      const res = await api.post("/ai/chat", { message, session_id: sessionId });
      setSessionId(res.data.session_id);
      setMessages((m) => [...m, { role: "assistant", content: res.data.reply }]);
    } catch (e) {
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content: "Sorry — I couldn't reach the assistant. Please try again in a moment.",
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      {/* Floating trigger */}
      <button
        onClick={() => setOpen(true)}
        data-testid="ai-assistant-open"
        className={`fixed bottom-6 right-6 z-40 h-14 w-14 rounded-full bg-[#1B263B] text-white shadow-xl flex items-center justify-center hover:bg-[#2B3A55] transition-all ${
          open ? "scale-0 pointer-events-none" : "scale-100"
        }`}
        aria-label="Open AI assistant"
      >
        <Sparkles size={22} strokeWidth={2} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
            transition={{ duration: 0.18 }}
            className="fixed bottom-6 right-6 z-40 w-[380px] max-w-[calc(100vw-2rem)] h-[560px] max-h-[calc(100vh-3rem)] bg-white border border-slate-200 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
            data-testid="ai-assistant-panel"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-[#1B263B] text-white">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center">
                  <Sparkles size={15} strokeWidth={2.2} />
                </div>
                <div>
                  <p className="text-sm font-semibold font-outfit leading-tight">SimuBot</p>
                  <p className="text-[10px] text-slate-300 flex items-center gap-1">
                    <FlaskConical size={9} /> Educational · Not financial advice
                  </p>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-slate-300 hover:text-white"
                data-testid="ai-assistant-close"
                aria-label="Close assistant"
              >
                <X size={18} strokeWidth={1.8} />
              </button>
            </div>

            {/* Messages */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-slate-50"
              data-testid="ai-messages"
            >
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] text-sm leading-relaxed px-3.5 py-2.5 rounded-2xl ${
                      m.role === "user"
                        ? "bg-[#1B263B] text-white rounded-br-sm"
                        : "bg-white text-slate-800 border border-slate-200 rounded-bl-sm"
                    }`}
                  >
                    {m.content}
                  </div>
                </div>
              ))}
              {sending && (
                <div className="flex justify-start">
                  <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" />
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0.15s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0.3s]" />
                  </div>
                </div>
              )}
            </div>

            {/* Suggestions */}
            {messages.length <= 1 && !sending && (
              <div className="px-4 py-2 flex gap-2 flex-wrap border-t border-slate-100 bg-white">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="text-[11px] font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-full transition-colors"
                    data-testid={`ai-suggestion-${s.toLowerCase().replace(/\s+/g, "-").replace(/\?/g, "")}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <form
              onSubmit={(e) => { e.preventDefault(); send(); }}
              className="p-3 border-t border-slate-200 flex gap-2 bg-white"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about volatility…"
                className="flex-1 text-sm px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1B263B]/20 focus:border-[#1B263B] font-inter"
                data-testid="ai-input"
                disabled={sending}
              />
              <button
                type="submit"
                disabled={sending || !input.trim()}
                className="h-9 w-9 flex items-center justify-center bg-[#1B263B] text-white rounded-lg hover:bg-[#2B3A55] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                data-testid="ai-send"
                aria-label="Send"
              >
                <Send size={15} strokeWidth={2} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

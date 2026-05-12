import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Loader2, Bot, User } from 'lucide-react';
import { aiAPI } from '../../services/api';
import { scaleIn, buttonTap } from '../../utils/motion';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

const QUICK_PROMPTS = [
  'I need medicine for a headache',
  'Show me rice and grains',
  'What skincare do you have?',
  'Something for cold and flu',
];

const AIAssistant: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([{
    id: '0', role: 'assistant',
    content: 'Hello! I can help you find products in our Pharmacy, Supermarket, and Cosmetics sections. What are you looking for?',
  }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
  useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 100); }, [open]);

  const send = async (text?: string) => {
    const query = (text || input).trim();
    if (!query || loading) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: query };
    setMessages((p) => [...p, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const history = [...messages, userMsg].map((m) => ({ role: m.role, content: m.content }));
      const res = await aiAPI.chat(history);
      setMessages((p) => [...p, { id: (Date.now()+1).toString(), role: 'assistant', content: res.data.data.reply }]);
    } catch {
      setMessages((p) => [...p, { id: (Date.now()+1).toString(), role: 'assistant', content: 'I am having trouble connecting. Please browse our categories or use the search bar.' }]);
    } finally { setLoading(false); }
  };

  return (
    <>
      <motion.button onClick={() => setOpen(!open)} whileHover={{ scale: 1.08 }} whileTap={buttonTap}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-green-600 hover:bg-green-700 text-white rounded-full shadow-[0_8px_32px_rgba(22,163,74,0.35)] flex items-center justify-center transition-colors"
        aria-label="Open AI assistant">
        <AnimatePresence mode="wait" initial={false}>
          {open
            ? <motion.div key="c" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}><X className="w-6 h-6" /></motion.div>
            : <motion.div key="o" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}><MessageCircle className="w-6 h-6" /></motion.div>
          }
        </AnimatePresence>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div variants={scaleIn} initial="initial" animate="animate" exit="exit"
            style={{ transformOrigin: 'bottom right', position: 'fixed', bottom: '96px', right: '24px', zIndex: 50, width: '360px', height: '460px' }}
            className="bg-white rounded-2xl shadow-[0_20px_64px_rgba(0,0,0,0.16)] border border-slate-200 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 bg-green-600 flex-shrink-0">
              <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-[13px] font-bold text-white leading-none">Shopping Assistant</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-300 animate-pulse" />
                  <span className="text-[11px] text-green-100">Online</span>
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="text-white/70 hover:text-white transition-colors p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${msg.role === 'assistant' ? 'bg-green-100' : 'bg-slate-100'}`}>
                    {msg.role === 'assistant' ? <Bot className="w-3.5 h-3.5 text-green-600" /> : <User className="w-3.5 h-3.5 text-slate-500" />}
                  </div>
                  <div className={`max-w-[76%] px-3 py-2 rounded-xl text-[13px] leading-relaxed ${msg.role === 'assistant' ? 'bg-slate-100 text-slate-800 rounded-tl-none' : 'bg-green-600 text-white rounded-tr-none'}`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex gap-2">
                  <div className="w-7 h-7 rounded-xl bg-green-100 flex items-center justify-center"><Bot className="w-3.5 h-3.5 text-green-600" /></div>
                  <div className="bg-slate-100 rounded-xl rounded-tl-none px-3 py-2.5 flex gap-1">
                    {[0,1,2].map((i) => (
                      <motion.span key={i} className="w-1.5 h-1.5 rounded-full bg-slate-400 block"
                        animate={{ y: [0, -4, 0] }} transition={{ duration: 0.6, delay: i * 0.15, repeat: Infinity }} />
                    ))}
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Quick prompts - only on first message */}
            {messages.length <= 1 && (
              <div className="px-4 pb-2 flex-shrink-0">
                <p className="text-[11px] text-slate-400 mb-1.5 font-medium">Suggested</p>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_PROMPTS.map((p) => (
                    <button key={p} onClick={() => send(p)}
                      className="text-[11px] font-medium text-green-700 bg-green-50 border border-green-200 px-2.5 py-1 rounded-full hover:bg-green-100 transition-colors">
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <div className="border-t border-slate-100 p-3 flex gap-2 flex-shrink-0">
              <input ref={inputRef} type="text" value={input} onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send()}
                placeholder="Ask me anything..." disabled={loading}
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-[13px] outline-none focus:border-green-400 focus:ring-2 focus:ring-green-400/10 transition-all" />
              <motion.button onClick={() => send()} disabled={!input.trim() || loading} whileTap={buttonTap}
                className="w-9 h-9 bg-green-600 hover:bg-green-700 disabled:opacity-40 text-white rounded-xl flex items-center justify-center flex-shrink-0 transition-colors">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AIAssistant;

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Message {
  role: "user" | "ai";
  text: string;
}

const quickPrompts = [
  "What courses should I take next?",
  "How is my GPA trending?",
  "Am I at academic risk?",
  "Explain my timetable conflicts",
];

export default function Chatbot() {
  const [messages, setMessages] = useState<Message[]>([
    { role: "ai", text: "Hi Alex! 👋 I'm your AI academic assistant. I can help with course recommendations, grade analysis, schedule planning, and more. How can I help you today?" },
  ]);
  const [input, setInput] = useState("");

  const send = (text: string) => {
    if (!text.trim()) return;
    setMessages(prev => [...prev, { role: "user", text }]);
    setInput("");
    setTimeout(() => {
      setMessages(prev => [...prev, { role: "ai", text: "That's a great question! Based on your current academic profile, I'd recommend focusing on courses that build on your strong performance in Data Structures and AI Foundations. Would you like me to suggest specific courses?" }]);
    }, 1000);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-w-3xl mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 pb-4 border-b border-border mb-4">
        <div className="p-2 rounded-xl gradient-primary">
          <Bot className="w-5 h-5 text-primary-foreground" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">AI Academic Assistant</h3>
          <p className="text-xs text-success flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-success" /> Online</p>
        </div>
      </motion.div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pb-4">
        <AnimatePresence>
          {messages.map((msg, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                msg.role === "user"
                  ? "gradient-primary text-primary-foreground rounded-br-md"
                  : "bg-muted text-foreground rounded-bl-md"
              }`}>
                {msg.text}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Quick prompts */}
      {messages.length <= 1 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {quickPrompts.map(p => (
            <button key={p} onClick={() => send(p)}
              className="px-3 py-1.5 rounded-full border border-border text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
              <Sparkles className="w-3 h-3 inline mr-1" />{p}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="flex gap-2 pt-2 border-t border-border">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && send(input)}
          placeholder="Ask me anything about your academics..."
          className="flex-1 px-4 py-3 rounded-xl bg-muted/50 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50"
        />
        <Button onClick={() => send(input)} className="gradient-primary text-primary-foreground px-4 hover:opacity-90" disabled={!input.trim()}>
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bot, Send, Sparkles } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { EmptyState, ErrorState, LoadingState } from "@/components/app/DataState";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { apiGet, apiPost } from "@/lib/api";
import { formatRelativeDateTime } from "@/lib/formatters";

interface ChatbotMessage {
  id: number;
  sender_type: "student" | "assistant" | "system";
  message_text: string;
  created_at: string;
}

interface ChatbotResponse {
  assistant_enabled: boolean;
  assistant_status: string;
  assistant_mode: string;
  assistant_provider: string;
  assistant_model: string;
  assistant_fallback_enabled: boolean;
  session: {
    id: number;
    title: string;
  };
  messages: ChatbotMessage[];
  quick_prompts: string[];
  student: {
    first_name: string;
    program_name: string;
  };
}

export default function Chatbot() {
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const [input, setInput] = useState("");

  const chatbotQuery = useQuery({
    queryKey: ["student", "chatbot"],
    queryFn: () => apiGet<ChatbotResponse>("/students/me/chatbot"),
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [chatbotQuery.data?.messages.length]);

  const sendMutation = useMutation({
    mutationFn: (message: string) => apiPost<ChatbotResponse>("/students/me/chatbot/messages", { message }),
    onSuccess: (payload) => {
      queryClient.setQueryData(["student", "chatbot"], payload);
      setInput("");
    },
    onError: (error) => {
      toast({
        title: "Unable to send message",
        description: error instanceof Error ? error.message : "Please try again in a moment.",
      });
    },
  });

  if (chatbotQuery.isLoading) {
    return <LoadingState lines={5} />;
  }

  if (chatbotQuery.isError) {
    return (
      <ErrorState
        description={chatbotQuery.error instanceof Error ? chatbotQuery.error.message : "The academic assistant could not be loaded."}
        onRetry={() => void chatbotQuery.refetch()}
      />
    );
  }

  const chatbot = chatbotQuery.data;
  if (!chatbot) {
    return <EmptyState title="Assistant unavailable" description="The academic assistant session could not be prepared right now." />;
  }

  const statusLabel =
    chatbot.assistant_status === "fallback" ? "Fallback mode" : chatbot.assistant_enabled ? "Online" : "Disabled";
  const statusColor =
    chatbot.assistant_status === "fallback" ? "bg-warning" : chatbot.assistant_enabled ? "bg-success" : "bg-warning";
  const providerLabel = chatbot.assistant_enabled
    ? `${chatbot.assistant_provider} · ${chatbot.assistant_model}`
    : "Assistant disabled";

  const send = (message: string) => {
    const cleanMessage = message.trim();
    if (!cleanMessage || sendMutation.isPending || !chatbot.assistant_enabled) {
      return;
    }

    sendMutation.mutate(cleanMessage);
  };

  return (
    <div className="mx-auto flex min-h-[calc(100dvh-9rem)] max-w-4xl flex-col gap-4">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-4 rounded-2xl border bg-card p-5 shadow-card md:flex-row md:items-center md:justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="rounded-xl gradient-primary p-2">
            <Bot className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">AI Academic Assistant</h3>
            <p className="text-sm text-muted-foreground">
              Personalized guidance for {chatbot.student.first_name} in {chatbot.student.program_name}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-full border bg-muted/40 px-3 py-1.5 text-xs">
          <span className={`h-2 w-2 rounded-full ${statusColor}`} />
          <span className="font-medium text-foreground">{statusLabel}</span>
          <span className="text-muted-foreground">{providerLabel}</span>
        </div>
      </motion.div>

      <div className="flex-1 overflow-hidden rounded-2xl border bg-card shadow-card">
        <div className="flex h-full min-h-[32rem] flex-col">
          <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-5">
            <AnimatePresence initial={false}>
              {chatbot.messages.map((message, index) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.02 }}
                  className={`flex ${message.sender_type === "student" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[92%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm sm:max-w-[78%] ${
                      message.sender_type === "student"
                        ? "rounded-br-md gradient-primary text-primary-foreground"
                        : "rounded-bl-md bg-muted text-foreground"
                    }`}
                  >
                    <p>{message.message_text}</p>
                    <p
                      className={`mt-2 text-[11px] ${
                        message.sender_type === "student" ? "text-primary-foreground/75" : "text-muted-foreground"
                      }`}
                    >
                      {formatRelativeDateTime(message.created_at)}
                    </p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {sendMutation.isPending ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                <div className="max-w-[78%] rounded-2xl rounded-bl-md bg-muted px-4 py-3 text-sm text-foreground shadow-sm">
                  Reviewing your student record with {chatbot.assistant_model}...
                </div>
              </motion.div>
            ) : null}

            <div ref={messagesEndRef} />
          </div>

          {chatbot.messages.length <= 1 ? (
            <div className="border-t border-border px-4 pb-3 pt-3 sm:px-5">
              <div className="flex flex-wrap gap-2">
                {chatbot.quick_prompts.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => send(prompt)}
                    className="rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    <Sparkles className="mr-1 inline h-3 w-3" />
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <div className="border-t border-border p-4 sm:p-5">
            {chatbot.assistant_status === "fallback" ? (
              <p className="mb-3 text-xs text-muted-foreground">
                Ollama is unavailable right now, so the assistant is answering with the built-in student context fallback.
              </p>
            ) : null}
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    send(input);
                  }
                }}
                placeholder="Ask about courses, GPA, timetable conflicts, finance, or campus updates..."
                className="flex-1 rounded-xl border border-border bg-muted/50 px-4 py-3 text-sm focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/15"
                disabled={!chatbot.assistant_enabled || sendMutation.isPending}
              />
              <Button
                onClick={() => send(input)}
                className="gradient-primary text-primary-foreground hover:opacity-90"
                disabled={!input.trim() || !chatbot.assistant_enabled || sendMutation.isPending}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

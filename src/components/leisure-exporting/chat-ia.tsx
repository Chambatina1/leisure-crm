'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from './store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Loader2, MessageCircle, Sparkles, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const QUICK_QUESTIONS = [
  '¿Cuánto cuesta enviar 10 lb?',
  '¿Cuánto cuesta enviar 25 lb a domicilio?',
  'Precios de bicicletas',
  '¿Dónde están ubicados?',
  'Precios de cajas',
];

function generateSessionId(): string {
  return 'session-' + Math.random().toString(36).substr(2, 9) + '-' + Date.now();
}

export function ChatIA() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(generateSessionId);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;

    const userMessage: ChatMessage = { role: 'user', content: text.trim() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mensaje: text.trim(), sessionId }),
      });
      const json = await res.json();
      if (json.ok) {
        setMessages(prev => [...prev, { role: 'assistant', content: json.respuesta }]);
      } else {
        toast.error('Error en el chat');
      }
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Lo siento, tuve un problema de conexión. Por favor intenta de nuevo.',
      }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  // Simple markdown-like rendering
  const renderContent = (content: string) => {
    return content.split('\n').map((line, i) => {
      // Bold
      let processed = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      // Italic
      processed = processed.replace(/\*(.*?)\*/g, '<em>$1</em>');
      // Headers
      if (processed.startsWith('# ')) {
        return <h3 key={i} className="font-bold text-base mt-2 mb-1">{processed.replace('# ', '')}</h3>;
      }

      return (
        <p
          key={i}
          className={`${line.trim() === '' ? 'h-3' : ''}`}
          dangerouslySetInnerHTML={{ __html: processed || '&nbsp;' }}
        />
      );
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col"
      style={{ height: 'calc(100vh - 64px - 64px)', minHeight: '500px' }}
    >
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-blue-600" />
            Chat Asistente
          </h1>
          <p className="text-zinc-500 text-sm mt-0.5">Tu asistente virtual de Leisure Exporting</p>
        </div>
        {messages.length > 0 && (
          <Button variant="ghost" size="sm" className="text-zinc-400" onClick={clearChat}>
            <Trash2 className="h-4 w-4 mr-1" /> Limpiar
          </Button>
        )}
      </div>

      <Card className="flex-1 flex flex-col border-0 shadow-md overflow-hidden min-h-0">
        {/* Messages Area */}
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center mb-4">
                <MessageCircle className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-zinc-700 mb-2">¡Hola! 👋</h3>
              <p className="text-sm text-zinc-400 max-w-sm mb-6">
                Soy el asistente virtual de Leisure Exporting. Puedo ayudarte con precios, rastreo y más.
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                {QUICK_QUESTIONS.map(q => (
                  <Button
                    key={q}
                    variant="outline"
                    size="sm"
                    className="text-xs h-auto py-2 px-3 text-zinc-600 border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                    onClick={() => sendMessage(q)}
                  >
                    {q}
                  </Button>
                ))}
              </div>
            </div>
          )}

          <AnimatePresence mode="popLayout">
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className={`flex gap-3 mb-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                {/* Avatar */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    msg.role === 'user'
                      ? 'bg-zinc-200'
                      : 'bg-blue-100'
                  }`}
                >
                  {msg.role === 'user' ? (
                    <span className="text-xs font-bold text-zinc-600">Tú</span>
                  ) : (
                    <Sparkles className="h-4 w-4 text-[#123d83]" />
                  )}
                </div>

                {/* Bubble */}
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-zinc-800 text-white rounded-tr-sm'
                      : 'bg-zinc-100 text-zinc-800 rounded-tl-sm'
                  }`}
                >
                  {msg.role === 'assistant' ? renderContent(msg.content) : msg.content}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex gap-3 mb-4"
            >
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                <Sparkles className="h-4 w-4 text-[#123d83]" />
              </div>
              <div className="bg-zinc-100 rounded-2xl rounded-tl-sm px-4 py-3">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </motion.div>
          )}
        </ScrollArea>

        {/* Input */}
        <div className="p-3 border-t bg-zinc-50 shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage(input);
            }}
            className="flex gap-2"
          >
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Escribe tu pregunta..."
              className="flex-1"
              disabled={loading}
            />
            <Button
              type="submit"
              disabled={loading || !input.trim()}
              className="bg-[#123d83] hover:bg-[#071a46] text-white px-4"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>
        </div>
      </Card>
    </motion.div>
  );
}

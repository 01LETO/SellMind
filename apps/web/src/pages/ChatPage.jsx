import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { Send, Trash2, ImagePlus, X, LayoutDashboard, LogOut, Loader2, Sparkles, Home } from 'lucide-react';
import Logo from '@/components/Logo';
import { useAuth } from '@/contexts/AuthContext';
import { useIntegratedAi } from '@/hooks/use-integrated-ai';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

export default function ChatPage() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { messages, isStreaming, isLoadingHistory, sendMessage, clearMessages } = useIntegratedAi();

  const [input, setInput] = useState('');
  const [images, setImages] = useState([]);
  const bottomRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isStreaming) return;

    setInput('');
    const toSend = [...images];
    setImages([]);
    await sendMessage(text, toSend);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleImageAdd = (e) => {
    const files = Array.from(e.target.files || []);
    setImages((prev) => [...prev, ...files].slice(0, 4));
    e.target.value = '';
  };

  const removeImage = (index) => setImages((prev) => prev.filter((_, i) => i !== index));

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <>
      <Helmet>
        <title>Chat IA — SellMind</title>
      </Helmet>

      <div className="flex flex-col h-screen" style={{ background: '#0B0F19' }}>
        {/* Header */}
        <div className="border-b border-white/5 bg-black/20 backdrop-blur-md shrink-0">
          <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Logo size={28} />
              <span className="text-muted-foreground text-sm">/</span>
              <span className="text-sm text-muted-foreground">Chat IA</span>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" onClick={() => navigate('/')}
                className="text-muted-foreground hover:text-foreground hover:bg-white/5">
                <Home className="w-4 h-4 mr-2" />
                Gerar página
              </Button>
              <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}
                className="text-muted-foreground hover:text-foreground hover:bg-white/5">
                <LayoutDashboard className="w-4 h-4 mr-2" />
                Dashboard
              </Button>
              <Button variant="ghost" size="sm" onClick={handleLogout}
                className="text-muted-foreground hover:text-foreground hover:bg-white/5">
                <LogOut className="w-4 h-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
            {isLoadingHistory ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-20 animate-fade-in">
                <div className="w-14 h-14 rounded-2xl gradient-primary/20 border border-primary/20 flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-7 h-7 text-primary/70" />
                </div>
                <h2 className="text-xl font-semibold text-foreground mb-2">Como posso ajudar?</h2>
                <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                  Pergunte sobre copywriting, estratégias de vendas, seu produto ou peça para criar seções da sua página.
                </p>
              </div>
            ) : (
              messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'assistant' && (
                    <div className="w-6 h-6 rounded-md gradient-primary flex items-center justify-center shrink-0 mt-1 mr-2 glow-sm">
                      <Sparkles className="w-3.5 h-3.5 text-white" />
                    </div>
                  )}
                  <div
                    className={`max-w-[78%] rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap leading-relaxed ${
                      msg.role === 'user'
                        ? 'gradient-primary text-white rounded-tr-sm'
                        : 'bg-white/5 border border-white/8 text-foreground rounded-tl-sm'
                    }`}
                  >
                    {msg.images?.map((src, j) => (
                      <img key={j} src={src} alt="" className="rounded-lg mb-2 max-h-48 object-contain" />
                    ))}
                    {msg.content || (msg.role === 'assistant' && isStreaming && i === messages.length - 1 ? (
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Pensando...
                      </span>
                    ) : null)}
                  </div>
                </div>
              ))
            )}
            <div ref={bottomRef} />
          </div>
        </div>

        {/* Input area */}
        <div className="border-t border-white/5 bg-black/20 backdrop-blur-md shrink-0">
          <div className="max-w-4xl mx-auto px-4 py-3">
            {images.length > 0 && (
              <div className="flex gap-2 mb-2 flex-wrap">
                {images.map((img, i) => (
                  <div key={i} className="relative">
                    <img
                      src={URL.createObjectURL(img)}
                      alt=""
                      className="w-14 h-14 object-cover rounded-lg border border-white/10"
                    />
                    <button
                      onClick={() => removeImage(i)}
                      className="absolute -top-1 -right-1 bg-destructive text-white rounded-full w-4 h-4 flex items-center justify-center"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2 items-end">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                className="hidden"
                onChange={handleImageAdd}
              />
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0 text-muted-foreground hover:text-foreground hover:bg-white/5"
                onClick={() => fileInputRef.current?.click()}
                disabled={isStreaming || images.length >= 4}
                title="Anexar imagem"
              >
                <ImagePlus className="w-4 h-4" />
              </Button>

              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Digite sua mensagem... (Enter para enviar)"
                className="resize-none min-h-[44px] max-h-32 bg-white/3 border-white/10 focus:border-primary/50 focus:ring-primary/20 placeholder:text-muted-foreground/50"
                rows={1}
                disabled={isStreaming}
              />

              <Button
                size="icon"
                className="shrink-0 gradient-primary text-white glow-sm hover:opacity-90 transition-all"
                onClick={handleSend}
                disabled={!input.trim() || isStreaming}
              >
                <Send className="w-4 h-4" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                onClick={async () => {
                  try {
                    await clearMessages();
                  } catch (err) {
                    console.error('Erro ao limpar histórico:', err);
                    alert('Erro ao limpar: ' + err.message);
                  }
                }}
                disabled={isStreaming}
                title="Limpar conversa"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

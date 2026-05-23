import React, { useEffect, useState } from 'react';
import { Sparkles, Link2, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';

const STORAGE_KEY = 'sellmind_welcomed';

const STEPS = [
  {
    icon: Sparkles,
    title: 'Descreva seu produto',
    description: 'Informe o nome, público-alvo, dor principal e a transformação que você entrega.',
  },
  {
    icon: Link2,
    title: 'Gere e publique',
    description: 'A IA cria a página completa em segundos. Copie o link e envie para seus clientes.',
  },
  {
    icon: Users,
    title: 'Capture leads',
    description: 'Quem preencher o formulário aparece no seu painel — com notificação por e-mail.',
  },
];

export default function WelcomeModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      const t = setTimeout(() => setOpen(true), 600);
      return () => clearTimeout(t);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem(STORAGE_KEY, '1');
    setOpen(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md glass border border-white/10 rounded-2xl shadow-card p-8 animate-fade-in">
        <div className="text-center mb-7">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs font-medium mb-4">
            <Sparkles className="w-3 h-3" />
            Bem-vindo ao SellMind
          </div>
          <h2 className="text-xl font-bold text-foreground">
            Crie sua primeira página de vendas
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Pronto em menos de 30 segundos.
          </p>
        </div>

        <div className="space-y-4 mb-7">
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <div key={i} className="flex items-start gap-4">
                <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center shrink-0 glow-sm">
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{step.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{step.description}</p>
                </div>
              </div>
            );
          })}
        </div>

        <Button
          onClick={handleClose}
          className="w-full gradient-primary text-white h-11 font-semibold glow-primary hover:opacity-90 transition-all"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          Começar agora
        </Button>
      </div>
    </div>
  );
}

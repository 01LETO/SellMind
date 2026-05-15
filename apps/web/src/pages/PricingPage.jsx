import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { Check, ArrowLeft, Sparkles, Zap, Shield } from 'lucide-react';
import Logo from '@/components/Logo';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { apiUrl } from '@/lib/api';

const PLANS = [
  {
    id: 'professional',
    name: 'Professional',
    price: 'R$ 47',
    period: '/mês',
    description: 'Para quem quer escalar suas vendas',
    icon: Zap,
    features: [
      '30 páginas de vendas por mês',
      'Todos os tons de voz',
      'Download em HTML',
      'Histórico de páginas',
      'Suporte por e-mail',
    ],
    cta: 'Assinar Professional',
    highlighted: false,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 'R$ 147',
    period: '/mês',
    description: 'Uso ilimitado para agências e times',
    icon: Shield,
    features: [
      'Páginas ilimitadas',
      'Todos os tons de voz',
      'Download em HTML',
      'Histórico completo',
      'Suporte prioritário',
      'API de integração',
      'Múltiplos usuários',
    ],
    cta: 'Assinar Enterprise',
    highlighted: true,
  },
];

export default function PricingPage() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(null);

  const handleSubscribe = async (planId) => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    setLoading(planId);
    try {
      const response = await fetch(apiUrl('/api/stripe/create-checkout'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planType: planId, userId: currentUser.id }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
        throw new Error(err.error || 'Falha ao criar checkout');
      }

      const { checkoutUrl } = await response.json();
      window.location.href = checkoutUrl;
    } catch (err) {
      toast({ variant: 'destructive', title: 'Erro', description: err.message });
    } finally {
      setLoading(null);
    }
  };

  return (
    <>
      <Helmet>
        <title>Planos — SellMind</title>
        <meta name="description" content="Escolha o plano ideal para criar mais páginas de vendas com IA." />
      </Helmet>

      <div className="min-h-screen gradient-bg">
        {/* Header */}
        <div className="border-b border-white/5 bg-black/20 backdrop-blur-md sticky top-0 z-50">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center justify-between">
              <Logo />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(currentUser ? '/' : '/login')}
                className="text-muted-foreground hover:text-foreground hover:bg-white/5"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          {/* Hero */}
          <div className="text-center mb-14 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs font-medium mb-5">
              <Sparkles className="w-3 h-3" />
              Simples e transparente
            </div>
            <h1 className="text-4xl font-bold mb-4 tracking-tight text-foreground">
              Escolha seu{' '}
              <span className="gradient-primary-text">plano ideal</span>
            </h1>
            <p className="text-muted-foreground text-lg">
              Comece gratuitamente com 3 páginas por mês. Faça upgrade quando precisar de mais.
            </p>
          </div>

          {/* Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10 animate-slide-up">
            {/* Free plan */}
            <Card className="glass border-white/8 shadow-card flex flex-col">
              <CardHeader className="pb-4">
                <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-3">
                  <Zap className="w-4 h-4 text-muted-foreground" />
                </div>
                <CardTitle className="text-xl text-foreground">Free</CardTitle>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-3xl font-bold text-foreground">R$ 0</span>
                  <span className="text-muted-foreground text-sm">/mês</span>
                </div>
                <p className="text-sm text-muted-foreground">Para testar a plataforma</p>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <ul className="space-y-2.5 mb-6 flex-1">
                  {['3 páginas por mês', 'Todos os tons de voz', 'Download em HTML'].map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-foreground/80">
                      <Check className="w-4 h-4 text-primary flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  variant="outline"
                  className="w-full border-white/10 hover:bg-white/5 text-foreground"
                  onClick={() => navigate(currentUser ? '/' : '/signup')}
                >
                  {currentUser ? 'Plano atual' : 'Começar grátis'}
                </Button>
              </CardContent>
            </Card>

            {PLANS.map((plan) => {
              const Icon = plan.icon;
              return (
                <Card
                  key={plan.id}
                  className={`flex flex-col relative ${
                    plan.highlighted
                      ? 'border-primary/40 shadow-[0_0_40px_rgba(139,92,246,0.15)] bg-gradient-to-b from-primary/5 to-transparent'
                      : 'glass border-white/8 shadow-card'
                  }`}
                >
                  {plan.highlighted && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                      <span className="gradient-primary text-white text-xs font-semibold px-3 py-1 rounded-full glow-sm">
                        Mais popular
                      </span>
                    </div>
                  )}
                  <CardHeader className="pb-4">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${
                      plan.highlighted ? 'gradient-primary glow-sm' : 'bg-white/5 border border-white/10'
                    }`}>
                      <Icon className={`w-4.5 h-4.5 ${plan.highlighted ? 'text-white' : 'text-muted-foreground'}`} />
                    </div>
                    <CardTitle className="text-xl text-foreground">{plan.name}</CardTitle>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-3xl font-bold text-foreground">{plan.price}</span>
                      <span className="text-muted-foreground text-sm">{plan.period}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{plan.description}</p>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col">
                    <ul className="space-y-2.5 mb-6 flex-1">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-center gap-2 text-sm text-foreground/80">
                          <Check className="w-4 h-4 text-primary flex-shrink-0" />
                          {f}
                        </li>
                      ))}
                    </ul>
                    <Button
                      className={`w-full font-semibold transition-all duration-200 ${
                        plan.highlighted
                          ? 'gradient-primary text-white glow-primary hover:opacity-90'
                          : 'border-white/10 hover:bg-white/5 text-foreground'
                      }`}
                      variant={plan.highlighted ? 'default' : 'outline'}
                      disabled={loading === plan.id}
                      onClick={() => handleSubscribe(plan.id)}
                    >
                      {loading === plan.id ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Redirecionando...
                        </div>
                      ) : plan.cta}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <p className="text-center text-sm text-muted-foreground">
            Pagamento seguro via Stripe. Cancele a qualquer momento.
          </p>
        </div>
      </div>
    </>
  );
}

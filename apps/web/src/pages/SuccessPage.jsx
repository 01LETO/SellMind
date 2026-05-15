import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { CheckCircle, Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabaseClient';

export default function SuccessPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [plan, setPlan] = useState(null);

  useEffect(() => {
    if (!sessionId) return;

    const fetchSession = async () => {
      try {
        const response = await fetch(`/api/stripe/session/${sessionId}`);
        if (!response.ok) return;
        const data = await response.json();
        if (data.planType) setPlan(data.planType);
      } catch {
        // silently ignore — UI still works without plan name
      }
    };

    fetchSession();
  }, [sessionId]);

  return (
    <>
      <Helmet>
        <title>Assinatura confirmada — SellMind</title>
      </Helmet>

      <div className="min-h-screen gradient-bg flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center animate-fade-in">
          <div className="w-20 h-20 rounded-full gradient-primary flex items-center justify-center mx-auto mb-6 glow-primary">
            <CheckCircle className="w-10 h-10 text-white" />
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs font-medium mb-4">
            <Sparkles className="w-3 h-3" />
            Pagamento confirmado
          </div>

          <h1 className="text-3xl font-bold text-foreground mb-3 tracking-tight">
            Bem-vindo ao{' '}
            <span className="gradient-primary-text">
              {plan ? `plano ${plan.charAt(0).toUpperCase() + plan.slice(1)}` : 'SellMind Pro'}
            </span>
            !
          </h1>

          <p className="text-muted-foreground mb-8">
            Sua assinatura está ativa. Agora você tem acesso completo para criar páginas de vendas com IA.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={() => navigate('/')}
              className="gradient-primary text-white glow-primary hover:opacity-90 transition-all font-semibold"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Gerar primeira página
            </Button>
            <Button
              variant="ghost"
              onClick={() => navigate('/dashboard')}
              className="text-muted-foreground hover:text-foreground hover:bg-white/5"
            >
              Ver dashboard
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

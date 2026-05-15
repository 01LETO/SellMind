import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { XCircle, ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function CancelPage() {
  const navigate = useNavigate();

  return (
    <>
      <Helmet>
        <title>Pagamento cancelado — SellMind</title>
      </Helmet>

      <div className="min-h-screen gradient-bg flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center animate-fade-in">
          <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-6">
            <XCircle className="w-10 h-10 text-muted-foreground" />
          </div>

          <h1 className="text-3xl font-bold text-foreground mb-3 tracking-tight">
            Pagamento cancelado
          </h1>

          <p className="text-muted-foreground mb-8">
            Nenhuma cobrança foi realizada. Você pode tentar novamente quando quiser.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={() => navigate('/pricing')}
              className="gradient-primary text-white glow-primary hover:opacity-90 transition-all font-semibold"
            >
              Ver planos
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button
              variant="ghost"
              onClick={() => navigate('/')}
              className="text-muted-foreground hover:text-foreground hover:bg-white/5"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar ao início
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

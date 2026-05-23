import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function UsageBanner({ used, limit, planType }) {
  const navigate = useNavigate();

  if (!limit || limit === Infinity || planType !== 'free') return null;

  const pct = used / limit;
  if (pct < 0.67) return null; // só mostra a partir de 67% (2/3)

  const isAtLimit = used >= limit;

  return (
    <div className={`border rounded-xl px-4 py-3 flex items-center justify-between gap-4 mb-6 ${
      isAtLimit
        ? 'bg-destructive/10 border-destructive/30'
        : 'bg-amber-500/10 border-amber-500/30'
    }`}>
      <div className="flex items-center gap-3">
        {isAtLimit
          ? <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
          : <Zap className="w-4 h-4 text-amber-400 shrink-0" />
        }
        <div>
          <p className={`text-sm font-medium ${isAtLimit ? 'text-destructive' : 'text-amber-400'}`}>
            {isAtLimit
              ? `Limite atingido — ${used}/${limit} páginas este mês`
              : `Quase no limite — ${used}/${limit} páginas usadas`
            }
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isAtLimit
              ? 'Faça upgrade para continuar gerando páginas sem limites.'
              : `Restam apenas ${limit - used} página${limit - used > 1 ? 's' : ''} no plano gratuito.`
            }
          </p>
        </div>
      </div>
      <Button
        size="sm"
        onClick={() => navigate('/pricing')}
        className={isAtLimit
          ? 'bg-destructive hover:bg-destructive/90 text-white shrink-0'
          : 'gradient-primary text-white glow-sm hover:opacity-90 shrink-0'
        }
      >
        <Zap className="w-3.5 h-3.5 mr-1.5" />
        Fazer upgrade
      </Button>
    </div>
  );
}

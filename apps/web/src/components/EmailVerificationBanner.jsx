import React, { useState } from 'react';
import { MailWarning } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export default function EmailVerificationBanner() {
  const { isEmailVerified, resendVerificationEmail } = useAuth();
  const [sending, setSending] = useState(false);

  if (isEmailVerified) return null;

  const handleResend = async () => {
    setSending(true);
    try {
      await resendVerificationEmail();
      toast({ title: 'E-mail enviado', description: 'Verifique sua caixa de entrada.' });
    } catch {
      toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível reenviar o e-mail.' });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="w-full bg-yellow-500/10 border-b border-yellow-500/20 px-4 py-2.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2 text-sm text-yellow-400">
          <MailWarning className="w-4 h-4 shrink-0" />
          <span>Confirme seu e-mail para usar todos os recursos.</span>
        </div>
        <Button
          size="sm"
          variant="outline"
          disabled={sending}
          onClick={handleResend}
          className="border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10 text-xs h-7"
        >
          {sending ? 'Enviando…' : 'Reenviar confirmação'}
        </Button>
      </div>
    </div>
  );
}

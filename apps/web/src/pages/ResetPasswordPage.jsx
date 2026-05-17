import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { ArrowLeft, Lock, Save, Loader2, AlertCircle } from 'lucide-react';
import Logo from '@/components/Logo';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';

const LINK_TIMEOUT_MS = 8000;
const MIN_PASSWORD_LENGTH = 8;

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [linkExpired, setLinkExpired] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setLinkExpired(true);
    }, LINK_TIMEOUT_MS);

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        clearTimeout(timeout);
        setReady(true);
      }
    });

    return () => {
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      toast({
        variant: 'destructive',
        title: 'Senha fraca',
        description: `A senha deve ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`,
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        variant: 'destructive',
        title: 'Senhas não coincidem',
        description: 'A nova senha e a confirmação devem ser iguais.',
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast({ title: 'Senha redefinida!', description: 'Sua senha foi atualizada com sucesso.' });
      navigate('/login');
    } catch (err) {
      toast({ variant: 'destructive', title: 'Erro', description: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Redefinir senha — SellMind</title>
      </Helmet>

      <div className="min-h-screen gradient-bg flex items-center justify-center px-4">
        <div className="w-full max-w-md animate-fade-in">
          <div className="flex justify-center mb-8">
            <Logo size={44} />
          </div>

          <Card className="glass border-white/8 shadow-card">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-foreground">Redefinir senha</CardTitle>
              <CardDescription>
                {ready
                  ? 'Digite sua nova senha abaixo.'
                  : linkExpired
                    ? 'Este link é inválido ou expirou.'
                    : 'Verificando link de recuperação...'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {linkExpired ? (
                <div className="space-y-4 text-center">
                  <div className="w-14 h-14 rounded-full bg-destructive/10 border border-destructive/20 flex items-center justify-center mx-auto">
                    <AlertCircle className="w-7 h-7 text-destructive" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    O link de recuperação expirou ou já foi utilizado. Solicite um novo link.
                  </p>
                  <Button
                    onClick={() => navigate('/forgot-password')}
                    className="w-full gradient-primary text-white h-11 font-semibold"
                  >
                    Solicitar novo link
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => navigate('/login')}
                    className="w-full text-muted-foreground hover:text-foreground hover:bg-white/5"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Voltar para o login
                  </Button>
                </div>
              ) : !ready ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="newPassword" className="text-sm text-foreground/80">Nova senha</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      placeholder={`Mínimo ${MIN_PASSWORD_LENGTH} caracteres`}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      minLength={MIN_PASSWORD_LENGTH}
                      className="bg-white/3 border-white/10 focus:border-primary/50 focus:ring-primary/20 placeholder:text-muted-foreground/50"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="confirmPassword" className="text-sm text-foreground/80">Confirmar nova senha</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Repita a nova senha"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="bg-white/3 border-white/10 focus:border-primary/50 focus:ring-primary/20 placeholder:text-muted-foreground/50"
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full gradient-primary text-white h-11 font-semibold glow-primary hover:opacity-90 transition-all"
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Salvando...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Lock className="w-4 h-4" />
                        Redefinir senha
                      </div>
                    )}
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => navigate('/login')}
                    className="w-full text-muted-foreground hover:text-foreground hover:bg-white/5"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Voltar para o login
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { ArrowLeft, Mail } from 'lucide-react';
import Logo from '@/components/Logo';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setSent(true);
    } catch (err) {
      toast({ variant: 'destructive', title: 'Erro', description: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Recuperar senha — SellMind</title>
      </Helmet>

      <div className="min-h-screen gradient-bg flex items-center justify-center px-4">
        <div className="w-full max-w-md animate-fade-in">
          <div className="flex justify-center mb-8">
            <Logo size={44} />
          </div>

          <Card className="glass border-white/8 shadow-card">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-foreground">Recuperar senha</CardTitle>
              <CardDescription>
                {sent
                  ? 'Verifique seu e-mail para continuar.'
                  : 'Digite seu e-mail para receber o link de redefinição.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {sent ? (
                <div className="text-center space-y-4">
                  <div className="w-14 h-14 rounded-full gradient-primary/20 border border-primary/20 flex items-center justify-center mx-auto">
                    <Mail className="w-7 h-7 text-primary" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Enviamos um link para <span className="text-foreground font-medium">{email}</span>. Clique no link para redefinir sua senha.
                  </p>
                  <Button variant="ghost" onClick={() => navigate('/login')}
                    className="text-muted-foreground hover:text-foreground hover:bg-white/5 w-full">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Voltar para o login
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-sm text-foreground/80">E-mail</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="bg-white/3 border-white/10 focus:border-primary/50 focus:ring-primary/20 placeholder:text-muted-foreground/50"
                    />
                  </div>
                  <Button type="submit" disabled={loading}
                    className="w-full gradient-primary text-white h-11 font-semibold glow-primary hover:opacity-90 transition-all">
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Enviando...
                      </div>
                    ) : 'Enviar link de recuperação'}
                  </Button>

                  <p className="text-center text-sm text-muted-foreground">
                    <Link to="/login" className="text-primary hover:text-primary/80 transition-colors flex items-center justify-center gap-1">
                      <ArrowLeft className="w-3 h-3" />
                      Voltar para o login
                    </Link>
                  </p>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

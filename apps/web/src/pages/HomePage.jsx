import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { Sparkles, LayoutDashboard, LogOut, MessageSquare } from 'lucide-react';
import Logo from '@/components/Logo';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { apiUrl } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import WelcomeModal from '@/components/WelcomeModal';
import UsageBanner from '@/components/UsageBanner';

const TONE_OPTIONS = [
  { value: 'profissional', label: 'Profissional' },
  { value: 'inspirador', label: 'Inspirador' },
  { value: 'urgente', label: 'Urgente' },
  { value: 'amigavel', label: 'Amigável' },
  { value: 'autoritativo', label: 'Autoritativo' },
  { value: 'emocional', label: 'Emocional' },
];

const PLAN_LIMITS = { free: 3, professional: 30, enterprise: Infinity };

export default function HomePage() {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [usage, setUsage] = useState({ used: 0, limit: 3, planType: 'free' });
  const [form, setForm] = useState({
    productName: '',
    targetAudience: '',
    mainPain: '',
    transformation: '',
    toneOfVoice: '',
  });

  useEffect(() => {
    if (!currentUser) return;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    Promise.all([
      supabase.from('profiles').select('plan_type').eq('user_id', currentUser.id).single(),
      supabase.from('pages').select('*', { count: 'exact', head: true })
        .eq('user_id', currentUser.id).gte('created_at', startOfMonth),
    ]).then(([{ data: profile }, { count }]) => {
      const planType = profile?.plan_type || 'free';
      setUsage({ used: count ?? 0, limit: PLAN_LIMITS[planType] ?? 3, planType });
    });
  }, [currentUser]);

  const handleChange = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));
  const handleSelect = (value) => setForm((prev) => ({ ...prev, toneOfVoice: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.toneOfVoice) {
      toast({ variant: 'destructive', title: 'Campo obrigatório', description: 'Selecione o tom de voz.' });
      return;
    }
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const response = await fetch(apiUrl('/api/pages/generate'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
        if (err.limitReached) {
          toast({ variant: 'destructive', title: 'Limite atingido', description: err.error });
          navigate('/pricing');
          return;
        }
        throw new Error(err.error || 'Falha ao gerar página');
      }

      const data = await response.json();
      navigate('/result', {
        state: {
          pageData: {
            html: data.html,
            metadata: {
              productName: form.productName,
              title: data.title,
              toneOfVoice: form.toneOfVoice,
              wordCount: data.wordCount,
              generatedAt: data.generatedAt,
              pageId: data.pageId,
            },
            formData: {
              targetAudience: form.targetAudience,
              mainPain: form.mainPain,
              transformation: form.transformation,
            },
          },
          saved: true,
        },
      });
    } catch (err) {
      toast({ variant: 'destructive', title: 'Erro ao gerar página', description: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <>
      <Helmet>
        <title>SellMind — Gerar Página de Vendas</title>
      </Helmet>

      <WelcomeModal />
      <div className="min-h-screen gradient-bg">
        {/* Header */}
        <div className="border-b border-white/5 bg-black/20 backdrop-blur-md sticky top-0 z-50">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center justify-between">
              <Logo />
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" onClick={() => navigate('/chat')}
                  className="text-muted-foreground hover:text-foreground hover:bg-white/5">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Chat IA
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
        </div>

        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <UsageBanner used={usage.used} limit={usage.limit} planType={usage.planType} />
          {/* Hero text */}
          <div className="text-center mb-10 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs font-medium mb-5">
              <Sparkles className="w-3 h-3" />
              Powered by Claude Opus
            </div>
            <h1 className="text-4xl font-bold mb-3 tracking-tight">
              Gere sua{' '}
              <span className="gradient-primary-text">Página de Vendas</span>
              {' '}com IA
            </h1>
            <p className="text-muted-foreground text-lg">
              Preencha as informações e receba uma landing page profissional em segundos.
            </p>
          </div>

          {/* Form card */}
          <Card className="glass border-white/8 shadow-card animate-slide-up">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg text-foreground">Informações do Produto</CardTitle>
              <CardDescription>Quanto mais detalhado, melhor será a página gerada.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-1.5">
                  <Label htmlFor="productName" className="text-sm text-foreground/80">Nome do produto / serviço *</Label>
                  <Input
                    id="productName"
                    placeholder="Ex: Curso de Marketing Digital, Consultoria Financeira..."
                    value={form.productName}
                    onChange={handleChange('productName')}
                    required
                    className="bg-white/3 border-white/10 focus:border-primary/50 focus:ring-primary/20 placeholder:text-muted-foreground/50"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="targetAudience" className="text-sm text-foreground/80">Público-alvo *</Label>
                  <Textarea
                    id="targetAudience"
                    placeholder="Ex: Empreendedores iniciantes que querem vender online mas não sabem por onde começar..."
                    value={form.targetAudience}
                    onChange={handleChange('targetAudience')}
                    required
                    rows={3}
                    className="bg-white/3 border-white/10 focus:border-primary/50 focus:ring-primary/20 placeholder:text-muted-foreground/50 resize-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="mainPain" className="text-sm text-foreground/80">Principal dor / problema *</Label>
                  <Textarea
                    id="mainPain"
                    placeholder="Ex: Perdem tempo tentando vender nas redes sociais sem resultado..."
                    value={form.mainPain}
                    onChange={handleChange('mainPain')}
                    required
                    rows={3}
                    className="bg-white/3 border-white/10 focus:border-primary/50 focus:ring-primary/20 placeholder:text-muted-foreground/50 resize-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="transformation" className="text-sm text-foreground/80">Transformação prometida *</Label>
                  <Textarea
                    id="transformation"
                    placeholder="Ex: Em 30 dias terão uma estratégia de vendas funcionando e seu primeiro cliente online..."
                    value={form.transformation}
                    onChange={handleChange('transformation')}
                    required
                    rows={3}
                    className="bg-white/3 border-white/10 focus:border-primary/50 focus:ring-primary/20 placeholder:text-muted-foreground/50 resize-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="toneOfVoice" className="text-sm text-foreground/80">Tom de voz *</Label>
                  <Select onValueChange={handleSelect} value={form.toneOfVoice}>
                    <SelectTrigger id="toneOfVoice"
                      className="bg-white/3 border-white/10 focus:border-primary/50 focus:ring-primary/20">
                      <SelectValue placeholder="Selecione o tom de voz..." />
                    </SelectTrigger>
                    <SelectContent className="bg-[#111827] border-white/10">
                      {TONE_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}
                          className="focus:bg-primary/20 focus:text-foreground">
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  type="submit"
                  className="w-full gradient-primary text-white h-12 text-base font-semibold glow-primary hover:opacity-90 transition-all duration-200"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Gerando sua página com IA...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5" />
                      Gerar Página de Vendas
                    </div>
                  )}
                </Button>

                {loading && (
                  <p className="text-center text-xs text-muted-foreground animate-pulse">
                    O Claude está criando sua página personalizada. Isso pode levar até 30 segundos...
                  </p>
                )}
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

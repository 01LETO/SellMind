import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { Sparkles, Zap, Shield, BarChart3, Download, MessageSquare, Check, ArrowRight, Star } from 'lucide-react';
import Logo from '@/components/Logo';
import { Button } from '@/components/ui/button';

const FEATURES = [
  {
    icon: Sparkles,
    title: 'IA de última geração',
    description: 'Powered by Claude Opus 4.7 da Anthropic — o modelo mais avançado para copywriting persuasivo.',
  },
  {
    icon: Zap,
    title: 'Pronto em segundos',
    description: 'Preencha as informações do seu produto e receba uma landing page completa em menos de 30 segundos.',
  },
  {
    icon: MessageSquare,
    title: 'Chat IA integrado',
    description: 'Tire dúvidas, refine sua copy e explore estratégias de vendas com o assistente de marketing.',
  },
  {
    icon: Download,
    title: 'Exporta em HTML',
    description: 'Baixe o código HTML pronto para publicar em qualquer plataforma, hospedagem ou WordPress.',
  },
  {
    icon: BarChart3,
    title: 'Histórico completo',
    description: 'Acesse todas as páginas que você criou, visualize, baixe ou exclua quando quiser.',
  },
  {
    icon: Shield,
    title: 'Seguro e privado',
    description: 'Seus dados ficam protegidos com autenticação Supabase e criptografia de ponta a ponta.',
  },
];

const TESTIMONIALS = [
  {
    name: 'Marcos Oliveira',
    role: 'Produtor de cursos online',
    text: 'Criei a página do meu curso em 2 minutos. Antes levava dias para fazer isso com um designer.',
    stars: 5,
  },
  {
    name: 'Ana Paula Lima',
    role: 'Coach de carreira',
    text: 'A copy ficou muito mais persuasiva do que eu conseguiria escrever sozinha. Minhas conversões aumentaram.',
    stars: 5,
  },
  {
    name: 'Rafael Santos',
    role: 'Consultor financeiro',
    text: 'Uso toda semana para testar diferentes abordagens. Economizo horas de trabalho com o SellMind.',
    stars: 5,
  },
];

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <>
      <Helmet>
        <title>SellMind — Gere Páginas de Vendas com IA em Segundos</title>
        <meta name="description" content="Crie landing pages profissionais com inteligência artificial. Powered by Claude Opus 4.7. Comece grátis." />
      </Helmet>

      <div className="min-h-screen gradient-bg">
        {/* Header */}
        <header className="border-b border-white/5 bg-black/20 backdrop-blur-md sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center justify-between">
              <Logo />
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => navigate('/login')}
                  className="text-muted-foreground hover:text-foreground hover:bg-white/5">
                  Entrar
                </Button>
                <Button size="sm" onClick={() => navigate('/signup')}
                  className="gradient-primary text-white glow-sm hover:opacity-90 transition-all">
                  Começar grátis
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Hero */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center animate-fade-in">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs font-medium mb-6">
            <Sparkles className="w-3 h-3" />
            Powered by Claude Opus 4.7
          </div>

          <h1 className="text-5xl sm:text-6xl font-bold mb-6 tracking-tight leading-tight">
            Páginas de vendas{' '}
            <span className="gradient-primary-text">profissionais</span>
            <br />
            criadas por IA em segundos
          </h1>

          <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
            Descreva seu produto e a IA cria uma landing page completa com copy persuasiva, pronta para publicar. Sem designer, sem agência.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Button
              onClick={() => navigate('/signup')}
              className="gradient-primary text-white h-12 px-8 text-base font-semibold glow-primary hover:opacity-90 transition-all"
            >
              <Sparkles className="w-5 h-5 mr-2" />
              Criar minha primeira página grátis
            </Button>
            <Button
              variant="ghost"
              onClick={() => navigate('/login')}
              className="h-12 px-8 text-base text-muted-foreground hover:text-foreground hover:bg-white/5 border border-white/10"
            >
              Já tenho conta
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>

          {/* Social proof */}
          <p className="text-sm text-muted-foreground">
            <span className="text-foreground font-medium">3 páginas grátis</span> por mês · Sem cartão de crédito · Cancele quando quiser
          </p>
        </section>

        {/* Features */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-foreground mb-3">
              Tudo que você precisa para{' '}
              <span className="gradient-primary-text">vender mais</span>
            </h2>
            <p className="text-muted-foreground text-lg">Ferramentas de IA pensadas para infoprodutores brasileiros.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((feature) => {
              const Icon = feature.icon;
              return (
                <div key={feature.title} className="glass border-white/8 rounded-xl p-6 hover:border-primary/20 transition-colors">
                  <div className="w-10 h-10 rounded-xl gradient-primary/20 border border-primary/20 flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Testimonials */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-foreground mb-3">
              Quem já usa o <span className="gradient-primary-text">SellMind</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="glass border-white/8 rounded-xl p-6">
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: t.stars }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                  ))}
                </div>
                <p className="text-sm text-foreground/80 leading-relaxed mb-4">&quot;{t.text}&quot;</p>
                <div>
                  <p className="text-sm font-semibold text-foreground">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Pricing */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-foreground mb-3">
              Planos <span className="gradient-primary-text">simples</span>
            </h2>
            <p className="text-muted-foreground">Comece grátis. Faça upgrade quando precisar de mais.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { name: 'Free', price: 'R$ 0', period: '/mês', features: ['3 páginas por mês', 'Chat IA', 'Download HTML'], highlighted: false, cta: 'Começar grátis' },
              { name: 'Professional', price: 'R$ 47', period: '/mês', features: ['30 páginas por mês', 'Chat IA ilimitado', 'Download HTML', 'Suporte por e-mail'], highlighted: true, cta: 'Assinar agora' },
              { name: 'Enterprise', price: 'R$ 147', period: '/mês', features: ['Páginas ilimitadas', 'Chat IA ilimitado', 'Download HTML', 'Suporte prioritário', 'API de integração'], highlighted: false, cta: 'Assinar agora' },
            ].map((plan) => (
              <div
                key={plan.name}
                className={`rounded-xl p-6 flex flex-col ${
                  plan.highlighted
                    ? 'border border-primary/40 bg-primary/5 shadow-[0_0_40px_rgba(139,92,246,0.1)]'
                    : 'glass border-white/8'
                }`}
              >
                {plan.highlighted && (
                  <span className="text-xs font-semibold gradient-primary text-white px-2.5 py-0.5 rounded-full self-start mb-3">
                    Mais popular
                  </span>
                )}
                <h3 className="font-bold text-lg text-foreground">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mt-1 mb-4">
                  <span className="text-3xl font-bold text-foreground">{plan.price}</span>
                  <span className="text-muted-foreground text-sm">{plan.period}</span>
                </div>
                <ul className="space-y-2.5 mb-6 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-foreground/80">
                      <Check className="w-4 h-4 text-primary flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  onClick={() => navigate('/signup')}
                  className={`w-full font-semibold transition-all ${
                    plan.highlighted
                      ? 'gradient-primary text-white glow-primary hover:opacity-90'
                      : 'border border-white/10 bg-transparent text-foreground hover:bg-white/5'
                  }`}
                  variant={plan.highlighted ? 'default' : 'outline'}
                >
                  {plan.cta}
                </Button>
              </div>
            ))}
          </div>
        </section>

        {/* CTA final */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="glass border-white/8 rounded-2xl p-12 text-center" style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.08) 0%, rgba(59,130,246,0.05) 100%)' }}>
            <h2 className="text-4xl font-bold text-foreground mb-4 tracking-tight">
              Pronto para criar sua{' '}
              <span className="gradient-primary-text">primeira página?</span>
            </h2>
            <p className="text-muted-foreground text-lg mb-8">
              Comece grátis. Sem cartão de crédito. Sua primeira página em menos de 1 minuto.
            </p>
            <Button
              onClick={() => navigate('/signup')}
              className="gradient-primary text-white h-12 px-10 text-base font-semibold glow-primary hover:opacity-90 transition-all"
            >
              <Sparkles className="w-5 h-5 mr-2" />
              Criar conta grátis agora
            </Button>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-white/5 py-8">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <Logo size={24} />
            <p className="text-xs text-muted-foreground">© 2026 SellMind. Todos os direitos reservados.</p>
            <div className="flex gap-4 text-xs text-muted-foreground">
              <button onClick={() => navigate('/pricing')} className="hover:text-foreground transition-colors">Planos</button>
              <button onClick={() => navigate('/login')} className="hover:text-foreground transition-colors">Entrar</button>
              <button onClick={() => navigate('/signup')} className="hover:text-foreground transition-colors">Criar conta</button>
              <button onClick={() => navigate('/terms')} className="hover:text-foreground transition-colors">Termos</button>
              <button onClick={() => navigate('/privacy')} className="hover:text-foreground transition-colors">Privacidade</button>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}

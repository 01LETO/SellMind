import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { Download, Eye, Trash2, Plus, LogOut, MessageSquare, Zap, CreditCard, Settings } from 'lucide-react';
import Logo from '@/components/Logo';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { toast } from '@/hooks/use-toast';
import { apiUrl } from '@/lib/api';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const [pages, setPages] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [currentUser]);

  const loadData = async () => {
    if (!currentUser) return;

    try {
      const [{ data: pagesData }, { data: profileData }] = await Promise.all([
        supabase
          .from('pages')
          .select('*')
          .eq('user_id', currentUser.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('profiles')
          .select('*')
          .eq('user_id', currentUser.id)
          .maybeSingle(),
      ]);

      setPages(pagesData ?? []);
      setProfile(profileData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleView = (page) => {
    navigate('/result', {
      state: {
        pageData: {
          html: page.html_content,
          metadata: {
            productName: page.product_name,
            title: page.title,
            toneOfVoice: page.tone_of_voice,
            wordCount: page.word_count,
            generatedAt: page.generated_at,
          },
          formData: {
            targetAudience: page.target_audience,
            mainPain: page.main_pain,
            transformation: page.transformation,
          },
        },
        saved: true,
      },
    });
  };

  const handleDownload = (page) => {
    const blob = new Blob([page.html_content], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${page.product_name.toLowerCase().replace(/\s+/g, '-')}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({ title: 'Download iniciado', description: 'Arquivo HTML baixado com sucesso' });
  };

  const handleDelete = async (pageId) => {
    const { error } = await supabase.from('pages').delete().eq('id', pageId);
    if (error) {
      toast({ variant: 'destructive', title: 'Erro ao excluir', description: 'Não foi possível excluir a página' });
      return;
    }
    setPages(pages.filter(p => p.id !== pageId));
    toast({ title: 'Página excluída', description: 'A página foi removida com sucesso' });
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const handleManageSubscription = async () => {
    try {
      const response = await fetch(apiUrl('/api/stripe/create-portal'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id }),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
        throw new Error(err.error);
      }
      const { url } = await response.json();
      window.location.href = url;
    } catch (err) {
      toast({ variant: 'destructive', title: 'Erro', description: err.message });
    }
  };

  const pagesThisMonth = pages.filter(p => {
    const pageDate = new Date(p.created_at);
    const now = new Date();
    return pageDate.getMonth() === now.getMonth() && pageDate.getFullYear() === now.getFullYear();
  }).length;

  const planLimits = { free: 3, professional: 30, enterprise: Infinity };
  const planType = profile?.plan_type || 'free';
  const limit = planLimits[planType];

  if (loading) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground text-sm">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Dashboard — SellMind</title>
        <meta name="description" content="Gerencie suas páginas de vendas criadas com IA" />
      </Helmet>

      <div className="min-h-screen gradient-bg">
        {/* Header */}
        <div className="border-b border-white/5 bg-black/20 backdrop-blur-md sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Logo />
                <span className="text-muted-foreground text-sm">/ Dashboard</span>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" onClick={() => navigate('/chat')}
                  className="text-muted-foreground hover:text-foreground hover:bg-white/5">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Chat IA
                </Button>
                <Button variant="ghost" size="sm" onClick={() => navigate('/')}
                  className="text-muted-foreground hover:text-foreground hover:bg-white/5">
                  <Plus className="w-4 h-4 mr-2" />
                  Nova página
                </Button>
                <Button variant="ghost" size="sm" onClick={() => navigate('/settings')}
                  className="text-muted-foreground hover:text-foreground hover:bg-white/5">
                  <Settings className="w-4 h-4 mr-2" />
                  Configurações
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

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card className="glass border-white/8 shadow-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground font-medium">Perfil</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-semibold text-foreground">{profile?.full_name || '—'}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{profile?.email || currentUser?.email}</p>
              </CardContent>
            </Card>

            <Card className="glass border-white/8 shadow-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground font-medium">Plano atual</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground capitalize">{planType}</span>
                  {planType === 'free' ? (
                    <span className="text-xs px-1.5 py-0.5 rounded-full border border-white/10 text-muted-foreground">Gratuito</span>
                  ) : (
                    <span className="text-xs px-1.5 py-0.5 rounded-full bg-primary/20 border border-primary/30 text-primary">Ativo</span>
                  )}
                </div>
                {planType === 'free' ? (
                  <button
                    onClick={() => navigate('/pricing')}
                    className="text-xs text-primary hover:text-primary/80 mt-1 transition-colors"
                  >
                    Fazer upgrade →
                  </button>
                ) : (
                  <button
                    onClick={handleManageSubscription}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mt-1 transition-colors"
                  >
                    <CreditCard className="w-3 h-3" />
                    Gerenciar assinatura
                  </button>
                )}
              </CardContent>
            </Card>

            <Card className="glass border-white/8 shadow-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground font-medium">Uso este mês</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-semibold text-foreground">
                  {pagesThisMonth} / {limit === Infinity ? '∞' : limit} páginas
                </p>
                <div className="mt-2 h-1.5 rounded-full bg-white/5 overflow-hidden">
                  <div
                    className="h-full rounded-full gradient-primary transition-all duration-500"
                    style={{ width: limit === Infinity ? '20%' : `${Math.min((pagesThisMonth / limit) * 100, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {limit === Infinity ? 'Ilimitado' : `${limit - pagesThisMonth} restantes`}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Pages table */}
          <Card className="glass border-white/8 shadow-card">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-foreground">Páginas criadas</CardTitle>
                  <p className="text-sm text-muted-foreground mt-0.5">Histórico de todas as suas páginas geradas</p>
                </div>
                <Button
                  onClick={() => navigate('/')}
                  className="gradient-primary text-white glow-primary hover:opacity-90 transition-all"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Nova página
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {pages.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-14 h-14 rounded-2xl gradient-primary/20 border border-primary/20 flex items-center justify-center mx-auto mb-4">
                    <Zap className="w-7 h-7 text-primary/60" />
                  </div>
                  <h3 className="text-base font-semibold text-foreground mb-1">Nenhuma página criada ainda</h3>
                  <p className="text-sm text-muted-foreground mb-5">Comece criando sua primeira página de vendas com IA</p>
                  <Button onClick={() => navigate('/')} className="gradient-primary text-white glow-primary hover:opacity-90 transition-all">
                    <Plus className="w-4 h-4 mr-2" />
                    Criar primeira página
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-white/5 hover:bg-transparent">
                        <TableHead className="text-muted-foreground">Produto</TableHead>
                        <TableHead className="text-muted-foreground">Tom de voz</TableHead>
                        <TableHead className="text-muted-foreground">Data</TableHead>
                        <TableHead className="text-right text-muted-foreground">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pages.map((page) => (
                        <TableRow key={page.id} className="border-white/5 hover:bg-white/2">
                          <TableCell className="font-medium text-foreground">{page.product_name}</TableCell>
                          <TableCell className="capitalize text-muted-foreground">{page.tone_of_voice}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {new Date(page.created_at).toLocaleDateString('pt-BR')}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleView(page)}
                                className="text-muted-foreground hover:text-foreground hover:bg-white/5 h-8 w-8 p-0"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDownload(page)}
                                className="text-muted-foreground hover:text-foreground hover:bg-white/5 h-8 w-8 p-0"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-8 w-8 p-0"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="glass border-white/10 bg-[#0d1220]">
                                  <AlertDialogHeader>
                                    <AlertDialogTitle className="text-foreground">Confirmar exclusão</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Tem certeza que deseja excluir esta página? Esta ação não pode ser desfeita.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel className="border-white/10 hover:bg-white/5">Cancelar</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDelete(page.id)}
                                      className="bg-destructive hover:bg-destructive/90"
                                    >
                                      Excluir
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

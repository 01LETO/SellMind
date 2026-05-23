import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { ArrowLeft, User, Lock, Trash2, LogOut, Save, Loader2 } from 'lucide-react';
import Logo from '@/components/Logo';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { toast } from '@/hooks/use-toast';

export default function SettingsPage() {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();

  const [fullName, setFullName] = useState(currentUser?.user_metadata?.full_name || '');
  const [loadingName, setLoadingName] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loadingPassword, setLoadingPassword] = useState(false);

  const handleUpdateName = async (e) => {
    e.preventDefault();
    if (!fullName.trim()) return;
    setLoadingName(true);
    try {
      const { error: authError } = await supabase.auth.updateUser({ data: { full_name: fullName } });
      if (authError) throw authError;

      const { error: profileError } = await supabase
        .from('profiles')
        .update({ full_name: fullName })
        .eq('user_id', currentUser.id);
      if (profileError) throw profileError;

      toast({ title: 'Nome atualizado com sucesso!' });
    } catch (err) {
      toast({ variant: 'destructive', title: 'Erro', description: err.message });
    } finally {
      setLoadingName(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast({ variant: 'destructive', title: 'Senhas não coincidem', description: 'A nova senha e a confirmação devem ser iguais.' });
      return;
    }
    if (newPassword.length < 8) {
      toast({ variant: 'destructive', title: 'Senha fraca', description: 'A senha deve ter pelo menos 8 caracteres.' });
      return;
    }
    if (!/[0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(newPassword)) {
      toast({ variant: 'destructive', title: 'Senha fraca', description: 'Use pelo menos um número ou símbolo (ex: 1, !, @).' });
      return;
    }
    setLoadingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast({ title: 'Senha atualizada com sucesso!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      toast({ variant: 'destructive', title: 'Erro', description: err.message });
    } finally {
      setLoadingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Sessão expirada. Faça login novamente.');

      const res = await fetch(`${import.meta.env.VITE_API_URL ?? '/hcgi/api'}/account`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Erro ao excluir conta.');
      }

      toast({ title: 'Conta excluída', description: 'Todos os seus dados foram removidos.' });
      await logout();
      navigate('/landing');
    } catch (err) {
      toast({ variant: 'destructive', title: 'Erro ao excluir conta', description: err.message });
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/landing');
  };

  return (
    <>
      <Helmet>
        <title>Configurações — SellMind</title>
      </Helmet>

      <div className="min-h-screen gradient-bg">
        {/* Header */}
        <div className="border-b border-white/5 bg-black/20 backdrop-blur-md sticky top-0 z-50">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}
                  className="text-muted-foreground hover:text-foreground hover:bg-white/5">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Dashboard
                </Button>
                <div className="border-l border-white/10 h-5" />
                <div className="flex items-center gap-2">
                  <Logo size={24} showText={false} />
                  <span className="text-sm font-semibold text-foreground">Configurações</span>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={handleLogout}
                className="text-muted-foreground hover:text-foreground hover:bg-white/5">
                <LogOut className="w-4 h-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-5">
          {/* Perfil */}
          <Card className="glass border-white/8 shadow-card">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-primary" />
                <CardTitle className="text-base text-foreground">Informações da conta</CardTitle>
              </div>
              <CardDescription>Atualize seu nome de exibição.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateName} className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-sm text-foreground/80">E-mail</Label>
                  <Input
                    value={currentUser?.email || ''}
                    disabled
                    className="bg-white/2 border-white/5 text-muted-foreground cursor-not-allowed"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="fullName" className="text-sm text-foreground/80">Nome completo</Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Seu nome"
                    className="bg-white/3 border-white/10 focus:border-primary/50 focus:ring-primary/20"
                  />
                </div>
                <Button type="submit" disabled={loadingName} size="sm"
                  className="gradient-primary text-white hover:opacity-90 transition-all">
                  {loadingName ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4 mr-2" />Salvar</>}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Senha */}
          <Card className="glass border-white/8 shadow-card">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-primary" />
                <CardTitle className="text-base text-foreground">Alterar senha</CardTitle>
              </div>
              <CardDescription>Defina uma nova senha para sua conta.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="newPassword" className="text-sm text-foreground/80">Nova senha</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    placeholder="Mínimo 6 caracteres"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    className="bg-white/3 border-white/10 focus:border-primary/50 focus:ring-primary/20"
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
                    className="bg-white/3 border-white/10 focus:border-primary/50 focus:ring-primary/20"
                  />
                </div>
                <Button type="submit" disabled={loadingPassword} size="sm"
                  className="gradient-primary text-white hover:opacity-90 transition-all">
                  {loadingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4 mr-2" />Atualizar senha</>}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Zona de perigo */}
          <Card className="border-destructive/20 bg-destructive/5 shadow-card">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <Trash2 className="w-4 h-4 text-destructive" />
                <CardTitle className="text-base text-destructive">Zona de perigo</CardTitle>
              </div>
              <CardDescription>Ações irreversíveis para sua conta.</CardDescription>
            </CardHeader>
            <CardContent>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm"
                    className="border-destructive/30 text-destructive hover:bg-destructive/10 hover:border-destructive/50">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Excluir minha conta
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="glass border-white/10 bg-[#0d1220]">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-foreground">Excluir conta permanentemente?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Todos os seus dados, páginas e histórico de chat serão excluídos. Esta ação não pode ser desfeita.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="border-white/10 hover:bg-white/5">Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteAccount} className="bg-destructive hover:bg-destructive/90">
                      Sim, excluir tudo
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { ArrowLeft, Eye, Users, TrendingUp, BarChart2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabaseClient';
import { apiUrl } from '@/lib/api';
import { toast } from '@/hooks/use-toast';

function StatCard({ icon: Icon, label, value, sub }) {
  return (
    <Card className="glass border-white/8 shadow-card">
      <CardContent className="pt-5">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 rounded-lg gradient-primary/20 border border-primary/20 flex items-center justify-center">
            <Icon className="w-4 h-4 text-primary" />
          </div>
          <span className="text-sm text-muted-foreground">{label}</span>
        </div>
        <p className="text-3xl font-bold text-foreground">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      </CardContent>
    </Card>
  );
}

function BarChart({ data }) {
  const max = Math.max(...data.map(d => d.views), 1);
  const last7 = data.slice(-7);

  return (
    <div>
      <div className="flex items-end gap-1.5 h-32">
        {data.map(({ day, views }) => (
          <div key={day} className="flex-1 flex flex-col items-center gap-1 group">
            <div className="relative w-full flex items-end justify-center">
              <div
                className="w-full rounded-t transition-all duration-300 bg-primary/40 group-hover:bg-primary/70"
                style={{ height: `${Math.max((views / max) * 128, views > 0 ? 4 : 1)}px` }}
                title={`${views} visualizações`}
              />
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-between mt-2 text-xs text-muted-foreground">
        <span>{data[0]?.day ? new Date(data[0].day + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) : ''}</span>
        <span className="text-center">Últimos 30 dias</span>
        <span>{data[data.length - 1]?.day ? new Date(data[data.length - 1].day + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) : ''}</span>
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const { pageId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const res = await fetch(apiUrl(`/api/pages/analytics/${pageId}`), {
          headers: { Authorization: `Bearer ${session?.access_token}` },
        });
        if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Erro');
        setData(await res.json());
      } catch (err) {
        toast({ variant: 'destructive', title: 'Erro', description: err.message });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [pageId]);

  return (
    <>
      <Helmet>
        <title>{data?.productName ? `Analytics — ${data.productName}` : 'Analytics'}</title>
      </Helmet>

      <div className="min-h-screen gradient-bg">
        <div className="border-b border-white/5 bg-black/20 backdrop-blur-md sticky top-0 z-50">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}
                className="text-muted-foreground hover:text-foreground hover:bg-white/5">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Dashboard
              </Button>
              <div className="border-l border-white/10 h-5" />
              <div className="flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-primary" />
                <h1 className="text-sm font-semibold text-foreground">
                  Analytics{data?.productName ? ` — ${data.productName}` : ''}
                </h1>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate(`/leads/${pageId}`)}
              className="text-muted-foreground hover:text-foreground hover:bg-white/5">
              <Users className="w-4 h-4 mr-2" />
              Ver leads
            </Button>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          {loading ? (
            <div className="flex justify-center py-24">
              <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
          ) : !data ? null : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                <StatCard icon={Eye} label="Visualizações totais" value={data.totalViews.toLocaleString('pt-BR')} sub="desde a criação da página" />
                <StatCard icon={Users} label="Leads capturados" value={data.totalLeads.toLocaleString('pt-BR')} sub="formulários preenchidos" />
                <StatCard icon={TrendingUp} label="Taxa de conversão" value={`${data.conversionRate}%`} sub="leads ÷ visualizações" />
              </div>

              <Card className="glass border-white/8 shadow-card">
                <CardHeader className="pb-4">
                  <CardTitle className="text-foreground text-base">Visualizações por dia</CardTitle>
                  <p className="text-sm text-muted-foreground">Últimos 30 dias</p>
                </CardHeader>
                <CardContent>
                  {data.viewsByDay.every(d => d.views === 0) ? (
                    <div className="text-center py-10">
                      <Eye className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                      <p className="text-sm text-muted-foreground">Nenhuma visualização ainda.</p>
                      <p className="text-xs text-muted-foreground mt-1">Compartilhe o link público da página para começar a receber visitas.</p>
                    </div>
                  ) : (
                    <BarChart data={data.viewsByDay} />
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </>
  );
}

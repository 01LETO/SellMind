import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { ArrowLeft, Download, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/lib/supabaseClient';
import { apiUrl } from '@/lib/api';
import { toast } from '@/hooks/use-toast';

export default function LeadsPage() {
  const { pageId } = useParams();
  const navigate = useNavigate();
  const [leads, setLeads] = useState([]);
  const [productName, setProductName] = useState('');
  const [loading, setLoading] = useState(true);
  const [columns, setColumns] = useState([]);

  useEffect(() => {
    loadLeads();
  }, [pageId]);

  const loadLeads = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const res = await fetch(apiUrl(`/api/leads/${pageId}`), {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Erro ao carregar leads');
      }

      const { leads: data, productName: name } = await res.json();
      setLeads(data);
      setProductName(name);

      // Derive columns from all lead data keys
      const allKeys = new Set();
      data.forEach((l) => Object.keys(l.data || {}).forEach((k) => allKeys.add(k)));
      setColumns([...allKeys]);
    } catch (err) {
      toast({ variant: 'destructive', title: 'Erro', description: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadCsv = () => {
    if (leads.length === 0) return;
    const headers = ['Data', ...columns];
    const rows = leads.map((l) => [
      new Date(l.created_at).toLocaleString('pt-BR'),
      ...columns.map((col) => `"${(l.data[col] ?? '').replace(/"/g, '""')}"`),
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leads-${productName.toLowerCase().replace(/\s+/g, '-')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <Helmet>
        <title>{productName ? `Leads — ${productName}` : 'Leads'}</title>
      </Helmet>

      <div className="min-h-screen gradient-bg">
        <div className="border-b border-white/5 bg-black/20 backdrop-blur-md sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/dashboard')}
                  className="text-muted-foreground hover:text-foreground hover:bg-white/5"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Dashboard
                </Button>
                <div className="border-l border-white/10 h-5" />
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" />
                  <h1 className="text-sm font-semibold text-foreground">
                    Leads{productName ? ` — ${productName}` : ''}
                  </h1>
                </div>
              </div>
              {leads.length > 0 && (
                <Button
                  size="sm"
                  onClick={handleDownloadCsv}
                  className="gradient-primary text-white glow-sm hover:opacity-90 transition-all"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Exportar CSV
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <Card className="glass border-white/8 shadow-card">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-foreground">Capturas de leads</CardTitle>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {leads.length === 0 ? 'Nenhum lead ainda' : `${leads.length} lead${leads.length > 1 ? 's' : ''} capturado${leads.length > 1 ? 's' : ''}`}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-16">
                  <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                </div>
              ) : leads.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-14 h-14 rounded-2xl gradient-primary/20 border border-primary/20 flex items-center justify-center mx-auto mb-4">
                    <Users className="w-7 h-7 text-primary/60" />
                  </div>
                  <h3 className="text-base font-semibold text-foreground mb-1">Nenhum lead ainda</h3>
                  <p className="text-sm text-muted-foreground">
                    Quando alguém preencher o formulário da sua página pública, aparecerá aqui.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-white/5 hover:bg-transparent">
                        <TableHead className="text-muted-foreground whitespace-nowrap">Data</TableHead>
                        {columns.map((col) => (
                          <TableHead key={col} className="text-muted-foreground capitalize whitespace-nowrap">
                            {col}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {leads.map((lead) => (
                        <TableRow key={lead.id} className="border-white/5 hover:bg-white/2">
                          <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                            {new Date(lead.created_at).toLocaleString('pt-BR')}
                          </TableCell>
                          {columns.map((col) => (
                            <TableCell key={col} className="text-foreground text-sm">
                              {lead.data[col] ?? '—'}
                            </TableCell>
                          ))}
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

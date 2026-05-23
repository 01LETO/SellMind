import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { ArrowLeft, Download, Copy, Eye, Code, Sparkles, Link2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';

export default function ResultPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const pageData = location.state?.pageData || null;

  const handleDownload = () => {
    if (!pageData) return;

    const blob = new Blob([pageData.html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${pageData.metadata.productName.toLowerCase().replace(/\s+/g, '-')}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({ title: 'Download iniciado', description: 'Arquivo HTML baixado com sucesso' });
  };

  const handleCopy = async () => {
    if (!pageData) return;

    try {
      await navigator.clipboard.writeText(pageData.html);
      toast({ title: 'Código copiado', description: 'HTML copiado para a área de transferência' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erro ao copiar', description: 'Não foi possível copiar o código' });
    }
  };

  const handleCopyLink = async () => {
    const pageId = pageData?.metadata?.pageId;
    if (!pageId) {
      toast({ variant: 'destructive', title: 'Link indisponível', description: 'Esta página não possui um link público.' });
      return;
    }
    const link = `${window.location.origin}/p/${pageId}`;
    try {
      await navigator.clipboard.writeText(link);
      toast({ title: 'Link copiado!', description: link });
    } catch {
      toast({ variant: 'destructive', title: 'Erro ao copiar link' });
    }
  };

  if (!pageData) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Nenhuma página para exibir</p>
          <Button onClick={() => navigate('/')} className="gradient-primary text-white">
            Criar nova página
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{`${pageData.metadata.productName} — Resultado`}</title>
        <meta name="description" content="Visualize e baixe sua página de vendas gerada por IA" />
      </Helmet>

      <div className="min-h-screen gradient-bg">
        {/* Header */}
        <div className="border-b border-white/5 bg-black/20 backdrop-blur-md sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/')}
                  className="text-muted-foreground hover:text-foreground hover:bg-white/5"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Nova página
                </Button>
                <div className="border-l border-white/10 h-5" />
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md gradient-primary flex items-center justify-center glow-sm">
                    <Sparkles className="w-3.5 h-3.5 text-white" />
                  </div>
                  <h1 className="text-sm font-semibold text-foreground">{pageData.metadata.productName}</h1>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopy}
                  className="text-muted-foreground hover:text-foreground hover:bg-white/5"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copiar HTML
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopyLink}
                  className="text-muted-foreground hover:text-foreground hover:bg-white/5"
                >
                  <Link2 className="w-4 h-4 mr-2" />
                  Copiar link
                </Button>
                <Button
                  size="sm"
                  onClick={handleDownload}
                  className="gradient-primary text-white glow-sm hover:opacity-90 transition-all"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Baixar HTML
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Tabs defaultValue="preview" className="w-full">
            <TabsList className="mb-4 bg-white/5 border border-white/8">
              <TabsTrigger value="preview" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
                <Eye className="w-4 h-4 mr-2" />
                Preview
              </TabsTrigger>
              <TabsTrigger value="code" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
                <Code className="w-4 h-4 mr-2" />
                Código HTML
              </TabsTrigger>
            </TabsList>

            <TabsContent value="preview" className="mt-0">
              <div className="border border-white/8 rounded-xl overflow-hidden shadow-card">
                <iframe
                  srcDoc={pageData.html}
                  className="w-full h-[calc(100vh-220px)] border-0"
                  title="Preview da página"
                  sandbox="allow-scripts allow-forms allow-popups"
                />
              </div>
            </TabsContent>

            <TabsContent value="code" className="mt-0">
              <div className="border border-white/8 rounded-xl overflow-hidden glass shadow-card">
                <pre className="p-6 overflow-x-auto text-xs leading-relaxed">
                  <code className="text-foreground/80">{pageData.html}</code>
                </pre>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
}

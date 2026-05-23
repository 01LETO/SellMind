import React from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import Logo from '@/components/Logo';

const EFFECTIVE_DATE = '22 de maio de 2026';
const RESPONSIBLE = '[SEU NOME COMPLETO]';
const CONTACT_EMAIL = '[SEU E-MAIL DE CONTATO]';

function Section({ title, children }) {
  return (
    <section className="mb-8">
      <h2 className="text-lg font-semibold text-foreground mb-3">{title}</h2>
      <div className="text-muted-foreground leading-relaxed space-y-3 text-sm">
        {children}
      </div>
    </section>
  );
}

export default function PrivacyPage() {
  return (
    <>
      <Helmet>
        <title>Política de Privacidade — SellMind</title>
        <meta name="description" content="Política de Privacidade do SellMind" />
      </Helmet>

      <div className="min-h-screen gradient-bg">
        <div className="border-b border-white/5 bg-black/20 backdrop-blur-md">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
            <Link to="/landing"><Logo size={32} /></Link>
            <Link to="/landing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              ← Voltar
            </Link>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
          <h1 className="text-3xl font-bold text-foreground mb-2">Política de Privacidade</h1>
          <p className="text-sm text-muted-foreground mb-10">Última atualização: {EFFECTIVE_DATE}</p>

          <Section title="1. Controlador dos Dados">
            <p>
              O controlador dos seus dados pessoais é <strong className="text-foreground">{RESPONSIBLE}</strong>,
              responsável pelo SellMind. Para questões relacionadas à privacidade, entre em contato
              pelo e-mail{' '}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary hover:text-primary/80 transition-colors">
                {CONTACT_EMAIL}
              </a>.
            </p>
            <p>
              Esta Política está em conformidade com a Lei Geral de Proteção de Dados Pessoais
              (LGPD — Lei n.º 13.709/2018).
            </p>
          </Section>

          <Section title="2. Dados que Coletamos">
            <p>Coletamos os seguintes dados pessoais:</p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li><strong className="text-foreground">Dados de cadastro:</strong> nome completo e endereço de e-mail</li>
              <li><strong className="text-foreground">Dados de pagamento:</strong> processados diretamente pelo Stripe — não armazenamos dados de cartão</li>
              <li><strong className="text-foreground">Conteúdo gerado:</strong> páginas de vendas e histórico do chat com IA criados por você</li>
              <li><strong className="text-foreground">Leads capturados:</strong> dados preenchidos por terceiros nos formulários das suas páginas públicas</li>
              <li><strong className="text-foreground">Dados de uso:</strong> logs de acesso e requisições para segurança e monitoramento</li>
            </ul>
          </Section>

          <Section title="3. Como Usamos seus Dados">
            <p>Utilizamos seus dados para:</p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li>Criar e gerenciar sua conta (base legal: execução de contrato)</li>
              <li>Processar pagamentos e emitir cobranças (base legal: execução de contrato)</li>
              <li>Enviar notificações de leads e comunicações sobre o serviço (base legal: legítimo interesse)</li>
              <li>Melhorar a plataforma e prevenir fraudes (base legal: legítimo interesse)</li>
              <li>Cumprir obrigações legais (base legal: cumprimento de obrigação legal)</li>
            </ul>
          </Section>

          <Section title="4. Compartilhamento de Dados">
            <p>
              Não vendemos seus dados. Compartilhamos somente com os seguintes prestadores de
              serviço, estritamente necessários para operar a plataforma:
            </p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li><strong className="text-foreground">Supabase</strong> — banco de dados e autenticação (EUA, cláusulas contratuais padrão)</li>
              <li><strong className="text-foreground">Stripe</strong> — processamento de pagamentos (EUA, certificação PCI-DSS)</li>
              <li><strong className="text-foreground">Anthropic</strong> — geração de conteúdo por IA (EUA, dados de prompt não armazenados além do necessário)</li>
              <li><strong className="text-foreground">Railway</strong> — hospedagem da API (EUA)</li>
            </ul>
            <p>
              Transferências internacionais ocorrem com base nas salvaguardas adequadas previstas
              no art. 33 da LGPD.
            </p>
          </Section>

          <Section title="5. Retenção de Dados">
            <p>
              Mantemos seus dados enquanto sua conta estiver ativa. Após o encerramento da conta,
              excluímos seus dados em até 30 dias, exceto quando a retenção for exigida por
              obrigação legal (ex: registros fiscais de pagamento, retidos por 5 anos).
            </p>
            <p>
              Dados de leads capturados nas suas páginas são excluídos junto com a página
              correspondente quando você a deleta, ou quando você exclui sua conta.
            </p>
          </Section>

          <Section title="6. Seus Direitos (LGPD)">
            <p>Você tem os seguintes direitos sobre seus dados pessoais:</p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li><strong className="text-foreground">Acesso:</strong> solicitar cópia dos dados que temos sobre você</li>
              <li><strong className="text-foreground">Correção:</strong> corrigir dados incompletos ou incorretos</li>
              <li><strong className="text-foreground">Exclusão:</strong> excluir sua conta e dados pelo painel de Configurações</li>
              <li><strong className="text-foreground">Portabilidade:</strong> receber seus dados em formato estruturado</li>
              <li><strong className="text-foreground">Oposição:</strong> opor-se ao tratamento baseado em legítimo interesse</li>
              <li><strong className="text-foreground">Revogação:</strong> revogar consentimento quando aplicável</li>
            </ul>
            <p>
              Para exercer qualquer um desses direitos, entre em contato pelo e-mail{' '}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary hover:text-primary/80 transition-colors">
                {CONTACT_EMAIL}
              </a>. Responderemos em até 15 dias úteis.
            </p>
          </Section>

          <Section title="7. Segurança">
            <p>
              Adotamos medidas técnicas e organizacionais para proteger seus dados, incluindo
              comunicações criptografadas (HTTPS/TLS), controles de acesso, autenticação segura
              e monitoramento de segurança. Nenhum sistema é 100% seguro; em caso de incidente,
              notificaremos os titulares afetados conforme exigido pela LGPD.
            </p>
          </Section>

          <Section title="8. Cookies">
            <p>
              Utilizamos apenas cookies essenciais para manter sua sessão autenticada.
              Não utilizamos cookies de rastreamento ou publicidade de terceiros.
            </p>
          </Section>

          <Section title="9. Alterações nesta Política">
            <p>
              Podemos atualizar esta Política periodicamente. Notificaremos por e-mail sobre
              mudanças materiais com pelo menos 15 dias de antecedência. A data de "última
              atualização" no topo sempre refletirá a versão vigente.
            </p>
          </Section>

          <Section title="10. Contato e ANPD">
            <p>
              Para dúvidas, solicitações ou reclamações relacionadas à privacidade:{' '}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary hover:text-primary/80 transition-colors">
                {CONTACT_EMAIL}
              </a>
            </p>
            <p>
              Você também pode apresentar reclamação à Autoridade Nacional de Proteção de
              Dados (ANPD) em{' '}
              <a href="https://www.gov.br/anpd" target="_blank" rel="noopener noreferrer"
                className="text-primary hover:text-primary/80 transition-colors">
                www.gov.br/anpd
              </a>.
            </p>
          </Section>

          <div className="border-t border-white/8 pt-8 flex items-center justify-between text-sm text-muted-foreground">
            <Link to="/terms" className="hover:text-foreground transition-colors">Termos de Uso</Link>
            <Link to="/landing" className="hover:text-foreground transition-colors">← Voltar ao início</Link>
          </div>
        </div>
      </div>
    </>
  );
}

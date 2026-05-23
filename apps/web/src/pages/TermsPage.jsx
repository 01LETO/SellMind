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

export default function TermsPage() {
  return (
    <>
      <Helmet>
        <title>Termos de Uso — SellMind</title>
        <meta name="description" content="Termos de Uso do SellMind" />
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
          <h1 className="text-3xl font-bold text-foreground mb-2">Termos de Uso</h1>
          <p className="text-sm text-muted-foreground mb-10">Última atualização: {EFFECTIVE_DATE}</p>

          <Section title="1. Aceitação dos Termos">
            <p>
              Ao acessar ou usar o SellMind ("Serviço"), você concorda com estes Termos de Uso.
              Se não concordar com qualquer parte destes termos, não utilize o Serviço.
            </p>
            <p>
              O Serviço é operado por <strong className="text-foreground">{RESPONSIBLE}</strong>,
              pessoa física, doravante denominado "nós" ou "SellMind".
            </p>
          </Section>

          <Section title="2. Descrição do Serviço">
            <p>
              O SellMind é uma plataforma de geração de páginas de vendas (landing pages) por
              Inteligência Artificial. O Serviço permite criar, hospedar e compartilhar páginas
              de vendas, além de capturar leads por meio de formulários integrados.
            </p>
            <p>
              O conteúdo gerado pela IA é baseado nas informações fornecidas pelo usuário.
              Não garantimos resultados comerciais específicos decorrentes do uso das páginas geradas.
            </p>
          </Section>

          <Section title="3. Elegibilidade">
            <p>
              Você deve ter pelo menos 18 anos para usar o Serviço. Ao criar uma conta, você
              declara e garante que as informações fornecidas são verdadeiras e que possui
              capacidade legal para celebrar este contrato.
            </p>
          </Section>

          <Section title="4. Conta e Segurança">
            <p>
              Você é responsável por manter a confidencialidade da sua senha e por todas as
              atividades realizadas na sua conta. Notifique-nos imediatamente em caso de uso
              não autorizado em {CONTACT_EMAIL}.
            </p>
            <p>
              Reservamos o direito de encerrar contas que violem estes Termos, sem aviso prévio.
            </p>
          </Section>

          <Section title="5. Planos e Pagamentos">
            <p>
              O SellMind oferece planos gratuito e pagos. Os planos pagos são cobrados de forma
              recorrente (mensal ou anual) via cartão de crédito, processados pelo Stripe.
            </p>
            <p>
              Os valores dos planos estão descritos na página de Preços e podem ser alterados
              com aviso prévio de 30 dias. Cobranças já realizadas não são reembolsadas,
              exceto conforme exigido por lei.
            </p>
            <p>
              Você pode cancelar sua assinatura a qualquer momento pelo painel de configurações.
              O acesso ao plano pago permanece ativo até o fim do período já pago.
            </p>
          </Section>

          <Section title="6. Uso Permitido e Proibido">
            <p>Você concorda em não usar o Serviço para:</p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li>Criar páginas com conteúdo ilegal, enganoso ou fraudulento</li>
              <li>Violar direitos de propriedade intelectual de terceiros</li>
              <li>Enviar spam ou comunicações não solicitadas</li>
              <li>Tentar comprometer a segurança ou integridade da plataforma</li>
              <li>Revender ou sublicenciar o acesso ao Serviço sem autorização</li>
            </ul>
          </Section>

          <Section title="7. Propriedade Intelectual">
            <p>
              O conteúdo gerado pela IA a partir das suas informações pertence a você.
              Você nos concede uma licença limitada para hospedar e exibir esse conteúdo
              conforme necessário para prestar o Serviço.
            </p>
            <p>
              A marca, logotipo, código e demais elementos do SellMind são de nossa propriedade
              e não podem ser reproduzidos sem autorização expressa.
            </p>
          </Section>

          <Section title="8. Limitação de Responsabilidade">
            <p>
              O Serviço é fornecido "como está". Não garantimos disponibilidade ininterrupta
              ou que o conteúdo gerado por IA seja adequado para qualquer finalidade específica.
            </p>
            <p>
              Em nenhuma hipótese nossa responsabilidade total excederá o valor pago pelo
              usuário nos últimos 12 meses. Não somos responsáveis por lucros cessantes,
              danos indiretos ou consequenciais.
            </p>
          </Section>

          <Section title="9. Alterações nos Termos">
            <p>
              Podemos atualizar estes Termos periodicamente. Notificaremos usuários sobre
              mudanças materiais por e-mail ou aviso na plataforma com pelo menos 15 dias
              de antecedência. O uso continuado após a vigência das alterações implica aceitação.
            </p>
          </Section>

          <Section title="10. Lei Aplicável e Foro">
            <p>
              Estes Termos são regidos pelas leis da República Federativa do Brasil.
              Fica eleito o foro da comarca de domicílio do usuário para dirimir quaisquer
              controvérsias decorrentes deste instrumento.
            </p>
          </Section>

          <Section title="11. Contato">
            <p>
              Para dúvidas sobre estes Termos, entre em contato pelo e-mail:{' '}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary hover:text-primary/80 transition-colors">
                {CONTACT_EMAIL}
              </a>
            </p>
          </Section>

          <div className="border-t border-white/8 pt-8 flex items-center justify-between text-sm text-muted-foreground">
            <Link to="/privacy" className="hover:text-foreground transition-colors">Política de Privacidade</Link>
            <Link to="/landing" className="hover:text-foreground transition-colors">← Voltar ao início</Link>
          </div>
        </div>
      </div>
    </>
  );
}

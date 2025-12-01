import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import Breadcrumbs from "@/components/Breadcrumbs";
import { useEffect } from "react";

const PrivacyPolicy = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = "Política de Privacidade | Elys - Proteção de Dados LGPD";
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <Breadcrumbs />

      <main id="main-content" className="container mx-auto px-4 py-24 max-w-4xl">
        {/* Header */}
        <header className="mb-8 md:mb-12">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
            Política de <span className="gradient-text">Privacidade</span>
          </h1>
          <p className="text-muted-foreground text-base sm:text-lg">
            Última atualização:{" "}
            {new Date().toLocaleDateString("pt-BR", {
              day: "2-digit",
              month: "long",
              year: "numeric",
            })}
          </p>
          <p className="text-muted-foreground mt-2">
            Esta Política de Privacidade está em conformidade com a Lei Geral de Proteção de Dados
            (LGPD - Lei nº 13.709/2018)
          </p>
        </header>

        {/* Content */}
        <article className="prose prose-lg max-w-none space-y-8">
          {/* Section 1 */}
          <section>
            <h2 className="text-2xl font-bold mb-4 text-foreground">1. Informações Gerais</h2>
            <p className="text-muted-foreground leading-relaxed">
              A <strong>Elys</strong> ("nós", "nosso" ou "nossa") respeita a sua privacidade e está
              comprometida em proteger seus dados pessoais. Esta política de privacidade explica
              como coletamos, usamos, armazenamos e protegemos suas informações quando você visita
              nosso website <strong>elys.com.br</strong> ou utiliza nossos serviços.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-4">
              Ao utilizar nossos serviços, você concorda com a coleta e uso de informações de acordo
              com esta política.
            </p>
          </section>

          {/* Section 2 */}
          <section>
            <h2 className="text-2xl font-bold mb-4 text-foreground">
              2. Responsável pelo Tratamento de Dados
            </h2>
            <div className="bg-muted/50 p-6 rounded-lg border border-border">
              <p className="text-muted-foreground mb-2">
                <strong>Nome Empresarial:</strong> Elys (Microempreendedor Individual)
              </p>
              <p className="text-muted-foreground mb-2">
                <strong>Atividade:</strong> Desenvolvimento de Software e Consultoria em TI
              </p>
              <p className="text-muted-foreground mb-2">
                <strong>E-mail:</strong> contato@elys.com.br
              </p>
              <p className="text-muted-foreground mb-2">
                <strong>Telefone:</strong> +55 (31) 9973-8235
              </p>
              <p className="text-muted-foreground mb-2">
                <strong>Localização:</strong> Brasil (atendimento 100% remoto)
              </p>
              <p className="text-muted-foreground">
                <strong>Encarregado de Dados:</strong> contato@elys.com.br
              </p>
            </div>
            <p className="text-sm text-muted-foreground mt-4 italic bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              ℹ️ <strong>Importante:</strong> Somos um Microempreendedor Individual (MEI) que opera
              100% remotamente. Não possuímos endereço físico comercial. Todos os nossos serviços
              são prestados de forma digital e remota em todo o território nacional.
            </p>
          </section>

          {/* Section 3 */}
          <section>
            <h2 className="text-2xl font-bold mb-4 text-foreground">3. Dados Coletados</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Coletamos diferentes tipos de dados para diversos fins, visando fornecer e melhorar
              nossos serviços:
            </p>

            <h3 className="text-xl font-semibold mb-3 text-foreground">
              3.1 Dados Pessoais Fornecidos por Você
            </h3>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
              <li>
                <strong>Nome completo</strong>
              </li>
              <li>
                <strong>Endereço de e-mail</strong>
              </li>
              <li>
                <strong>Telefone</strong>
              </li>
              <li>
                <strong>Nome da empresa</strong> (opcional)
              </li>
              <li>
                <strong>Mensagens e informações</strong> enviadas através de formulários de contato
              </li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6 text-foreground">
              3.2 Dados Coletados Automaticamente
            </h3>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
              <li>
                <strong>Endereço IP</strong>
              </li>
              <li>
                <strong>Tipo de navegador e versão</strong>
              </li>
              <li>
                <strong>Sistema operacional</strong>
              </li>
              <li>
                <strong>Páginas visitadas e tempo de permanência</strong>
              </li>
              <li>
                <strong>Data e hora de acesso</strong>
              </li>
              <li>
                <strong>URL de referência</strong>
              </li>
              <li>
                <strong>Cookies e tecnologias similares</strong> (veja nossa Política de Cookies)
              </li>
            </ul>
          </section>

          {/* Section 4 */}
          <section>
            <h2 className="text-2xl font-bold mb-4 text-foreground">
              4. Finalidade do Tratamento de Dados
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Utilizamos seus dados pessoais para as seguintes finalidades:
            </p>
            <div className="space-y-4">
              <div className="border-l-4 border-primary pl-4">
                <h4 className="font-semibold text-foreground">Prestação de Serviços</h4>
                <p className="text-muted-foreground">
                  Responder solicitações, fornecer orçamentos e executar contratos de
                  desenvolvimento de software.
                </p>
              </div>
              <div className="border-l-4 border-primary pl-4">
                <h4 className="font-semibold text-foreground">Comunicação</h4>
                <p className="text-muted-foreground">
                  Enviar respostas a consultas, atualizações sobre projetos e informações
                  importantes sobre nossos serviços.
                </p>
              </div>
              <div className="border-l-4 border-primary pl-4">
                <h4 className="font-semibold text-foreground">Melhorias e Análises</h4>
                <p className="text-muted-foreground">
                  Analisar o uso do website para melhorar a experiência do usuário e otimizar nossos
                  serviços.
                </p>
              </div>
              <div className="border-l-4 border-primary pl-4">
                <h4 className="font-semibold text-foreground">Marketing</h4>
                <p className="text-muted-foreground">
                  Enviar newsletters e materiais promocionais (apenas com seu consentimento
                  explícito).
                </p>
              </div>
              <div className="border-l-4 border-primary pl-4">
                <h4 className="font-semibold text-foreground">Segurança</h4>
                <p className="text-muted-foreground">
                  Prevenir fraudes, ataques e garantir a segurança de nossos sistemas.
                </p>
              </div>
              <div className="border-l-4 border-primary pl-4">
                <h4 className="font-semibold text-foreground">Cumprimento Legal</h4>
                <p className="text-muted-foreground">
                  Cumprir obrigações legais, regulatórias e contratuais.
                </p>
              </div>
            </div>
          </section>

          {/* Section 5 */}
          <section>
            <h2 className="text-2xl font-bold mb-4 text-foreground">
              5. Base Legal para Tratamento de Dados (LGPD)
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              O tratamento de seus dados pessoais é realizado com base nas seguintes hipóteses
              legais previstas na LGPD:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
              <li>
                <strong>Consentimento:</strong> Quando você fornece seus dados voluntariamente
                através de formulários
              </li>
              <li>
                <strong>Execução de contrato:</strong> Para prestação de serviços contratados
              </li>
              <li>
                <strong>Legítimo interesse:</strong> Para análises, melhorias de serviços e
                comunicação relacionada ao negócio
              </li>
              <li>
                <strong>Cumprimento de obrigação legal:</strong> Quando exigido por lei ou
                regulamentação
              </li>
            </ul>
          </section>

          {/* Section 6 */}
          <section>
            <h2 className="text-2xl font-bold mb-4 text-foreground">
              6. Compartilhamento de Dados
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              A Elys não vende, aluga ou compartilha seus dados pessoais com terceiros, exceto nas
              seguintes situações:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
              <li>
                <strong>Prestadores de Serviços:</strong> Compartilhamos dados com parceiros que nos
                auxiliam (hospedagem, análise de dados, ferramentas de e-mail), sempre sob contratos
                de confidencialidade
              </li>
              <li>
                <strong>Obrigações Legais:</strong> Quando exigido por lei, ordem judicial ou
                autoridade competente
              </li>
              <li>
                <strong>Proteção de Direitos:</strong> Para proteger nossos direitos, propriedade,
                segurança ou de terceiros
              </li>
              <li>
                <strong>Consentimento:</strong> Com sua autorização expressa para outros fins
              </li>
            </ul>
          </section>

          {/* Section 7 */}
          <section>
            <h2 className="text-2xl font-bold mb-4 text-foreground">
              7. Armazenamento e Segurança
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Implementamos medidas técnicas e organizacionais adequadas para proteger seus dados
              pessoais:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
              <li>
                <strong>Criptografia:</strong> Dados em trânsito protegidos por SSL/TLS
              </li>
              <li>
                <strong>Controle de Acesso:</strong> Acesso restrito apenas a colaboradores
                autorizados
              </li>
              <li>
                <strong>Servidores Seguros:</strong> Armazenamento em servidores confiáveis com
                backups regulares
              </li>
              <li>
                <strong>Monitoramento:</strong> Sistemas de detecção e prevenção de ataques
              </li>
              <li>
                <strong>Retenção de Dados:</strong> Mantemos seus dados apenas pelo tempo necessário
                para as finalidades descritas ou conforme exigido por lei
              </li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4 bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <strong>Importante:</strong> Nenhum método de transmissão ou armazenamento eletrônico
              é 100% seguro. Embora nos esforcemos para proteger seus dados, não podemos garantir
              segurança absoluta.
            </p>
          </section>

          {/* Section 8 */}
          <section>
            <h2 className="text-2xl font-bold mb-4 text-foreground">8. Seus Direitos (LGPD)</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              De acordo com a LGPD, você possui os seguintes direitos em relação aos seus dados
              pessoais:
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
                <h4 className="font-semibold text-foreground mb-2">✓ Confirmação e Acesso</h4>
                <p className="text-sm text-muted-foreground">
                  Confirmar se tratamos seus dados e solicitar acesso a eles
                </p>
              </div>
              <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
                <h4 className="font-semibold text-foreground mb-2">✓ Correção</h4>
                <p className="text-sm text-muted-foreground">
                  Solicitar correção de dados incompletos, inexatos ou desatualizados
                </p>
              </div>
              <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
                <h4 className="font-semibold text-foreground mb-2">✓ Anonimização ou Bloqueio</h4>
                <p className="text-sm text-muted-foreground">
                  Solicitar anonimização ou bloqueio de dados desnecessários
                </p>
              </div>
              <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
                <h4 className="font-semibold text-foreground mb-2">✓ Eliminação</h4>
                <p className="text-sm text-muted-foreground">
                  Solicitar exclusão de dados tratados com seu consentimento
                </p>
              </div>
              <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
                <h4 className="font-semibold text-foreground mb-2">✓ Portabilidade</h4>
                <p className="text-sm text-muted-foreground">
                  Solicitar portabilidade dos dados a outro fornecedor
                </p>
              </div>
              <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
                <h4 className="font-semibold text-foreground mb-2">✓ Informação</h4>
                <p className="text-sm text-muted-foreground">
                  Saber sobre entidades com as quais compartilhamos dados
                </p>
              </div>
              <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
                <h4 className="font-semibold text-foreground mb-2">✓ Revogação</h4>
                <p className="text-sm text-muted-foreground">
                  Revogar consentimento a qualquer momento
                </p>
              </div>
              <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
                <h4 className="font-semibold text-foreground mb-2">✓ Oposição</h4>
                <p className="text-sm text-muted-foreground">
                  Opor-se a tratamento realizado sem consentimento
                </p>
              </div>
            </div>
            <p className="text-muted-foreground leading-relaxed mt-6">
              Para exercer qualquer destes direitos, entre em contato conosco através do e-mail{" "}
              <strong>dpo@elys.com.br</strong> ou pelo telefone <strong>+55 (31) 9973-8235</strong>.
              Responderemos sua solicitação em até 15 dias.
            </p>
          </section>

          {/* Section 9 */}
          <section>
            <h2 className="text-2xl font-bold mb-4 text-foreground">
              9. Cookies e Tecnologias Similares
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Utilizamos cookies e tecnologias similares para melhorar sua experiência em nosso
              website. Para informações detalhadas sobre como usamos cookies, consulte nossa{" "}
              <a href="/cookie-policy" className="text-primary hover:underline font-semibold">
                Política de Cookies
              </a>
              .
            </p>
          </section>

          {/* Section 10 */}
          <section>
            <h2 className="text-2xl font-bold mb-4 text-foreground">
              10. Transferência Internacional de Dados
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Alguns de nossos prestadores de serviço podem estar localizados fora do Brasil. Nestes
              casos, garantimos que a transferência seja realizada em conformidade com a LGPD e que
              sejam adotadas medidas adequadas de proteção de dados, incluindo cláusulas contratuais
              padrão e certificações de segurança.
            </p>
          </section>

          {/* Section 11 */}
          <section>
            <h2 className="text-2xl font-bold mb-4 text-foreground">11. Menores de Idade</h2>
            <p className="text-muted-foreground leading-relaxed">
              Nossos serviços são direcionados a empresas e profissionais. Não coletamos
              intencionalmente dados pessoais de menores de 18 anos sem o consentimento dos pais ou
              responsáveis legais. Se tomarmos conhecimento de que coletamos dados de menores sem
              consentimento, tomaremos medidas para eliminar essas informações.
            </p>
          </section>

          {/* Section 12 */}
          <section>
            <h2 className="text-2xl font-bold mb-4 text-foreground">
              12. Alterações nesta Política
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Podemos atualizar nossa Política de Privacidade periodicamente. Notificaremos sobre
              quaisquer mudanças publicando a nova política nesta página e atualizando a data de
              "Última atualização". Recomendamos revisar esta política periodicamente para se manter
              informado sobre como protegemos seus dados.
            </p>
          </section>

          {/* Section 13 */}
          <section>
            <h2 className="text-2xl font-bold mb-4 text-foreground">13. Contato</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Se você tiver dúvidas sobre esta Política de Privacidade ou sobre como tratamos seus
              dados pessoais, entre em contato conosco:
            </p>
            <div className="bg-gradient-to-br from-primary/10 to-secondary/10 p-6 rounded-lg border border-primary/20">
              <p className="text-muted-foreground mb-2">
                <strong>E-mail:</strong>{" "}
                <a href="mailto:contato@elys.com.br" className="text-primary hover:underline">
                  contato@elys.com.br
                </a>
              </p>
              <p className="text-muted-foreground mb-2">
                <strong>Telefone/WhatsApp:</strong>{" "}
                <a href="tel:+5531997382235" className="text-primary hover:underline">
                  +55 (31) 9973-8235
                </a>
              </p>
              <p className="text-muted-foreground mb-2">
                <strong>Atendimento:</strong> 100% Remoto (todo o Brasil)
              </p>
              <p className="text-muted-foreground">
                <strong>Horário de atendimento:</strong> Segunda a Sexta, 8h às 18h
              </p>
            </div>
          </section>

          {/* Section 14 */}
          <section>
            <h2 className="text-2xl font-bold mb-4 text-foreground">
              14. Autoridade Nacional de Proteção de Dados (ANPD)
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Caso considere que seus direitos não foram atendidos adequadamente, você pode contatar
              a Autoridade Nacional de Proteção de Dados (ANPD):
            </p>
            <p className="text-muted-foreground mt-4">
              Website:{" "}
              <a
                href="https://www.gov.br/anpd"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                www.gov.br/anpd
              </a>
            </p>
          </section>
        </article>

        {/* CTA Section */}
        <div className="mt-16 p-8 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-2xl border border-primary/20 text-center">
          <h3 className="text-2xl font-bold mb-4">Dúvidas sobre seus dados?</h3>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Nossa equipe está pronta para esclarecer qualquer questão sobre como protegemos e
            tratamos suas informações pessoais.
          </p>
          <a
            href="/#contact"
            className="inline-flex items-center px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-all hover:shadow-lg font-semibold"
          >
            Fale Conosco
          </a>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PrivacyPolicy;

import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import Breadcrumbs from "@/components/Breadcrumbs";
import { useEffect } from "react";

const PrivacyPolicy = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = "Politica de Privacidade | Elkys - Protecao de Dados LGPD";
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <Breadcrumbs />

      <main id="main-content" className="container mx-auto px-4 py-24 max-w-4xl">
        <header className="mb-12 border-b border-border pb-8">
          <p className="text-sm font-medium text-primary uppercase tracking-wider mb-2">
            Documento Legal
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold mb-4 text-foreground">
            Politica de Privacidade
          </h1>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm text-muted-foreground">
            <span>
              Vigencia:{" "}
              {new Date().toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            </span>
            <span className="hidden sm:inline">|</span>
            <span>Em conformidade com a LGPD (Lei n. 13.709/2018)</span>
          </div>
        </header>

        <article className="prose prose-lg max-w-none">
          <section className="mb-10">
            <h2 className="text-xl font-semibold mb-4 text-foreground border-l-4 border-primary pl-4">
              1. Introducao
            </h2>
            <div className="space-y-4 text-muted-foreground leading-relaxed">
              <p>
                <strong>1.1.</strong> A presente Politica de Privacidade tem por objetivo informar
                aos usuarios do website elkys.com.br sobre o tratamento de dados pessoais realizado
                pela Elkys.
              </p>
              <p>
                <strong>1.2.</strong> Esta Politica esta em conformidade com a Lei Geral de Protecao
                de Dados Pessoais (LGPD - Lei n. 13.709/2018) e demais normas aplicaveis a protecao
                de dados no Brasil.
              </p>
              <p>
                <strong>1.3.</strong> Ao acessar e utilizar este website, o usuario declara estar
                ciente das praticas descritas nesta Politica.
              </p>
            </div>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold mb-4 text-foreground border-l-4 border-primary pl-4">
              2. Controlador dos Dados
            </h2>
            <div className="space-y-4 text-muted-foreground leading-relaxed">
              <p>
                <strong>2.1.</strong> Para fins desta Politica, o controlador dos dados pessoais e:
              </p>
              <div className="bg-muted/30 p-6 rounded-lg mt-4">
                <p className="mb-2">
                  <strong>Razao Social:</strong> Elkys (Microempreendedor Individual)
                </p>
                <p className="mb-2">
                  <strong>Atividade:</strong> Desenvolvimento de Software e Consultoria em TI
                </p>
                <p className="mb-2">
                  <strong>E-mail:</strong>{" "}
                  <a href="mailto:contato@elkys.com.br" className="text-primary hover:underline">
                    contato@elkys.com.br
                  </a>
                </p>
                <p>
                  <strong>Modalidade:</strong> Atendimento 100% remoto em territorio nacional
                </p>
              </div>
            </div>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold mb-4 text-foreground border-l-4 border-primary pl-4">
              3. Dados Pessoais Coletados
            </h2>
            <div className="space-y-4 text-muted-foreground leading-relaxed">
              <p>
                <strong>3.1.</strong> Dados fornecidos diretamente pelo usuario:
              </p>
              <ul className="list-none ml-6 space-y-1">
                <li>(a) Nome completo;</li>
                <li>(b) Endereco de e-mail;</li>
                <li>(c) Numero de telefone;</li>
                <li>(d) Nome da empresa (quando aplicavel);</li>
                <li>(e) Informacoes contidas em mensagens enviadas pelo formulario de contato.</li>
              </ul>
              <p className="mt-4">
                <strong>3.2.</strong> Dados coletados automaticamente:
              </p>
              <ul className="list-none ml-6 space-y-1">
                <li>(a) Endereco IP;</li>
                <li>(b) Tipo e versao do navegador;</li>
                <li>(c) Sistema operacional;</li>
                <li>(d) Paginas acessadas e tempo de permanencia;</li>
                <li>(e) Data e horario de acesso;</li>
                <li>(f) Cookies e tecnologias similares.</li>
              </ul>
            </div>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold mb-4 text-foreground border-l-4 border-primary pl-4">
              4. Finalidades do Tratamento
            </h2>
            <div className="space-y-4 text-muted-foreground leading-relaxed">
              <p>
                <strong>4.1.</strong> Os dados pessoais sao tratados para as seguintes finalidades:
              </p>
              <ul className="list-none ml-6 space-y-1">
                <li>
                  (a) Responder solicitacoes de contato e fornecer informacoes sobre servicos;
                </li>
                <li>(b) Elaborar propostas comerciais e formalizar contratacoes;</li>
                <li>(c) Prestar os servicos contratados;</li>
                <li>(d) Enviar comunicacoes relacionadas aos servicos;</li>
                <li>(e) Melhorar a experiencia de navegacao no website;</li>
                <li>(f) Realizar analises estatisticas e de desempenho;</li>
                <li>(g) Cumprir obrigacoes legais e regulatorias.</li>
              </ul>
            </div>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold mb-4 text-foreground border-l-4 border-primary pl-4">
              5. Bases Legais para o Tratamento
            </h2>
            <div className="space-y-4 text-muted-foreground leading-relaxed">
              <p>
                <strong>5.1.</strong> O tratamento de dados pessoais e realizado com fundamento nas
                seguintes bases legais previstas na LGPD:
              </p>
              <ul className="list-none ml-6 space-y-2">
                <li>
                  <strong>(a) Consentimento (Art. 7, I):</strong> quando o usuario fornece seus
                  dados voluntariamente atraves de formularios;
                </li>
                <li>
                  <strong>(b) Execucao de Contrato (Art. 7, V):</strong> para a prestacao dos
                  servicos contratados;
                </li>
                <li>
                  <strong>(c) Legitimo Interesse (Art. 7, IX):</strong> para comunicacoes
                  relacionadas aos servicos e melhorias do website;
                </li>
                <li>
                  <strong>(d) Cumprimento de Obrigacao Legal (Art. 7, II):</strong> quando exigido
                  por lei ou regulamentacao.
                </li>
              </ul>
            </div>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold mb-4 text-foreground border-l-4 border-primary pl-4">
              6. Compartilhamento de Dados
            </h2>
            <div className="space-y-4 text-muted-foreground leading-relaxed">
              <p>
                <strong>6.1.</strong> A Elkys nao comercializa dados pessoais de seus usuarios.
              </p>
              <p>
                <strong>6.2.</strong> O compartilhamento de dados podera ocorrer nas seguintes
                hipoteses:
              </p>
              <ul className="list-none ml-6 space-y-1">
                <li>(a) Com prestadores de servicos essenciais a operacao do website;</li>
                <li>(b) Para cumprimento de obrigacao legal ou determinacao judicial;</li>
                <li>(c) Para protecao dos direitos da Elkys ou de terceiros;</li>
                <li>(d) Mediante consentimento expresso do titular.</li>
              </ul>
              <p className="mt-4">
                <strong>6.3.</strong> Todo compartilhamento e realizado mediante contratos que
                asseguram a protecao adequada dos dados.
              </p>
            </div>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold mb-4 text-foreground border-l-4 border-primary pl-4">
              7. Seguranca dos Dados
            </h2>
            <div className="space-y-4 text-muted-foreground leading-relaxed">
              <p>
                <strong>7.1.</strong> A Elkys adota medidas tecnicas e organizacionais adequadas
                para proteger os dados pessoais, incluindo:
              </p>
              <ul className="list-none ml-6 space-y-1">
                <li>(a) Criptografia de dados em transito (SSL/TLS);</li>
                <li>(b) Controle de acesso restrito;</li>
                <li>(c) Monitoramento de seguranca;</li>
                <li>(d) Backups periodicos.</li>
              </ul>
              <p className="mt-4">
                <strong>7.2.</strong> Apesar das medidas de seguranca implementadas, nenhum sistema
                e completamente imune a riscos.
              </p>
            </div>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold mb-4 text-foreground border-l-4 border-primary pl-4">
              8. Retencao dos Dados
            </h2>
            <div className="space-y-4 text-muted-foreground leading-relaxed">
              <p>
                <strong>8.1.</strong> Os dados pessoais serao mantidos pelo periodo necessario para:
              </p>
              <ul className="list-none ml-6 space-y-1">
                <li>(a) Cumprir as finalidades para as quais foram coletados;</li>
                <li>(b) Atender obrigacoes legais, contratuais ou regulatorias;</li>
                <li>(c) Exercer direitos em processos judiciais, administrativos ou arbitrais.</li>
              </ul>
              <p className="mt-4">
                <strong>8.2.</strong> Apos o termino do periodo de retencao, os dados serao
                eliminados ou anonimizados.
              </p>
            </div>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold mb-4 text-foreground border-l-4 border-primary pl-4">
              9. Direitos do Titular
            </h2>
            <div className="space-y-4 text-muted-foreground leading-relaxed">
              <p>
                <strong>9.1.</strong> Nos termos da LGPD, o titular dos dados pessoais tem direito
                a:
              </p>
              <ul className="list-none ml-6 space-y-1">
                <li>(a) Confirmacao da existencia de tratamento;</li>
                <li>(b) Acesso aos dados;</li>
                <li>(c) Correcao de dados incompletos, inexatos ou desatualizados;</li>
                <li>(d) Anonimizacao, bloqueio ou eliminacao de dados desnecessarios;</li>
                <li>(e) Portabilidade dos dados;</li>
                <li>(f) Eliminacao dos dados tratados com base no consentimento;</li>
                <li>(g) Informacao sobre compartilhamento de dados;</li>
                <li>(h) Revogacao do consentimento.</li>
              </ul>
              <p className="mt-4">
                <strong>9.2.</strong> As solicitacoes podem ser encaminhadas para o e-mail
                contato@elkys.com.br e serao respondidas no prazo de 15 dias.
              </p>
            </div>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold mb-4 text-foreground border-l-4 border-primary pl-4">
              10. Cookies
            </h2>
            <div className="space-y-4 text-muted-foreground leading-relaxed">
              <p>
                <strong>10.1.</strong> Este website utiliza cookies e tecnologias similares para
                melhorar a experiencia de navegacao.
              </p>
              <p>
                <strong>10.2.</strong> Para informacoes detalhadas sobre os cookies utilizados,
                consulte a{" "}
                <a href="/cookie-policy" className="text-primary hover:underline">
                  Politica de Cookies
                </a>
                .
              </p>
            </div>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold mb-4 text-foreground border-l-4 border-primary pl-4">
              11. Transferencia Internacional
            </h2>
            <div className="space-y-4 text-muted-foreground leading-relaxed">
              <p>
                <strong>11.1.</strong> Alguns prestadores de servicos utilizados pela Elkys podem
                estar localizados em outros paises.
              </p>
              <p>
                <strong>11.2.</strong> Nesses casos, a transferencia de dados e realizada em
                conformidade com a LGPD, mediante a adocao de salvaguardas apropriadas.
              </p>
            </div>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold mb-4 text-foreground border-l-4 border-primary pl-4">
              12. Alteracoes nesta Politica
            </h2>
            <div className="space-y-4 text-muted-foreground leading-relaxed">
              <p>
                <strong>12.1.</strong> Esta Politica podera ser atualizada periodicamente para
                refletir alteracoes nas praticas de tratamento de dados ou na legislacao aplicavel.
              </p>
              <p>
                <strong>12.2.</strong> As alteracoes serao publicadas nesta pagina com a indicacao
                da data de vigencia.
              </p>
            </div>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold mb-4 text-foreground border-l-4 border-primary pl-4">
              13. Contato e Encarregado de Dados
            </h2>
            <div className="space-y-4 text-muted-foreground leading-relaxed">
              <p>
                <strong>13.1.</strong> Para exercer seus direitos ou esclarecer duvidas sobre esta
                Politica, entre em contato:
              </p>
              <div className="bg-muted/30 p-6 rounded-lg mt-4">
                <p className="mb-2">
                  <strong>E-mail:</strong>{" "}
                  <a href="mailto:contato@elkys.com.br" className="text-primary hover:underline">
                    contato@elkys.com.br
                  </a>
                </p>
                <p className="mb-2">
                  <strong>Telefone:</strong>{" "}
                  <a href="tel:+5531997382935" className="text-primary hover:underline">
                    +55 (31) 99738-2935
                  </a>
                </p>
                <p>
                  <strong>Horario de Atendimento:</strong> Segunda a Sexta, das 8h as 18h
                </p>
              </div>
              <p className="mt-4">
                <strong>13.2.</strong> O titular tambem podera apresentar reclamacao perante a
                Autoridade Nacional de Protecao de Dados (ANPD) atraves do website{" "}
                <a
                  href="https://www.gov.br/anpd"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  www.gov.br/anpd
                </a>
                .
              </p>
            </div>
          </section>

          <div className="border-t border-border pt-8 mt-12">
            <p className="text-sm text-muted-foreground text-center">
              Ao utilizar este website, o usuario declara estar ciente das praticas de tratamento de
              dados descritas nesta Politica de Privacidade.
            </p>
          </div>
        </article>
      </main>

      <Footer />
    </div>
  );
};

export default PrivacyPolicy;

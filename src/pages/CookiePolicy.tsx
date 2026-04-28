import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import Breadcrumbs from "@/components/Breadcrumbs";
import SEO from "@/components/SEO";

const CookiePolicy = () => {
  return (
    <>
      <SEO
        title="Política de Cookies | Elkys"
        description="Política de Cookies da Elkys. Saiba quais cookies utilizamos, suas finalidades e como gerenciá-los em seu navegador."
        canonical="https://elkys.com.br/cookie-policy"
      />
      <div className="min-h-screen bg-background">
        <Navigation />
        <Breadcrumbs />

        <main
          id="main-content"
          className="container mx-auto px-4 py-16 md:py-20 lg:py-24 max-w-4xl"
        >
          <header className="mb-12 border-b border-border pb-8">
            <p className="text-sm font-medium text-primary uppercase tracking-wider mb-2">
              Documento Legal
            </p>
            <h1 className="text-3xl sm:text-4xl font-bold mb-4 text-foreground">
              Politica de Cookies
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
              <span>Versao 2.0</span>
            </div>
          </header>

          <article className="max-w-none">
            <section className="mb-10">
              <h2 className="text-xl font-semibold mb-4 text-foreground border-l-4 border-primary pl-4">
                1. Definicao
              </h2>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>
                  <strong>1.1.</strong> Cookies sao pequenos arquivos de texto armazenados no
                  dispositivo do usuario quando este acessa um website. Esta Politica tambem abrange
                  tecnologias similares de armazenamento local utilizadas pelo navegador
                  (localStorage e sessionStorage), tratadas em conjunto pelo termo &quot;cookies e
                  armazenamento similar&quot;.
                </p>
                <p>
                  <strong>1.2.</strong> Os itens armazenados podem ser classificados quanto a origem
                  (primeira parte ou terceiros), duracao (sessao ou persistente) e finalidade
                  (necessarios, funcionais, analiticos ou de marketing).
                </p>
              </div>
            </section>

            <section className="mb-10">
              <h2 className="text-xl font-semibold mb-4 text-foreground border-l-4 border-primary pl-4">
                2. Finalidades de Utilizacao
              </h2>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>
                  <strong>2.1.</strong> O website elkys.com.br e seus portais autenticados utilizam
                  cookies e armazenamento similar para:
                </p>
                <ul className="list-none ml-6 space-y-1">
                  <li>
                    (a) Garantir o funcionamento do website e a manutencao da sessao autenticada nos
                    portais;
                  </li>
                  <li>(b) Registrar a preferencia de consentimento do usuario para cookies;</li>
                  <li>(c) Memorizar preferencias de exibicao, como tema (claro/escuro);</li>
                  <li>
                    (d) Realizar analises estatisticas agregadas de acesso e desempenho do website
                    publico, mediante consentimento previo.
                  </li>
                </ul>
                <p>
                  <strong>2.2.</strong> A Elkys{" "}
                  <strong>
                    nao utiliza cookies de marketing, remarketing, perfilamento publicitario ou
                    pixels de redes sociais
                  </strong>{" "}
                  (Facebook Pixel, Google Ads, LinkedIn Insight, etc).
                </p>
              </div>
            </section>

            <section className="mb-10">
              <h2 className="text-xl font-semibold mb-4 text-foreground border-l-4 border-primary pl-4">
                3. Consentimento
              </h2>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>
                  <strong>3.1.</strong> No primeiro acesso, o usuario visualiza um banner de
                  consentimento que permite <em>Aceitar</em> ou <em>Recusar</em> cookies nao
                  estritamente necessarios.
                </p>
                <p>
                  <strong>3.2.</strong> Os cookies estritamente necessarios (autenticacao e registro
                  do proprio consentimento) dispensam autorizacao previa, conforme permitido pela
                  LGPD para a base legal de execucao de contrato e legitimo interesse.
                </p>
                <p>
                  <strong>3.3.</strong> Cookies analiticos do Google Analytics 4 sao carregados
                  apenas apos o consentimento expresso e, mesmo assim, com tecnica de carga diferida
                  (lazy-load) que so dispara mediante interacao do usuario com a pagina ou apos um
                  intervalo de espera, reduzindo o impacto na privacidade e no desempenho.
                </p>
                <p>
                  <strong>3.4.</strong> O usuario pode revogar ou alterar o consentimento a qualquer
                  momento, limpando o armazenamento local do navegador para o dominio{" "}
                  <code className="bg-muted px-1.5 py-0.5 rounded text-xs">elkys.com.br</code> ou
                  contatando{" "}
                  <a href="mailto:contato@elkys.com.br" className="text-primary hover:underline">
                    contato@elkys.com.br
                  </a>
                  .
                </p>
              </div>
            </section>

            <section className="mb-10">
              <h2 className="text-xl font-semibold mb-4 text-foreground border-l-4 border-primary pl-4">
                4. Categorias de Cookies Utilizados
              </h2>
              <div className="space-y-6 text-muted-foreground leading-relaxed">
                <div>
                  <p>
                    <strong>4.1. Estritamente Necessarios</strong>
                  </p>
                  <p className="mt-2">
                    Indispensaveis para autenticacao no portal, registro de consentimento e
                    funcionamento basico do website. Nao requerem consentimento previo.
                  </p>
                </div>

                <div>
                  <p>
                    <strong>4.2. Funcionais</strong>
                  </p>
                  <p className="mt-2">
                    Memorizam preferencias do usuario, como tema visual. Podem ser desabilitados
                    pelo navegador, mas a experiencia podera ser afetada.
                  </p>
                </div>

                <div>
                  <p>
                    <strong>4.3. Analiticos</strong>
                  </p>
                  <p className="mt-2">
                    Coletam, de forma agregada e sem identificar individualmente o usuario, dados
                    sobre paginas acessadas, dispositivo e duracao da visita. Sao carregados apenas
                    apos consentimento.
                  </p>
                </div>
              </div>
            </section>

            <section className="mb-10">
              <h2 className="text-xl font-semibold mb-4 text-foreground border-l-4 border-primary pl-4">
                5. Itens Armazenados (Inventario Detalhado)
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="border border-border p-3 text-left font-semibold text-foreground">
                        Nome
                      </th>
                      <th className="border border-border p-3 text-left font-semibold text-foreground">
                        Tipo
                      </th>
                      <th className="border border-border p-3 text-left font-semibold text-foreground">
                        Provedor
                      </th>
                      <th className="border border-border p-3 text-left font-semibold text-foreground">
                        Finalidade
                      </th>
                      <th className="border border-border p-3 text-left font-semibold text-foreground">
                        Categoria
                      </th>
                      <th className="border border-border p-3 text-left font-semibold text-foreground">
                        Duracao
                      </th>
                    </tr>
                  </thead>
                  <tbody className="text-muted-foreground">
                    <tr>
                      <td className="border border-border p-3">cookie-consent</td>
                      <td className="border border-border p-3">localStorage</td>
                      <td className="border border-border p-3">Elkys (1a parte)</td>
                      <td className="border border-border p-3">
                        Registra a escolha do usuario (aceito/recusado)
                      </td>
                      <td className="border border-border p-3">Necessario</td>
                      <td className="border border-border p-3">Persistente</td>
                    </tr>
                    <tr>
                      <td className="border border-border p-3">cookie-consent-date</td>
                      <td className="border border-border p-3">localStorage</td>
                      <td className="border border-border p-3">Elkys (1a parte)</td>
                      <td className="border border-border p-3">
                        Carimba data/hora do consentimento (auditoria)
                      </td>
                      <td className="border border-border p-3">Necessario</td>
                      <td className="border border-border p-3">Persistente</td>
                    </tr>
                    <tr>
                      <td className="border border-border p-3">sb-&lt;projeto&gt;-auth-token</td>
                      <td className="border border-border p-3">localStorage</td>
                      <td className="border border-border p-3">Supabase (1a parte)</td>
                      <td className="border border-border p-3">
                        Token de sessao autenticada nos portais admin e cliente
                      </td>
                      <td className="border border-border p-3">Necessario</td>
                      <td className="border border-border p-3">
                        Sessao (renovado automaticamente; expira em 30 min de inatividade)
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-border p-3">
                        sb-&lt;projeto&gt;-auth-token-code-verifier
                      </td>
                      <td className="border border-border p-3">localStorage</td>
                      <td className="border border-border p-3">Supabase (1a parte)</td>
                      <td className="border border-border p-3">
                        Verificador PKCE durante o fluxo de login (seguranca)
                      </td>
                      <td className="border border-border p-3">Necessario</td>
                      <td className="border border-border p-3">Sessao</td>
                    </tr>
                    <tr>
                      <td className="border border-border p-3">theme</td>
                      <td className="border border-border p-3">localStorage</td>
                      <td className="border border-border p-3">Elkys (1a parte)</td>
                      <td className="border border-border p-3">
                        Preferencia de tema visual (claro/escuro/sistema)
                      </td>
                      <td className="border border-border p-3">Funcional</td>
                      <td className="border border-border p-3">Persistente</td>
                    </tr>
                    <tr>
                      <td className="border border-border p-3">_ga</td>
                      <td className="border border-border p-3">Cookie</td>
                      <td className="border border-border p-3">Google Analytics 4 (3a parte)</td>
                      <td className="border border-border p-3">
                        Identificador de cliente para estatisticas agregadas
                      </td>
                      <td className="border border-border p-3">Analitico</td>
                      <td className="border border-border p-3">2 anos</td>
                    </tr>
                    <tr>
                      <td className="border border-border p-3">_ga_&lt;ID&gt;</td>
                      <td className="border border-border p-3">Cookie</td>
                      <td className="border border-border p-3">Google Analytics 4 (3a parte)</td>
                      <td className="border border-border p-3">
                        Persistencia de estado de sessao GA4
                      </td>
                      <td className="border border-border p-3">Analitico</td>
                      <td className="border border-border p-3">2 anos</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="text-sm mt-4">
                <strong>Observacao:</strong> os itens em localStorage nao sao tecnicamente cookies,
                mas estao listados aqui por possuirem funcao equivalente e por transparencia. A
                Elkys nao utiliza <em>_gid</em>, <em>_gat</em> nem cookies do antigo Google
                Analytics Universal (descontinuado).
              </p>
            </section>

            <section className="mb-10">
              <h2 className="text-xl font-semibold mb-4 text-foreground border-l-4 border-primary pl-4">
                6. Gerenciamento pelo Navegador
              </h2>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>
                  <strong>6.1.</strong> O usuario pode configurar seu navegador para recusar
                  cookies, apagar cookies existentes ou ser notificado quando um cookie for enviado.
                </p>
                <p>
                  <strong>6.2.</strong> Instrucoes nos principais navegadores:
                </p>
                <ul className="list-none ml-6 space-y-2">
                  <li>
                    <strong>(a) Google Chrome:</strong>{" "}
                    <a
                      href="https://support.google.com/chrome/answer/95647"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      support.google.com/chrome/answer/95647
                    </a>
                  </li>
                  <li>
                    <strong>(b) Mozilla Firefox:</strong>{" "}
                    <a
                      href="https://support.mozilla.org/pt-BR/kb/limpe-cookies-e-dados-de-sites-no-firefox"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      support.mozilla.org
                    </a>
                  </li>
                  <li>
                    <strong>(c) Safari:</strong>{" "}
                    <a
                      href="https://support.apple.com/pt-br/guide/safari/sfri11471/mac"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      support.apple.com
                    </a>
                  </li>
                  <li>
                    <strong>(d) Microsoft Edge:</strong>{" "}
                    <a
                      href="https://support.microsoft.com/pt-br/microsoft-edge"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      support.microsoft.com
                    </a>
                  </li>
                </ul>
                <p className="mt-4">
                  <strong>6.3.</strong> A desabilitacao de cookies estritamente necessarios
                  impossibilitara o login nos portais. A desabilitacao dos demais nao impede a
                  navegacao.
                </p>
              </div>
            </section>

            <section className="mb-10">
              <h2 className="text-xl font-semibold mb-4 text-foreground border-l-4 border-primary pl-4">
                7. Opt-out de Servicos Analiticos
              </h2>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>
                  <strong>7.1.</strong> O usuario pode optar por nao ser rastreado pelo Google
                  Analytics em todos os sites instalando a extensao oficial:
                </p>
                <ul className="list-none ml-6 space-y-2">
                  <li>
                    <strong>(a) Google Analytics Opt-out:</strong>{" "}
                    <a
                      href="https://tools.google.com/dlpage/gaoptout"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      tools.google.com/dlpage/gaoptout
                    </a>
                  </li>
                </ul>
              </div>
            </section>

            <section className="mb-10">
              <h2 className="text-xl font-semibold mb-4 text-foreground border-l-4 border-primary pl-4">
                8. Base Legal
              </h2>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>
                  <strong>8.1.</strong> Esta Politica de Cookies esta em conformidade com a Lei
                  Geral de Protecao de Dados (LGPD - Lei n. 13.709/2018) e o Marco Civil da Internet
                  (Lei n. 12.965/2014).
                </p>
                <p>
                  <strong>8.2.</strong> Para detalhes sobre o tratamento de dados pessoais realizado
                  pela Elkys, consulte a{" "}
                  <a href="/privacy-policy" className="text-primary hover:underline">
                    Politica de Privacidade
                  </a>
                  .
                </p>
              </div>
            </section>

            <section className="mb-10">
              <h2 className="text-xl font-semibold mb-4 text-foreground border-l-4 border-primary pl-4">
                9. Alteracoes
              </h2>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>
                  <strong>9.1.</strong> Esta Politica podera ser atualizada para refletir mudancas
                  no inventario de cookies ou na legislacao. Alteracoes relevantes serao comunicadas
                  no website e o banner de consentimento sera reapresentado quando cabivel.
                </p>
              </div>
            </section>

            <section className="mb-10">
              <h2 className="text-xl font-semibold mb-4 text-foreground border-l-4 border-primary pl-4">
                10. Contato
              </h2>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>
                  <strong>10.1.</strong> Para duvidas sobre esta Politica de Cookies, entre em
                  contato:
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
              </div>
            </section>

            <div className="border-t border-border pt-8 mt-12">
              <p className="text-sm text-muted-foreground text-center">
                Ao continuar navegando neste website, o usuario declara estar ciente e de acordo com
                a utilizacao de cookies conforme descrito nesta Politica.
              </p>
            </div>
          </article>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default CookiePolicy;

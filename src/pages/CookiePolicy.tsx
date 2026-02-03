import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import Breadcrumbs from "@/components/Breadcrumbs";
import { Helmet } from "react-helmet-async";

const CookiePolicy = () => {

  return (
    <>
      <Helmet>
        <title>Política de Cookies | Elkys</title>
        <meta name="description" content="Política de Cookies da Elkys. Saiba quais cookies utilizamos, suas finalidades e como gerenciá-los em seu navegador." />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://elkys.com.br/cookie-policy" />
        <meta property="og:title" content="Política de Cookies | Elkys" />
        <meta property="og:description" content="Política de Cookies da Elkys. Saiba quais cookies utilizamos e como gerenciá-los." />
        <meta property="og:url" content="https://elkys.com.br/cookie-policy" />
        <meta property="og:type" content="website" />
      </Helmet>
      <div className="min-h-screen bg-background">
        <Navigation />
      <Breadcrumbs />

      <main id="main-content" className="container mx-auto px-4 py-24 max-w-4xl">
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
            <span>Versao 1.0</span>
          </div>
        </header>

        <article className="prose prose-lg max-w-none">
          <section className="mb-10">
            <h2 className="text-xl font-semibold mb-4 text-foreground border-l-4 border-primary pl-4">
              1. Definicao de Cookies
            </h2>
            <div className="space-y-4 text-muted-foreground leading-relaxed">
              <p>
                <strong>1.1.</strong> Cookies sao pequenos arquivos de texto armazenados no
                dispositivo do usuario quando este acessa um website. Sao utilizados para otimizar a
                navegacao e fornecer informacoes ao administrador do site.
              </p>
              <p>
                <strong>1.2.</strong> Os cookies podem ser classificados quanto a sua origem
                (primeira parte ou terceiros), duracao (sessao ou persistentes) e finalidade
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
                <strong>2.1.</strong> O website elkys.com.br utiliza cookies para as seguintes
                finalidades:
              </p>
              <ul className="list-none ml-6 space-y-1">
                <li>(a) Garantir o funcionamento adequado do website;</li>
                <li>(b) Memorizar preferencias de navegacao do usuario;</li>
                <li>(c) Realizar analises estatisticas de acesso e desempenho;</li>
                <li>(d) Melhorar a experiencia de navegacao;</li>
                <li>(e) Oferecer conteudo personalizado.</li>
              </ul>
            </div>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold mb-4 text-foreground border-l-4 border-primary pl-4">
              3. Tipos de Cookies Utilizados
            </h2>
            <div className="space-y-6 text-muted-foreground leading-relaxed">
              <div>
                <p>
                  <strong>3.1. Cookies Estritamente Necessarios</strong>
                </p>
                <p className="mt-2">
                  Sao essenciais para o funcionamento basico do website. Sem estes cookies,
                  determinadas funcionalidades nao podem ser disponibilizadas. Nao requerem
                  consentimento do usuario.
                </p>
                <div className="bg-muted/30 p-4 rounded-lg mt-3">
                  <p className="text-sm">
                    <strong>Exemplos:</strong> Cookies de autenticacao, seguranca e preferencias de
                    sessao.
                  </p>
                  <p className="text-sm mt-1">
                    <strong>Duracao:</strong> Sessao ou ate 1 ano.
                  </p>
                </div>
              </div>

              <div>
                <p>
                  <strong>3.2. Cookies de Desempenho e Analiticos</strong>
                </p>
                <p className="mt-2">
                  Coletam informacoes sobre como os usuarios utilizam o website, permitindo
                  identificar areas de melhoria e otimizar o desempenho.
                </p>
                <div className="bg-muted/30 p-4 rounded-lg mt-3">
                  <p className="text-sm">
                    <strong>Exemplos:</strong> Google Analytics (_ga, _gid, _gat).
                  </p>
                  <p className="text-sm mt-1">
                    <strong>Duracao:</strong> De 1 dia a 2 anos.
                  </p>
                </div>
              </div>

              <div>
                <p>
                  <strong>3.3. Cookies de Funcionalidade</strong>
                </p>
                <p className="mt-2">
                  Permitem que o website memorize escolhas realizadas pelo usuario, como idioma,
                  regiao ou preferencias de exibicao.
                </p>
                <div className="bg-muted/30 p-4 rounded-lg mt-3">
                  <p className="text-sm">
                    <strong>Exemplos:</strong> Preferencias de tema (claro/escuro), idioma.
                  </p>
                  <p className="text-sm mt-1">
                    <strong>Duracao:</strong> De 1 mes a 1 ano.
                  </p>
                </div>
              </div>

              <div>
                <p>
                  <strong>3.4. Cookies de Marketing</strong>
                </p>
                <p className="mt-2">
                  Utilizados para rastrear a navegacao e exibir anuncios relevantes. Podem ser de
                  terceiros, como plataformas de publicidade.
                </p>
                <div className="bg-muted/30 p-4 rounded-lg mt-3">
                  <p className="text-sm">
                    <strong>Exemplos:</strong> Google Ads, Facebook Pixel.
                  </p>
                  <p className="text-sm mt-1">
                    <strong>Duracao:</strong> De 1 mes a 2 anos.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold mb-4 text-foreground border-l-4 border-primary pl-4">
              4. Cookies de Primeira Parte e de Terceiros
            </h2>
            <div className="space-y-4 text-muted-foreground leading-relaxed">
              <p>
                <strong>4.1.</strong> Cookies de primeira parte sao definidos diretamente pelo
                website elkys.com.br e so podem ser lidos por este dominio.
              </p>
              <p>
                <strong>4.2.</strong> Cookies de terceiros sao definidos por dominios externos, como
                servicos de analise (Google Analytics) ou plataformas de publicidade.
              </p>
            </div>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold mb-4 text-foreground border-l-4 border-primary pl-4">
              5. Tabela de Cookies
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="border border-border p-3 text-left font-semibold text-foreground">
                      Cookie
                    </th>
                    <th className="border border-border p-3 text-left font-semibold text-foreground">
                      Provedor
                    </th>
                    <th className="border border-border p-3 text-left font-semibold text-foreground">
                      Finalidade
                    </th>
                    <th className="border border-border p-3 text-left font-semibold text-foreground">
                      Duracao
                    </th>
                  </tr>
                </thead>
                <tbody className="text-muted-foreground">
                  <tr>
                    <td className="border border-border p-3">_ga</td>
                    <td className="border border-border p-3">Google Analytics</td>
                    <td className="border border-border p-3">Identificacao de usuarios</td>
                    <td className="border border-border p-3">2 anos</td>
                  </tr>
                  <tr>
                    <td className="border border-border p-3">_gid</td>
                    <td className="border border-border p-3">Google Analytics</td>
                    <td className="border border-border p-3">Identificacao de usuarios</td>
                    <td className="border border-border p-3">24 horas</td>
                  </tr>
                  <tr>
                    <td className="border border-border p-3">_gat</td>
                    <td className="border border-border p-3">Google Analytics</td>
                    <td className="border border-border p-3">Controle de taxa de requisicoes</td>
                    <td className="border border-border p-3">1 minuto</td>
                  </tr>
                  <tr>
                    <td className="border border-border p-3">cookie_consent</td>
                    <td className="border border-border p-3">Elkys</td>
                    <td className="border border-border p-3">Registro de consentimento</td>
                    <td className="border border-border p-3">1 ano</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold mb-4 text-foreground border-l-4 border-primary pl-4">
              6. Gerenciamento de Cookies
            </h2>
            <div className="space-y-4 text-muted-foreground leading-relaxed">
              <p>
                <strong>6.1.</strong> O usuario pode configurar seu navegador para recusar todos ou
                alguns cookies, ou para ser notificado quando um cookie e enviado.
              </p>
              <p>
                <strong>6.2.</strong> Instrucoes para gerenciamento de cookies nos principais
                navegadores:
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
                <strong>6.3.</strong> A desabilitacao de cookies pode afetar a funcionalidade do
                website e a experiencia de navegacao.
              </p>
            </div>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold mb-4 text-foreground border-l-4 border-primary pl-4">
              7. Opt-out de Servicos de Terceiros
            </h2>
            <div className="space-y-4 text-muted-foreground leading-relaxed">
              <p>
                <strong>7.1.</strong> O usuario pode optar por nao participar de cookies especificos
                de terceiros:
              </p>
              <ul className="list-none ml-6 space-y-2">
                <li>
                  <strong>(a) Google Analytics:</strong>{" "}
                  <a
                    href="https://tools.google.com/dlpage/gaoptout"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    tools.google.com/dlpage/gaoptout
                  </a>
                </li>
                <li>
                  <strong>(b) Network Advertising Initiative:</strong>{" "}
                  <a
                    href="https://optout.networkadvertising.org"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    optout.networkadvertising.org
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
                <strong>8.1.</strong> Esta Politica de Cookies esta em conformidade com a Lei Geral
                de Protecao de Dados (LGPD - Lei n. 13.709/2018) e o Marco Civil da Internet (Lei n.
                12.965/2014).
              </p>
              <p>
                <strong>8.2.</strong> Para informacoes detalhadas sobre o tratamento de dados
                pessoais, consulte a{" "}
                <a href="/privacy-policy" className="text-primary hover:underline">
                  Politica de Privacidade
                </a>
                .
              </p>
            </div>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold mb-4 text-foreground border-l-4 border-primary pl-4">
              9. Alteracoes nesta Politica
            </h2>
            <div className="space-y-4 text-muted-foreground leading-relaxed">
              <p>
                <strong>9.1.</strong> Esta Politica podera ser atualizada periodicamente. As
                alteracoes serao publicadas nesta pagina com a indicacao da data de vigencia.
              </p>
              <p>
                <strong>9.2.</strong> Recomenda-se a consulta periodica desta pagina para
                conhecimento de eventuais atualizacoes.
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
              Ao continuar navegando neste website, o usuario declara estar ciente e de acordo com a
              utilizacao de cookies conforme descrito nesta Politica.
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

import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import Breadcrumbs from "@/components/Breadcrumbs";
import { useEffect } from "react";

const CookiePolicy = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = "Política de Cookies | Elys - Como Usamos Cookies";
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <Breadcrumbs />

      <main id="main-content" className="container mx-auto px-4 py-24 max-w-4xl">
        {/* Header */}
        <header className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Política de <span className="gradient-text">Cookies</span>
          </h1>
          <p className="text-muted-foreground text-lg">
            Última atualização:{" "}
            {new Date().toLocaleDateString("pt-BR", {
              day: "2-digit",
              month: "long",
              year: "numeric",
            })}
          </p>
        </header>

        {/* Content */}
        <article className="prose prose-lg max-w-none space-y-8">
          {/* Section 1 */}
          <section>
            <h2 className="text-2xl font-bold mb-4 text-foreground">1. O Que São Cookies?</h2>
            <p className="text-muted-foreground leading-relaxed">
              Cookies são pequenos arquivos de texto que são armazenados no seu dispositivo
              (computador, tablet ou celular) quando você visita um website. Eles são amplamente
              utilizados para fazer os sites funcionarem de forma mais eficiente, bem como para
              fornecer informações aos proprietários do site.
            </p>
            <div className="bg-primary/5 p-6 rounded-lg border border-primary/20 mt-4">
              <p className="text-muted-foreground">
                <strong>Em resumo:</strong> Os cookies são como pequenas "notas adesivas digitais"
                que ajudam o website a lembrar de você e suas preferências durante a navegação.
              </p>
            </div>
          </section>

          {/* Section 2 */}
          <section>
            <h2 className="text-2xl font-bold mb-4 text-foreground">2. Como Usamos Cookies</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              A <strong>Elys</strong> utiliza cookies para melhorar sua experiência em nosso website
              (<strong>elys.com.br</strong>). Os cookies nos ajudam a:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
              <li>Entender como você usa nosso website</li>
              <li>Lembrar suas preferências e configurações</li>
              <li>Melhorar a velocidade e segurança do site</li>
              <li>Personalizar conteúdo e anúncios</li>
              <li>Analisar o desempenho do website</li>
              <li>Fornecer funcionalidades de redes sociais</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section>
            <h2 className="text-2xl font-bold mb-4 text-foreground">
              3. Tipos de Cookies Utilizados
            </h2>

            <div className="space-y-6">
              {/* Cookie Type 1 */}
              <div className="border border-border rounded-lg p-6">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl">🔧</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2 text-foreground">
                      Cookies Estritamente Necessários
                    </h3>
                    <p className="text-muted-foreground mb-3">
                      São essenciais para que você possa navegar pelo site e usar seus recursos. Sem
                      esses cookies, serviços básicos não podem ser fornecidos.
                    </p>
                    <div className="bg-muted/50 p-4 rounded">
                      <p className="text-sm text-muted-foreground mb-2">
                        <strong>Exemplos:</strong>
                      </p>
                      <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1 ml-2">
                        <li>Cookies de sessão para manter você logado</li>
                        <li>Cookies de segurança e autenticação</li>
                        <li>Cookies de preferência de idioma</li>
                      </ul>
                      <p className="text-sm text-muted-foreground mt-3">
                        <strong>Duração:</strong> Sessão ou até 1 ano
                        <br />
                        <strong>Consentimento necessário:</strong> ❌ Não (essenciais)
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Cookie Type 2 */}
              <div className="border border-border rounded-lg p-6">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl">📊</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2 text-foreground">
                      Cookies de Desempenho/Analíticos
                    </h3>
                    <p className="text-muted-foreground mb-3">
                      Coletam informações sobre como os visitantes usam o website, permitindo-nos
                      melhorar o funcionamento do site.
                    </p>
                    <div className="bg-muted/50 p-4 rounded">
                      <p className="text-sm text-muted-foreground mb-2">
                        <strong>Exemplos:</strong>
                      </p>
                      <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1 ml-2">
                        <li>Google Analytics (_ga, _gid, _gat)</li>
                        <li>Hotjar (análise de comportamento)</li>
                        <li>Métricas de páginas mais visitadas</li>
                        <li>Taxas de erro e tempo de carregamento</li>
                      </ul>
                      <p className="text-sm text-muted-foreground mt-3">
                        <strong>Duração:</strong> De 1 dia a 2 anos
                        <br />
                        <strong>Consentimento necessário:</strong> ✅ Sim
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Cookie Type 3 */}
              <div className="border border-border rounded-lg p-6">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl">⚙️</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2 text-foreground">
                      Cookies de Funcionalidade
                    </h3>
                    <p className="text-muted-foreground mb-3">
                      Permitem que o website lembre escolhas que você faz e forneça recursos
                      aprimorados e personalizados.
                    </p>
                    <div className="bg-muted/50 p-4 rounded">
                      <p className="text-sm text-muted-foreground mb-2">
                        <strong>Exemplos:</strong>
                      </p>
                      <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1 ml-2">
                        <li>Preferências de idioma</li>
                        <li>Tema claro/escuro</li>
                        <li>Região ou fuso horário</li>
                        <li>Informações de formulários preenchidos</li>
                      </ul>
                      <p className="text-sm text-muted-foreground mt-3">
                        <strong>Duração:</strong> De 1 mês a 1 ano
                        <br />
                        <strong>Consentimento necessário:</strong> ✅ Sim
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Cookie Type 4 */}
              <div className="border border-border rounded-lg p-6">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl">🎯</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2 text-foreground">
                      Cookies de Marketing/Publicidade
                    </h3>
                    <p className="text-muted-foreground mb-3">
                      Usados para rastrear visitantes em websites com o objetivo de exibir anúncios
                      relevantes e envolventes.
                    </p>
                    <div className="bg-muted/50 p-4 rounded">
                      <p className="text-sm text-muted-foreground mb-2">
                        <strong>Exemplos:</strong>
                      </p>
                      <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1 ml-2">
                        <li>Google Ads (_gcl, conversion tracking)</li>
                        <li>Facebook Pixel (fr, _fbp)</li>
                        <li>LinkedIn Insights</li>
                        <li>Cookies de remarketing</li>
                      </ul>
                      <p className="text-sm text-muted-foreground mt-3">
                        <strong>Duração:</strong> De 1 mês a 2 anos
                        <br />
                        <strong>Consentimento necessário:</strong> ✅ Sim
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Cookie Type 5 */}
              <div className="border border-border rounded-lg p-6">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl">👥</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2 text-foreground">
                      Cookies de Redes Sociais
                    </h3>
                    <p className="text-muted-foreground mb-3">
                      Permitem que você compartilhe páginas e conteúdo em redes sociais através de
                      botões de compartilhamento.
                    </p>
                    <div className="bg-muted/50 p-4 rounded">
                      <p className="text-sm text-muted-foreground mb-2">
                        <strong>Exemplos:</strong>
                      </p>
                      <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1 ml-2">
                        <li>LinkedIn (share buttons)</li>
                        <li>Facebook (like buttons)</li>
                        <li>Twitter/X (tweet buttons)</li>
                        <li>WhatsApp (share)</li>
                      </ul>
                      <p className="text-sm text-muted-foreground mt-3">
                        <strong>Duração:</strong> Varia por plataforma (1 mês a 2 anos)
                        <br />
                        <strong>Consentimento necessário:</strong> ✅ Sim
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Section 4 */}
          <section>
            <h2 className="text-2xl font-bold mb-4 text-foreground">
              4. Cookies de Primeira e Terceiros
            </h2>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-primary/5 p-6 rounded-lg border border-primary/20">
                <h3 className="text-lg font-semibold mb-3 text-foreground">
                  🏠 Cookies de Primeira Parte
                </h3>
                <p className="text-muted-foreground text-sm mb-3">
                  São definidos diretamente pelo nosso website (elys.com.br) e só podem ser lidos
                  por nós.
                </p>
                <p className="text-sm text-muted-foreground">
                  <strong>Usados para:</strong> Autenticação, preferências, análise interna
                </p>
              </div>

              <div className="bg-secondary/5 p-6 rounded-lg border border-secondary/20">
                <h3 className="text-lg font-semibold mb-3 text-foreground">
                  🌐 Cookies de Terceiros
                </h3>
                <p className="text-muted-foreground text-sm mb-3">
                  São definidos por domínios diferentes do nosso website, como Google Analytics,
                  Facebook, etc.
                </p>
                <p className="text-sm text-muted-foreground">
                  <strong>Usados para:</strong> Análises externas, publicidade, redes sociais
                </p>
              </div>
            </div>
          </section>

          {/* Section 5 */}
          <section>
            <h2 className="text-2xl font-bold mb-4 text-foreground">
              5. Tabela Detalhada de Cookies
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-border text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="border border-border p-3 text-left font-semibold">
                      Nome do Cookie
                    </th>
                    <th className="border border-border p-3 text-left font-semibold">Provedor</th>
                    <th className="border border-border p-3 text-left font-semibold">Finalidade</th>
                    <th className="border border-border p-3 text-left font-semibold">Duração</th>
                  </tr>
                </thead>
                <tbody className="text-muted-foreground">
                  <tr>
                    <td className="border border-border p-3">
                      <code>_ga</code>
                    </td>
                    <td className="border border-border p-3">Google Analytics</td>
                    <td className="border border-border p-3">Distinguir usuários únicos</td>
                    <td className="border border-border p-3">2 anos</td>
                  </tr>
                  <tr>
                    <td className="border border-border p-3">
                      <code>_gid</code>
                    </td>
                    <td className="border border-border p-3">Google Analytics</td>
                    <td className="border border-border p-3">Distinguir usuários</td>
                    <td className="border border-border p-3">24 horas</td>
                  </tr>
                  <tr>
                    <td className="border border-border p-3">
                      <code>_gat</code>
                    </td>
                    <td className="border border-border p-3">Google Analytics</td>
                    <td className="border border-border p-3">Limitar taxa de solicitações</td>
                    <td className="border border-border p-3">1 minuto</td>
                  </tr>
                  <tr>
                    <td className="border border-border p-3">
                      <code>cookie_consent</code>
                    </td>
                    <td className="border border-border p-3">Elys</td>
                    <td className="border border-border p-3">Armazenar preferências de cookies</td>
                    <td className="border border-border p-3">1 ano</td>
                  </tr>
                  <tr>
                    <td className="border border-border p-3">
                      <code>_fbp</code>
                    </td>
                    <td className="border border-border p-3">Facebook</td>
                    <td className="border border-border p-3">Rastreamento de conversões</td>
                    <td className="border border-border p-3">3 meses</td>
                  </tr>
                  <tr>
                    <td className="border border-border p-3">
                      <code>_gcl_*</code>
                    </td>
                    <td className="border border-border p-3">Google Ads</td>
                    <td className="border border-border p-3">Rastreamento de conversões</td>
                    <td className="border border-border p-3">90 dias</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Section 6 */}
          <section>
            <h2 className="text-2xl font-bold mb-4 text-foreground">6. Como Gerenciar Cookies</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Você tem o direito de decidir se aceita ou não cookies. Quando você visita nosso
              website pela primeira vez, mostramos um banner de consentimento de cookies onde você
              pode escolher suas preferências.
            </p>

            <h3 className="text-xl font-semibold mb-3 text-foreground">
              6.1 Configurações do Navegador
            </h3>
            <p className="text-muted-foreground leading-relaxed mb-4">
              A maioria dos navegadores permite que você controle cookies através das configurações.
              Aqui estão links para as instruções dos navegadores mais comuns:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
              <li>
                <strong>Google Chrome:</strong>{" "}
                <a
                  href="https://support.google.com/chrome/answer/95647"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Gerenciar cookies no Chrome
                </a>
              </li>
              <li>
                <strong>Mozilla Firefox:</strong>{" "}
                <a
                  href="https://support.mozilla.org/pt-BR/kb/limpe-cookies-e-dados-de-sites-no-firefox"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Gerenciar cookies no Firefox
                </a>
              </li>
              <li>
                <strong>Safari:</strong>{" "}
                <a
                  href="https://support.apple.com/pt-br/guide/safari/sfri11471/mac"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Gerenciar cookies no Safari
                </a>
              </li>
              <li>
                <strong>Microsoft Edge:</strong>{" "}
                <a
                  href="https://support.microsoft.com/pt-br/microsoft-edge/excluir-cookies-no-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Gerenciar cookies no Edge
                </a>
              </li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6 text-foreground">
              6.2 Ferramentas de Opt-out
            </h3>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Você também pode optar por não participar de cookies específicos de terceiros:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
              <li>
                <strong>Google Analytics:</strong>{" "}
                <a
                  href="https://tools.google.com/dlpage/gaoptout"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Plugin de Opt-out
                </a>
              </li>
              <li>
                <strong>Network Advertising Initiative:</strong>{" "}
                <a
                  href="https://optout.networkadvertising.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Opt-out de publicidade
                </a>
              </li>
            </ul>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-6 rounded-lg border border-yellow-200 dark:border-yellow-800 mt-6">
              <p className="text-muted-foreground">
                <strong>⚠️ Importante:</strong> Se você optar por desativar cookies, algumas
                funcionalidades do nosso website podem não funcionar corretamente. Por exemplo, você
                pode precisar inserir suas informações novamente ou algumas páginas podem não
                carregar adequadamente.
              </p>
            </div>
          </section>

          {/* Section 7 */}
          <section>
            <h2 className="text-2xl font-bold mb-4 text-foreground">7. Conformidade com a LGPD</h2>
            <p className="text-muted-foreground leading-relaxed">
              Esta Política de Cookies está em conformidade com a Lei Geral de Proteção de Dados
              (LGPD - Lei nº 13.709/2018) e o Marco Civil da Internet (Lei nº 12.965/2014).
              Respeitamos seus direitos de privacidade e garantimos transparência sobre como usamos
              cookies.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-4">
              Para mais informações sobre como tratamos seus dados pessoais, consulte nossa{" "}
              <a href="/privacy-policy" className="text-primary hover:underline font-semibold">
                Política de Privacidade
              </a>
              .
            </p>
          </section>

          {/* Section 8 */}
          <section>
            <h2 className="text-2xl font-bold mb-4 text-foreground">
              8. Atualizações desta Política
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Podemos atualizar esta Política de Cookies periodicamente para refletir mudanças em
              nossa prática de cookies ou por outros motivos operacionais, legais ou regulatórios.
              Recomendamos que você revise esta página regularmente para se manter informado sobre
              como usamos cookies.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-4">
              A data da "Última atualização" no topo desta página indica quando esta política foi
              revisada pela última vez.
            </p>
          </section>

          {/* Section 9 */}
          <section>
            <h2 className="text-2xl font-bold mb-4 text-foreground">9. Contato</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Se você tiver dúvidas sobre nossa Política de Cookies ou sobre como usamos cookies,
              entre em contato conosco:
            </p>
            <div className="bg-gradient-to-br from-primary/10 to-secondary/10 p-6 rounded-lg border border-primary/20">
              <p className="text-muted-foreground mb-2">
                <strong>E-mail:</strong>{" "}
                <a href="mailto:dpo@elys.com.br" className="text-primary hover:underline">
                  dpo@elys.com.br
                </a>
              </p>
              <p className="text-muted-foreground mb-2">
                <strong>Telefone:</strong>{" "}
                <a href="tel:+5531997382235" className="text-primary hover:underline">
                  +55 (31) 9973-8235
                </a>
              </p>
              <p className="text-muted-foreground mb-2">
                <strong>Endereço:</strong> São Paulo, SP - Brasil
              </p>
              <p className="text-muted-foreground">
                <strong>Horário de atendimento:</strong> Segunda a Sexta, 8h às 18h
              </p>
            </div>
          </section>

          {/* Summary Box */}
          <section className="mt-12 p-6 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-lg border border-primary/20">
            <h3 className="text-xl font-bold mb-4 text-foreground">📋 Resumo Rápido</h3>
            <ul className="space-y-2 text-muted-foreground">
              <li>✅ Usamos cookies para melhorar sua experiência</li>
              <li>✅ Você pode controlar cookies através do banner de consentimento</li>
              <li>✅ Cookies essenciais são necessários para o funcionamento do site</li>
              <li>✅ Você pode desabilitar cookies nas configurações do navegador</li>
              <li>✅ Suas preferências são respeitadas conforme a LGPD</li>
            </ul>
          </section>
        </article>

        {/* CTA Section */}
        <div className="mt-16 p-8 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-2xl border border-primary/20 text-center">
          <h3 className="text-2xl font-bold mb-4">Quer saber mais sobre privacidade?</h3>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Visite nossa Política de Privacidade completa para entender como protegemos seus dados
            pessoais.
          </p>
          <a
            href="/privacy-policy"
            className="inline-flex items-center px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-all hover:shadow-lg font-semibold"
          >
            Ver Política de Privacidade
          </a>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default CookiePolicy;

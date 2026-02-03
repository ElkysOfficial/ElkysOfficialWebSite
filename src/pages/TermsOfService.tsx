import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import Breadcrumbs from "@/components/Breadcrumbs";
import { Helmet } from "react-helmet-async";

const TermsOfService = () => {

  return (
    <>
      <Helmet>
        <title>Termos de Uso | Elkys - Condições de Serviço</title>
        <meta name="description" content="Termos de Uso do website Elkys. Conheça as condições de uso, direitos, obrigações e políticas aplicáveis aos nossos serviços de desenvolvimento de software." />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://elkys.com.br/terms-of-service" />
        <meta property="og:title" content="Termos de Uso | Elkys" />
        <meta property="og:description" content="Termos de Uso do website Elkys. Conheça as condições de uso e políticas aplicáveis aos nossos serviços." />
        <meta property="og:url" content="https://elkys.com.br/terms-of-service" />
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
          <h1 className="text-3xl sm:text-4xl font-bold mb-4 text-foreground">Termos de Uso</h1>
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
              1. Disposicoes Preliminares
            </h2>
            <div className="space-y-4 text-muted-foreground leading-relaxed">
              <p>
                <strong>1.1.</strong> O presente instrumento estabelece os Termos de Uso aplicaveis
                ao acesso e utilizacao do website elkys.com.br, de titularidade da Elkys, pessoa
                juridica inscrita sob o regime de Microempreendedor Individual (MEI).
              </p>
              <p>
                <strong>1.2.</strong> Ao acessar ou utilizar este website, o usuario declara ter
                lido, compreendido e aceito integralmente as condicoes aqui estabelecidas.
              </p>
              <p>
                <strong>1.3.</strong> A Elkys reserva-se o direito de modificar unilateralmente, a
                qualquer tempo, os presentes Termos, mediante publicacao da versao atualizada neste
                website.
              </p>
            </div>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold mb-4 text-foreground border-l-4 border-primary pl-4">
              2. Definicoes
            </h2>
            <div className="space-y-3 text-muted-foreground leading-relaxed">
              <p>
                <strong>2.1.</strong> Para fins deste instrumento, consideram-se as seguintes
                definicoes:
              </p>
              <div className="ml-6 space-y-2">
                <p>
                  <strong>(a) "Elkys":</strong> pessoa juridica prestadora dos servicos descritos
                  neste website;
                </p>
                <p>
                  <strong>(b) "Usuario":</strong> pessoa fisica ou juridica que acessa o website;
                </p>
                <p>
                  <strong>(c) "Cliente":</strong> usuario que contrata os servicos oferecidos;
                </p>
                <p>
                  <strong>(d) "Servicos":</strong> desenvolvimento de software, consultoria em TI,
                  automacao de processos e demais solucoes tecnologicas;
                </p>
                <p>
                  <strong>(e) "Conteudo":</strong> informacoes, textos, imagens, codigos e demais
                  materiais disponiveis no website.
                </p>
              </div>
            </div>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold mb-4 text-foreground border-l-4 border-primary pl-4">
              3. Objeto
            </h2>
            <div className="space-y-4 text-muted-foreground leading-relaxed">
              <p>
                <strong>3.1.</strong> Este website tem como objetivo apresentar os servicos
                oferecidos pela Elkys, permitindo que potenciais clientes conhecam as solucoes
                disponiveis e entrem em contato para contratacao.
              </p>
              <p>
                <strong>3.2.</strong> Os servicos oferecidos incluem, mas nao se limitam a:
              </p>
              <ul className="list-none ml-6 space-y-1">
                <li>(a) Desenvolvimento de software sob demanda;</li>
                <li>(b) Criacao de aplicacoes web e mobile;</li>
                <li>(c) Automacao de processos empresariais;</li>
                <li>(d) Integracao de sistemas;</li>
                <li>(e) Consultoria em arquitetura de software.</li>
              </ul>
            </div>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold mb-4 text-foreground border-l-4 border-primary pl-4">
              4. Obrigacoes do Usuario
            </h2>
            <div className="space-y-4 text-muted-foreground leading-relaxed">
              <p>
                <strong>4.1.</strong> O usuario compromete-se a utilizar o website em conformidade
                com a legislacao vigente, os bons costumes e a ordem publica.
              </p>
              <p>
                <strong>4.2.</strong> E vedado ao usuario:
              </p>
              <ul className="list-none ml-6 space-y-1">
                <li>(a) Reproduzir, copiar ou distribuir o conteudo sem autorizacao expressa;</li>
                <li>(b) Utilizar mecanismos automatizados para coleta de dados;</li>
                <li>(c) Interferir no funcionamento do website;</li>
                <li>(d) Violar direitos de propriedade intelectual;</li>
                <li>(e) Praticar atos que possam causar danos a Elkys ou a terceiros.</li>
              </ul>
              <p>
                <strong>4.3.</strong> O usuario e responsavel pela veracidade das informacoes
                fornecidas atraves dos formularios de contato.
              </p>
            </div>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold mb-4 text-foreground border-l-4 border-primary pl-4">
              5. Propriedade Intelectual
            </h2>
            <div className="space-y-4 text-muted-foreground leading-relaxed">
              <p>
                <strong>5.1.</strong> Todo o conteudo disponivel no website, incluindo textos,
                imagens, logotipos, icones, fotografias, videos, codigos-fonte e elementos de
                design, e de propriedade exclusiva da Elkys ou de seus licenciadores.
              </p>
              <p>
                <strong>5.2.</strong> A utilizacao, reproducao, distribuicao ou modificacao de
                qualquer conteudo sem autorizacao previa e expressa constitui violacao dos direitos
                de propriedade intelectual.
              </p>
              <p>
                <strong>5.3.</strong> O nome comercial "Elkys" e sua identidade visual sao
                protegidos pela legislacao aplicavel, sendo vedada sua utilizacao por terceiros.
              </p>
            </div>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold mb-4 text-foreground border-l-4 border-primary pl-4">
              6. Contratacao de Servicos
            </h2>
            <div className="space-y-4 text-muted-foreground leading-relaxed">
              <p>
                <strong>6.1.</strong> A contratacao de servicos sera formalizada mediante proposta
                comercial ou contrato especifico, que estabelecera escopo, prazos, valores e demais
                condicoes aplicaveis.
              </p>
              <p>
                <strong>6.2.</strong> Os precos dos servicos serao definidos caso a caso, de acordo
                com a complexidade e requisitos de cada projeto.
              </p>
              <p>
                <strong>6.3.</strong> A Elkys reserva-se o direito de recusar propostas de
                contratacao a seu exclusivo criterio.
              </p>
            </div>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold mb-4 text-foreground border-l-4 border-primary pl-4">
              7. Limitacao de Responsabilidade
            </h2>
            <div className="space-y-4 text-muted-foreground leading-relaxed">
              <p>
                <strong>7.1.</strong> A Elkys nao sera responsavel por:
              </p>
              <ul className="list-none ml-6 space-y-1">
                <li>(a) Danos decorrentes da indisponibilidade temporaria do website;</li>
                <li>(b) Prejuizos causados por uso indevido do website pelo usuario;</li>
                <li>(c) Conteudo de websites de terceiros acessados atraves de links;</li>
                <li>(d) Perdas indiretas, incidentais ou consequenciais.</li>
              </ul>
              <p>
                <strong>7.2.</strong> O website e fornecido "no estado em que se encontra", sem
                garantias de qualquer natureza quanto a disponibilidade ininterrupta ou ausencia de
                erros.
              </p>
            </div>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold mb-4 text-foreground border-l-4 border-primary pl-4">
              8. Privacidade e Protecao de Dados
            </h2>
            <div className="space-y-4 text-muted-foreground leading-relaxed">
              <p>
                <strong>8.1.</strong> O tratamento de dados pessoais realizado pela Elkys esta
                descrito na{" "}
                <a href="/privacy-policy" className="text-primary hover:underline">
                  Politica de Privacidade
                </a>
                , que complementa os presentes Termos.
              </p>
              <p>
                <strong>8.2.</strong> A Elkys compromete-se a tratar os dados pessoais em
                conformidade com a Lei Geral de Protecao de Dados (Lei n. 13.709/2018).
              </p>
            </div>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold mb-4 text-foreground border-l-4 border-primary pl-4">
              9. Disposicoes Finais
            </h2>
            <div className="space-y-4 text-muted-foreground leading-relaxed">
              <p>
                <strong>9.1.</strong> A tolerancia quanto ao eventual descumprimento de qualquer
                disposicao destes Termos nao constituira novacao ou renuncia de direitos.
              </p>
              <p>
                <strong>9.2.</strong> Caso qualquer clausula seja considerada nula ou ineficaz, as
                demais permanecerao em pleno vigor.
              </p>
              <p>
                <strong>9.3.</strong> Estes Termos sao regidos pelas leis da Republica Federativa do
                Brasil.
              </p>
              <p>
                <strong>9.4.</strong> Fica eleito o foro da Comarca de Belo Horizonte, Estado de
                Minas Gerais, para dirimir quaisquer controversias decorrentes destes Termos.
              </p>
            </div>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-semibold mb-4 text-foreground border-l-4 border-primary pl-4">
              10. Contato
            </h2>
            <div className="space-y-4 text-muted-foreground leading-relaxed">
              <p>
                <strong>10.1.</strong> Para esclarecimentos sobre estes Termos de Uso, o usuario
                podera entrar em contato atraves dos seguintes canais:
              </p>
              <div className="bg-muted/30 p-6 rounded-lg mt-4">
                <p className="mb-2">
                  <strong>Razao Social:</strong> Elkys (Microempreendedor Individual)
                </p>
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
              Ao utilizar este website, o usuario declara estar ciente e de acordo com os presentes
              Termos de Uso.
            </p>
          </div>
        </article>
      </main>

        <Footer />
      </div>
    </>
  );
};

export default TermsOfService;

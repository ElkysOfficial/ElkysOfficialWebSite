import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import Breadcrumbs from "@/components/Breadcrumbs";
import { useEffect } from "react";

const TermsOfService = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = "Termos de Uso | Elys - Condições de Serviço";
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <Breadcrumbs />

      <main id="main-content" className="container mx-auto px-4 py-24 max-w-4xl">
        {/* Header */}
        <header className="mb-8 md:mb-12">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
            Termos de <span className="gradient-text">Uso</span>
          </h1>
          <p className="text-muted-foreground text-base sm:text-lg">
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
            <h2 className="text-2xl font-bold mb-4 text-foreground">1. Aceitação dos Termos</h2>
            <p className="text-muted-foreground leading-relaxed">
              Bem-vindo ao website da <strong>Elys</strong>. Ao acessar e usar este site (
              <strong>elys.com.br</strong>), você concorda em cumprir e estar vinculado aos
              seguintes Termos de Uso. Se você não concordar com qualquer parte destes termos, não
              deve usar nosso website ou serviços.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-4">
              Estes Termos de Uso constituem um acordo legal entre você (o "Usuário" ou "Cliente") e
              Elys, operando como Microempreendedor Individual - MEI ("Elys", "nós", "nosso" ou
              "nossa").
            </p>
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800 mt-4">
              <p className="text-sm text-muted-foreground">
                ℹ️ <strong>Nota:</strong> A Elys opera como Microempreendedor Individual (MEI),
                prestando serviços de desenvolvimento de software e consultoria em TI de forma 100%
                remota em todo o território brasileiro.
              </p>
            </div>
          </section>

          {/* Section 2 */}
          <section>
            <h2 className="text-2xl font-bold mb-4 text-foreground">2. Definições</h2>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
              <li>
                <strong>"Website"</strong> refere-se ao site elys.com.br e todas as suas páginas
              </li>
              <li>
                <strong>"Serviços"</strong> refere-se a todos os serviços de desenvolvimento de
                software, consultoria, automação e integrações oferecidos pela Elys
              </li>
              <li>
                <strong>"Usuário"</strong> refere-se a qualquer pessoa que acessa ou usa o Website
              </li>
              <li>
                <strong>"Cliente"</strong> refere-se a qualquer pessoa ou empresa que contrata
                nossos Serviços
              </li>
              <li>
                <strong>"Conteúdo"</strong> refere-se a textos, imagens, vídeos, código e qualquer
                outro material presente no Website
              </li>
            </ul>
          </section>

          {/* Section 3 */}
          <section>
            <h2 className="text-2xl font-bold mb-4 text-foreground">3. Uso do Website</h2>

            <h3 className="text-xl font-semibold mb-3 text-foreground">3.1 Licença de Uso</h3>
            <p className="text-muted-foreground leading-relaxed">
              Concedemos a você uma licença limitada, não exclusiva, não transferível e revogável
              para acessar e usar nosso Website para fins pessoais e comerciais legítimos, de acordo
              com estes Termos.
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-6 text-foreground">
              3.2 Restrições de Uso
            </h3>
            <p className="text-muted-foreground leading-relaxed mb-4">Você concorda em NÃO:</p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
              <li>Usar o Website para fins ilegais ou não autorizados</li>
              <li>Tentar obter acesso não autorizado aos nossos sistemas ou redes</li>
              <li>Interferir ou interromper o funcionamento do Website</li>
              <li>
                Copiar, reproduzir, distribuir ou modificar o conteúdo sem autorização expressa
              </li>
              <li>Usar técnicas de scraping, crawling ou extração automatizada de dados</li>
              <li>Transmitir vírus, malware ou qualquer código malicioso</li>
              <li>Violar direitos de propriedade intelectual da Elys ou de terceiros</li>
              <li>Fazer engenharia reversa de qualquer parte do Website</li>
              <li>Usar o Website para competir diretamente com a Elys</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section>
            <h2 className="text-2xl font-bold mb-4 text-foreground">4. Propriedade Intelectual</h2>

            <h3 className="text-xl font-semibold mb-3 text-foreground">4.1 Direitos Autorais</h3>
            <p className="text-muted-foreground leading-relaxed">
              Todo o conteúdo presente no Website, incluindo mas não limitado a textos, gráficos,
              logos, ícones, imagens, clipes de áudio, downloads digitais e compilações de dados, é
              de propriedade da Elys ou de seus fornecedores de conteúdo e está protegido por leis
              brasileiras e internacionais de direitos autorais.
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-6 text-foreground">
              4.2 Nome Comercial e Identidade Visual
            </h3>
            <p className="text-muted-foreground leading-relaxed">
              "Elys" é o nome comercial utilizado para identificar nossos serviços. O nome, logotipo
              e identidade visual são de nossa propriedade e não podem ser utilizados por terceiros
              sem autorização prévia por escrito. Você não está autorizado a usar nosso nome
              comercial, logotipo ou elementos de identidade visual sem nossa permissão expressa.
            </p>
            <p className="text-sm text-muted-foreground mt-3 italic">
              * Nota: O nome "Elys" não é uma marca registrada no INPI, mas é protegido pelos
              direitos de uso e identidade comercial.
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-6 text-foreground">
              4.3 Código-Fonte e Trabalhos Desenvolvidos
            </h3>
            <p className="text-muted-foreground leading-relaxed">
              Os direitos de propriedade intelectual sobre os projetos desenvolvidos pela Elys serão
              definidos em contratos específicos para cada projeto. Na ausência de contrato
              específico, a Elys retém todos os direitos sobre código, design e documentação
              produzidos.
            </p>
          </section>

          {/* Section 5 */}
          <section>
            <h2 className="text-2xl font-bold mb-4 text-foreground">5. Serviços Oferecidos</h2>

            <h3 className="text-xl font-semibold mb-3 text-foreground">
              5.1 Descrição dos Serviços
            </h3>
            <p className="text-muted-foreground leading-relaxed mb-4">
              A Elys oferece os seguintes serviços:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
              <li>Desenvolvimento de software sob demanda (web e mobile)</li>
              <li>Automação de processos e RPA</li>
              <li>Integração de sistemas</li>
              <li>Consultoria em arquitetura de software e CI/CD</li>
              <li>Manutenção e suporte contínuo</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6 text-foreground">
              5.2 Contratação de Serviços
            </h3>
            <p className="text-muted-foreground leading-relaxed">
              A contratação de serviços requer um contrato específico ou proposta comercial aceita
              por ambas as partes. Os termos específicos de cada projeto, incluindo escopo, prazos,
              valores e condições de pagamento, serão definidos em documentos separados.
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-6 text-foreground">
              5.3 Modificações nos Serviços
            </h3>
            <p className="text-muted-foreground leading-relaxed">
              Reservamo-nos o direito de modificar, suspender ou descontinuar qualquer serviço a
              qualquer momento, sem aviso prévio. Não seremos responsáveis perante você ou terceiros
              por qualquer modificação, suspensão ou descontinuação dos serviços.
            </p>
          </section>

          {/* Section 6 */}
          <section>
            <h2 className="text-2xl font-bold mb-4 text-foreground">
              6. Cadastro e Conta de Usuário
            </h2>

            <h3 className="text-xl font-semibold mb-3 text-foreground">
              6.1 Informações de Cadastro
            </h3>
            <p className="text-muted-foreground leading-relaxed">
              Ao se cadastrar ou enviar informações através de formulários em nosso Website, você
              concorda em fornecer informações verdadeiras, precisas, atuais e completas. Você é
              responsável por manter a confidencialidade de suas credenciais de acesso (quando
              aplicável).
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-6 text-foreground">
              6.2 Responsabilidade do Usuário
            </h3>
            <p className="text-muted-foreground leading-relaxed">
              Você é totalmente responsável por todas as atividades que ocorrem sob sua conta. Você
              deve notificar-nos imediatamente sobre qualquer uso não autorizado de sua conta ou
              qualquer outra violação de segurança.
            </p>
          </section>

          {/* Section 7 */}
          <section>
            <h2 className="text-2xl font-bold mb-4 text-foreground">
              7. Privacidade e Proteção de Dados
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              O uso de nosso Website também é regido por nossa{" "}
              <a href="/privacy-policy" className="text-primary hover:underline font-semibold">
                Política de Privacidade
              </a>
              , que está em conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei nº
              13.709/2018). Ao usar nosso Website, você consente com a coleta e uso de informações
              conforme descrito na Política de Privacidade.
            </p>
          </section>

          {/* Section 8 */}
          <section>
            <h2 className="text-2xl font-bold mb-4 text-foreground">8. Pagamentos e Faturamento</h2>

            <h3 className="text-xl font-semibold mb-3 text-foreground">8.1 Preços e Condições</h3>
            <p className="text-muted-foreground leading-relaxed">
              Os preços de nossos serviços são informados em propostas comerciais específicas e
              podem variar conforme o escopo do projeto. Reservamo-nos o direito de alterar nossos
              preços a qualquer momento, mas mudanças não afetarão contratos já firmados.
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-6 text-foreground">
              8.2 Forma de Pagamento
            </h3>
            <p className="text-muted-foreground leading-relaxed">
              Aceitamos diversas formas de pagamento, incluindo transferência bancária, PIX, boleto
              e cartão de crédito. As condições de pagamento (parcelamento, prazos, etc.) serão
              definidas em contrato.
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-6 text-foreground">
              8.3 Atrasos e Inadimplência
            </h3>
            <p className="text-muted-foreground leading-relaxed">
              Pagamentos em atraso estarão sujeitos a juros de mora e multa conforme previsto na
              legislação brasileira. Em caso de inadimplência, reservamo-nos o direito de suspender
              a prestação de serviços até a regularização.
            </p>
          </section>

          {/* Section 9 */}
          <section>
            <h2 className="text-2xl font-bold mb-4 text-foreground">9. Garantias e Limitações</h2>

            <h3 className="text-xl font-semibold mb-3 text-foreground">9.1 Garantia de Serviços</h3>
            <p className="text-muted-foreground leading-relaxed">
              Garantimos que nossos serviços serão prestados com profissionalismo e de acordo com as
              melhores práticas do mercado. Garantias específicas sobre projetos desenvolvidos serão
              detalhadas em contratos individuais.
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-6 text-foreground">9.2 Isenções</h3>
            <p className="text-muted-foreground leading-relaxed mb-4">
              O Website é fornecido "como está" e "conforme disponível". Não garantimos que:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
              <li>O Website estará disponível de forma ininterrupta ou livre de erros</li>
              <li>Os defeitos serão corrigidos imediatamente</li>
              <li>O Website estará livre de vírus ou outros componentes prejudiciais</li>
              <li>Os resultados obtidos serão precisos ou confiáveis em todas as situações</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6 text-foreground">
              9.3 Limitação de Responsabilidade
            </h3>
            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-6 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <p className="text-muted-foreground leading-relaxed">
                Na extensão máxima permitida por lei, a Elys não será responsável por quaisquer
                danos indiretos, incidentais, especiais, consequenciais ou punitivos, incluindo mas
                não limitado a perda de lucros, dados, uso, goodwill ou outras perdas intangíveis,
                resultantes de:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4 mt-4">
                <li>Seu acesso ou uso (ou incapacidade de acessar ou usar) o Website</li>
                <li>Qualquer conduta ou conteúdo de terceiros no Website</li>
                <li>Qualquer conteúdo obtido do Website</li>
                <li>Acesso não autorizado, uso ou alteração de suas transmissões ou conteúdo</li>
              </ul>
            </div>
          </section>

          {/* Section 10 */}
          <section>
            <h2 className="text-2xl font-bold mb-4 text-foreground">10. Indenização</h2>
            <p className="text-muted-foreground leading-relaxed">
              Você concorda em indenizar, defender e isentar a Elys, seus diretores, funcionários,
              agentes e parceiros de e contra quaisquer reivindicações, responsabilidades, danos,
              perdas e despesas, incluindo honorários advocatícios razoáveis, decorrentes de:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4 mt-4">
              <li>Seu uso do Website</li>
              <li>Violação destes Termos de Uso</li>
              <li>
                Violação de direitos de terceiros, incluindo direitos de propriedade intelectual
              </li>
              <li>Qualquer conteúdo que você enviar ou transmitir através do Website</li>
            </ul>
          </section>

          {/* Section 11 */}
          <section>
            <h2 className="text-2xl font-bold mb-4 text-foreground">
              11. Links para Sites de Terceiros
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Nosso Website pode conter links para sites ou serviços de terceiros que não são de
              propriedade ou controlados pela Elys. Não temos controle sobre, e não assumimos
              responsabilidade pelo conteúdo, políticas de privacidade ou práticas de sites ou
              serviços de terceiros. Você reconhece e concorda que a Elys não será responsável,
              direta ou indiretamente, por quaisquer danos causados por ou em conexão com o uso de
              tais sites ou serviços.
            </p>
          </section>

          {/* Section 12 */}
          <section>
            <h2 className="text-2xl font-bold mb-4 text-foreground">12. Rescisão</h2>

            <h3 className="text-xl font-semibold mb-3 text-foreground">12.1 Rescisão pela Elys</h3>
            <p className="text-muted-foreground leading-relaxed">
              Podemos rescindir ou suspender seu acesso ao Website imediatamente, sem aviso prévio
              ou responsabilidade, por qualquer motivo, incluindo, sem limitação, se você violar
              estes Termos de Uso.
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-6 text-foreground">
              12.2 Efeitos da Rescisão
            </h3>
            <p className="text-muted-foreground leading-relaxed">
              Após a rescisão, seu direito de usar o Website cessará imediatamente. Todas as
              disposições destes Termos que, por sua natureza, devam sobreviver à rescisão,
              permanecerão em vigor, incluindo disposições sobre propriedade intelectual, isenções
              de garantia e limitações de responsabilidade.
            </p>
          </section>

          {/* Section 13 */}
          <section>
            <h2 className="text-2xl font-bold mb-4 text-foreground">
              13. Lei Aplicável e Jurisdição
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Estes Termos de Uso serão regidos e interpretados de acordo com as leis da República
              Federativa do Brasil, sem consideração a seus conflitos de disposições legais.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-4">
              Qualquer disputa decorrente ou relacionada a estes Termos será submetida à jurisdição
              exclusiva dos tribunais da Comarca de São Paulo, Estado de São Paulo, Brasil.
            </p>
          </section>

          {/* Section 14 */}
          <section>
            <h2 className="text-2xl font-bold mb-4 text-foreground">14. Disposições Gerais</h2>

            <h3 className="text-xl font-semibold mb-3 text-foreground">
              14.1 Alterações aos Termos
            </h3>
            <p className="text-muted-foreground leading-relaxed">
              Reservamo-nos o direito de modificar ou substituir estes Termos a qualquer momento. Se
              uma revisão for material, tentaremos fornecer um aviso com pelo menos 30 dias de
              antecedência antes de quaisquer novos termos entrarem em vigor. O que constitui uma
              mudança material será determinado a nosso exclusivo critério.
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-6 text-foreground">
              14.2 Integralidade do Acordo
            </h3>
            <p className="text-muted-foreground leading-relaxed">
              Estes Termos de Uso, juntamente com nossa Política de Privacidade e quaisquer
              contratos específicos de serviços, constituem o acordo integral entre você e a Elys em
              relação ao uso do Website.
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-6 text-foreground">14.3 Divisibilidade</h3>
            <p className="text-muted-foreground leading-relaxed">
              Se qualquer disposição destes Termos for considerada inválida ou inexequível, tal
              disposição será modificada e interpretada para cumprir os objetivos de tal disposição
              na maior extensão possível sob a lei aplicável, e as disposições restantes continuarão
              em pleno vigor e efeito.
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-6 text-foreground">14.4 Renúncia</h3>
            <p className="text-muted-foreground leading-relaxed">
              Nenhuma renúncia pela Elys de qualquer termo ou condição estabelecido nestes Termos
              será considerada uma renúncia adicional ou contínua de tal termo ou condição ou uma
              renúncia de qualquer outro termo ou condição.
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-6 text-foreground">14.5 Cessão</h3>
            <p className="text-muted-foreground leading-relaxed">
              Você não pode ceder ou transferir estes Termos, no todo ou em parte, sem nosso
              consentimento prévio por escrito. Podemos ceder nossos direitos a qualquer momento sem
              restrições.
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-6 text-foreground">14.6 Idioma</h3>
            <p className="text-muted-foreground leading-relaxed">
              Estes Termos de Uso são redigidos em português. Qualquer tradução destes Termos é
              fornecida apenas para sua conveniência. Em caso de conflito entre a versão em
              português e uma tradução, a versão em português prevalecerá.
            </p>
          </section>

          {/* Section 15 */}
          <section>
            <h2 className="text-2xl font-bold mb-4 text-foreground">15. Contato</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Se você tiver alguma dúvida sobre estes Termos de Uso, entre em contato conosco:
            </p>
            <div className="bg-gradient-to-br from-primary/10 to-secondary/10 p-6 rounded-lg border border-primary/20">
              <p className="text-muted-foreground mb-2">
                <strong>Nome Empresarial:</strong> Elys (Microempreendedor Individual)
              </p>
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

          {/* Acceptance */}
          <section className="mt-12 p-6 bg-primary/5 rounded-lg border-l-4 border-primary">
            <p className="text-muted-foreground leading-relaxed">
              <strong>
                Ao usar nosso Website e Serviços, você confirma que leu, compreendeu e concorda em
                estar vinculado a estes Termos de Uso.
              </strong>
            </p>
          </section>
        </article>

        {/* CTA Section */}
        <div className="mt-16 p-8 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-2xl border border-primary/20 text-center">
          <h3 className="text-2xl font-bold mb-4">Pronto para começar seu projeto?</h3>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Nossa equipe está pronta para transformar suas ideias em soluções tecnológicas
            inovadoras.
          </p>
          <a
            href="/#contact"
            className="inline-flex items-center px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-all hover:shadow-lg font-semibold"
          >
            Solicitar Orçamento
          </a>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default TermsOfService;

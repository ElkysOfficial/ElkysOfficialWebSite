// Conteudo da Politica de Privacidade. Compartilhado entre a pagina
// publica /privacy-policy e a tela de aceite do portal do cliente.
const PrivacyBody = () => (
  <>
    <section className="mb-10">
      <h2 className="text-xl font-semibold mb-4 text-foreground border-l-4 border-primary pl-4">
        1. Introducao
      </h2>
      <div className="space-y-4 text-muted-foreground leading-relaxed">
        <p>
          <strong>1.1.</strong> A presente Politica de Privacidade descreve como a Elkys coleta,
          utiliza, armazena, compartilha e protege dados pessoais no ambito do website elkys.com.br
          e dos portais autenticados de administracao e de clientes hospedados sob o mesmo dominio.
        </p>
        <p>
          <strong>1.2.</strong> Esta Politica esta em conformidade com a Lei Geral de Protecao de
          Dados Pessoais (LGPD - Lei n. 13.709/2018), com o Marco Civil da Internet (Lei n.
          12.965/2014) e demais normas aplicaveis a protecao de dados no Brasil.
        </p>
        <p>
          <strong>1.3.</strong> Ao acessar e utilizar o website ou os portais, o usuario declara
          estar ciente das praticas descritas nesta Politica. O uso continuado apos alteracoes
          implica aceitacao da versao vigente.
        </p>
      </div>
    </section>

    <section className="mb-10">
      <h2 className="text-xl font-semibold mb-4 text-foreground border-l-4 border-primary pl-4">
        2. Controlador dos Dados
      </h2>
      <div className="space-y-4 text-muted-foreground leading-relaxed">
        <p>
          <strong>2.1.</strong> Para os fins desta Politica, o controlador dos dados pessoais e:
        </p>
        <div className="bg-muted/30 p-6 rounded-lg mt-4">
          <p className="mb-2">
            <strong>Razao Social:</strong> Elkys (Microempreendedor Individual)
          </p>
          <p className="mb-2">
            <strong>Atividade:</strong> Desenvolvimento de software, consultoria em TI e automacao
            de processos
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
          <strong>3.1. Dados coletados no website publico (formulario de contato):</strong>
        </p>
        <ul className="list-none ml-6 space-y-1">
          <li>(a) Nome completo;</li>
          <li>(b) Endereco de e-mail;</li>
          <li>(c) Nome da empresa (opcional);</li>
          <li>(d) Mensagem livre enviada pelo usuario.</li>
        </ul>

        <p className="mt-4">
          <strong>3.2. Dados cadastrais coletados no portal de clientes</strong> (apenas quando ha
          relacao contratual ou pre-contratual ativa):
        </p>
        <ul className="list-none ml-6 space-y-1">
          <li>
            (a) Identificacao: nome completo, CPF, RG, data de nascimento, genero (declarado);
          </li>
          <li>(b) Empresariais: razao social, nome fantasia, CNPJ, CNAE, inscricoes;</li>
          <li>
            (c) Contato: e-mail, e-mail financeiro, telefone, WhatsApp, contato secundario,
            responsavel financeiro;
          </li>
          <li>(d) Endereco: logradouro, numero, complemento, bairro, cidade, estado, CEP, pais;</li>
          <li>
            (e) Operacionais: cargo do representante, dados de representacao legal e demais
            informacoes contidas em propostas, contratos, projetos e cobrancas.
          </li>
        </ul>

        <p className="mt-4">
          <strong>3.3. Dados de equipe</strong> (colaboradores Elkys com acesso ao portal
          administrativo): nome, CPF, e-mail, telefone, data de nascimento, ultimo acesso e funcao
          atribuida.
        </p>

        <p className="mt-4">
          <strong>3.4. Dados coletados automaticamente:</strong>
        </p>
        <ul className="list-none ml-6 space-y-1">
          <li>(a) Endereco IP;</li>
          <li>(b) Tipo e versao do navegador, sistema operacional e dispositivo;</li>
          <li>(c) Paginas acessadas, eventos de navegacao e tempo de permanencia;</li>
          <li>(d) Data e horario de acesso;</li>
          <li>(e) Tokens de autenticacao e identificadores de sessao;</li>
          <li>(f) Logs de auditoria de acoes realizadas no portal autenticado.</li>
        </ul>
      </div>
    </section>

    <section className="mb-10">
      <h2 className="text-xl font-semibold mb-4 text-foreground border-l-4 border-primary pl-4">
        4. Finalidades do Tratamento
      </h2>
      <div className="space-y-4 text-muted-foreground leading-relaxed">
        <p>
          <strong>4.1.</strong> Os dados pessoais sao tratados, conforme aplicavel, para as
          seguintes finalidades:
        </p>
        <ul className="list-none ml-6 space-y-1">
          <li>(a) Responder solicitacoes de contato e fornecer informacoes sobre os servicos;</li>
          <li>(b) Elaborar propostas comerciais e formalizar contratacoes;</li>
          <li>
            (c) Prestar os servicos contratados, incluindo gestao de projetos, entregas e suporte;
          </li>
          <li>
            (d) Emitir cobrancas, processar pagamentos e cumprir obrigacoes financeiras e fiscais;
          </li>
          <li>
            (e) Permitir acesso autenticado aos portais (admin e cliente) e manter sessoes seguras;
          </li>
          <li>
            (f) Enviar comunicacoes transacionais (boas-vindas, validacao de contrato, lembrete de
            fatura, alerta de inadimplencia, conclusao de projeto, entre outras);
          </li>
          <li>
            (g) Registrar trilhas de auditoria de acoes relevantes para fins de seguranca,
            rastreabilidade e prevencao a fraudes;
          </li>
          <li>
            (h) Realizar analises estatisticas agregadas de uso do website (sem identificacao
            individual);
          </li>
          <li>(i) Cumprir obrigacoes legais, regulatorias e ordens judiciais.</li>
        </ul>
      </div>
    </section>

    <section className="mb-10">
      <h2 className="text-xl font-semibold mb-4 text-foreground border-l-4 border-primary pl-4">
        5. Bases Legais para o Tratamento
      </h2>
      <div className="space-y-4 text-muted-foreground leading-relaxed">
        <p>
          <strong>5.1.</strong> O tratamento e fundamentado nas seguintes bases legais (Art. 7 da
          LGPD):
        </p>
        <ul className="list-none ml-6 space-y-2">
          <li>
            <strong>(a) Consentimento (Art. 7, I):</strong> envio voluntario de dados no formulario
            de contato e ativacao de cookies nao estritamente necessarios;
          </li>
          <li>
            <strong>(b) Execucao de Contrato (Art. 7, V):</strong> tratamento de dados de clientes
            para prestar os servicos contratados, faturar e gerir o relacionamento;
          </li>
          <li>
            <strong>(c) Cumprimento de Obrigacao Legal (Art. 7, II):</strong> retencao fiscal,
            contabil e demais obrigacoes regulatorias;
          </li>
          <li>
            <strong>(d) Legitimo Interesse (Art. 7, IX):</strong> seguranca, prevencao a fraudes,
            auditoria, melhoria do produto e contato comercial sobre servicos contratados;
          </li>
          <li>
            <strong>(e) Exercicio Regular de Direitos (Art. 7, VI):</strong> defesa em processos
            judiciais, administrativos ou arbitrais.
          </li>
        </ul>
      </div>
    </section>

    <section className="mb-10">
      <h2 className="text-xl font-semibold mb-4 text-foreground border-l-4 border-primary pl-4">
        6. Compartilhamento de Dados e Subprocessadores
      </h2>
      <div className="space-y-4 text-muted-foreground leading-relaxed">
        <p>
          <strong>6.1.</strong> A Elkys nao comercializa dados pessoais. O compartilhamento ocorre
          apenas com prestadores de servicos essenciais a operacao do website e dos portais, sob
          contratos que asseguram protecao adequada dos dados.
        </p>
        <p>
          <strong>6.2. Subprocessadores utilizados atualmente:</strong>
        </p>
        <div className="overflow-x-auto mt-3">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-muted/50">
                <th className="border border-border p-3 text-left font-semibold text-foreground">
                  Servico
                </th>
                <th className="border border-border p-3 text-left font-semibold text-foreground">
                  Finalidade
                </th>
                <th className="border border-border p-3 text-left font-semibold text-foreground">
                  Pais
                </th>
              </tr>
            </thead>
            <tbody className="text-muted-foreground">
              <tr>
                <td className="border border-border p-3">Supabase</td>
                <td className="border border-border p-3">
                  Infraestrutura de aplicacao e armazenamento de dados dos portais
                </td>
                <td className="border border-border p-3">EUA</td>
              </tr>
              <tr>
                <td className="border border-border p-3">EmailJS</td>
                <td className="border border-border p-3">
                  Servico de envio de e-mails de contato publico
                </td>
                <td className="border border-border p-3">EUA</td>
              </tr>
              <tr>
                <td className="border border-border p-3">Resend</td>
                <td className="border border-border p-3">
                  Servico de envio de e-mails transacionais
                </td>
                <td className="border border-border p-3">EUA</td>
              </tr>
              <tr>
                <td className="border border-border p-3">Google Analytics 4</td>
                <td className="border border-border p-3">
                  Estatisticas agregadas de uso do website, mediante consentimento previo
                </td>
                <td className="border border-border p-3">EUA</td>
              </tr>
              <tr>
                <td className="border border-border p-3">Hostinger</td>
                <td className="border border-border p-3">Hospedagem do website</td>
                <td className="border border-border p-3">Brasil/UE</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-4">
          <strong>6.3.</strong> Outras hipoteses de compartilhamento:
        </p>
        <ul className="list-none ml-6 space-y-1">
          <li>(a) Cumprimento de obrigacao legal ou determinacao judicial;</li>
          <li>(b) Protecao dos direitos da Elkys ou de terceiros;</li>
          <li>(c) Mediante consentimento expresso do titular.</li>
        </ul>
      </div>
    </section>

    <section className="mb-10">
      <h2 className="text-xl font-semibold mb-4 text-foreground border-l-4 border-primary pl-4">
        7. Seguranca dos Dados
      </h2>
      <div className="space-y-4 text-muted-foreground leading-relaxed">
        <p>
          <strong>7.1.</strong> A Elkys adota medidas administrativas, tecnicas e organizacionais
          adequadas ao risco para proteger os dados pessoais contra acesso nao autorizado,
          alteracao, divulgacao, perda ou destruicao indevida, em conformidade com o Art. 46 da
          LGPD.
        </p>
        <p>
          <strong>7.2.</strong> Tais medidas incluem, entre outras, criptografia em transito e em
          repouso, controle de acesso autenticado baseado em papeis, registros de auditoria das
          acoes administrativas, gestao de incidentes e rotinas de backup. Detalhes tecnicos
          adicionais podem ser fornecidos a clientes corporativos sob acordo de confidencialidade.
        </p>
        <p>
          <strong>7.3.</strong> Nenhum metodo de transmissao ou armazenamento de informacoes e
          completamente seguro. A Elkys nao garante seguranca absoluta, mas trabalha continuamente
          para mitigar riscos e responder a incidentes. Na hipotese de incidente de seguranca que
          possa acarretar risco ou dano relevante aos titulares, a Elkys comunicara a ANPD e os
          titulares afetados no prazo previsto pelo Art. 48 da LGPD.
        </p>
      </div>
    </section>

    <section className="mb-10">
      <h2 className="text-xl font-semibold mb-4 text-foreground border-l-4 border-primary pl-4">
        8. Retencao dos Dados
      </h2>
      <div className="space-y-4 text-muted-foreground leading-relaxed">
        <p>
          <strong>8.1.</strong> Os dados pessoais sao mantidos pelo periodo necessario para atender
          as finalidades descritas, observados os seguintes prazos minimos:
        </p>
        <ul className="list-none ml-6 space-y-1">
          <li>
            (a) Dados de contato do website (formulario): ate 24 meses apos o ultimo contato, salvo
            conversao em relacao contratual;
          </li>
          <li>(b) Logs de acesso e auditoria: 6 meses (Marco Civil da Internet, Art. 15);</li>
          <li>
            (c) Dados fiscais e contabeis (cobrancas, faturas, contratos): minimo de 5 anos contados
            do encerramento do exercicio fiscal correspondente;
          </li>
          <li>
            (d) Dados contratuais (contratos, propostas aceitas, comunicacoes relacionadas): ate o
            transcurso do prazo prescricional aplicavel (geralmente 10 anos, Art. 205 do Codigo
            Civil);
          </li>
          <li>
            (e) Dados de marketing/comunicacao baseados em consentimento: ate a revogacao pelo
            titular.
          </li>
        </ul>
        <p className="mt-4">
          <strong>8.2.</strong> Apos o termino do periodo de retencao, os dados serao eliminados ou
          anonimizados, salvo exigencia legal em contrario.
        </p>
      </div>
    </section>

    <section className="mb-10">
      <h2 className="text-xl font-semibold mb-4 text-foreground border-l-4 border-primary pl-4">
        9. Direitos do Titular
      </h2>
      <div className="space-y-4 text-muted-foreground leading-relaxed">
        <p>
          <strong>9.1.</strong> Nos termos do Art. 18 da LGPD, o titular dos dados pode solicitar a
          qualquer momento:
        </p>
        <ul className="list-none ml-6 space-y-1">
          <li>(a) Confirmacao da existencia de tratamento;</li>
          <li>(b) Acesso aos dados;</li>
          <li>(c) Correcao de dados incompletos, inexatos ou desatualizados;</li>
          <li>
            (d) Anonimizacao, bloqueio ou eliminacao de dados desnecessarios, excessivos ou tratados
            em desconformidade com a LGPD;
          </li>
          <li>(e) Portabilidade dos dados a outro fornecedor;</li>
          <li>
            (f) Eliminacao dos dados tratados com base no consentimento, ressalvadas as hipoteses de
            retencao legal;
          </li>
          <li>(g) Informacao sobre as entidades com as quais houve compartilhamento;</li>
          <li>
            (h) Informacao sobre a possibilidade de nao fornecer consentimento e suas consequencias;
          </li>
          <li>(i) Revogacao do consentimento.</li>
        </ul>
        <p className="mt-4">
          <strong>9.2.</strong> As solicitacoes podem ser encaminhadas para{" "}
          <a href="mailto:contato@elkys.com.br" className="text-primary hover:underline">
            contato@elkys.com.br
          </a>{" "}
          e serao respondidas no prazo de ate 15 dias, podendo a Elkys solicitar documentacao
          adicional para confirmacao da identidade do titular.
        </p>
      </div>
    </section>

    <section className="mb-10">
      <h2 className="text-xl font-semibold mb-4 text-foreground border-l-4 border-primary pl-4">
        10. Cookies e Armazenamento Local
      </h2>
      <div className="space-y-4 text-muted-foreground leading-relaxed">
        <p>
          <strong>10.1.</strong> O website utiliza cookies e tecnologias similares de armazenamento
          local (como localStorage do navegador) para autenticacao, registro de consentimento e
          estatisticas agregadas de uso.
        </p>
        <p>
          <strong>10.2.</strong> Para detalhes sobre cada item armazenado, consulte a{" "}
          <a href="/cookie-policy" className="text-primary hover:underline">
            Politica de Cookies
          </a>
          .
        </p>
      </div>
    </section>

    <section className="mb-10">
      <h2 className="text-xl font-semibold mb-4 text-foreground border-l-4 border-primary pl-4">
        11. Transferencia Internacional de Dados
      </h2>
      <div className="space-y-4 text-muted-foreground leading-relaxed">
        <p>
          <strong>11.1.</strong> Parte dos subprocessadores listados na clausula 6 esta localizada
          fora do Brasil, em especial nos Estados Unidos (Supabase, EmailJS, Resend e Google
          Analytics).
        </p>
        <p>
          <strong>11.2.</strong> Tais transferencias sao realizadas com base no Art. 33 da LGPD,
          mediante adocao de salvaguardas contratuais (clausulas-padrao e DPAs com os fornecedores)
          e selecao de provedores que oferecam nivel adequado de protecao.
        </p>
      </div>
    </section>

    <section className="mb-10">
      <h2 className="text-xl font-semibold mb-4 text-foreground border-l-4 border-primary pl-4">
        12. Decisoes Automatizadas
      </h2>
      <div className="space-y-4 text-muted-foreground leading-relaxed">
        <p>
          <strong>12.1.</strong> A Elkys nao adota decisoes totalmente automatizadas que produzam
          efeitos juridicos relevantes ao titular. Acoes automatizadas restringem-se a operacoes
          administrativas (ex.: envio de lembretes de cobranca, expiracao de proposta), todas
          reversiveis e supervisionadas humanamente.
        </p>
      </div>
    </section>

    <section className="mb-10">
      <h2 className="text-xl font-semibold mb-4 text-foreground border-l-4 border-primary pl-4">
        13. Alteracoes nesta Politica
      </h2>
      <div className="space-y-4 text-muted-foreground leading-relaxed">
        <p>
          <strong>13.1.</strong> Esta Politica podera ser atualizada para refletir mudancas nas
          praticas de tratamento de dados, na legislacao ou no rol de subprocessadores.
        </p>
        <p>
          <strong>13.2.</strong> Atualizacoes relevantes serao comunicadas por meio do website e,
          quando exigido, por e-mail aos titulares afetados.
        </p>
      </div>
    </section>

    <section className="mb-10">
      <h2 className="text-xl font-semibold mb-4 text-foreground border-l-4 border-primary pl-4">
        14. Encarregado pelo Tratamento de Dados (DPO) e Contato
      </h2>
      <div className="space-y-4 text-muted-foreground leading-relaxed">
        <p>
          <strong>14.1.</strong> Para exercer direitos previstos na LGPD ou esclarecer duvidas sobre
          esta Politica, o titular pode contatar o Encarregado pelo Tratamento de Dados:
        </p>
        <div className="bg-muted/30 p-6 rounded-lg mt-4">
          <p className="mb-2">
            <strong>Encarregado (DPO):</strong> Equipe de Privacidade Elkys
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
        <p className="mt-4">
          <strong>14.2.</strong> O titular tambem pode apresentar reclamacao perante a Autoridade
          Nacional de Protecao de Dados (ANPD) atraves de{" "}
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
  </>
);

export default PrivacyBody;

const LOGO_URL = "https://elkys.com.br/imgs/icons/lettering_elkys_email.png";

interface EmailButton {
  label: string;
  href: string;
}

interface EmailTemplateOptions {
  preheader?: string;
  title: string;
  greeting: string;
  body: string;
  button?: EmailButton;
  note?: string;
  highlight?: {
    title: string;
    rows: { label: string; value: string }[];
  };
  warning?: string;
}

export function buildEmail(opts: EmailTemplateOptions): string {
  const highlightBlock = opts.highlight
    ? `
                        <!-- CREDENCIAIS -->
                        <table
                          role="presentation"
                          width="100%"
                          border="0"
                          cellspacing="0"
                          cellpadding="0"
                          style="
                            width: 100%;
                            background-color: #f7f7f7;
                            border: 1px solid #dddddd;
                            margin: 0 0 22px 0;
                          "
                        >
                          <tr>
                            <td style="padding: 14px;">
                              <table
                                role="presentation"
                                width="100%"
                                border="0"
                                cellspacing="0"
                                cellpadding="0"
                              >
                                ${opts.highlight.rows
                                  .map(
                                    (row, i) => `
                                <tr class="stack-column">
                                  <td
                                    class="credential-label text-muted"
                                    valign="top"
                                    style="
                                      width: 145px;
                                      padding: 0 10px ${i === opts.highlight!.rows.length - 1 ? "0" : "10px"} 0;
                                      font-size: 13px;
                                      line-height: 20px;
                                      color: #666666;
                                    "
                                  >
                                    ${row.label}
                                  </td>
                                  <td
                                    class="text-dark"
                                    valign="top"
                                    style="
                                      padding: 0 0 ${i === opts.highlight!.rows.length - 1 ? "0" : "10px"} 0;
                                      font-size: 13px;
                                      line-height: 20px;
                                      color: ${/e-?mail/i.test(row.label) ? "#1d4ed8" : "#111111"};
                                      font-weight: 700;
                                    "
                                  >
                                    ${row.value}
                                  </td>
                                </tr>`
                                  )
                                  .join("")}
                              </table>
                            </td>
                          </tr>
                        </table>`
    : "";

  const buttonBlock = opts.button
    ? `
                        <!-- BOTÃO -->
                        <table
                          role="presentation"
                          width="100%"
                          border="0"
                          cellspacing="0"
                          cellpadding="0"
                          style="margin: 0 0 24px 0;"
                        >
                          <tr>
                            <td align="center">
                              <!--[if mso]>
                                <v:roundrect
                                  xmlns:v="urn:schemas-microsoft-com:vml"
                                  href="${opts.button.href}"
                                  style="height:42px;v-text-anchor:middle;width:176px;"
                                  arcsize="0%"
                                  strokecolor="#472680"
                                  fillcolor="#472680"
                                >
                                  <w:anchorlock />
                                  <center
                                    style="
                                      color:#ffffff;
                                      font-family:Arial, Helvetica, sans-serif;
                                      font-size:14px;
                                      font-weight:bold;
                                    "
                                  >
                                    ${opts.button.label}
                                  </center>
                                </v:roundrect>
                              <![endif]-->

                              <!--[if !mso]><!-- -->
                              <a
                                href="${opts.button.href}"
                                target="_blank"
                                class="button button-purple"
                                style="
                                  display: inline-block;
                                  background-color: #472680;
                                  color: #ffffff;
                                  font-size: 14px;
                                  line-height: 14px;
                                  font-weight: 700;
                                  padding: 14px 28px;
                                "
                              >
                                ${opts.button.label}
                              </a>
                              <!--<![endif]-->
                            </td>
                          </tr>
                        </table>`
    : "";

  const warningBlock = opts.warning
    ? `
                        <p
                          class="text-body"
                          style="
                            margin: 0 0 18px 0;
                            font-size: 14px;
                            line-height: 22px;
                            color: #333333;
                          "
                        >
                          ${opts.warning}
                        </p>`
    : "";

  const noteBlock = opts.note
    ? `
                        <p
                          class="text-body"
                          style="
                            margin: 0 0 18px 0;
                            font-size: 14px;
                            line-height: 22px;
                            color: #333333;
                          "
                        >
                          ${opts.note}
                        </p>`
    : "";

  return `<!doctype html>
<html lang="pt-BR" xmlns="http://www.w3.org/1999/xhtml">
  <head>
    <meta charset="UTF-8" />
    <meta http-equiv="x-ua-compatible" content="ie=edge" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="color-scheme" content="light dark" />
    <meta name="supported-color-schemes" content="light dark" />
    <title>Email Elkys</title>

    <style>
      html,
      body {
        margin: 0 !important;
        padding: 0 !important;
        width: 100% !important;
        height: 100% !important;
        background-color: #f3f4f6 !important;
      }

      body,
      table,
      td,
      a {
        -webkit-text-size-adjust: 100%;
        -ms-text-size-adjust: 100%;
        font-family: Arial, Helvetica, sans-serif;
      }

      table,
      td {
        mso-table-lspace: 0pt;
        mso-table-rspace: 0pt;
        border-collapse: collapse !important;
      }

      img {
        border: 0;
        outline: none;
        text-decoration: none;
        display: block;
        -ms-interpolation-mode: bicubic;
      }

      a {
        text-decoration: none;
      }

      .apple-link a {
        color: inherit !important;
        text-decoration: none !important;
      }

      @media only screen and (max-width: 600px) {
        .container {
          width: 100% !important;
          max-width: 100% !important;
        }

        .mobile-side-padding {
          padding-left: 16px !important;
          padding-right: 16px !important;
        }

        .mobile-content-padding {
          padding: 20px 16px 24px 16px !important;
        }

        .stack-column,
        .stack-column td {
          display: block !important;
          width: 100% !important;
        }

        .credential-label {
          padding-bottom: 4px !important;
        }

        .button {
          display: block !important;
          width: 100% !important;
          box-sizing: border-box !important;
        }

        .footer-social-padding {
          padding-left: 16px !important;
          padding-right: 16px !important;
        }
      }

      [data-ogsc] .email-bg,
      [data-ogsb] .email-bg {
        background-color: #f3f4f6 !important;
      }

      [data-ogsc] .card-bg,
      [data-ogsb] .card-bg {
        background-color: #ffffff !important;
      }

      [data-ogsc] .purple-bg,
      [data-ogsb] .purple-bg {
        background-color: #472680 !important;
      }

      [data-ogsc] .text-dark,
      [data-ogsb] .text-dark {
        color: #111111 !important;
      }

      [data-ogsc] .text-body,
      [data-ogsb] .text-body {
        color: #333333 !important;
      }

      [data-ogsc] .text-muted,
      [data-ogsb] .text-muted {
        color: #666666 !important;
      }

      [data-ogsc] .button-purple,
      [data-ogsb] .button-purple {
        background-color: #472680 !important;
        color: #ffffff !important;
      }
    </style>
  </head>

  <body class="email-bg" style="margin: 0; padding: 0; background-color: #f3f4f6;">
    <center style="width: 100%; background-color: #f3f4f6;">
    <table
      role="presentation"
      width="100%"
      border="0"
      cellspacing="0"
      cellpadding="0"
      class="email-bg"
      style="background-color: #f3f4f6;"
    >
      <tr>
        <td align="center" valign="top" style="background-color: #f3f4f6;">
          <!-- HEADER ROXO -->
          <table
            role="presentation"
            width="100%"
            border="0"
            cellspacing="0"
            cellpadding="0"
            class="purple-bg"
            style="background-color: #472680;"
          >
            <tr>
              <td align="center" style="padding: 28px 16px 0 16px;">
                <table
                  role="presentation"
                  width="552"
                  border="0"
                  cellspacing="0"
                  cellpadding="0"
                  class="container"
                  style="width: 552px; max-width: 552px;"
                >
                  <tr>
                    <td align="left" style="padding: 0 0 28px 16px;">
                      <img
                        src="${LOGO_URL}"
                        width="76"
                        alt="Elkys"
                        style="display: block; width: 76px; max-width: 76px; height: auto;"
                      />
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <tr>
              <td height="5" style="height: 5px; line-height: 5px; font-size: 0;">
                &nbsp;
              </td>
            </tr>
          </table>

          <!-- TRANSIÇÃO HEADER + CARD -->
          <table
            role="presentation"
            width="100%"
            border="0"
            cellspacing="0"
            cellpadding="0"
            style="background-color: #f3f4f6;"
          >
            <tr>
              <td
                align="center"
                valign="top"
                class="mobile-side-padding"
                style="
                  padding: 0 16px;
                  background:
                    linear-gradient(to bottom, #472680 0, #472680 58px, #f3f4f6 58px, #f3f4f6 100%);
                "
              >
                <table
                  role="presentation"
                  width="552"
                  border="0"
                  cellspacing="0"
                  cellpadding="0"
                  class="container card-bg"
                  style="
                    width: 552px;
                    max-width: 552px;
                    background-color: #ffffff;
                    border-top: 3px solid #148f8f;
                  "
                >
                  <tr>
                    <td
                      class="mobile-content-padding"
                      style="padding: 20px 16px 0 16px; background-color: #ffffff;"
                    >
                      <p
                        class="text-body"
                        style="
                          margin: 0 0 18px 0;
                          font-size: 14px;
                          line-height: 22px;
                          color: #444444;
                        "
                      >
                        ${opts.greeting}
                      </p>

                      ${opts.body}

                      ${highlightBlock}

                      ${buttonBlock}

                      ${warningBlock}

                      ${noteBlock}

                      <p
                        class="text-body"
                        style="
                          margin: 0 0 6px 0;
                          font-size: 14px;
                          line-height: 22px;
                          color: #333333;
                        "
                      >
                        Cordialmente,
                      </p>

                      <p
                        class="text-dark"
                        style="
                          margin: 0 0 24px 0;
                          font-size: 14px;
                          line-height: 22px;
                          color: #111111;
                          font-weight: 700;
                        "
                      >
                        Elkys
                      </p>

                      <p
                        class="text-muted"
                        style="
                          margin: 0 0 12px 0;
                          font-size: 11px;
                          line-height: 18px;
                          color: #666666;
                          font-style: italic;
                        "
                      >
                        A Elkys é especializada no desenvolvimento de soluções digitais sob medida,
                        com foco em arquitetura robusta, performance e segurança. Atuamos na
                        construção de sistemas, automações e plataformas que sustentam operações
                        críticas, garantindo confiabilidade, escalabilidade e integridade dos dados
                        em todas as camadas da aplicação.
                      </p>

                      <p
                        class="text-muted"
                        style="
                          margin: 0 0 12px 0;
                          font-size: 11px;
                          line-height: 18px;
                          color: #666666;
                          font-style: italic;
                        "
                      >
                        Caso você não reconheça este acesso ou não tenha solicitado este cadastro,
                        entre em contato imediatamente com nossa equipe.
                      </p>

                      <p
                        class="text-muted"
                        style="
                          margin: 0 0 0 0;
                          font-size: 11px;
                          line-height: 18px;
                          color: #666666;
                          font-style: italic;
                        "
                      >
                        Este é um e-mail automático. Não responda a esta mensagem.
                      </p>
                    </td>
                  </tr>

                  <!-- ESPAÇO INTERNO BRANCO ANTES DE ENTRAR NO FOOTER -->
                  <tr>
                    <td
                      style="
                        height: 14px;
                        line-height: 14px;
                        font-size: 0;
                        background-color: #ffffff;
                      "
                    >
                      &nbsp;
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>

          <!-- FAIXA DE TRANSIÇÃO FOOTER:
               centro continua branco, laterais já ficam roxas -->
          <table
            role="presentation"
            width="100%"
            border="0"
            cellspacing="0"
            cellpadding="0"
            class="purple-bg"
            style="background-color: #472680"
          >
            <tr>
              <td
                align="center"
                valign="top"
                class="mobile-side-padding"
                style="padding: 0 16px; background-color: #472680"
              >
                <table
                  role="presentation"
                  width="552"
                  border="0"
                  cellspacing="0"
                  cellpadding="0"
                  class="container"
                  style="width: 552px; max-width: 552px"
                >
                  <tr>
                    <td
                      style="
                        height: 44px;
                        line-height: 14px;
                        font-size: 0;
                        background-color: #ffffff;
                      "
                    >
                      &nbsp;
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- FOOTER -->
            <tr>
              <td
                align="center"
                valign="top"
                class="footer-social-padding"
                style="padding: 14px 16px 20px 16px; background-color: #472680"
              >
                <table
                  role="presentation"
                  width="552"
                  border="0"
                  cellspacing="0"
                  cellpadding="0"
                  class="container"
                  style="width: 552px; max-width: 552px"
                >
                  <tr>
                    <td align="left" style="padding: 0 0 0 16px">
                      <table role="presentation" border="0" cellspacing="0" cellpadding="0">
                        <tr>
                          <td style="padding: 0 8px 0 0">
                            <a href="https://www.linkedin.com/company/elkys/" target="_blank">
                              <img
                                src="https://cdn-icons-png.flaticon.com/24/174/174857.png"
                                width="24"
                                height="24"
                                alt="LinkedIn"
                                style="display: block"
                              />
                            </a>
                          </td>
                          <td style="padding: 0 8px 0 0">
                            <a href="https://www.instagram.com/elkys_oficial/" target="_blank">
                              <img
                                src="https://cdn-icons-png.flaticon.com/24/2111/2111463.png"
                                width="24"
                                height="24"
                                alt="Instagram"
                                style="display: block"
                              />
                            </a>
                          </td>
                          <td style="padding: 0">
                            <a
                              href="https://api.whatsapp.com/send/?phone=553199738235&text&type=phone_number&app_absent=0"
                              target="_blank"
                            >
                              <img
                                src="https://cdn-icons-png.flaticon.com/24/733/733585.png"
                                width="24"
                                height="24"
                                alt="WhatsApp"
                                style="display: block"
                              />
                            </a>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>

        </td>
      </tr>
    </table>
    </center>
  </body>
</html>`;
}

export const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
}): Promise<{ ok: boolean; error?: string }> {
  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
  const FROM_EMAIL = Deno.env.get("FROM_EMAIL") ?? "noreply@elkys.com.br";

  if (!RESEND_API_KEY) {
    console.error("[sendEmail] RESEND_API_KEY not configured");
    return { ok: false, error: "Email service not configured" };
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    console.error("[sendEmail] Resend error:", detail);
    return { ok: false, error: detail };
  }

  return { ok: true };
}

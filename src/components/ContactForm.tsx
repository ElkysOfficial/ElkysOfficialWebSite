import { Send, CheckCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import emailjs from "@emailjs/browser";
import { Button, Input, Textarea, Card, CardContent, CardHeader, CardTitle } from "@/design-system";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { EMAILJS_CONFIG } from "@/config/emailjs";

const contactFormSchema = z.object({
  name: z
    .string()
    .min(3, "Nome deve ter no mínimo 3 caracteres")
    .max(100, "Nome muito longo")
    .regex(/^[a-zA-ZÀ-ÿ\s]+$/, "Nome deve conter apenas letras"),
  email: z
    .string()
    .email("E-mail inválido")
    .min(5, "E-mail muito curto")
    .max(100, "E-mail muito longo"),
  company: z.string().max(100, "Nome da empresa muito longo").optional(),
  message: z
    .string()
    .min(10, "Mensagem deve ter no mínimo 10 caracteres")
    .max(1000, "Mensagem muito longa (máximo 1000 caracteres)"),
});

type ContactFormData = z.infer<typeof contactFormSchema>;

const ContactForm = () => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema),
    mode: "onBlur",
  });

  const onSubmit = async (data: ContactFormData) => {
    try {
      emailjs.init(EMAILJS_CONFIG.PUBLIC_KEY);

      const templateParams = {
        name: data.name,
        email: data.email,
        company: data.company || "Não informado",
        message: data.message,
        calendar_link: EMAILJS_CONFIG.CALENDAR_LINK,
      };

      await Promise.all([
        emailjs.send(EMAILJS_CONFIG.SERVICE_ID, EMAILJS_CONFIG.TEMPLATE_ID, templateParams),
        emailjs.send(
          EMAILJS_CONFIG.SERVICE_ID,
          EMAILJS_CONFIG.AUTO_REPLY_TEMPLATE_ID,
          templateParams
        ),
      ]);

      toast.success("Solicitação registrada com sucesso!", {
        description: "Nossa equipe técnica retornará em até 2 horas úteis.",
      });

      reset();
    } catch (error) {
      console.error("EmailJS Error:", error);
      toast.error("Erro ao enviar mensagem", {
        description: "Por favor, tente novamente ou entre em contato via WhatsApp.",
      });
    }
  };

  return (
    <section id="contact-form" className="py-16 md:py-20 lg:py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-4">
              Inicie seu projeto com <span className="text-primary">previsibilidade</span>
            </h2>
            <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
              Descreva seu desafio técnico e receba um diagnóstico preliminar sem compromisso.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            <div className="space-y-6">
              <Card className="shadow-elegant hover:shadow-glow transition-all duration-300">
                <CardHeader>
                  <CardTitle className="text-lg text-primary">O que você pode esperar</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    "Diagnóstico técnico sem compromisso",
                    "Proposta detalhada em até 48h úteis",
                    "Entregas semanais com visibilidade total",
                    "Código versionado, testado e documentado",
                    "Suporte pós-entrega",
                  ].map((text) => (
                    <div key={text} className="flex items-center space-x-3">
                      <CheckCircle className="h-5 w-5 text-accent" />
                      <span className="text-sm text-muted-foreground">{text}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <div className="bg-gradient-primary rounded-xl p-6 text-white">
                <p className="font-bold mb-4">Compromisso de resposta</p>
                <p className="text-sm opacity-90 mb-4">
                  Toda solicitação é respondida em até 2 horas úteis pela equipe técnica.
                </p>
                <div className="text-xs opacity-75">
                  Seg-Sex: 8h às 18h
                  <br />
                  Sáb: 8h às 12h
                </div>
              </div>
            </div>

            <div className="lg:col-span-2">
              <Card className="shadow-elegant hover:shadow-glow transition-all duration-300">
                <CardHeader>
                  <CardTitle className="text-xl">Solicitar Diagnóstico</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label
                          htmlFor="name"
                          className="block text-sm font-medium text-foreground mb-2"
                        >
                          Nome completo *
                        </label>
                        <Input
                          id="name"
                          type="text"
                          placeholder="Seu nome"
                          className="w-full"
                          {...register("name")}
                        />
                        {errors.name && (
                          <p className="text-destructive text-xs mt-1">{errors.name.message}</p>
                        )}
                      </div>
                      <div>
                        <label
                          htmlFor="email"
                          className="block text-sm font-medium text-foreground mb-2"
                        >
                          E-mail *
                        </label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="seu.email@empresa.com"
                          className="w-full"
                          {...register("email")}
                        />
                        {errors.email && (
                          <p className="text-destructive text-xs mt-1">{errors.email.message}</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="company"
                        className="block text-sm font-medium text-foreground mb-2"
                      >
                        Empresa
                      </label>
                      <Input
                        id="company"
                        type="text"
                        placeholder="Nome da sua empresa"
                        className="w-full"
                        {...register("company")}
                      />
                      {errors.company && (
                        <p className="text-destructive text-xs mt-1">{errors.company.message}</p>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor="message"
                        className="block text-sm font-medium text-foreground mb-2"
                      >
                        Mensagem *
                      </label>
                      <Textarea
                        id="message"
                        placeholder="Descreva brevemente o contexto, os desafios técnicos e os objetivos do projeto..."
                        rows={5}
                        className="w-full"
                        {...register("message")}
                      />
                      {errors.message && (
                        <p className="text-destructive text-xs mt-1">{errors.message.message}</p>
                      )}
                    </div>

                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      variant="gradient"
                      size="lg"
                      className="w-full min-h-[44px]"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                          Enviando...
                        </>
                      ) : (
                        <>
                          Enviar solicitação
                          <Send className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>

                    <p className="text-xs text-muted-foreground text-center">
                      Ao enviar este formulário, você concorda com nossos{" "}
                      <Link
                        to="/terms-of-service"
                        className="text-primary hover:underline font-medium"
                      >
                        Termos de Uso
                      </Link>{" "}
                      e{" "}
                      <Link
                        to="/privacy-policy"
                        className="text-primary hover:underline font-medium"
                      >
                        Política de Privacidade
                      </Link>
                      .
                    </p>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactForm;

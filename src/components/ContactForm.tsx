import { Send, CheckCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';

// Validation schema with Zod
const contactFormSchema = z.object({
  name: z.string()
    .min(3, 'Nome deve ter no mínimo 3 caracteres')
    .max(100, 'Nome muito longo')
    .regex(/^[a-zA-ZÀ-ÿ\s]+$/, 'Nome deve conter apenas letras'),
  email: z.string()
    .email('E-mail inválido')
    .min(5, 'E-mail muito curto')
    .max(100, 'E-mail muito longo'),
  company: z.string()
    .max(100, 'Nome da empresa muito longo')
    .optional(),
  message: z.string()
    .min(10, 'Mensagem deve ter no mínimo 10 caracteres')
    .max(1000, 'Mensagem muito longa (máximo 1000 caracteres)')
});

type ContactFormData = z.infer<typeof contactFormSchema>;

const ContactForm = () => {
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema),
    mode: 'onBlur' // Validate on blur for better UX
  });

  const onSubmit = async (data: ContactFormData) => {
    try {
      // Simulate form submission
      await new Promise(resolve => setTimeout(resolve, 1500));

      toast({
        title: "Mensagem enviada com sucesso!",
        description: "Entraremos em contato em breve. Obrigado!",
      });

      reset(); // Reset form after successful submission
    } catch (error) {
      toast({
        title: "Erro ao enviar mensagem",
        description: "Por favor, tente novamente mais tarde.",
        variant: "destructive"
      });
    }
  };

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Vamos conversar sobre seu <span className="text-primary">projeto</span>
            </h2>
            <p className="text-xl text-muted-foreground leading-relaxed">
              Conte-nos sobre seus desafios e descubra como podemos ajudar sua empresa a crescer.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Contact Info */}
            <div className="space-y-6">
              <Card className="shadow-elegant">
                <CardHeader>
                  <CardTitle className="text-lg text-primary">Por que escolher a Elys?</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-accent" />
                    <span className="text-sm text-muted-foreground">Consulta inicial gratuita</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-accent" />
                    <span className="text-sm text-muted-foreground">Proposta em até 48h</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-accent" />
                    <span className="text-sm text-muted-foreground">Desenvolvimento ágil</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-accent" />
                    <span className="text-sm text-muted-foreground">Suporte contínuo</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-accent" />
                    <span className="text-sm text-muted-foreground">Código limpo e documentado</span>
                  </div>
                </CardContent>
              </Card>

              <div className="bg-gradient-primary rounded-xl p-6 text-white">
                <p className="font-bold mb-4">Resposta rápida garantida</p>
                <p className="text-sm opacity-90 mb-4">
                  Nossa equipe responde em até 2 horas durante horário comercial.
                </p>
                <div className="text-xs opacity-75">
                  Seg-Sex: 8h às 18h<br />
                  Sáb: 8h às 12h
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-2">
              <Card className="shadow-elegant">
                <CardHeader>
                  <CardTitle>Solicitar Orçamento</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
                          Nome completo *
                        </label>
                        <Input
                          id="name"
                          type="text"
                          placeholder="Seu nome"
                          className="w-full"
                          {...register('name')}
                        />
                        {errors.name && (
                          <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>
                        )}
                      </div>
                      <div>
                        <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                          E-mail *
                        </label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="seu.email@empresa.com"
                          className="w-full"
                          {...register('email')}
                        />
                        {errors.email && (
                          <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label htmlFor="company" className="block text-sm font-medium text-foreground mb-2">
                        Empresa
                      </label>
                      <Input
                        id="company"
                        type="text"
                        placeholder="Nome da sua empresa"
                        className="w-full"
                        {...register('company')}
                      />
                      {errors.company && (
                        <p className="text-red-500 text-xs mt-1">{errors.company.message}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="message" className="block text-sm font-medium text-foreground mb-2">
                        Mensagem *
                      </label>
                      <Textarea
                        id="message"
                        placeholder="Conte-nos sobre seu projeto, desafios e objetivos..."
                        rows={5}
                        className="w-full"
                        {...register('message')}
                      />
                      {errors.message && (
                        <p className="text-red-500 text-xs mt-1">{errors.message.message}</p>
                      )}
                    </div>

                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      variant="gradient"
                      size="lg"
                      className="w-full"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                          Enviando...
                        </>
                      ) : (
                        <>
                          Enviar mensagem
                          <Send className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>

                    <p className="text-xs text-muted-foreground text-center">
                      Ao enviar este formulário, você concorda com nossos{' '}
                      <Link
                        to="/terms-of-service"
                        className="text-primary hover:underline font-medium"
                      >
                        Termos de Uso
                      </Link>{' '}
                      e{' '}
                      <Link
                        to="/privacy-policy"
                        className="text-primary hover:underline font-medium"
                      >
                        Política de Privacidade
                      </Link>.
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
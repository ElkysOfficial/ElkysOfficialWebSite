import { CheckCircle } from "@/assets/icons";
import { Card, CardContent } from "@/design-system";
import { getServiceProcess } from "@/data/process";

interface ServiceProcessProps {
  serviceSlug: string;
}

const ServiceProcess = ({ serviceSlug }: ServiceProcessProps) => {
  const process = getServiceProcess(serviceSlug);

  if (!process) return null;

  return (
    <section className="py-16 md:py-20 lg:py-24 bg-muted">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
            Como este projeto é <span className="text-primary">conduzido</span>
          </h2>
          <p className="text-base md:text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            {process.subtitle}
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {process.steps.map((step) => {
            const StepIcon = step.icon;
            return (
              <Card key={step.number} className="h-full">
                <CardContent className="p-5 md:p-6 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-primary">{step.number}</span>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-gradient-primary flex items-center justify-center flex-shrink-0">
                      <StepIcon className="h-5 w-5 text-white" />
                    </div>
                  </div>

                  <h3 className="text-base font-semibold text-foreground">{step.title}</h3>

                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>

                  {/* Deliverables */}
                  <div className="pt-3 border-t border-border space-y-1.5">
                    {step.deliverables.map((d, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                        <CheckCircle className="h-3.5 w-3.5 text-accent flex-shrink-0 mt-0.5" />
                        {d}
                      </div>
                    ))}
                  </div>

                  {step.clientParticipation && (
                    <span className="inline-flex items-center gap-1 text-xs text-accent font-medium mt-2">
                      <CheckCircle className="h-3 w-3" />
                      Participação do cliente
                    </span>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default ServiceProcess;

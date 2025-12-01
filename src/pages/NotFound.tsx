import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Home, Search, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import letteringPurple from "../../public/imgs/icons/lettering_elys_purple.webp";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navigation />

      <main id="main-content" className="flex-grow flex items-center justify-center px-4 py-20">
        <div className="max-w-2xl w-full text-center space-y-8">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <img
              src={letteringPurple}
              alt="Elys"
              width={120}
              height={60}
              className="h-12 w-auto opacity-50"
            />
          </div>

          {/* 404 Number */}
          <div className="relative">
            <h1 className="text-9xl md:text-[12rem] font-bold text-primary/10 select-none">404</h1>
            <div className="absolute inset-0 flex items-center justify-center">
              <Search className="h-16 w-16 md:h-24 md:w-24 text-primary/30" />
            </div>
          </div>

          {/* Message */}
          <div className="space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              Página não encontrada
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground max-w-md mx-auto">
              A página que você está procurando não existe ou foi movida para outro endereço.
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8">
            <Link to="/">
              <Button size="lg" variant="gradient" className="w-full sm:w-auto">
                <Home className="mr-2 h-5 w-5" />
                Voltar para Home
              </Button>
            </Link>
            <Button
              size="lg"
              variant="outline"
              onClick={() => window.history.back()}
              className="w-full sm:w-auto"
            >
              <ArrowLeft className="mr-2 h-5 w-5" />
              Página Anterior
            </Button>
          </div>

          {/* Quick Links */}
          <div className="pt-8 border-t border-border">
            <p className="text-sm text-muted-foreground mb-4">
              Ou explore nossos principais serviços:
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link to="/#services">
                <Button variant="ghost" size="sm">
                  Serviços
                </Button>
              </Link>
              <Link to="/cases">
                <Button variant="ghost" size="sm">
                  Cases de Sucesso
                </Button>
              </Link>
              <Link to="/#contact">
                <Button variant="ghost" size="sm">
                  Contato
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default NotFound;

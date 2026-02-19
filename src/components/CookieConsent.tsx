import { useState, useEffect } from "react";
import { Cookie, X } from "@/assets/icons";
import { Button } from "@/design-system";
import { Link } from "react-router-dom";

const CookieConsent = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    // Check if user has already given consent
    const hasConsent = localStorage.getItem("cookie-consent");

    // Show banner only if user hasn't given consent yet
    if (!hasConsent) {
      // Delay showing banner to not block initial render
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem("cookie-consent", "accepted");
    localStorage.setItem("cookie-consent-date", new Date().toISOString());
    closeBanner();
  };

  const handleDecline = () => {
    localStorage.setItem("cookie-consent", "declined");
    localStorage.setItem("cookie-consent-date", new Date().toISOString());
    closeBanner();
  };

  const closeBanner = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsVisible(false);
    }, 300);
  };

  if (!isVisible) return null;

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-50 p-4 transition-all duration-300 ${
        isClosing ? "translate-y-full opacity-0" : "translate-y-0 opacity-100"
      }`}
      role="dialog"
      aria-label="Banner de consentimento de cookies"
      aria-live="polite"
    >
      <div className="container mx-auto max-w-7xl px-4">
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-2xl p-4 md:p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
            {/* Icon */}
            <div className="flex-shrink-0">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Cookie className="w-5 h-5 md:w-6 md:h-6 text-primary" />
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 space-y-2">
              <h3 className="text-base md:text-lg font-semibold text-foreground">
                Política de Cookies
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Este site utiliza cookies para análise de tráfego e melhoria da experiência de
                navegação. Ao continuar, você concorda com o uso de cookies conforme nossa{" "}
                <Link to="/cookie-policy" className="text-primary hover:underline font-medium">
                  Política de Cookies
                </Link>{" "}
                e{" "}
                <Link to="/privacy-policy" className="text-primary hover:underline font-medium">
                  Política de Privacidade
                </Link>
                .
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
              <Button
                onClick={handleDecline}
                variant="outline"
                size="sm"
                className="w-full sm:w-auto text-sm"
              >
                Recusar
              </Button>
              <Button
                onClick={handleAccept}
                variant="default"
                size="sm"
                className="w-full sm:w-auto text-sm bg-primary hover:bg-primary/90"
              >
                Aceitar Cookies
              </Button>
            </div>

            {/* Close button */}
            <button
              onClick={closeBanner}
              className="absolute top-4 right-4 md:relative md:top-0 md:right-0 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Fechar banner de cookies"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CookieConsent;

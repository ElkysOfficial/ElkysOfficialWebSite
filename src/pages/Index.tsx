import Navigation from '@/components/Navigation';
import Hero from '@/components/Hero';
import About from '@/components/About';
import Services from '@/components/Services';
import Testimonials from '@/components/Testimonials';
import ClientsCarousel from '@/components/ClientsCarousel';
import { Team } from '@/components/Team';
import ContactForm from '@/components/ContactForm';
import Contact from '@/components/Contact';
import Footer from '@/components/Footer';

const Index = () => {
  return (
    <div className="min-h-screen">
      <Navigation />
      <Hero />
      <About />
      <Services />
      <ClientsCarousel />
      <Testimonials />
      <Team />
      <ContactForm />
      <Contact />
      <Footer />
    </div>
  );
};

export default Index;

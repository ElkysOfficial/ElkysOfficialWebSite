import { useEffect, useState } from 'react';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link, useLocation } from 'react-router-dom';
import lettering_elys_purple from '../../public/imgs/icons/lettering_elys_purple.png';
import lettering_elys_white from '../../public/imgs/icons/lettering_elys.png';

const Navigation = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [viewportPosition, setViewportPosition] = useState(0);
    const location = useLocation();
    const isHomePage = location.pathname === '/';
    const isCasesPage = location.pathname === '/cases';

    const handleScroll = () => {
        const currentPosition = window.scrollY;
        setViewportPosition(currentPosition);
    };

    useEffect(() => {
        window.addEventListener('scroll', handleScroll);
        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    },[]);

    console.log(viewportPosition);

    const navItems = [
        { label: 'Início', href: isHomePage ? '#hero' : '/#hero', isRoute: false },
        { label: 'Sobre', href: isHomePage ? '#about' : '/#about', isRoute: false },
        { label: 'Serviços', href: isHomePage ? '#services' : '/#services', isRoute: false },
        { label: 'Cases', href: '/cases', isRoute: true },
        { label: 'Contato', href: isHomePage ? '#contact' : '/#contact', isRoute: false },
    ];

    // On Cases page or when scrolled past hero, use light navbar
    const useLightNavbar = isCasesPage || viewportPosition > 900;

    return (
        <nav className={`fixed top-0 left-0 right-0 z-50 backdrop-blur-md transition-all duration-500 ${
            useLightNavbar
                ? 'bg-white/95 shadow-md border-b border-slate-100'
                : viewportPosition !== 0 && viewportPosition <= 900
                    ? 'bg-gradient-hero shadow-lg'
                    : 'bg-transparent'
        }`}>
            <div className="container mx-auto px-4">
                <div className="flex items-center justify-between h-16">
                {isHomePage ? (
                    <a href="#hero" className="flex items-center space-x-2">
                        <img src={useLightNavbar ? lettering_elys_purple : lettering_elys_white} alt="Elys" className='w-16 transition-all duration-500'/>
                    </a>
                ) : (
                    <Link to="/#hero" className="flex items-center space-x-2">
                        <img src={useLightNavbar ? lettering_elys_purple : lettering_elys_white} alt="Elys" className='w-16 transition-all duration-500'/>
                    </Link>
                )}
                {/* Desktop Navigation */}
                <div className="hidden md:flex items-center space-x-8">
                    {navItems.map((item) => (
                        item.isRoute ? (
                            <Link
                                key={item.label}
                                to={item.href}
                                className={`${useLightNavbar ? 'text-slate-700 hover:text-primary' : 'text-white hover:text-[#F97415]'} transition-colors duration-300 font-medium`}
                            >
                                {item.label}
                            </Link>
                        ) : (
                            <a
                                key={item.label}
                                href={item.href}
                                className={`${useLightNavbar ? 'text-slate-700 hover:text-primary' : 'text-white hover:text-[#F97415]'} transition-colors duration-300 font-medium`}
                            >
                                {item.label}
                            </a>
                        )
                    ))}
                    <Button variant={useLightNavbar ? 'gradient' : 'gradient_secondary'}>
                    Fale Conosco
                    </Button>
                </div>

                {/* Mobile Menu Button */}
                <button
                    className={`md:hidden p-2 transition-colors duration-300 ${useLightNavbar ? 'text-slate-700' : 'text-white'}`}
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                >
                    {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </button>
                </div>

                {/* Mobile Navigation */}
                {isMenuOpen && (
                <div className={`md:hidden py-4 border-t transition-colors duration-300 ${useLightNavbar ? 'border-slate-200 bg-white/95' : 'border-white/20 bg-gradient-hero/95'}`}>
                    <div className="flex flex-col space-y-3">
                    {navItems.map((item) => (
                        item.isRoute ? (
                            <Link
                                key={item.label}
                                to={item.href}
                                className={`${useLightNavbar ? 'text-slate-700 hover:text-primary' : 'text-white hover:text-[#F97415]'} transition-colors duration-300 font-medium px-2 py-1`}
                                onClick={() => setIsMenuOpen(false)}
                            >
                                {item.label}
                            </Link>
                        ) : (
                            <a
                                key={item.label}
                                href={item.href}
                                className={`${useLightNavbar ? 'text-slate-700 hover:text-primary' : 'text-white hover:text-[#F97415]'} transition-colors duration-300 font-medium px-2 py-1`}
                                onClick={() => setIsMenuOpen(false)}
                            >
                                {item.label}
                            </a>
                        )
                    ))}
                    <Button variant={useLightNavbar ? 'gradient' : 'gradient_secondary'} className="mt-4">
                        Fale Conosco
                    </Button>
                    </div>
                </div>
                )}
            </div>
        </nav>
    );
};

export default Navigation;
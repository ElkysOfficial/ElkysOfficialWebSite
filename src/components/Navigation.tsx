import { useEffect, useState } from 'react';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import lettering_elys_purple from '../../public/imgs/icons/lettering_elys_purple.png';
import lettering_elys_white from '../../public/imgs/icons/lettering_elys.png';

const Navigation = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [viewportPosition, setViewportPosition] = useState(0);

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
        { label: 'Início', href: '#home' },
        { label: 'Sobre', href: '#about' },
        { label: 'Serviços', href: '#services' },
        { label: 'Depoimentos', href: '#testimonials' },
        { label: 'Contato', href: '#contact' },
    ];

    return (
        <nav className={`fixed top-0 left-0 right-0 z-50 backdrop-blur-md ${ viewportPosition !== 0 && viewportPosition <= 900? 'bg-gradient-hero shadow-lg' : 'bg-transparent'} ${viewportPosition > 900 ? 'bg-[#ebebebe0] shadow-lg' : ''} transition-all transition-[background-color 2s ease-in-out]`} >
            <div className="container mx-auto px-4">
                <div className="flex items-center justify-between h-16">
                <div className="flex items-center space-x-2">
                    <img src={viewportPosition <= 900 ? lettering_elys_white : lettering_elys_purple} alt="Elys" className='w-16 transition-all'/>
                </div>
                {/* Desktop Navigation */}
                <div className="hidden md:flex items-center space-x-8">
                    {navItems.map((item) => (
                    <a
                        key={item.label}
                        href={item.href}
                        className={`${viewportPosition > 900 ? 'text-black hover:text-primary' : 'text-white hover:text-[#F97415]'}  transition-colors font-medium`}
                    >
                        {item.label}
                    </a>
                    ))}
                    <Button variant={viewportPosition > 900 ? 'gradient' : 'gradient_secondary'}>
                    Fale Conosco
                    </Button>
                </div>

                {/* Mobile Menu Button */}
                <button
                    className={`md:hidden p-2 ${viewportPosition > 900 ? 'text-black' : 'text-white'}`}
                    
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                >
                    {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </button>
                </div>

                {/* Mobile Navigation */}
                {isMenuOpen && (
                <div className="md:hidden py-4 border-t border-border">
                    <div className="flex flex-col space-y-3">
                    {navItems.map((item) => (
                        <a
                        key={item.label}
                        href={item.href}
                        className={`${viewportPosition > 900 ? 'text-black hover:text-primary' : 'text-white hover:text-[#F97415]'} transition-colors font-medium px-2 py-1`}
                        onClick={() => setIsMenuOpen(false)}
                        >
                        {item.label}
                        </a>
                    ))}
                    <Button variant={viewportPosition > 900 ? 'gradient' : 'gradient_secondary'} className="mt-4">
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
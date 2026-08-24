import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { MapPin, Phone, Mail, Instagram, Facebook, MessageCircle, ArrowUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface StoreSettings {
  brand_name: string;
  tagline: string;
  store_address: string;
  store_email: string;
  store_phone: string;
  whatsapp_number: string;
  instagram_url: string;
  facebook_url: string;
  about_text: string;
}

const SiteFooter = () => {
  const [settings, setSettings] = useState<StoreSettings>({
    brand_name: 'Al Mishk',
    tagline: 'Premium Attar & Fragrances',
    store_address: '',
    store_email: '',
    store_phone: '',
    whatsapp_number: '',
    instagram_url: '',
    facebook_url: '',
    about_text: '',
  });

  useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await supabase.from('store_settings').select('*');
      if (data) {
        const settingsMap: Record<string, string> = {};
        data.forEach((item: { setting_key: string; setting_value: string | null }) => {
          settingsMap[item.setting_key] = item.setting_value || '';
        });
        setSettings((prev) => ({ ...prev, ...settingsMap }));
      }
    };
    fetchSettings();
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-foreground text-background relative">
      {/* Top Wave Decoration */}
      <div className="absolute top-0 left-0 right-0 overflow-hidden">
        <svg className="relative block w-full h-8" viewBox="0 0 1200 120" preserveAspectRatio="none">
          <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" 
                fill="hsl(var(--background))"></path>
        </svg>
      </div>

      {/* Main Footer */}
      <div className="container mx-auto px-4 pt-20 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand Info */}
          <div className="space-y-6">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-12 h-12 rounded-full bg-gradient-gold flex items-center justify-center shadow-gold">
                <span className="text-xl font-display text-white font-bold">A</span>
              </div>
              <div>
                <span className="text-2xl font-serif text-primary">{settings.brand_name}</span>
                <p className="text-xs text-background/60">{settings.tagline}</p>
              </div>
            </Link>
            <p className="text-background/70 text-sm leading-relaxed">
              {settings.about_text || 'Experience the essence of luxury with our handcrafted collection of premium attars and fragrances. Crafted with love in India.'}
            </p>
            {/* Social Links */}
            <div className="flex items-center gap-3">
              {settings.instagram_url && (
                <a
                  href={settings.instagram_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-11 h-11 rounded-full bg-background/10 flex items-center justify-center hover:bg-primary hover:text-foreground transition-all duration-300"
                >
                  <Instagram className="h-5 w-5" />
                </a>
              )}
              {settings.facebook_url && (
                <a
                  href={settings.facebook_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-11 h-11 rounded-full bg-background/10 flex items-center justify-center hover:bg-primary hover:text-foreground transition-all duration-300"
                >
                  <Facebook className="h-5 w-5" />
                </a>
              )}
              {settings.whatsapp_number && (
                <a
                  href={`https://wa.me/${settings.whatsapp_number.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-11 h-11 rounded-full bg-background/10 flex items-center justify-center hover:bg-emerald-500 transition-all duration-300"
                >
                  <MessageCircle className="h-5 w-5" />
                </a>
              )}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-serif text-lg mb-6 text-primary">Quick Links</h4>
            <ul className="space-y-3">
              {[
                { label: 'Home', to: '/' },
                { label: 'Shop All', to: '/' },
                { label: 'Best Sellers', to: '/' },
                { label: 'New Arrivals', to: '/' },
                { label: 'Wishlist', to: '/wishlist' },
                { label: 'Track Order', to: '/orders' },
              ].map((link) => (
                <li key={link.label}>
                  <Link 
                    to={link.to} 
                    className="text-background/70 hover:text-primary transition-colors text-sm flex items-center gap-2 group"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-primary/50 group-hover:bg-primary transition-colors" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h4 className="font-serif text-lg mb-6 text-primary">Customer Service</h4>
            <ul className="space-y-3">
              {[
                { label: 'My Account', to: '/profile' },
                { label: 'Shipping Policy', to: '#' },
                { label: 'Return & Refund', to: '#' },
                { label: 'Terms & Conditions', to: '#' },
                { label: 'Privacy Policy', to: '#' },
                { label: 'FAQs', to: '#' },
              ].map((link) => (
                <li key={link.label}>
                  <Link 
                    to={link.to} 
                    className="text-background/70 hover:text-primary transition-colors text-sm flex items-center gap-2 group"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-primary/50 group-hover:bg-primary transition-colors" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="font-serif text-lg mb-6 text-primary">Contact Us</h4>
            <ul className="space-y-4">
              {settings.store_address && (
                <li className="flex items-start gap-3 text-sm">
                  <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
                    <MapPin className="h-5 w-5 text-primary" />
                  </div>
                  <span className="text-background/70 pt-2">{settings.store_address}</span>
                </li>
              )}
              {settings.store_phone && (
                <li className="flex items-center gap-3 text-sm">
                  <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
                    <Phone className="h-5 w-5 text-primary" />
                  </div>
                  <a href={`tel:${settings.store_phone}`} className="text-background/70 hover:text-primary transition-colors">
                    {settings.store_phone}
                  </a>
                </li>
              )}
              {settings.store_email && (
                <li className="flex items-center gap-3 text-sm">
                  <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
                    <Mail className="h-5 w-5 text-primary" />
                  </div>
                  <a href={`mailto:${settings.store_email}`} className="text-background/70 hover:text-primary transition-colors">
                    {settings.store_email}
                  </a>
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-background/10">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-background/60 text-center md:text-left">
              © {currentYear} {settings.brand_name}. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <p className="text-sm text-background/60">
                Made with ❤️ in India
              </p>
              <Button
                variant="ghost"
                size="icon"
                onClick={scrollToTop}
                className="w-10 h-10 rounded-full bg-primary/20 hover:bg-primary text-background hover:text-foreground transition-all"
              >
                <ArrowUp className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default SiteFooter;

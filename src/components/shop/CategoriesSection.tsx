import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Droplets, FlaskConical, Crown, Gift, Boxes, Layers } from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';

type Category = Tables<'categories'>;

interface CategoriesSectionProps {
  onCategorySelect?: (categoryId: string | null) => void;
  selectedCategory?: string | null;
}

const getCategoryIcon = (name: string) => {
  const lower = name.toLowerCase();
  if (lower.includes('attar') || lower.includes('oil')) return Droplets;
  if (lower.includes('perfume') || lower.includes('eau') || lower.includes('spray')) return FlaskConical;
  if (lower.includes('combo') || lower.includes('bundle')) return Gift;
  if (lower.includes('discovery') || lower.includes('set')) return Boxes;
  if (lower.includes('premium') || lower.includes('luxury')) return Crown;
  return Droplets;
};

const CategoriesSection = ({ onCategorySelect, selectedCategory }: CategoriesSectionProps) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      const { data } = await supabase
        .from('categories')
        .select('*')
        .order('name', { ascending: true });
      // Exclude combo/bundle categories from the shop-by-category section
      const filtered = (data || []).filter(c => {
        const lower = c.name.toLowerCase();
        return !lower.includes('combo') && !lower.includes('bundle');
      });
      setCategories(filtered);
      setIsLoading(false);
    };
    fetchCategories();
  }, []);

  if (isLoading || categories.length === 0) return null;

  const handleCategoryClick = (categoryId: string | null) => {
    onCategorySelect?.(categoryId);
    // Scroll to products section
    const el = document.getElementById('products');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="py-16 md:py-20 px-4 bg-secondary/40">
      <div className="container mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-4">
            <Layers className="h-5 w-5" />
            <span className="text-sm font-medium">Explore</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-serif text-foreground mb-3">Shop by Category</h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Find your perfect fragrance from our curated collections
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6 max-w-5xl mx-auto">
          {/* Category Cards only — no "All Products" card */}
          {categories.map((category) => {
            const IconComponent = getCategoryIcon(category.name);
            const isSelected = selectedCategory === category.id;

            return (
              <button
                key={category.id}
                className="text-left"
                onClick={() => handleCategoryClick(category.id)}
              >
                <Card
                  className={`cursor-pointer transition-all duration-300 hover-lift h-full ${
                    isSelected
                      ? 'border-2 border-primary bg-primary/5 shadow-gold'
                      : 'card-luxury'
                  }`}
                >
                  <CardContent className="p-6 text-center">
                    <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center transition-colors ${
                      isSelected ? 'bg-primary text-primary-foreground' : 'bg-primary/10 text-primary'
                    }`}>
                      <IconComponent className="h-8 w-8" />
                    </div>
                    <h3 className="font-medium text-foreground line-clamp-2">{category.name}</h3>
                    {category.description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{category.description}</p>
                    )}
                  </CardContent>
                </Card>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default CategoriesSection;

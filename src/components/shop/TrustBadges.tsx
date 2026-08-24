import { Shield, Award, Leaf, Gem } from 'lucide-react';

const TrustBadges = () => {
  const badges = [
    {
      icon: Shield,
      title: '100% Authentic',
      description: 'Genuine products guaranteed',
    },
    {
      icon: Award,
      title: 'Premium Quality',
      description: 'Handcrafted fragrances',
    },
    {
      icon: Leaf,
      title: 'Natural Ingredients',
      description: 'Pure & organic extracts',
    },
    {
      icon: Gem,
      title: 'Luxury Craftsmanship',
      description: 'Artisanal perfumery traditions',
    },
  ];

  return (
    <section className="py-16 md:py-20 px-4 bg-card border-y border-primary/10">
      <div className="container mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-serif text-foreground mb-3">
            Why Choose <span className="text-gradient-gold">Al Mishk</span>
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Experience the finest quality and service with every purchase
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {badges.map((badge, index) => {
            const IconComponent = badge.icon;
            return (
              <div
                key={index}
                className="trust-badge text-center"
              >
                <div className="w-14 h-14 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
                  <IconComponent className="h-7 w-7 text-primary" />
                </div>
                <h3 className="font-medium text-foreground text-sm mb-1">{badge.title}</h3>
                <p className="text-xs text-muted-foreground">{badge.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default TrustBadges;

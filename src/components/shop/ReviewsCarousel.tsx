import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Star, Quote, MessageSquare } from 'lucide-react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import Autoplay from 'embla-carousel-autoplay';

interface HomepageReview {
  id: string;
  customer_name: string;
  customer_location: string | null;
  review_text: string;
  rating: number;
  avatar_url: string | null;
}

const ReviewsCarousel = () => {
  const [reviews, setReviews] = useState<HomepageReview[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      const { data } = await supabase
        .from('homepage_reviews')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      setReviews(data || []);
      setIsLoading(false);
    };
    fetchReviews();
  }, []);

  if (isLoading || reviews.length === 0) {
    return null;
  }

  return (
    <section className="py-16 md:py-20 bg-secondary/40">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-4">
            <MessageSquare className="h-5 w-5" />
            <span className="text-sm font-medium">Testimonials</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-serif text-foreground mb-3">
            What Our Customers Say
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Trusted by fragrance lovers across India
          </p>
        </div>

        <Carousel
          opts={{
            align: 'start',
            loop: true,
          }}
          plugins={[
            Autoplay({
              delay: 4000,
              stopOnInteraction: true,
            }),
          ]}
          className="w-full max-w-5xl mx-auto"
        >
          <CarouselContent className="-ml-3 md:-ml-4">
            {reviews.map((review) => (
              <CarouselItem key={review.id} className="pl-3 md:pl-4 md:basis-1/2 lg:basis-1/3">
                <Card className="card-luxury h-full">
                  <CardContent className="p-6">
                    <Quote className="h-10 w-10 text-primary/20 mb-4" />
                    
                    {/* Rating */}
                    <div className="flex gap-1 mb-4">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-5 w-5 ${
                            i < review.rating
                              ? 'text-primary fill-primary'
                              : 'text-muted-foreground/30'
                          }`}
                        />
                      ))}
                    </div>

                    {/* Review Text */}
                    <p className="text-foreground/90 leading-relaxed mb-6 line-clamp-4">
                      "{review.review_text}"
                    </p>

                    {/* Customer Info */}
                    <div className="flex items-center gap-3 pt-4 border-t border-primary/10">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-lg">
                        {review.avatar_url ? (
                          <img
                            src={review.avatar_url}
                            alt={review.customer_name}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          review.customer_name.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{review.customer_name}</p>
                        {review.customer_location && (
                          <p className="text-sm text-muted-foreground">
                            {review.customer_location}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="hidden md:flex -left-12 border-primary/30 hover:bg-primary/10 hover:border-primary" />
          <CarouselNext className="hidden md:flex -right-12 border-primary/30 hover:bg-primary/10 hover:border-primary" />
        </Carousel>
      </div>
    </section>
  );
};

export default ReviewsCarousel;

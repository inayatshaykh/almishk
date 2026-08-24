import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import StarRating from './StarRating';
import ReviewForm from './ReviewForm';
import { MessageSquare } from 'lucide-react';

interface Review {
  id: string;
  rating: number;
  title: string | null;
  content: string | null;
  created_at: string;
  user_id: string;
}

interface ProductReviewsProps {
  productId: string;
}

const ProductReviews = ({ productId }: ProductReviewsProps) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [averageRating, setAverageRating] = useState(0);

  const fetchReviews = async () => {
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('product_id', productId)
      .eq('is_approved', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching reviews:', error);
    } else {
      setReviews(data || []);
      if (data && data.length > 0) {
        const avg = data.reduce((sum, r) => sum + r.rating, 0) / data.length;
        setAverageRating(Math.round(avg * 10) / 10);
      }
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchReviews();
  }, [productId]);

  const getDisplayName = () => {
    return 'Verified Buyer';
  };

  return (
    <div className="space-y-8">
      {/* Reviews Summary */}
      {reviews.length > 0 && (
        <div className="flex items-center gap-4">
          <div className="text-4xl font-serif text-primary">{averageRating}</div>
          <div>
            <StarRating rating={Math.round(averageRating)} size="md" />
            <p className="text-sm text-muted-foreground mt-1">
              Based on {reviews.length} review{reviews.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      )}

      {/* Review Form */}
      <ReviewForm productId={productId} onReviewSubmitted={fetchReviews} />

      {/* Reviews List */}
      <Card className="card-luxury">
        <CardHeader>
          <CardTitle className="text-xl font-serif flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Customer Reviews
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground text-center py-8">Loading reviews...</p>
          ) : reviews.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground">No reviews yet. Be the first to review!</p>
            </div>
          ) : (
            <div className="space-y-6">
              {reviews.map((review) => (
                <div key={review.id} className="border-b border-border pb-6 last:border-0 last:pb-0">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <StarRating rating={review.rating} size="sm" />
                        <span className="text-sm text-muted-foreground">
                          {new Date(review.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      {review.title && (
                        <h4 className="font-medium mb-1">{review.title}</h4>
                      )}
                      {review.content && (
                        <p className="text-muted-foreground">{review.content}</p>
                      )}
                      <p className="text-sm text-muted-foreground mt-2">
                        — {getDisplayName()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProductReviews;

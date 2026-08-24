import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import StarRating from './StarRating';
import { useAuth } from '@/contexts/AuthContext';

interface ReviewFormProps {
  productId: string;
  onReviewSubmitted: () => void;
}

const ReviewForm = ({ productId, onReviewSubmitted }: ReviewFormProps) => {
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error('Please login to submit a review');
      return;
    }

    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }

    setIsSubmitting(true);

    const { error } = await supabase.from('reviews').insert({
      product_id: productId,
      user_id: user.id,
      rating,
      title: title || null,
      content: content || null,
    });

    if (error) {
      if (error.code === '23505') {
        toast.error('You have already reviewed this product');
      } else {
        toast.error('Failed to submit review');
        console.error(error);
      }
    } else {
      toast.success('Review submitted! It will appear after approval.');
      setRating(0);
      setTitle('');
      setContent('');
      onReviewSubmitted();
    }

    setIsSubmitting(false);
  };

  if (!user) {
    return (
      <Card className="card-luxury">
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">
            Please <a href="/auth" className="text-primary hover:underline">login</a> to write a review
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="card-luxury">
      <CardHeader>
        <CardTitle className="text-xl font-serif">Write a Review</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Your Rating *</Label>
            <StarRating
              rating={rating}
              size="lg"
              interactive
              onRatingChange={setRating}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="review-title">Review Title</Label>
            <Input
              id="review-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Summarize your experience"
              className="bg-background"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="review-content">Your Review</Label>
            <Textarea
              id="review-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share your thoughts about this product..."
              className="bg-background min-h-[120px]"
            />
          </div>
          <Button
            type="submit"
            disabled={isSubmitting || rating === 0}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Review'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default ReviewForm;

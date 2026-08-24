import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plus, Trash2, Star, MessageSquare } from 'lucide-react';

interface HomepageReview {
  id: string;
  customer_name: string;
  customer_location: string | null;
  review_text: string;
  rating: number;
  avatar_url: string | null;
  is_active: boolean;
  sort_order: number;
}

const AdminHomepageReviews = () => {
  const [reviews, setReviews] = useState<HomepageReview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Form state
  const [customerName, setCustomerName] = useState('');
  const [customerLocation, setCustomerLocation] = useState('');
  const [reviewText, setReviewText] = useState('');
  const [rating, setRating] = useState(5);

  const fetchReviews = async () => {
    const { data } = await supabase
      .from('homepage_reviews')
      .select('*')
      .order('sort_order', { ascending: true });

    setReviews(data || []);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleAddReview = async () => {
    if (!customerName.trim() || !reviewText.trim()) {
      toast.error('Please fill in customer name and review text');
      return;
    }

    const maxOrder = reviews.length > 0 ? Math.max(...reviews.map((r) => r.sort_order)) : -1;

    const { error } = await supabase.from('homepage_reviews').insert({
      customer_name: customerName,
      customer_location: customerLocation || null,
      review_text: reviewText,
      rating,
      sort_order: maxOrder + 1,
      is_active: true,
    });

    if (error) {
      toast.error('Failed to add review');
    } else {
      toast.success('Review added');
      setIsDialogOpen(false);
      setCustomerName('');
      setCustomerLocation('');
      setReviewText('');
      setRating(5);
      fetchReviews();
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('homepage_reviews').delete().eq('id', id);
    if (error) {
      toast.error('Failed to delete');
    } else {
      toast.success('Review deleted');
      fetchReviews();
    }
  };

  const handleToggleActive = async (id: string, currentState: boolean) => {
    const { error } = await supabase
      .from('homepage_reviews')
      .update({ is_active: !currentState })
      .eq('id', id);

    if (error) {
      toast.error('Failed to update');
    } else {
      fetchReviews();
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-headline text-3xl text-gradient-gold">Homepage Reviews</h1>
            <p className="text-muted-foreground mt-1">Manage customer testimonials for the homepage slideshow</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90">
                <Plus className="h-4 w-4 mr-2" />
                Add Review
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Customer Review</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Customer Name *</Label>
                  <Input
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Enter customer name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Location (optional)</Label>
                  <Input
                    value={customerLocation}
                    onChange={(e) => setCustomerLocation(e.target.value)}
                    placeholder="e.g., Mumbai, Maharashtra"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Review Text *</Label>
                  <Textarea
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    placeholder="Enter the customer's review..."
                    rows={4}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Rating</Label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className="focus:outline-none"
                      >
                        <Star
                          className={`h-6 w-6 ${
                            star <= rating ? 'text-primary fill-primary' : 'text-muted-foreground'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
                <Button onClick={handleAddReview} className="w-full">
                  Add Review
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="card-luxury overflow-hidden">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              Customer Reviews
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-border">
                  <TableHead>Customer</TableHead>
                  <TableHead>Review</TableHead>
                  <TableHead className="w-24">Rating</TableHead>
                  <TableHead className="w-20">Active</TableHead>
                  <TableHead className="w-20">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : reviews.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                      <p className="text-muted-foreground">No reviews yet</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  reviews.map((review) => (
                    <TableRow key={review.id} className="border-border">
                      <TableCell>
                        <div>
                          <p className="font-medium">{review.customer_name}</p>
                          {review.customer_location && (
                            <p className="text-xs text-muted-foreground">{review.customer_location}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm line-clamp-2">{review.review_text}</p>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-0.5">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-3 w-3 ${
                                i < review.rating ? 'text-primary fill-primary' : 'text-muted-foreground'
                              }`}
                            />
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={review.is_active}
                          onCheckedChange={() => handleToggleActive(review.id, review.is_active)}
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDelete(review.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminHomepageReviews;

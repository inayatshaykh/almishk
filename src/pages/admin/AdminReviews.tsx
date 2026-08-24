import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Check, X, Trash2, MessageSquare, Star } from 'lucide-react';

interface Review {
  id: string;
  product_id: string;
  user_id: string;
  rating: number;
  title: string | null;
  content: string | null;
  is_approved: boolean;
  created_at: string;
  products?: { name: string } | null;
}

const AdminReviews = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved'>('all');

  const fetchReviews = async () => {
    let query = supabase
      .from('reviews')
      .select(`
        *,
        products:product_id (name)
      `)
      .order('created_at', { ascending: false });

    if (filter === 'pending') {
      query = query.eq('is_approved', false);
    } else if (filter === 'approved') {
      query = query.eq('is_approved', true);
    }

    const { data, error } = await query;

    if (error) {
      toast.error('Failed to load reviews');
      console.error(error);
    } else {
      setReviews((data as Review[]) || []);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchReviews();
  }, [filter]);

  const handleApprove = async (id: string) => {
    const { error } = await supabase
      .from('reviews')
      .update({ is_approved: true })
      .eq('id', id);

    if (error) {
      toast.error('Failed to approve review');
    } else {
      toast.success('Review approved');
      fetchReviews();
    }
  };

  const handleReject = async (id: string) => {
    const { error } = await supabase
      .from('reviews')
      .update({ is_approved: false })
      .eq('id', id);

    if (error) {
      toast.error('Failed to reject review');
    } else {
      toast.success('Review rejected');
      fetchReviews();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this review?')) return;

    const { error } = await supabase
      .from('reviews')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to delete review');
    } else {
      toast.success('Review deleted');
      fetchReviews();
    }
  };

  const pendingCount = reviews.filter(r => !r.is_approved).length;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-headline text-3xl text-gradient-gold">Reviews</h1>
            <p className="text-muted-foreground mt-1">Moderate customer reviews</p>
          </div>
          {pendingCount > 0 && (
            <Badge className="badge-warning">
              {pendingCount} pending review{pendingCount !== 1 ? 's' : ''}
            </Badge>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            onClick={() => setFilter('all')}
            size="sm"
          >
            All
          </Button>
          <Button
            variant={filter === 'pending' ? 'default' : 'outline'}
            onClick={() => setFilter('pending')}
            size="sm"
          >
            Pending
          </Button>
          <Button
            variant={filter === 'approved' ? 'default' : 'outline'}
            onClick={() => setFilter('approved')}
            size="sm"
          >
            Approved
          </Button>
        </div>

        <Card className="card-luxury overflow-hidden">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-muted-foreground">Product</TableHead>
                  <TableHead className="text-muted-foreground">Rating</TableHead>
                  <TableHead className="text-muted-foreground">Review</TableHead>
                  <TableHead className="text-muted-foreground">Status</TableHead>
                  <TableHead className="text-muted-foreground">Date</TableHead>
                  <TableHead className="text-muted-foreground text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Loading reviews...
                    </TableCell>
                  </TableRow>
                ) : reviews.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                      <p className="text-muted-foreground">No reviews found</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  reviews.map((review) => (
                    <TableRow key={review.id} className="border-border">
                      <TableCell className="font-medium">
                        {review.products?.name || 'Unknown Product'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${
                                i < review.rating
                                  ? 'fill-primary text-primary'
                                  : 'fill-muted text-muted-foreground/30'
                              }`}
                            />
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs">
                        {review.title && (
                          <p className="font-medium text-sm">{review.title}</p>
                        )}
                        {review.content && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {review.content}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={review.is_approved ? 'badge-success' : 'badge-warning'}>
                          {review.is_approved ? 'Approved' : 'Pending'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {new Date(review.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {!review.is_approved && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleApprove(review.id)}
                              className="hover:text-accent-foreground"
                              title="Approve"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                          )}
                          {review.is_approved && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleReject(review.id)}
                              className="hover:text-primary"
                              title="Reject"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(review.id)}
                            className="hover:text-destructive"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
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

export default AdminReviews;

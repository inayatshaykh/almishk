import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Heart } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface WishlistButtonProps {
  productId: string;
  size?: 'sm' | 'default' | 'lg' | 'icon';
  variant?: 'default' | 'outline' | 'ghost';
  className?: string;
  showText?: boolean;
}

const WishlistButton = ({
  productId,
  size = 'icon',
  variant = 'ghost',
  className,
  showText = false,
}: WishlistButtonProps) => {
  const { user } = useAuth();
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const checkWishlist = async () => {
      if (!user) return;

      const { data } = await supabase
        .from('wishlists')
        .select('id')
        .eq('user_id', user.id)
        .eq('product_id', productId)
        .maybeSingle();

      setIsInWishlist(!!data);
    };

    checkWishlist();
  }, [user, productId]);

  const toggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      toast.error('Please sign in to add items to wishlist');
      return;
    }

    setIsLoading(true);

    if (isInWishlist) {
      const { error } = await supabase
        .from('wishlists')
        .delete()
        .eq('user_id', user.id)
        .eq('product_id', productId);

      if (error) {
        toast.error('Failed to remove from wishlist');
      } else {
        setIsInWishlist(false);
        toast.success('Removed from wishlist');
      }
    } else {
      const { error } = await supabase.from('wishlists').insert({
        user_id: user.id,
        product_id: productId,
      });

      if (error) {
        toast.error('Failed to add to wishlist');
      } else {
        setIsInWishlist(true);
        toast.success('Added to wishlist');
      }
    }

    setIsLoading(false);
  };

  return (
    <Button
      size={size}
      variant={variant}
      onClick={toggleWishlist}
      disabled={isLoading}
      className={cn(
        isInWishlist && 'text-destructive hover:text-destructive',
        className
      )}
    >
      <Heart
        className={cn('h-5 w-5', showText && 'mr-2')}
        fill={isInWishlist ? 'currentColor' : 'none'}
      />
      {showText && (isInWishlist ? 'In Wishlist' : 'Add to Wishlist')}
    </Button>
  );
};

export default WishlistButton;

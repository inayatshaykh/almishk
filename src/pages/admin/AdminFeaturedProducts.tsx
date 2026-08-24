import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plus, Trash2, Award, Zap, Package, ArrowUp, ArrowDown } from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';

type Product = Tables<'products'>;

interface FeaturedProduct {
  id: string;
  product_id: string;
  feature_type: string;
  sort_order: number;
  is_active: boolean;
  product?: Product;
}

const AdminFeaturedProducts = () => {
  const [bestSellers, setBestSellers] = useState<FeaturedProduct[]>([]);
  const [newArrivals, setNewArrivals] = useState<FeaturedProduct[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isBestSellerDialogOpen, setIsBestSellerDialogOpen] = useState(false);
  const [isNewArrivalDialogOpen, setIsNewArrivalDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<string>('');

  const fetchData = async () => {
    const [{ data: featuredData }, { data: productsData }] = await Promise.all([
      supabase.from('featured_products').select('*').order('sort_order', { ascending: true }),
      supabase.from('products').select('*').eq('is_combo', false).order('name'),
    ]);

    if (featuredData && productsData) {
      const withProducts = featuredData.map((item) => ({
        ...item,
        product: productsData.find((p) => p.id === item.product_id),
      }));

      setBestSellers(withProducts.filter((i) => i.feature_type === 'best_seller'));
      setNewArrivals(withProducts.filter((i) => i.feature_type === 'new_arrival'));
    }
    setProducts(productsData || []);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddFeatured = async (featureType: 'best_seller' | 'new_arrival') => {
    if (!selectedProduct) {
      toast.error('Please select a product');
      return;
    }

    const items = featureType === 'best_seller' ? bestSellers : newArrivals;
    const maxOrder = items.length > 0 ? Math.max(...items.map((i) => i.sort_order)) : -1;

    const { error } = await supabase.from('featured_products').insert({
      product_id: selectedProduct,
      feature_type: featureType,
      sort_order: maxOrder + 1,
      is_active: true,
    });

    if (error) {
      if (error.code === '23505') {
        toast.error('This product is already in this list');
      } else {
        toast.error('Failed to add product');
      }
    } else {
      toast.success('Product added');
      setSelectedProduct('');
      if (featureType === 'best_seller') {
        setIsBestSellerDialogOpen(false);
      } else {
        setIsNewArrivalDialogOpen(false);
      }
      fetchData();
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('featured_products').delete().eq('id', id);
    if (error) {
      toast.error('Failed to remove');
    } else {
      toast.success('Product removed');
      fetchData();
    }
  };

  const handleToggleActive = async (id: string, currentState: boolean) => {
    const { error } = await supabase
      .from('featured_products')
      .update({ is_active: !currentState })
      .eq('id', id);

    if (error) {
      toast.error('Failed to update');
    } else {
      fetchData();
    }
  };

  const handleMoveUp = async (items: FeaturedProduct[], index: number) => {
    if (index === 0) return;

    const current = items[index];
    const previous = items[index - 1];

    await Promise.all([
      supabase.from('featured_products').update({ sort_order: previous.sort_order }).eq('id', current.id),
      supabase.from('featured_products').update({ sort_order: current.sort_order }).eq('id', previous.id),
    ]);

    fetchData();
  };

  const handleMoveDown = async (items: FeaturedProduct[], index: number) => {
    if (index === items.length - 1) return;

    const current = items[index];
    const next = items[index + 1];

    await Promise.all([
      supabase.from('featured_products').update({ sort_order: next.sort_order }).eq('id', current.id),
      supabase.from('featured_products').update({ sort_order: current.sort_order }).eq('id', next.id),
    ]);

    fetchData();
  };

  const renderTable = (items: FeaturedProduct[], featureType: 'best_seller' | 'new_arrival') => (
    <Table>
      <TableHeader>
        <TableRow className="border-border">
          <TableHead className="w-16">Order</TableHead>
          <TableHead className="w-16">Image</TableHead>
          <TableHead>Product</TableHead>
          <TableHead className="w-24">Price</TableHead>
          <TableHead className="w-20">Active</TableHead>
          <TableHead className="w-20">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {isLoading ? (
          <TableRow>
            <TableCell colSpan={6} className="text-center py-8">
              Loading...
            </TableCell>
          </TableRow>
        ) : items.length === 0 ? (
          <TableRow>
            <TableCell colSpan={6} className="text-center py-8">
              <Package className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">No products added yet</p>
            </TableCell>
          </TableRow>
        ) : (
          items.map((item, index) => (
            <TableRow key={item.id} className="border-border">
              <TableCell>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => handleMoveUp(items, index)}
                    disabled={index === 0}
                  >
                    <ArrowUp className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => handleMoveDown(items, index)}
                    disabled={index === items.length - 1}
                  >
                    <ArrowDown className="h-3 w-3" />
                  </Button>
                </div>
              </TableCell>
              <TableCell>
                <div className="w-10 h-10 rounded bg-muted overflow-hidden">
                  {item.product?.image_url ? (
                    <img
                      src={item.product.image_url}
                      alt={item.product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="h-4 w-4 text-muted-foreground/50" />
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell className="font-medium">{item.product?.name || 'Unknown'}</TableCell>
              <TableCell>₹{item.product?.price}</TableCell>
              <TableCell>
                <Switch
                  checked={item.is_active}
                  onCheckedChange={() => handleToggleActive(item.id, item.is_active)}
                />
              </TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive"
                  onClick={() => handleDelete(item.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-headline text-3xl text-gradient-gold">Featured Products</h1>
          <p className="text-muted-foreground mt-1">Manage Best Sellers and New Arrivals on homepage</p>
        </div>

        <Tabs defaultValue="best_sellers" className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="best_sellers" className="flex items-center gap-2">
              <Award className="h-4 w-4" />
              Best Sellers
            </TabsTrigger>
            <TabsTrigger value="new_arrivals" className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              New Arrivals
            </TabsTrigger>
          </TabsList>

          <TabsContent value="best_sellers" className="mt-6">
            <Card className="card-luxury overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Award className="h-5 w-5 text-primary" />
                  Best Sellers
                </CardTitle>
                <Dialog open={isBestSellerDialogOpen} onOpenChange={setIsBestSellerDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="bg-primary hover:bg-primary/90">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Product
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Best Seller</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                      <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a product" />
                        </SelectTrigger>
                        <SelectContent>
                          {products.map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button onClick={() => handleAddFeatured('best_seller')} className="w-full">
                        Add to Best Sellers
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent className="p-0">
                {renderTable(bestSellers, 'best_seller')}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="new_arrivals" className="mt-6">
            <Card className="card-luxury overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Zap className="h-5 w-5 text-primary" />
                  New Arrivals
                </CardTitle>
                <Dialog open={isNewArrivalDialogOpen} onOpenChange={setIsNewArrivalDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="bg-primary hover:bg-primary/90">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Product
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Arrival</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                      <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a product" />
                        </SelectTrigger>
                        <SelectContent>
                          {products.map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button onClick={() => handleAddFeatured('new_arrival')} className="w-full">
                        Add to New Arrivals
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent className="p-0">
                {renderTable(newArrivals, 'new_arrival')}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default AdminFeaturedProducts;

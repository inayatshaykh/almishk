import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plus, Trash2, ArrowUp, ArrowDown, ImageIcon } from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';

type Product = Tables<'products'>;

interface SlideshowItem {
  id: string;
  product_id: string;
  title: string | null;
  subtitle: string | null;
  sort_order: number;
  is_active: boolean;
  product?: Product;
}

const AdminSlideshow = () => {
  const [items, setItems] = useState<SlideshowItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Form state
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');

  const fetchData = async () => {
    const [{ data: slideshowData }, { data: productsData }] = await Promise.all([
      supabase.from('slideshow_items').select('*').order('sort_order', { ascending: true }),
      supabase.from('products').select('*').eq('is_combo', false).order('name'),
    ]);

    if (slideshowData && productsData) {
      const itemsWithProducts = slideshowData.map((item) => ({
        ...item,
        product: productsData.find((p) => p.id === item.product_id),
      }));
      setItems(itemsWithProducts as SlideshowItem[]);
    }
    setProducts(productsData || []);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddItem = async () => {
    if (!selectedProduct) {
      toast.error('Please select a product');
      return;
    }

    const maxOrder = items.length > 0 ? Math.max(...items.map((i) => i.sort_order)) : -1;

    const { error } = await supabase.from('slideshow_items').insert({
      product_id: selectedProduct,
      title: title || null,
      subtitle: subtitle || null,
      sort_order: maxOrder + 1,
      is_active: true,
    });

    if (error) {
      toast.error('Failed to add item');
    } else {
      toast.success('Slideshow item added');
      setIsDialogOpen(false);
      setSelectedProduct('');
      setTitle('');
      setSubtitle('');
      fetchData();
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('slideshow_items').delete().eq('id', id);
    if (error) {
      toast.error('Failed to delete');
    } else {
      toast.success('Item removed');
      fetchData();
    }
  };

  const handleToggleActive = async (id: string, currentState: boolean) => {
    const { error } = await supabase
      .from('slideshow_items')
      .update({ is_active: !currentState })
      .eq('id', id);

    if (error) {
      toast.error('Failed to update');
    } else {
      fetchData();
    }
  };

  const handleMoveUp = async (index: number) => {
    if (index === 0) return;

    const current = items[index];
    const previous = items[index - 1];

    await Promise.all([
      supabase.from('slideshow_items').update({ sort_order: previous.sort_order }).eq('id', current.id),
      supabase.from('slideshow_items').update({ sort_order: current.sort_order }).eq('id', previous.id),
    ]);

    fetchData();
  };

  const handleMoveDown = async (index: number) => {
    if (index === items.length - 1) return;

    const current = items[index];
    const next = items[index + 1];

    await Promise.all([
      supabase.from('slideshow_items').update({ sort_order: next.sort_order }).eq('id', current.id),
      supabase.from('slideshow_items').update({ sort_order: current.sort_order }).eq('id', next.id),
    ]);

    fetchData();
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-headline text-3xl text-gradient-gold">Slideshow</h1>
            <p className="text-muted-foreground mt-1">Manage hero banner slideshow</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90">
                <Plus className="h-4 w-4 mr-2" />
                Add Slide
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Slideshow Item</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Product</Label>
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
                </div>
                <div className="space-y-2">
                  <Label>Custom Title (optional)</Label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Leave empty to use product name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Custom Subtitle (optional)</Label>
                  <Input
                    value={subtitle}
                    onChange={(e) => setSubtitle(e.target.value)}
                    placeholder="Leave empty to use product description"
                  />
                </div>
                <Button onClick={handleAddItem} className="w-full">
                  Add to Slideshow
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="card-luxury overflow-hidden">
          <CardHeader>
            <CardTitle className="text-lg">Slideshow Items</CardTitle>
            <p className="text-sm text-muted-foreground">Slides auto-rotate every 2 seconds</p>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-border">
                  <TableHead className="w-16">Order</TableHead>
                  <TableHead className="w-20">Image</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Custom Title</TableHead>
                  <TableHead className="w-20">Active</TableHead>
                  <TableHead className="w-32">Actions</TableHead>
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
                      <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                      <p className="text-muted-foreground">No slideshow items yet</p>
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
                            className="h-8 w-8"
                            onClick={() => handleMoveUp(index)}
                            disabled={index === 0}
                          >
                            <ArrowUp className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleMoveDown(index)}
                            disabled={index === items.length - 1}
                          >
                            <ArrowDown className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="w-12 h-12 rounded bg-muted overflow-hidden">
                          {item.product?.image_url ? (
                            <img
                              src={item.product.image_url}
                              alt={item.product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ImageIcon className="h-5 w-5 text-muted-foreground/50" />
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{item.product?.name || 'Unknown'}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {item.title || '—'}
                      </TableCell>
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
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminSlideshow;

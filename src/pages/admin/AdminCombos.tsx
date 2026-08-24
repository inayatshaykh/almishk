import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Gift, Plus, Pencil, Trash2, Package } from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';

type Product = Tables<'products'>;

interface ComboForm {
  name: string;
  description: string;
  price: string;
  discount_percentage: string;
  image_url: string;
  stock_quantity: string;
  stock_status: string;
}

const emptyForm: ComboForm = {
  name: '',
  description: '',
  price: '',
  discount_percentage: '0',
  image_url: '',
  stock_quantity: '10',
  stock_status: 'in_stock',
};

const AdminCombos = () => {
  const [combos, setCombos] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ComboForm>(emptyForm);
  const [comboItems, setComboItems] = useState<{ product_id: string; quantity: number }[]>([]);

  const fetchData = async () => {
    const [{ data: comboData }, { data: products }] = await Promise.all([
      supabase.from('products').select('*').eq('is_combo', true).order('created_at', { ascending: false }),
      supabase.from('products').select('*').eq('is_combo', false).order('name'),
    ]);
    setCombos(comboData || []);
    setAllProducts(products || []);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setComboItems([]);
    setDialogOpen(true);
  };

  const openEdit = async (combo: Product) => {
    setEditingId(combo.id);
    setForm({
      name: combo.name,
      description: combo.description || '',
      price: String(combo.price),
      discount_percentage: String(combo.discount_percentage ?? 0),
      image_url: combo.image_url || '',
      stock_quantity: String(combo.stock_quantity),
      stock_status: combo.stock_status,
    });
    // Fetch combo items
    const { data: items } = await supabase
      .from('combo_items')
      .select('included_product_id, quantity')
      .eq('combo_product_id', combo.id);
    setComboItems(
      (items || []).map((i) => ({ product_id: i.included_product_id, quantity: i.quantity }))
    );
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.price) {
      toast.error('Name and price are required');
      return;
    }

    const productData = {
      name: form.name,
      description: form.description || null,
      price: parseFloat(form.price),
      discount_percentage: parseFloat(form.discount_percentage) || 0,
      image_url: form.image_url || null,
      stock_quantity: parseInt(form.stock_quantity) || 0,
      stock_status: form.stock_status as 'in_stock' | 'out_of_stock' | 'low_stock',
      is_combo: true,
    };

    if (editingId) {
      const { error } = await supabase.from('products').update(productData).eq('id', editingId);
      if (error) { toast.error('Failed to update combo'); return; }

      // Update combo items
      await supabase.from('combo_items').delete().eq('combo_product_id', editingId);
      if (comboItems.length > 0) {
        await supabase.from('combo_items').insert(
          comboItems.map((item) => ({
            combo_product_id: editingId,
            included_product_id: item.product_id,
            quantity: item.quantity,
          }))
        );
      }
      toast.success('Combo updated');
    } else {
      const { data: newCombo, error } = await supabase.from('products').insert(productData).select('id').single();
      if (error || !newCombo) { toast.error('Failed to create combo'); return; }

      if (comboItems.length > 0) {
        await supabase.from('combo_items').insert(
          comboItems.map((item) => ({
            combo_product_id: newCombo.id,
            included_product_id: item.product_id,
            quantity: item.quantity,
          }))
        );
      }
      toast.success('Combo created');
    }

    setDialogOpen(false);
    fetchData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this combo?')) return;
    await supabase.from('combo_items').delete().eq('combo_product_id', id);
    await supabase.from('products').delete().eq('id', id);
    toast.success('Combo deleted');
    fetchData();
  };

  const addComboItem = () => {
    setComboItems([...comboItems, { product_id: '', quantity: 1 }]);
  };

  const updateComboItem = (index: number, field: 'product_id' | 'quantity', value: string | number) => {
    const updated = [...comboItems];
    updated[index] = { ...updated[index], [field]: value };
    setComboItems(updated);
  };

  const removeComboItem = (index: number) => {
    setComboItems(comboItems.filter((_, i) => i !== index));
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-headline text-3xl text-gradient-gold">Combo Packs</h1>
            <p className="text-muted-foreground mt-1">Create and manage special bundles</p>
          </div>
          <Button onClick={openCreate} className="btn-luxury">
            <Plus className="h-4 w-4 mr-2" />
            Create Combo
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        ) : combos.length === 0 ? (
          <Card className="card-luxury">
            <CardContent className="py-12 text-center">
              <Gift className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium mb-2">No Combos Yet</h3>
              <p className="text-muted-foreground mb-4">Create your first combo pack to get started.</p>
              <Button onClick={openCreate} className="btn-luxury">
                <Plus className="h-4 w-4 mr-2" />
                Create Combo
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {combos.map((combo) => (
              <Card key={combo.id} className="card-luxury overflow-hidden">
                <div className="aspect-[4/3] bg-secondary/30 flex items-center justify-center overflow-hidden">
                  {combo.image_url ? (
                    <img src={combo.image_url} alt={combo.name} className="w-full h-full object-cover" />
                  ) : (
                    <Gift className="h-16 w-16 text-primary/20" />
                  )}
                </div>
                <CardContent className="p-5">
                  <h3 className="font-serif text-lg mb-1">{combo.name}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{combo.description}</p>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-2xl font-serif text-primary">₹{combo.price}</span>
                    <Badge className={
                      combo.stock_status === 'in_stock' ? 'badge-success' :
                      combo.stock_status === 'low_stock' ? 'badge-warning' : 'badge-danger'
                    }>
                      {combo.stock_status === 'in_stock' ? 'In Stock' :
                       combo.stock_status === 'low_stock' ? 'Low Stock' : 'Out of Stock'}
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => openEdit(combo)}>
                      <Pencil className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button size="sm" variant="outline" className="border-destructive/30 text-destructive hover:bg-destructive/10" onClick={() => handleDelete(combo.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Create/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? 'Edit Combo' : 'Create Combo'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Combo Name *</Label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Original Price (₹) *</Label>
                  <Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Discount (%)</Label>
                  <Input type="number" min="0" max="100" value={form.discount_percentage} onChange={(e) => setForm({ ...form, discount_percentage: e.target.value })} />
                  {parseFloat(form.discount_percentage) > 0 && parseFloat(form.price) > 0 && (
                    <p className="text-xs text-emerald-600">
                      Final: ₹{(parseFloat(form.price) * (1 - parseFloat(form.discount_percentage) / 100)).toFixed(2)}
                    </p>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Image URL</Label>
                <Input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Stock Quantity</Label>
                  <Input type="number" value={form.stock_quantity} onChange={(e) => setForm({ ...form, stock_quantity: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Stock Status</Label>
                  <Select value={form.stock_status} onValueChange={(v) => setForm({ ...form, stock_status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="in_stock">In Stock</SelectItem>
                      <SelectItem value="low_stock">Low Stock</SelectItem>
                      <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Included Products */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-medium">Included Products</Label>
                  <Button size="sm" variant="outline" onClick={addComboItem}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Product
                  </Button>
                </div>
                {comboItems.map((item, index) => (
                  <div key={index} className="flex gap-3 items-end">
                    <div className="flex-1 space-y-1">
                      <Label className="text-xs">Product</Label>
                      <Select value={item.product_id} onValueChange={(v) => updateComboItem(index, 'product_id', v)}>
                        <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
                        <SelectContent>
                          {allProducts.map((p) => (
                            <SelectItem key={p.id} value={p.id}>{p.name} - ₹{p.price}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="w-20 space-y-1">
                      <Label className="text-xs">Qty</Label>
                      <Input type="number" min={1} value={item.quantity} onChange={(e) => updateComboItem(index, 'quantity', parseInt(e.target.value) || 1)} />
                    </div>
                    <Button size="icon" variant="ghost" className="text-destructive" onClick={() => removeComboItem(index)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleSave} className="btn-luxury">
                  {editingId ? 'Update Combo' : 'Create Combo'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminCombos;

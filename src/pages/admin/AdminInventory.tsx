import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { AlertTriangle, Package, CheckCircle } from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';

type Product = Tables<'products'>;

const AdminInventory = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      const { data } = await supabase.from('products').select('*').order('stock_quantity', { ascending: true });
      setProducts(data || []);
      setIsLoading(false);
    };
    fetchProducts();
  }, []);

  const lowStock = products.filter(p => p.stock_status === 'low_stock');
  const outOfStock = products.filter(p => p.stock_status === 'out_of_stock');

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-headline text-3xl text-gradient-gold">Inventory</h1>
          <p className="text-muted-foreground mt-1">Monitor stock levels</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="card-luxury p-6">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-emerald-400" />
              <div>
                <p className="text-2xl font-serif">{products.filter(p => p.stock_status === 'in_stock').length}</p>
                <p className="text-sm text-muted-foreground">In Stock</p>
              </div>
            </div>
          </Card>
          <Card className="card-luxury p-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-8 w-8 text-amber-400" />
              <div>
                <p className="text-2xl font-serif">{lowStock.length}</p>
                <p className="text-sm text-muted-foreground">Low Stock</p>
              </div>
            </div>
          </Card>
          <Card className="card-luxury p-6">
            <div className="flex items-center gap-3">
              <Package className="h-8 w-8 text-red-400" />
              <div>
                <p className="text-2xl font-serif">{outOfStock.length}</p>
                <p className="text-sm text-muted-foreground">Out of Stock</p>
              </div>
            </div>
          </Card>
        </div>

        <Card className="card-luxury overflow-hidden">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-border">
                  <TableHead>Product</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={3} className="text-center py-8">Loading...</TableCell></TableRow>
                ) : products.map((product) => (
                  <TableRow key={product.id} className="border-border">
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>{product.stock_quantity}</TableCell>
                    <TableCell>
                      <Badge className={product.stock_status === 'in_stock' ? 'badge-success' : product.stock_status === 'low_stock' ? 'badge-warning' : 'badge-danger'}>
                        {product.stock_status.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminInventory;

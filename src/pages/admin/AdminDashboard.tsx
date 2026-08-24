import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Package, FolderTree, ShoppingCart, Users, AlertTriangle, TrendingUp } from 'lucide-react';

interface DashboardStats {
  totalProducts: number;
  totalCategories: number;
  totalOrders: number;
  totalUsers: number;
  lowStockProducts: number;
  pendingOrders: number;
}

const AdminDashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    totalCategories: 0,
    totalOrders: 0,
    totalUsers: 0,
    lowStockProducts: 0,
    pendingOrders: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [
          { count: productsCount },
          { count: categoriesCount },
          { count: ordersCount },
          { count: usersCount },
          { count: lowStockCount },
          { count: pendingOrdersCount },
        ] = await Promise.all([
          supabase.from('products').select('*', { count: 'exact', head: true }),
          supabase.from('categories').select('*', { count: 'exact', head: true }),
          supabase.from('orders').select('*', { count: 'exact', head: true }),
          supabase.from('profiles').select('*', { count: 'exact', head: true }),
          supabase.from('products').select('*', { count: 'exact', head: true }).in('stock_status', ['low_stock', 'out_of_stock']),
          supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        ]);

        setStats({
          totalProducts: productsCount || 0,
          totalCategories: categoriesCount || 0,
          totalOrders: ordersCount || 0,
          totalUsers: usersCount || 0,
          lowStockProducts: lowStockCount || 0,
          pendingOrders: pendingOrdersCount || 0,
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statCards = [
    {
      title: 'Total Products',
      value: stats.totalProducts,
      icon: Package,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      title: 'Categories',
      value: stats.totalCategories,
      icon: FolderTree,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-400/10',
    },
    {
      title: 'Total Orders',
      value: stats.totalOrders,
      icon: ShoppingCart,
      color: 'text-sky-400',
      bgColor: 'bg-sky-400/10',
    },
    {
      title: 'Total Users',
      value: stats.totalUsers,
      icon: Users,
      color: 'text-violet-400',
      bgColor: 'bg-violet-400/10',
    },
    {
      title: 'Low Stock Items',
      value: stats.lowStockProducts,
      icon: AlertTriangle,
      color: 'text-amber-400',
      bgColor: 'bg-amber-400/10',
    },
    {
      title: 'Pending Orders',
      value: stats.pendingOrders,
      icon: TrendingUp,
      color: 'text-rose-400',
      bgColor: 'bg-rose-400/10',
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-headline text-3xl text-gradient-gold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome to your admin dashboard
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {statCards.map((stat) => (
            <Card key={stat.title} className="card-luxury hover:border-primary/30 transition-colors">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground font-medium">
                      {stat.title}
                    </p>
                    <p className="text-3xl font-serif font-semibold mt-2">
                      {isLoading ? '...' : stat.value}
                    </p>
                  </div>
                  <div className={`p-3 rounded-sm ${stat.bgColor}`}>
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <Card className="card-luxury">
          <CardHeader>
            <CardTitle className="text-xl font-serif">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <a
                href="/admin/products"
                className="p-4 rounded-sm border border-border hover:border-primary/50 hover:bg-primary/5 transition-all group"
              >
                <Package className="h-8 w-8 text-primary mb-3 group-hover:scale-110 transition-transform" />
                <h3 className="font-medium">Add Product</h3>
                <p className="text-sm text-muted-foreground">Create a new perfume product</p>
              </a>
              <a
                href="/admin/orders"
                className="p-4 rounded-sm border border-border hover:border-primary/50 hover:bg-primary/5 transition-all group"
              >
                <ShoppingCart className="h-8 w-8 text-primary mb-3 group-hover:scale-110 transition-transform" />
                <h3 className="font-medium">View Orders</h3>
                <p className="text-sm text-muted-foreground">Manage customer orders</p>
              </a>
              <a
                href="/admin/inventory"
                className="p-4 rounded-sm border border-border hover:border-primary/50 hover:bg-primary/5 transition-all group"
              >
                <AlertTriangle className="h-8 w-8 text-primary mb-3 group-hover:scale-110 transition-transform" />
                <h3 className="font-medium">Check Inventory</h3>
                <p className="text-sm text-muted-foreground">Monitor stock levels</p>
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;

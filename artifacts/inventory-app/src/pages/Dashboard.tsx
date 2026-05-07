import { useGetDashboard } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PackageOpen, AlertTriangle, AlertOctagon, Layers, ArrowUpRight, ArrowDownRight, Activity } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { MovementBadge } from "@/components/MovementBadge";
import { StockBadge } from "@/components/StockBadge";

export default function Dashboard() {
  const { data: stats, isLoading, isError } = useGetDashboard();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-10 w-48 mb-2" />
          <Skeleton className="h-5 w-64" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (isError || !stats) {
    return (
      <div className="p-8 text-center bg-destructive/10 rounded-xl text-destructive">
        <AlertOctagon className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <h2 className="text-xl font-semibold mb-2">Could not load dashboard</h2>
        <p>Please check your connection and try again.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-serif font-bold text-foreground">Shop Overview</h1>
        <p className="text-muted-foreground mt-1">Here is what's happening with your stock today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Products</CardTitle>
            <PackageOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalProducts}</div>
            <p className="text-xs text-muted-foreground mt-1">Items in your catalog</p>
          </CardContent>
        </Card>
        
        <Card className={stats.lowStockCount > 0 ? "border-orange-200 bg-orange-50/30 dark:bg-orange-950/20" : ""}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-orange-600 dark:text-orange-400">Low Stock</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">{stats.lowStockCount}</div>
            <p className="text-xs text-orange-600/80 dark:text-orange-400/80 mt-1">Items running low</p>
          </CardContent>
        </Card>

        <Card className={stats.outOfStockCount > 0 ? "border-destructive/30 bg-destructive/5" : ""}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-destructive">Out of Stock</CardTitle>
            <AlertOctagon className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-destructive">{stats.outOfStockCount}</div>
            <p className="text-xs text-destructive/80 mt-1">Need immediate restock</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Categories</CardTitle>
            <Layers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalCategories}</div>
            <p className="text-xs text-muted-foreground mt-1">Active categories</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Top Low Stock Items</CardTitle>
            <Link href="/products?lowStock=true" className="text-sm text-primary hover:underline font-medium">
              View all
            </Link>
          </CardHeader>
          <CardContent>
            {stats.topLowStockProducts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <PackageOpen className="h-10 w-10 mx-auto mb-2 opacity-20" />
                <p>All items are sufficiently stocked.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {stats.topLowStockProducts.map(product => (
                  <div key={product.id} className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors">
                    <div>
                      <Link href={`/products/${product.id}`} className="font-medium hover:text-primary hover:underline">
                        {product.name}
                      </Link>
                      <div className="text-xs text-muted-foreground mt-1">{product.category}</div>
                    </div>
                    <div className="text-right">
                      <StockBadge quantity={product.quantity} threshold={product.minThreshold} />
                      <div className="text-xs text-muted-foreground mt-1">
                        Min: {product.minThreshold} {product.unit}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Movements</CardTitle>
            <Link href="/movements" className="text-sm text-primary hover:underline font-medium">
              View history
            </Link>
          </CardHeader>
          <CardContent>
            {stats.recentMovements.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="h-10 w-10 mx-auto mb-2 opacity-20" />
                <p>No recent stock movements.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {stats.recentMovements.map(movement => (
                  <div key={movement.id} className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        {movement.type === 'in' && <div className="bg-emerald-100 text-emerald-700 p-1.5 rounded-full"><ArrowDownRight className="h-4 w-4" /></div>}
                        {movement.type === 'out' && <div className="bg-red-100 text-red-700 p-1.5 rounded-full"><ArrowUpRight className="h-4 w-4" /></div>}
                        {movement.type === 'adjustment' && <div className="bg-blue-100 text-blue-700 p-1.5 rounded-full"><Activity className="h-4 w-4" /></div>}
                      </div>
                      <div>
                        <Link href={`/products/${movement.productId}`} className="font-medium hover:text-primary hover:underline block leading-tight">
                          {movement.productName}
                        </Link>
                        <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                          <MovementBadge type={movement.type} />
                          <span>{new Date(movement.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="font-bold whitespace-nowrap text-right">
                      {movement.type === 'out' ? '-' : '+'}{movement.quantity}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

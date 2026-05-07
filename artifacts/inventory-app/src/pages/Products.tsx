import { useState } from "react";
import { useListProducts, useListCategories } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Plus, Search, Filter, AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { StockBadge } from "@/components/StockBadge";
import { useDebounce } from "@/hooks/use-debounce";

export default function Products() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [category, setCategory] = useState<string>("all");
  const [lowStock, setLowStock] = useState<string>("all");

  const { data: products, isLoading } = useListProducts({
    search: debouncedSearch || undefined,
    category: category !== "all" ? category : undefined,
    lowStock: lowStock === "true" ? true : undefined,
  });

  const { data: categories } = useListCategories();

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-foreground">Products</h1>
          <p className="text-muted-foreground mt-1">Manage your shop's inventory.</p>
        </div>
        <Button asChild className="shrink-0 bg-primary hover:bg-primary/90 text-primary-foreground">
          <Link href="/products/new">
            <Plus className="h-4 w-4 mr-2" /> Add Product
          </Link>
        </Button>
      </div>

      <Card className="bg-card">
        <CardContent className="p-4 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-4 w-full sm:w-auto">
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-[140px] sm:w-[180px]">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <SelectValue placeholder="Category" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories?.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={lowStock} onValueChange={setLowStock}>
              <SelectTrigger className="w-[140px] sm:w-[160px]">
                <SelectValue placeholder="Stock Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stock Levels</SelectItem>
                <SelectItem value="true">Low Stock Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="bg-card rounded-xl border overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <Skeleton className="h-8 w-24" />
              </div>
            ))}
          </div>
        ) : !products || products.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            <PackageOpen className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <h3 className="text-lg font-medium text-foreground mb-1">No products found</h3>
            <p>Try adjusting your search or filters, or add a new product.</p>
            {(search || category !== 'all' || lowStock !== 'all') && (
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => { setSearch(""); setCategory("all"); setLowStock("all"); }}
              >
                Clear Filters
              </Button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-border">
            {products.map((product) => (
              <Link key={product.id} href={`/products/${product.id}`} className="block hover:bg-muted/30 transition-colors p-4 sm:p-6">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-lg font-medium text-foreground truncate">{product.name}</h3>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <Badge variant="secondary" className="text-xs font-normal">
                        {product.category}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        Min: {product.minThreshold} {product.unit}
                      </span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <StockBadge quantity={product.quantity} threshold={product.minThreshold} />
                    {(product.sellingPrice !== null && product.sellingPrice !== undefined) && (
                      <div className="text-sm font-medium mt-1">
                        ${Number(product.sellingPrice).toFixed(2)}
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Temporary icon component for empty state
function PackageOpen(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 22v-9" />
      <path d="M15.17 2.38a2 2 0 0 0-6.34 0l-5.6 3.24a2 2 0 0 0-1.05 1.74v8.28a2 2 0 0 0 1.05 1.74l6.17 3.56a2 2 0 0 0 1.96 0l6.17-3.56a2 2 0 0 0 1.05-1.74V7.36a2 2 0 0 0-1.05-1.74z" />
      <path d="M2 7l10 5 10-5" />
      <path d="m7.12 4.11 9.76 5.64" />
      <path d="M12 12v9" />
      <path d="m17.12 4.11-9.76 5.64" />
    </svg>
  );
}

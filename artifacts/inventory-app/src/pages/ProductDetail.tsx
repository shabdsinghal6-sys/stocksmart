import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useGetProduct, useDeleteProduct, useAdjustStock, useListMovements, getGetProductQueryKey, getListMovementsQueryKey, getListProductsQueryKey, getGetDashboardQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Pencil, Trash2, AlertOctagon, TrendingUp, TrendingDown, ArrowRightLeft } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { StockBadge } from "@/components/StockBadge";
import { MovementBadge } from "@/components/MovementBadge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ProductDetail() {
  const { id } = useParams();
  const productId = Number(id);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: product, isLoading, isError } = useGetProduct(productId, {
    query: {
      enabled: !!productId,
      queryKey: getGetProductQueryKey(productId)
    }
  });

  const { data: movements, isLoading: isLoadingMovements } = useListMovements(
    { productId, limit: 10 },
    { query: { enabled: !!productId, queryKey: getListMovementsQueryKey({ productId, limit: 10 }) } }
  );

  const deleteProduct = useDeleteProduct();
  const adjustStock = useAdjustStock();

  const [isAdjustOpen, setIsAdjustOpen] = useState(false);
  const [adjustType, setAdjustType] = useState<"in" | "out" | "adjustment">("in");
  const [adjustQty, setAdjustQty] = useState("");
  const [adjustNote, setAdjustNote] = useState("");

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-12 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-64 col-span-2" />
          <Skeleton className="h-64 col-span-1" />
        </div>
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div className="p-8 text-center bg-destructive/10 rounded-xl text-destructive">
        <AlertOctagon className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <h2 className="text-xl font-semibold mb-2">Product not found</h2>
        <Button variant="outline" asChild className="mt-4"><Link href="/products">Go back</Link></Button>
      </div>
    );
  }

  async function handleDelete() {
    if (confirm("Are you sure you want to delete this product? This action cannot be undone.")) {
      try {
        await deleteProduct.mutateAsync({ id: productId });
        toast({ title: "Product deleted", description: "The product has been removed." });
        queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetDashboardQueryKey() });
        setLocation("/products");
      } catch (err) {
        toast({ title: "Error", description: "Could not delete product.", variant: "destructive" });
      }
    }
  }

  async function handleAdjust() {
    const qty = Number(adjustQty);
    if (!qty || qty <= 0) {
      toast({ title: "Invalid quantity", description: "Please enter a valid positive number.", variant: "destructive" });
      return;
    }
    
    try {
      await adjustStock.mutateAsync({
        id: productId,
        data: {
          type: adjustType,
          quantity: qty,
          note: adjustNote || undefined,
        }
      });
      
      setIsAdjustOpen(false);
      setAdjustQty("");
      setAdjustNote("");
      
      toast({ title: "Stock updated", description: "Stock movement recorded successfully." });
      queryClient.invalidateQueries({ queryKey: getGetProductQueryKey(productId) });
      queryClient.invalidateQueries({ queryKey: getListMovementsQueryKey({ productId, limit: 10 }) });
      queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetDashboardQueryKey() });
    } catch (err) {
      toast({ title: "Error", description: "Failed to update stock.", variant: "destructive" });
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <Link href="/products" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors">
        <ArrowLeft className="h-4 w-4 mr-1" /> Back to Products
      </Link>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-serif font-bold text-foreground">{product.name}</h1>
            <StockBadge quantity={product.quantity} threshold={product.minThreshold} />
          </div>
          <p className="text-muted-foreground">{product.category}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/products/${product.id}/edit`}>
              <Pencil className="h-4 w-4 mr-2" /> Edit
            </Link>
          </Button>
          <Button variant="outline" className="text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={handleDelete} disabled={deleteProduct.isPending}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader className="pb-3 border-b">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">Product Details</CardTitle>
                <div className="text-sm text-muted-foreground">ID: {product.id}</div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Unit of Measure</dt>
                  <dd className="mt-1 text-base">{product.unit}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Alert Threshold</dt>
                  <dd className="mt-1 text-base">{product.minThreshold} {product.unit}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Cost Price</dt>
                  <dd className="mt-1 text-base">{product.costPrice ? `$${Number(product.costPrice).toFixed(2)}` : '-'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Selling Price</dt>
                  <dd className="mt-1 text-base">{product.sellingPrice ? `$${Number(product.sellingPrice).toFixed(2)}` : '-'}</dd>
                </div>
                {product.description && (
                  <div className="sm:col-span-2 pt-4 border-t">
                    <dt className="text-sm font-medium text-muted-foreground">Description</dt>
                    <dd className="mt-2 text-base text-foreground/80 leading-relaxed whitespace-pre-wrap">{product.description}</dd>
                  </div>
                )}
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Recent Movements</CardTitle>
              <Button variant="link" asChild className="h-auto p-0">
                <Link href={`/movements?productId=${product.id}`}>View all</Link>
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {isLoadingMovements ? (
                <div className="p-6 space-y-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : !movements || movements.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground text-sm">
                  No stock movements recorded yet.
                </div>
              ) : (
                <div className="divide-y">
                  {movements.map(mov => (
                    <div key={mov.id} className="p-4 flex items-center justify-between hover:bg-muted/20">
                      <div className="flex items-center gap-3">
                        <MovementBadge type={mov.type} />
                        <div>
                          <div className="text-sm font-medium">
                            {mov.type === 'in' ? 'Added stock' : mov.type === 'out' ? 'Removed stock' : 'Manual adjustment'}
                            {mov.note && <span className="text-muted-foreground font-normal ml-2">— {mov.note}</span>}
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {new Date(mov.createdAt).toLocaleString()}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`font-medium ${mov.type === 'out' ? 'text-destructive' : 'text-emerald-600'}`}>
                          {mov.type === 'out' ? '-' : '+'}{mov.quantity}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {mov.quantityBefore} → {mov.quantityAfter}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="sticky top-6 border-primary/20 shadow-sm bg-sidebar">
            <CardHeader className="bg-primary/5 pb-4">
              <CardTitle className="text-lg">Current Stock</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="text-5xl font-bold font-serif mb-2">{product.quantity}</div>
              <div className="text-muted-foreground">{product.unit} available</div>

              <div className="mt-8 space-y-3">
                <Dialog open={isAdjustOpen} onOpenChange={setIsAdjustOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-full bg-emerald-600 hover:bg-emerald-700" onClick={() => setAdjustType("in")}>
                      <TrendingUp className="h-4 w-4 mr-2" /> Add Stock
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Record Stock In</DialogTitle>
                      <DialogDescription>Add new inventory for {product.name}.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Quantity to Add</Label>
                        <Input type="number" min="1" value={adjustQty} onChange={e => setAdjustQty(e.target.value)} placeholder={`e.g. 10 ${product.unit}`} />
                      </div>
                      <div className="space-y-2">
                        <Label>Note (Optional)</Label>
                        <Input value={adjustNote} onChange={e => setAdjustNote(e.target.value)} placeholder="e.g. Supplier delivery" />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsAdjustOpen(false)}>Cancel</Button>
                      <Button onClick={handleAdjust} disabled={adjustStock.isPending}>Save</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700" onClick={() => setAdjustType("out")}>
                      <TrendingDown className="h-4 w-4 mr-2" /> Record Sale / Remove
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Record Stock Out</DialogTitle>
                      <DialogDescription>Remove inventory for {product.name}.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Quantity to Remove</Label>
                        <Input type="number" min="1" value={adjustQty} onChange={e => setAdjustQty(e.target.value)} placeholder={`e.g. 5 ${product.unit}`} />
                      </div>
                      <div className="space-y-2">
                        <Label>Note (Optional)</Label>
                        <Input value={adjustNote} onChange={e => setAdjustNote(e.target.value)} placeholder="e.g. Sale or Damaged" />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setAdjustType("in")}>Cancel</Button>
                      <Button variant="destructive" onClick={handleAdjust} disabled={adjustStock.isPending}>Remove</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="ghost" className="w-full" onClick={() => setAdjustType("adjustment")}>
                      <ArrowRightLeft className="h-4 w-4 mr-2" /> Manual Count Adjustment
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Manual Count Adjustment</DialogTitle>
                      <DialogDescription>Correct the inventory count for {product.name} after a stocktake.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Variance Quantity</Label>
                        <Input type="number" value={adjustQty} onChange={e => setAdjustQty(e.target.value)} placeholder="Difference (e.g. 2 or -3)" />
                      </div>
                      <div className="space-y-2">
                        <Label>Note</Label>
                        <Input value={adjustNote} onChange={e => setAdjustNote(e.target.value)} placeholder="e.g. Stocktake correction" />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setAdjustType("in")}>Cancel</Button>
                      <Button onClick={handleAdjust} disabled={adjustStock.isPending}>Adjust</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

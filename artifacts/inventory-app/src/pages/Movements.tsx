import { useState } from "react";
import { useListMovements } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MovementBadge } from "@/components/MovementBadge";
import { Activity, History, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function Movements() {
  const [type, setType] = useState<string>("all");
  const [search, setSearch] = useState("");

  const { data: movements, isLoading } = useListMovements({
    type: type !== "all" ? (type as any) : undefined,
    limit: 100, // Reasonable default for a log page without pagination built-in
  });

  const filteredMovements = movements?.filter(m => 
    !search || m.productName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-serif font-bold text-foreground">Stock Movements</h1>
        <p className="text-muted-foreground mt-1">A history of all inventory additions, removals, and adjustments.</p>
      </div>

      <Card className="bg-card">
        <CardContent className="p-4 flex flex-col sm:flex-row gap-4">
           <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Filter by product name..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-4 w-full sm:w-auto">
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Movement Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="in">Stock In</SelectItem>
                <SelectItem value="out">Stock Out</SelectItem>
                <SelectItem value="adjustment">Adjustments</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="flex justify-between items-center pb-4 border-b last:border-0">
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-48" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <Skeleton className="h-8 w-16" />
                </div>
              ))}
            </div>
          ) : !filteredMovements || filteredMovements.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <History className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <h3 className="text-lg font-medium text-foreground mb-1">No movements found</h3>
              <p>Try adjusting your filters to see more history.</p>
              {(type !== 'all' || search) && (
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => { setType("all"); setSearch(""); }}
                >
                  Clear Filters
                </Button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filteredMovements.map((movement) => (
                <div key={movement.id} className="p-4 sm:p-6 hover:bg-muted/20 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="mt-1 hidden sm:block">
                      <Activity className="h-5 w-5 text-muted-foreground/50" />
                    </div>
                    <div>
                      <Link href={`/products/${movement.productId}`} className="font-medium text-foreground hover:text-primary hover:underline text-lg">
                        {movement.productName}
                      </Link>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <MovementBadge type={movement.type} />
                        <span className="text-sm text-muted-foreground">
                          {new Date(movement.createdAt).toLocaleString()}
                        </span>
                      </div>
                      {movement.note && (
                        <div className="text-sm mt-2 text-foreground/80 italic">
                          "{movement.note}"
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-left sm:text-right bg-muted/30 sm:bg-transparent p-3 sm:p-0 rounded-lg sm:rounded-none">
                    <div className={`text-xl font-bold font-serif ${movement.type === 'out' ? 'text-destructive' : 'text-emerald-600'}`}>
                      {movement.type === 'out' ? '-' : '+'}{movement.quantity}
                    </div>
                    <div className="text-sm text-muted-foreground flex items-center sm:justify-end gap-2 mt-1">
                      <span>Count:</span>
                      <span className="font-medium">{movement.quantityBefore}</span>
                      <span>→</span>
                      <span className="font-medium text-foreground">{movement.quantityAfter}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

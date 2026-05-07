import { Badge } from "@/components/ui/badge";

interface StockBadgeProps {
  quantity: number;
  threshold: number;
}

export function StockBadge({ quantity, threshold }: StockBadgeProps) {
  if (quantity === 0) {
    return (
      <Badge variant="destructive" className="font-semibold px-2 py-0.5 rounded-md">
        Out of Stock (0)
      </Badge>
    );
  }
  
  if (quantity <= threshold) {
    return (
      <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800 font-semibold px-2 py-0.5 rounded-md">
        Low Stock ({quantity})
      </Badge>
    );
  }
  
  return (
    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800 font-semibold px-2 py-0.5 rounded-md">
      In Stock ({quantity})
    </Badge>
  );
}

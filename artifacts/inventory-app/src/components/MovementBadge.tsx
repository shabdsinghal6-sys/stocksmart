import { Badge } from "@/components/ui/badge";

interface MovementBadgeProps {
  type: 'in' | 'out' | 'adjustment';
}

export function MovementBadge({ type }: MovementBadgeProps) {
  switch (type) {
    case 'in':
      return (
        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800">
          Stock In
        </Badge>
      );
    case 'out':
      return (
        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800">
          Stock Out
        </Badge>
      );
    case 'adjustment':
      return (
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800">
          Adjustment
        </Badge>
      );
  }
}

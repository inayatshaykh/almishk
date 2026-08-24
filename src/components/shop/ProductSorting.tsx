import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowUpDown } from 'lucide-react';

export type SortOption = 'newest' | 'price_low' | 'price_high' | 'most_reviewed';

interface ProductSortingProps {
  value: SortOption;
  onChange: (value: SortOption) => void;
}

const ProductSorting = ({ value, onChange }: ProductSortingProps) => {
  return (
    <div className="flex items-center gap-2">
      <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
      <Select value={value} onValueChange={(v) => onChange(v as SortOption)}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="newest">Newest First</SelectItem>
          <SelectItem value="price_low">Price: Low to High</SelectItem>
          <SelectItem value="price_high">Price: High to Low</SelectItem>
          <SelectItem value="most_reviewed">Most Reviewed</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

export default ProductSorting;

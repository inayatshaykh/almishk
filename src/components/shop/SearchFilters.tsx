import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import type { Tables } from '@/integrations/supabase/types';

type Category = Tables<'categories'>;

interface SearchFiltersProps {
  categories: Category[];
  searchQuery: string;
  selectedCategory: string | null;
  priceRange: [number, number];
  stockStatus: string | null;
  maxPrice: number;
  onSearchChange: (query: string) => void;
  onCategoryChange: (categoryId: string | null) => void;
  onPriceRangeChange: (range: [number, number]) => void;
  onStockStatusChange: (status: string | null) => void;
  onClearFilters: () => void;
}

const SearchFilters = ({
  categories,
  searchQuery,
  selectedCategory,
  priceRange,
  stockStatus,
  maxPrice,
  onSearchChange,
  onCategoryChange,
  onPriceRangeChange,
  onStockStatusChange,
  onClearFilters,
}: SearchFiltersProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const hasActiveFilters = selectedCategory || stockStatus || priceRange[0] > 0 || priceRange[1] < maxPrice;
  const activeFilterCount = [
    selectedCategory,
    stockStatus,
    priceRange[0] > 0 || priceRange[1] < maxPrice,
  ].filter(Boolean).length;

  const FilterContent = () => (
    <div className="space-y-6">
      {/* Category Filter */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Category</Label>
        <Select
          value={selectedCategory || 'all'}
          onValueChange={(v) => onCategoryChange(v === 'all' ? null : v)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Price Range */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <Label className="text-sm font-medium">Price Range</Label>
          <span className="text-sm text-muted-foreground">
            ₹{priceRange[0]} - ₹{priceRange[1]}
          </span>
        </div>
        <Slider
          value={priceRange}
          onValueChange={(value) => onPriceRangeChange(value as [number, number])}
          max={maxPrice}
          min={0}
          step={10}
          className="w-full"
        />
      </div>

      {/* Stock Status */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Availability</Label>
        <Select
          value={stockStatus || 'all'}
          onValueChange={(v) => onStockStatusChange(v === 'all' ? null : v)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="All Stock Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="in_stock">In Stock</SelectItem>
            <SelectItem value="low_stock">Low Stock</SelectItem>
            <SelectItem value="out_of_stock">Out of Stock</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <Button variant="outline" onClick={onClearFilters} className="w-full">
          <X className="h-4 w-4 mr-2" />
          Clear All Filters
        </Button>
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search perfumes..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 bg-card border-border"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Mobile Filter Button */}
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" className="lg:hidden relative">
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              Filters
              {activeFilterCount > 0 && (
                <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center bg-primary text-primary-foreground text-xs">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Filters</SheetTitle>
            </SheetHeader>
            <div className="mt-6">
              <FilterContent />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Filters */}
      <div className="hidden lg:flex flex-wrap gap-4 items-end">
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Category</Label>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedCategory === null ? 'default' : 'outline'}
              size="sm"
              onClick={() => onCategoryChange(null)}
            >
              All
            </Button>
            {categories.map((cat) => (
              <Button
                key={cat.id}
                variant={selectedCategory === cat.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => onCategoryChange(cat.id)}
              >
                {cat.name}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-2 min-w-[200px]">
          <Label className="text-xs text-muted-foreground">
            Price: ₹{priceRange[0]} - ₹{priceRange[1]}
          </Label>
          <Slider
            value={priceRange}
            onValueChange={(value) => onPriceRangeChange(value as [number, number])}
            max={maxPrice}
            min={0}
            step={10}
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Availability</Label>
          <Select
            value={stockStatus || 'all'}
            onValueChange={(v) => onStockStatusChange(v === 'all' ? null : v)}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="in_stock">In Stock</SelectItem>
              <SelectItem value="low_stock">Low Stock</SelectItem>
              <SelectItem value="out_of_stock">Out of Stock</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={onClearFilters} className="text-muted-foreground">
            <X className="h-4 w-4 mr-1" />
            Clear
          </Button>
        )}
      </div>

      {/* Active Filter Pills */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {selectedCategory && (
            <Badge variant="secondary" className="gap-1">
              {categories.find((c) => c.id === selectedCategory)?.name}
              <button onClick={() => onCategoryChange(null)}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {stockStatus && (
            <Badge variant="secondary" className="gap-1">
              {stockStatus.replace('_', ' ')}
              <button onClick={() => onStockStatusChange(null)}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {(priceRange[0] > 0 || priceRange[1] < maxPrice) && (
            <Badge variant="secondary" className="gap-1">
              ₹{priceRange[0]} - ₹{priceRange[1]}
              <button onClick={() => onPriceRangeChange([0, maxPrice])}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchFilters;

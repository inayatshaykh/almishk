import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Package } from 'lucide-react';

interface ImageGalleryProps {
  images: { id: string; image_url: string; is_primary: boolean }[];
  productName: string;
  mainImageUrl?: string | null;
}

const ImageGallery = ({ images, productName, mainImageUrl }: ImageGalleryProps) => {
  // Combine main product image with gallery images
  const allImages = [
    ...(mainImageUrl ? [{ id: 'main', image_url: mainImageUrl, is_primary: true }] : []),
    ...images.filter(img => img.image_url !== mainImageUrl),
  ];

  const [selectedIndex, setSelectedIndex] = useState(0);
  const selectedImage = allImages[selectedIndex];

  if (allImages.length === 0) {
    return (
      <div className="aspect-square bg-muted rounded-sm flex items-center justify-center">
        <Package className="h-24 w-24 text-muted-foreground/30" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Main Image */}
      <div className="aspect-square bg-muted rounded-sm overflow-hidden">
        <img
          src={selectedImage?.image_url}
          alt={productName}
          className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
        />
      </div>

      {/* Thumbnails */}
      {allImages.length > 1 && (
        <div className="flex gap-3 overflow-x-auto pb-2">
          {allImages.map((image, index) => (
            <button
              key={image.id}
              onClick={() => setSelectedIndex(index)}
              className={cn(
                "flex-shrink-0 w-20 h-20 rounded-sm overflow-hidden border-2 transition-all",
                selectedIndex === index
                  ? "border-primary ring-2 ring-primary/20"
                  : "border-border hover:border-primary/50"
              )}
            >
              <img
                src={image.image_url}
                alt={`${productName} - ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageGallery;

import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { starRating } from '@/lib/format';

interface StarRatingProps {
  rating: number;
  size?: number;
  className?: string;
  showValue?: boolean;
  reviewCount?: number;
}

export function StarRating({ rating, size = 16, className, showValue = false, reviewCount }: StarRatingProps) {
  const { full, half, empty } = starRating(rating);
  return (
    <div className={cn('flex items-center gap-1', className)}>
      <div className="flex items-center">
        {Array.from({ length: full }).map((_, i) => (
          <Star key={`f${i}`} className="fill-amber-400 text-amber-400" style={{ width: size, height: size }} />
        ))}
        {half && (
          <div className="relative" style={{ width: size, height: size }}>
            <Star className="text-amber-400 absolute inset-0" style={{ width: size, height: size }} />
            <div className="absolute inset-0 overflow-hidden" style={{ width: size / 2 }}>
              <Star className="fill-amber-400 text-amber-400" style={{ width: size, height: size }} />
            </div>
          </div>
        )}
        {Array.from({ length: empty }).map((_, i) => (
          <Star key={`e${i}`} className="text-muted-foreground/40" style={{ width: size, height: size }} />
        ))}
      </div>
      {showValue && (
        <span className="text-sm font-medium text-muted-foreground">
          {rating.toFixed(1)}
          {reviewCount !== undefined && <span className="ml-1">({reviewCount})</span>}
        </span>
      )}
    </div>
  );
}

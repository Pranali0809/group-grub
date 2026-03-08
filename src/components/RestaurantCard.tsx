type RestaurantCardProps = {
  name: string;
  image?: string | null;
  cuisineTag?: string | null;
  priceRange?: string | null;
  highlightTag?: string | null;
  customTags?: string[] | null;
  compact?: boolean;
};

const RestaurantCard = ({ name, image, cuisineTag, priceRange, highlightTag, customTags, compact = false }: RestaurantCardProps) => {
  const tags = [cuisineTag, priceRange, highlightTag, ...(customTags || [])].filter(Boolean);

  return (
    <div className={`overflow-hidden rounded-xl bg-secondary ${compact ? '' : ''}`}>
      <div className={`relative ${compact ? 'h-28' : 'h-44'} w-full overflow-hidden`}>
        {image ? (
          <img src={image} alt={name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-muted">
            <span className="text-3xl">🍽️</span>
          </div>
        )}
      </div>
      <div className="p-3">
        <h3 className="font-display text-sm font-bold text-secondary-foreground uppercase tracking-wide">{name}</h3>
        {tags.length > 0 && (
          <p className="mt-1 text-xs text-muted-foreground">
            {tags.join(' • ')}
          </p>
        )}
      </div>
    </div>
  );
};

export default RestaurantCard;

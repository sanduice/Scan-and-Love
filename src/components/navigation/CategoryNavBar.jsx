import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useProductCategories } from '@/hooks/useSupabaseData';

export default function CategoryNavBar() {
  // Explicitly order by the 'order' column from database
  const { data: categories = [], isLoading } = useProductCategories('order');

  // Build hierarchical structure - only get parent categories (no parent_id), sorted by order
  const parentCategories = categories
    .filter(cat => !cat.parent_id)
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  if (isLoading) {
    return (
      <div className="bg-background border-b border-border sticky top-16 md:top-20 z-30 hidden lg:block">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-10 gap-6">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-3 w-20 bg-muted animate-pulse rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <nav className="bg-muted/30 border-b border-border sticky top-16 md:top-20 z-30 hidden lg:block">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-10 gap-1">
          {parentCategories.map((category) => (
            <Link
              key={category.id}
              to={createPageUrl('Products') + `?category=${category.slug}`}
              className="px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap"
            >
              {category.name}
            </Link>
          ))}

          {/* Static Support/Resources links */}
          <div className="ml-auto flex items-center gap-1">
            <Link
              to={createPageUrl('RequestQuote')}
              className="px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap"
            >
              Request Quote
            </Link>
            <Link
              to={createPageUrl('Blog')}
              className="px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap"
            >
              Blog
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}

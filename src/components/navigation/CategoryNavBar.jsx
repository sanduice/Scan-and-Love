import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ChevronDown } from 'lucide-react';
import { useProductCategories } from '@/hooks/useSupabaseData';

export default function CategoryNavBar() {
  const { data: categories = [], isLoading } = useProductCategories();
  const [activeDropdown, setActiveDropdown] = useState(null);

  // Build hierarchical structure - only get parent categories (no parent_id)
  const parentCategories = categories.filter(cat => !cat.parent_id);
  
  // Get subcategories for a parent
  const getSubcategories = (parentId) => {
    return categories.filter(cat => cat.parent_id === parentId);
  };

  if (isLoading) {
    return (
      <div className="bg-background border-b border-border sticky top-16 md:top-20 z-40 hidden lg:block">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-12 gap-6">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-4 w-24 bg-muted animate-pulse rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <nav 
      className="bg-background border-b border-border sticky top-16 md:top-20 z-40 hidden lg:block overflow-visible"
      onMouseLeave={() => setActiveDropdown(null)}
    >
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-12 gap-1">
          {parentCategories.map((category) => {
            const subcategories = getSubcategories(category.id);
            const hasSubcategories = subcategories.length > 0;

            return (
              <div
                key={category.id}
                className="relative"
                onMouseEnter={() => hasSubcategories && setActiveDropdown(category.id)}
              >
                <Link
                  to={createPageUrl('Products') + `?category=${category.slug}`}
                  className={`flex items-center gap-1 px-4 py-2.5 text-sm font-medium transition-colors whitespace-nowrap rounded-md ${
                    activeDropdown === category.id
                      ? 'text-primary bg-primary/5'
                      : 'text-foreground hover:text-primary hover:bg-muted'
                  }`}
                >
                  {category.name}
                  {hasSubcategories && (
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${
                      activeDropdown === category.id ? 'rotate-180' : ''
                    }`} />
                  )}
                </Link>

                {/* Dropdown for subcategories */}
                {hasSubcategories && activeDropdown === category.id && (
                  <div className="absolute top-full left-0 pt-1 z-[100]">
                    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl py-2 min-w-[220px] animate-in fade-in slide-in-from-top-2 duration-200">
                      {/* View All link */}
                      <Link
                        to={createPageUrl('Products') + `?category=${category.slug}`}
                        className="flex items-center px-4 py-2.5 text-sm font-semibold text-primary hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        onClick={() => setActiveDropdown(null)}
                      >
                        All {category.name}
                      </Link>
                      <div className="h-px bg-gray-200 dark:bg-gray-700 my-1" />
                      
                      {subcategories.map((sub) => {
                        const subSubcategories = getSubcategories(sub.id);
                        const hasSubSub = subSubcategories.length > 0;

                        return (
                          <div key={sub.id} className="relative group">
                            <Link
                              to={createPageUrl('Products') + `?category=${sub.slug}`}
                              className="flex items-center justify-between px-4 py-2.5 text-sm text-gray-900 dark:text-gray-100 hover:text-primary hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                              onClick={() => setActiveDropdown(null)}
                            >
                              {sub.name}
                              {hasSubSub && <ChevronDown className="w-3 h-3 -rotate-90" />}
                            </Link>

                            {/* Sub-subcategories flyout */}
                            {hasSubSub && (
                              <div className="absolute left-full top-0 pl-1 hidden group-hover:block z-[100]">
                                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl py-2 min-w-[200px]">
                                  {subSubcategories.map((subSub) => (
                                    <Link
                                      key={subSub.id}
                                      to={createPageUrl('Products') + `?category=${subSub.slug}`}
                                      className="block px-4 py-2.5 text-sm text-gray-900 dark:text-gray-100 hover:text-primary hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                      onClick={() => setActiveDropdown(null)}
                                    >
                                      {subSub.name}
                                    </Link>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Static Support/Resources links */}
          <div className="ml-auto flex items-center gap-1">
            <Link
              to={createPageUrl('RequestQuote')}
              className="px-4 py-2.5 text-sm font-medium text-foreground hover:text-primary hover:bg-muted transition-colors rounded-md whitespace-nowrap"
            >
              Request Quote
            </Link>
            <Link
              to={createPageUrl('Blog')}
              className="px-4 py-2.5 text-sm font-medium text-foreground hover:text-primary hover:bg-muted transition-colors rounded-md whitespace-nowrap"
            >
              Blog
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}

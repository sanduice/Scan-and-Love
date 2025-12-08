import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Calendar, Clock, ArrowRight, Search, Tag } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

const CATEGORIES = [
  { id: 'all', label: 'All Posts' },
  { id: 'tips', label: 'Tips & Tricks' },
  { id: 'how-to', label: 'How-To Guides' },
  { id: 'product-guides', label: 'Product Guides' },
  { id: 'design-inspiration', label: 'Design Inspiration' },
  { id: 'industry-news', label: 'Industry News' },
  { id: 'case-studies', label: 'Case Studies' },
];

export default function Blog() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['blog-posts'],
    queryFn: () => base44.entities.BlogPost.filter({ is_published: true }, '-published_at'),
  });

  const filteredPosts = posts.filter(post => {
    const matchesCategory = selectedCategory === 'all' || post.category === selectedCategory;
    const matchesSearch = !searchQuery || 
      post.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.excerpt?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const featuredPost = filteredPosts[0];
  const otherPosts = filteredPosts.slice(1);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold mb-4">Blog & Resources</h1>
          <p className="text-xl text-gray-300 max-w-2xl">
            Tips, guides, and inspiration for your custom signage and printing projects
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedCategory === cat.id
                    ? 'bg-[#2196F3] text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-100 border'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="bg-white rounded-xl overflow-hidden">
                <Skeleton className="h-48 w-full" />
                <div className="p-6 space-y-3">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-500 text-lg">No blog posts found.</p>
            <p className="text-gray-400 mt-2">Check back soon for new content!</p>
          </div>
        ) : (
          <>
            {/* Featured Post */}
            {featuredPost && (
              <Link
                to={createPageUrl('BlogPost') + `?slug=${featuredPost.slug}`}
                className="block mb-12"
              >
                <article className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow">
                  <div className="md:flex">
                    <div className="md:w-1/2">
                      <div className="h-64 md:h-full bg-gray-100">
                        {featuredPost.featured_image ? (
                          <img
                            src={featuredPost.featured_image}
                            alt={featuredPost.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-blue-600">
                            <span className="text-white text-6xl font-bold opacity-20">N</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="md:w-1/2 p-8 flex flex-col justify-center">
                      <span className="inline-block px-3 py-1 bg-[#2196F3]/10 text-[#2196F3] text-sm font-medium rounded-full mb-4 w-fit capitalize">
                        {featuredPost.category?.replace('-', ' ')}
                      </span>
                      <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 hover:text-[#2196F3]">
                        {featuredPost.title}
                      </h2>
                      <p className="text-gray-600 mb-6 line-clamp-3">{featuredPost.excerpt}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(featuredPost.published_at || featuredPost.created_date).toLocaleDateString()}
                        </span>
                        {featuredPost.read_time_minutes && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {featuredPost.read_time_minutes} min read
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              </Link>
            )}

            {/* Post Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {otherPosts.map(post => (
                <Link
                  key={post.id}
                  to={createPageUrl('BlogPost') + `?slug=${post.slug}`}
                  className="group"
                >
                  <article className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all h-full flex flex-col">
                    <div className="h-48 bg-gray-100 overflow-hidden">
                      {post.featured_image ? (
                        <img
                          src={post.featured_image}
                          alt={post.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-400 to-slate-500">
                          <span className="text-white text-4xl font-bold opacity-20">N</span>
                        </div>
                      )}
                    </div>
                    <div className="p-6 flex-1 flex flex-col">
                      <span className="inline-block px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded mb-3 w-fit capitalize">
                        {post.category?.replace('-', ' ')}
                      </span>
                      <h3 className="font-bold text-gray-900 mb-2 group-hover:text-[#2196F3] line-clamp-2">
                        {post.title}
                      </h3>
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2 flex-1">{post.excerpt}</p>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{new Date(post.published_at || post.created_date).toLocaleDateString()}</span>
                        <span className="flex items-center gap-1 text-[#2196F3] font-medium">
                          Read more <ArrowRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
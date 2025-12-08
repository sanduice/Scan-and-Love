import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import ReactMarkdown from 'react-markdown';
import { Calendar, Clock, ArrowLeft, Tag, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import SocialShare from '@/components/SocialShare';

export default function BlogPost() {
  const urlParams = new URLSearchParams(window.location.search);
  const slug = urlParams.get('slug');

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['blog-post', slug],
    queryFn: () => base44.entities.BlogPost.filter({ slug, is_published: true }),
    enabled: !!slug,
  });

  const post = posts[0];

  const { data: relatedPosts = [] } = useQuery({
    queryKey: ['related-posts', post?.category],
    queryFn: () => base44.entities.BlogPost.filter({ category: post.category, is_published: true }, '-published_at', 4),
    enabled: !!post?.category,
  });

  const otherPosts = relatedPosts.filter(p => p.id !== post?.id).slice(0, 3);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white py-12">
        <div className="max-w-3xl mx-auto px-4">
          <Skeleton className="h-8 w-48 mb-4" />
          <Skeleton className="h-12 w-full mb-4" />
          <Skeleton className="h-6 w-64 mb-8" />
          <Skeleton className="h-80 w-full mb-8" />
          <div className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Post not found</h1>
          <Link to={createPageUrl('Blog')}>
            <Button>Back to Blog</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            to={createPageUrl('Blog')}
            className="inline-flex items-center gap-2 text-gray-300 hover:text-white mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Blog
          </Link>
          <span className="inline-block px-3 py-1 bg-white/10 text-white text-sm font-medium rounded-full mb-4 capitalize">
            {post.category?.replace('-', ' ')}
          </span>
          <h1 className="text-3xl md:text-4xl font-bold mb-6">{post.title}</h1>
          <div className="flex items-center gap-6 text-gray-300">
            <span className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              {new Date(post.published_at || post.created_date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </span>
            {post.read_time_minutes && (
              <span className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                {post.read_time_minutes} min read
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Featured Image */}
      {post.featured_image && (
        <div className="max-w-4xl mx-auto px-4 -mt-8">
          <img
            src={post.featured_image}
            alt={post.title}
            className="w-full h-64 md:h-96 object-cover rounded-xl shadow-lg"
          />
        </div>
      )}

      {/* Content */}
      <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-p:text-gray-600 prose-a:text-[#2196F3] prose-strong:text-gray-900">
          <ReactMarkdown>{post.content}</ReactMarkdown>
        </div>

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="mt-12 pt-8 border-t">
            <div className="flex items-center gap-2 flex-wrap">
              <Tag className="w-4 h-4 text-gray-400" />
              {post.tags.map((tag, i) => (
                <span
                  key={i}
                  className="px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Share */}
        <div className="mt-8 border-t pt-8">
          <SocialShare title={post.title} />
        </div>

        {/* CTA */}
        <div className="mt-12 bg-gradient-to-br from-[#2196F3] to-blue-600 rounded-2xl p-8 text-white text-center">
          <h3 className="text-2xl font-bold mb-4">Ready to Create Your Custom Signs?</h3>
          <p className="text-blue-100 mb-6">Start designing with our easy online tools</p>
          <Link to={createPageUrl('DesignTool') + '?product=vinyl-banner'}>
            <Button className="bg-white text-[#2196F3] hover:bg-gray-100">
              Start Designing Now
            </Button>
          </Link>
        </div>
      </article>

      {/* Related Posts */}
      {otherPosts.length > 0 && (
        <div className="bg-gray-50 py-12">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">Related Articles</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {otherPosts.map(relatedPost => (
                <Link
                  key={relatedPost.id}
                  to={createPageUrl('BlogPost') + `?slug=${relatedPost.slug}`}
                  className="group"
                >
                  <article className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all">
                    <div className="h-40 bg-gray-100 overflow-hidden">
                      {relatedPost.featured_image ? (
                        <img
                          src={relatedPost.featured_image}
                          alt={relatedPost.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-400 to-slate-500">
                          <span className="text-white text-3xl font-bold opacity-20">N</span>
                        </div>
                      )}
                    </div>
                    <div className="p-5">
                      <h3 className="font-bold text-gray-900 group-hover:text-[#2196F3] line-clamp-2">
                        {relatedPost.title}
                      </h3>
                      <p className="text-gray-500 text-sm mt-2 line-clamp-2">{relatedPost.excerpt}</p>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
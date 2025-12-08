import React from 'react';
import { Star, ThumbsUp, CheckCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

export default function ProductReviews({ product }) {
  const rating = product.average_rating || 4.7;
  const reviewCount = product.review_count || 1000;
  
  // Mock rating distribution
  const ratingDist = [
    { stars: 5, percentage: 78 },
    { stars: 4, percentage: 14 },
    { stars: 3, percentage: 5 },
    { stars: 2, percentage: 2 },
    { stars: 1, percentage: 1 },
  ];

  // Mock reviews
  const reviews = [
    {
      id: 1,
      author: 'John D.',
      location: 'CA',
      rating: 5,
      date: 'November 20, 2025',
      verified: true,
      title: 'Excellent quality and fast shipping!',
      content: 'The banner arrived quickly and the quality exceeded my expectations. The colors are vibrant and the material is sturdy. Will definitely order again!',
    },
    {
      id: 2,
      author: 'Sarah M.',
      location: 'TX',
      rating: 5,
      date: 'November 18, 2025',
      verified: true,
      title: 'Perfect for our grand opening',
      content: 'We ordered several banners for our store opening and they looked fantastic. The grommets are well-placed and the hem is professionally done.',
    },
    {
      id: 3,
      author: 'Michael R.',
      location: 'NY',
      rating: 4,
      date: 'November 15, 2025',
      verified: true,
      title: 'Great value for the price',
      content: 'Good quality banner at a reasonable price. The only reason for 4 stars is the shipping took a day longer than expected, but the product itself is excellent.',
    },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-6 py-5 border-b border-gray-100">
        <h2 className="text-xl font-bold text-gray-900">Customer Reviews</h2>
      </div>
      
      <div className="p-6">
        <div className="grid md:grid-cols-3 gap-8 mb-8">
          {/* Overall Rating */}
          <div className="text-center md:border-r border-gray-100 md:pr-8">
            <div className="text-5xl font-bold text-gray-900 mb-2">{rating.toFixed(1)}</div>
            <div className="flex justify-center gap-1 mb-2">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-5 h-5 ${
                    i < Math.floor(rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <p className="text-sm text-gray-500">{reviewCount.toLocaleString()} Reviews</p>
          </div>
          
          {/* Rating Distribution */}
          <div className="md:col-span-2 space-y-2">
            {ratingDist.map((item) => (
              <div key={item.stars} className="flex items-center gap-3">
                <span className="text-sm text-gray-600 w-12">{item.stars} Star</span>
                <Progress value={item.percentage} className="flex-1 h-2" />
                <span className="text-sm text-gray-500 w-10 text-right">{item.percentage}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Reviews List */}
        <div className="space-y-6">
          {reviews.map((review) => (
            <div key={review.id} className="border-b border-gray-100 pb-6 last:border-0">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-gray-900">{review.author}</span>
                    <span className="text-sm text-gray-400">({review.location})</span>
                    {review.verified && (
                      <span className="flex items-center gap-1 text-xs text-green-600">
                        <CheckCircle className="w-3 h-3" />
                        Verified Purchase
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-gray-500">{review.date}</span>
                  </div>
                </div>
              </div>
              <h4 className="font-medium text-gray-900 mb-2">{review.title}</h4>
              <p className="text-gray-600">{review.content}</p>
              <button className="flex items-center gap-2 mt-3 text-sm text-gray-500 hover:text-gray-700">
                <ThumbsUp className="w-4 h-4" />
                Helpful
              </button>
            </div>
          ))}
        </div>

        <div className="mt-6 text-center">
          <button className="text-[#2196F3] hover:underline font-medium">
            View All {reviewCount.toLocaleString()} Reviews
          </button>
        </div>
      </div>
    </div>
  );
}
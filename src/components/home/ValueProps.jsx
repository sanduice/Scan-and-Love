import React from 'react';
import { Truck, Palette, Clock, Award } from 'lucide-react';

const values = [
  {
    icon: Clock,
    title: 'Next Day Production',
    description: 'Order by 5PM EST and we\'ll have your sign completed and shipped the very next business day.'
  },
  {
    icon: Truck,
    title: 'Free Shipping over $99',
    description: 'For orders over $99 your order ships free! Excludes rigid signs over 36".'
  },
  {
    icon: Palette,
    title: 'Free Design Services',
    description: 'Our professional designers will help create the perfect sign for your needs at no extra cost.'
  },
  {
    icon: Award,
    title: 'Award Winning Service',
    description: 'Winners of numerous customer service awards, we keep you as our number one priority.'
  }
];

export default function ValueProps() {
  return (
    <section className="bg-gray-50 border-y border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {values.map((item, index) => (
            <div key={index} className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-[#8BC34A]/10 flex items-center justify-center">
                <item.icon className="w-6 h-6 text-[#8BC34A]" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">{item.title}</h3>
                <p className="text-sm text-gray-600">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
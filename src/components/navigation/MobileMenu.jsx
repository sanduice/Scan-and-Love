import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ChevronDown, ChevronRight, X } from 'lucide-react';

const MOBILE_MENU = [
  {
    title: 'Banners',
    items: [
      { name: 'Vinyl Banners', link: 'DesignTool?product=vinyl-banner', price: 'From $25' },
      { name: 'Mesh Banners', link: 'Products?category=banners', price: 'From $35' },
      { name: 'Fabric Banners', link: 'Products?category=banners', price: 'From $45' },
    ],
  },
  {
    title: 'Displays & Stands',
    items: [
      { name: 'Retractable Banners', link: 'RetractableBanner', price: 'From $114' },
      { name: 'X-Banner Stands', link: 'Products?category=displays-stands', price: 'From $45' },
      { name: 'Pop-Up Displays', link: 'Products?category=displays-stands', price: 'From $299' },
    ],
  },
  {
    title: 'Signs',
    items: [
      { name: 'Plastic Signs (PVC)', link: 'PlasticSign', price: 'From $15' },
      { name: 'Aluminum Signs', link: 'Products?category=signs', price: 'From $25' },
      { name: 'Foam Board Signs', link: 'DesignTool?product=foam-board', price: 'From $18' },
    ],
  },
  {
    title: 'Yard Signs',
    items: [
      { name: '12" x 18"', link: 'DesignTool?product=yard-sign&width=12&height=18', price: 'From $8' },
      { name: '18" x 24"', link: 'DesignTool?product=yard-sign&width=18&height=24', price: 'From $12' },
      { name: '24" x 36"', link: 'DesignTool?product=yard-sign&width=24&height=36', price: 'From $18' },
    ],
  },
  {
    title: 'Stickers',
    items: [
      { name: 'Die-Cut Stickers', link: 'StickerBuilder?type=die-cut', price: 'From $117' },
      { name: 'Kiss-Cut Stickers', link: 'StickerBuilder?type=kiss-cut', price: 'From $99' },
      { name: 'All Stickers', link: 'Stickers' },
    ],
  },
  {
    title: 'Help & Info',
    items: [
      { name: 'Contact & Support', link: 'Contact' },
      { name: 'Request a Quote', link: 'RequestQuote' },
      { name: 'Request Samples', link: 'RequestSamples' },
      { name: 'About Us', link: 'About' },
      { name: 'Blog', link: 'Blog' },
    ],
  },
];

export default function MobileMenu({ isOpen, onClose, onLogin, user }) {
  const [expandedSection, setExpandedSection] = useState(null);

  if (!isOpen) return null;

  return (
    <div className="lg:hidden fixed inset-0 z-50">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      
      {/* Menu Panel */}
      <div className="absolute inset-y-0 right-0 w-full max-w-sm bg-white shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-[#2196F3] to-[#1976D2] rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">N</span>
            </div>
            <span className="font-bold text-gray-900">NetravePrint</span>
          </div>
          <button onClick={onClose} className="p-2 text-gray-500 hover:text-gray-900">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Start Designing CTA */}
        <div className="p-4 border-b bg-gradient-to-r from-[#8BC34A] to-[#7CB342]">
          <Link
            to={createPageUrl('DesignTool') + '?product=vinyl-banner'}
            onClick={onClose}
            className="block text-center text-white font-semibold py-3 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
          >
            Start Designing Now
          </Link>
        </div>

        {/* Menu Items */}
        <div className="flex-1 overflow-y-auto">
          {MOBILE_MENU.map((section, idx) => (
            <div key={idx} className="border-b">
              <button
                onClick={() => setExpandedSection(expandedSection === idx ? null : idx)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50"
              >
                <span className="font-medium text-gray-900">{section.title}</span>
                <ChevronDown 
                  className={`w-5 h-5 text-gray-400 transition-transform ${
                    expandedSection === idx ? 'rotate-180' : ''
                  }`} 
                />
              </button>
              
              {expandedSection === idx && (
                <div className="bg-gray-50 pb-2">
                  {section.items.map((item, itemIdx) => (
                    <Link
                      key={itemIdx}
                      to={createPageUrl(item.link)}
                      onClick={onClose}
                      className="flex items-center justify-between px-6 py-3 hover:bg-gray-100"
                    >
                      <span className="text-gray-700">{item.name}</span>
                      <div className="flex items-center gap-2">
                        {item.price && (
                          <span className="text-xs text-green-600 font-medium">{item.price}</span>
                        )}
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50">
          {user ? (
            <Link
              to={createPageUrl('Account')}
              onClick={onClose}
              className="block text-center py-3 border rounded-lg text-gray-700 hover:bg-white transition-colors"
            >
              My Account
            </Link>
          ) : (
            <button
              onClick={() => { onClose(); onLogin(); }}
              className="w-full py-3 border rounded-lg text-gray-700 hover:bg-white transition-colors"
            >
              Sign In / Create Account
            </button>
          )}
          <p className="text-center text-sm text-gray-500 mt-3">
            Need help? Call 1-888-222-4929
          </p>
        </div>
      </div>
    </div>
  );
}
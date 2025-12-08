import React from 'react';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Clock, Truck, Shield, Tag, ChevronDown, Check } from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

export default function PricingBreakdown({ pricing, options, quantity, width, height }) {
  const [showBreakdown, setShowBreakdown] = React.useState(true);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 text-white p-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-slate-300 text-sm">Your Price</span>
          <span className="text-[#8BC34A] text-sm font-medium">
            ${pricing.unitPrice}/ea
          </span>
        </div>
        <div className="text-4xl font-bold">${pricing.total.toFixed(2)}</div>
        {quantity > 1 && (
          <div className="text-slate-400 text-sm mt-1">
            for {quantity} banners
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 border-b">
        <div className="p-4 text-center border-r">
          <div className="text-lg font-semibold text-gray-900">{width}"</div>
          <div className="text-xs text-gray-500">Width</div>
        </div>
        <div className="p-4 text-center border-r">
          <div className="text-lg font-semibold text-gray-900">{height}"</div>
          <div className="text-xs text-gray-500">Height</div>
        </div>
        <div className="p-4 text-center">
          <div className="text-lg font-semibold text-gray-900">{pricing.sqft}</div>
          <div className="text-xs text-gray-500">Sq Ft</div>
        </div>
      </div>

      {/* Price Breakdown */}
      <Collapsible open={showBreakdown} onOpenChange={setShowBreakdown}>
        <CollapsibleTrigger className="w-full px-6 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors border-b">
          <span className="text-sm font-medium text-gray-700">Price Breakdown</span>
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showBreakdown ? 'rotate-180' : ''}`} />
        </CollapsibleTrigger>
        <CollapsibleContent className="px-6 py-4 space-y-3 border-b bg-gray-50">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">
              {options.material} ({pricing.sqft} sq ft × ${pricing.pricePerSqFt}/sqft × {quantity})
            </span>
            <span className="font-medium">${pricing.baseTotal.toFixed(2)}</span>
          </div>
          
          {pricing.modifiers.printSides > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Double Sided (+50%)</span>
              <span className="font-medium">+${pricing.modifiers.printSides.toFixed(2)}</span>
            </div>
          )}
          
          {pricing.modifiers.finish > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Sewn Hem</span>
              <span className="font-medium">+${pricing.modifiers.finish.toFixed(2)}</span>
            </div>
          )}
          
          {pricing.modifiers.grommets > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Extra Grommets</span>
              <span className="font-medium">+${pricing.modifiers.grommets.toFixed(2)}</span>
            </div>
          )}
          
          {pricing.modifiers.polePockets > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Pole Pockets</span>
              <span className="font-medium">+${pricing.modifiers.polePockets.toFixed(2)}</span>
            </div>
          )}
          
          {pricing.modifiers.accessory > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">{options.accessory}</span>
              <span className="font-medium">+${pricing.modifiers.accessory.toFixed(2)}</span>
            </div>
          )}
          
          <div className="pt-2 border-t flex justify-between text-sm">
            <span className="text-gray-600">Subtotal</span>
            <span className="font-medium">${pricing.subtotal.toFixed(2)}</span>
          </div>
          
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Shipping</span>
            <span className={`font-medium ${pricing.shipping === 0 ? 'text-[#8BC34A]' : ''}`}>
              {pricing.shipping === 0 ? 'FREE' : `$${pricing.shipping.toFixed(2)}`}
            </span>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Selected Options Summary */}
      <div className="px-6 py-4 border-b">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Your Selections</h4>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-[#8BC34A]" />
            <span className="text-gray-600">{options.material}</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-[#8BC34A]" />
            <span className="text-gray-600">{options.printSides}</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-[#8BC34A]" />
            <span className="text-gray-600">{options.finish}</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-[#8BC34A]" />
            <span className="text-gray-600">Grommets: {options.grommets}</span>
          </div>
          {options.polePockets !== 'None' && (
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-[#8BC34A]" />
              <span className="text-gray-600">{options.polePockets}</span>
            </div>
          )}
        </div>
      </div>

      {/* CTA */}
      <div className="p-6">
        <Button className="w-full h-14 bg-[#8BC34A] hover:bg-[#7CB342] text-white text-lg font-semibold mb-4">
          <ShoppingCart className="w-5 h-5 mr-2" />
          Add to Cart - ${pricing.total.toFixed(2)}
        </Button>
        
        {/* Benefits */}
        <div className="space-y-3">
          <div className="flex items-center gap-3 text-sm">
            <div className="w-8 h-8 rounded-full bg-[#8BC34A]/10 flex items-center justify-center">
              <Clock className="w-4 h-4 text-[#8BC34A]" />
            </div>
            <div>
              <div className="font-medium text-gray-900">Next Day Production</div>
              <div className="text-xs text-gray-500">Order by 5PM EST</div>
            </div>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
              <Truck className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <div className="font-medium text-gray-900">
                {pricing.shipping === 0 ? 'Free Shipping!' : 'Free Shipping over $99'}
              </div>
              <div className="text-xs text-gray-500">Continental US</div>
            </div>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center">
              <Shield className="w-4 h-4 text-purple-600" />
            </div>
            <div>
              <div className="font-medium text-gray-900">Quality Guarantee</div>
              <div className="text-xs text-gray-500">100% satisfaction or your money back</div>
            </div>
          </div>
        </div>
      </div>

      {/* Bulk Pricing Note */}
      {quantity < 10 && (
        <div className="px-6 pb-6">
          <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl">
            <div className="flex items-center gap-2 text-amber-800">
              <Tag className="w-4 h-4" />
              <span className="text-sm font-medium">Save up to 60% on bulk orders!</span>
            </div>
            <p className="text-xs text-amber-600 mt-1">Order 10+ banners for bigger discounts</p>
          </div>
        </div>
      )}
    </div>
  );
}
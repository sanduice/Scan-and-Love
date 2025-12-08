import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Mail, Calendar, Download } from 'lucide-react';

export default function PressRoom() {
  return (
    <div className="min-h-screen bg-white">
      <div className="bg-slate-900 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold mb-4">Press Room</h1>
          <p className="text-xl text-slate-300">Latest news and announcements from Netrave Print</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid gap-12">
          
          {/* Press Release Item */}
          <article className="border-b pb-12">
            <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                December 2, 2025
              </span>
              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">Press Release</span>
            </div>
            
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">
              Best Name Badge Disrupts Industry with Factory Direct Pricing
            </h2>
            
            <div className="prose prose-lg text-gray-600 mb-8">
              <p className="lead font-medium text-gray-900">
                COOPER CITY, FL – Netrave Print (Best Name Badge) is shaking up the custom identification market by offering factory-direct pricing on premium name badges, challenging established competitors with a promise of higher quality at a fraction of the cost.
              </p>
              <p>
                By leveraging advanced digital printing technology and streamlining the production process at their Florida facility, Netrave Print has eliminated the middlemen markups typical in the promotional products industry. This allows businesses of all sizes—from local cafes to national corporations—to access professional-grade name badges without breaking the budget.
              </p>
              <p>
                "We saw a gap in the market where businesses were overpaying for simple identification products," said the CEO of Netrave Print. "Our goal is to democratize access to professional branding. Whether you need one badge or one thousand, you get the same factory-direct attention and pricing."
              </p>
            </div>

            <div className="flex gap-4">
              <Link to={createPageUrl('BlogPost') + '?slug=best-name-badge-disrupts-industry'}>
                <Button variant="outline">Read Full Release</Button>
              </Link>
              <Button variant="ghost" className="text-gray-500">
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </Button>
            </div>
          </article>

          {/* Media Contact */}
          <div className="bg-gray-50 rounded-xl p-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Media Contact</h3>
            <div className="flex items-start gap-4">
              <div className="p-3 bg-white rounded-full shadow-sm">
                <Mail className="w-6 h-6 text-[#2196F3]" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Press Relations</p>
                <p className="text-gray-600 mb-2">For all media inquiries, please contact:</p>
                <a href="mailto:press@netraveprint.com" className="text-[#2196F3] font-medium hover:underline">
                  press@netraveprint.com
                </a>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
import React from 'react';
import { ExternalLink } from 'lucide-react';

export default function NetworkBar() {
  return (
    <div className="bg-slate-950 text-white border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-8 text-xs font-medium">
          <span className="text-slate-400 mr-4 hidden sm:inline">Our Brands:</span>
          
          <a 
            href="https://www.namebadge.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center px-3 h-full text-slate-400 hover:text-white hover:bg-slate-900 transition-colors gap-1"
          >
            NameBadge.com
            <ExternalLink className="w-3 h-3 opacity-50" />
          </a>

          <a 
            href="https://www.stickerine.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center px-3 h-full text-slate-400 hover:text-white hover:bg-slate-900 transition-colors gap-1"
          >
            Stickerine.com
            <ExternalLink className="w-3 h-3 opacity-50" />
          </a>
          
          <div className="flex items-center px-3 h-full bg-[#2196F3] text-white relative">
            Netrave Print
            {/* Active Tab Indicator */}
            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-white"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
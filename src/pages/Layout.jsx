import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/hooks/useSupabaseData';
import { 
  Search, ShoppingCart, User, Menu, X, Phone, ChevronDown,
  LogIn, Palette, FileText, LogOut
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Toaster, toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import MobileMenu from '@/components/navigation/MobileMenu';
import NetworkBar from '@/components/navigation/NetworkBar';
import MegaMenu from '@/components/navigation/MegaMenu';
import nbLogo from '@/assets/nb_logo.svg';

export default function Layout({ children, currentPageName }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const navigate = useNavigate();
  
  const { user, loading: isLoadingUser, signOut } = useAuth();
  const { data: cartItems = [] } = useCart();

  const cartCount = cartItems.length;

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast.error('Error signing out');
    } else {
      toast.success('Signed out successfully');
      navigate(createPageUrl('Home'));
    }
  };

  const handleLogin = () => {
    navigate(createPageUrl('Auth'));
  };

  // Don't show layout on design tool pages
  if (currentPageName === 'DesignTool' || currentPageName === 'NameBadgeDesigner' || currentPageName === 'NameBadgeNames') {
    return (
      <>
        <Toaster position="top-right" richColors />
        {children}
      </>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Toaster position="top-right" richColors />
      
      {/* Network Bar */}
      <NetworkBar />
      
      {/* Top Bar */}
      <div className="bg-slate-900 text-white text-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex justify-between items-center">
          <div className="flex items-center gap-6">
            <span className="text-[#8BC34A] font-medium">Free Shipping on Orders $100+</span>
            <span className="hidden sm:inline text-slate-400">•</span>
            <span className="hidden sm:inline text-slate-300">Next Day Production</span>
          </div>
          <div className="flex items-center gap-4">
            <a href="tel:1-800-243-9227" className="flex items-center gap-2 hover:text-[#8BC34A] transition-colors">
              <Phone className="w-4 h-4" />
              <span className="hidden sm:inline">1-800-243-9227</span>
            </a>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <header className="bg-background border-b border-border sticky top-0 z-50">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="flex items-center justify-between h-16 md:h-20 gap-4">
            {/* Logo */}
            <Link to={createPageUrl('Home')} className="flex items-center flex-shrink-0 min-w-max">
              <img src={nbLogo} alt="NetravePrint Logo" className="h-8 md:h-10 w-auto" />
            </Link>

            {/* Wider Search Bar for Desktop */}
            <div className="hidden lg:block relative flex-1 max-w-xl">
              <Input
                placeholder="Search products..."
                className="w-full pl-10 h-10 bg-muted border-border focus:bg-background text-sm rounded-full"
              />
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-2 md:gap-4">
              {/* Mobile Search Toggle */}
              <button 
                className="lg:hidden p-2 text-muted-foreground hover:text-foreground"
                onClick={() => setSearchOpen(!searchOpen)}
              >
                <Search className="w-5 h-5" />
              </button>

              {/* Design Button - Compact */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="hidden md:flex px-4 py-2 text-sm font-medium text-white bg-[#8BC34A] hover:bg-[#7CB342] rounded-full transition-colors items-center gap-1 outline-none shadow-sm whitespace-nowrap">
                    <Palette className="w-4 h-4" />
                    <span>Design Now</span>
                    <ChevronDown className="w-3 h-3 ml-1 text-white/70" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end">
                  <DropdownMenuLabel>Select Product to Design</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>Banners</DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                      <DropdownMenuItem>
                        <Link to={createPageUrl('ProductDetail') + '?slug=vinyl-banner'} className="w-full">Vinyl Banners</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Link to={createPageUrl('ProductDetail') + '?slug=retractable-banner'} className="w-full">Retractable Banners</Link>
                      </DropdownMenuItem>
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                  
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>Signs</DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                      <DropdownMenuItem>
                        <Link to={createPageUrl('ProductDetail') + '?slug=yard-sign'} className="w-full">Yard Signs</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Link to={createPageUrl('ProductDetail') + '?slug=aluminum-sign'} className="w-full">Aluminum Signs</Link>
                      </DropdownMenuItem>
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>

                  <DropdownMenuItem>
                    <Link to={createPageUrl('DesignTool') + '?product=vinyl-banner'} className="w-full font-medium text-green-600">Open Blank Canvas</Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Account */}
              {isLoadingUser ? (
                <div className="w-9 h-9 rounded-full bg-muted animate-pulse" />
              ) : user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-full">
                      <div className="w-8 h-8 rounded-full bg-[#2196F3] flex items-center justify-center text-white text-sm font-medium">
                        {user.email?.charAt(0).toUpperCase() || 'U'}
                      </div>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuLabel className="font-normal">
                      <p className="text-sm font-medium">{user.email}</p>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to={createPageUrl('Account')} className="w-full cursor-pointer">
                        <User className="w-4 h-4 mr-2" />
                        My Account
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to={createPageUrl('Admin')} className="w-full cursor-pointer">
                        <FileText className="w-4 h-4 mr-2" />
                        Dashboard
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive">
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={handleLogin}
                  className="hidden sm:flex"
                >
                  <LogIn className="w-4 h-4 mr-2" />
                  Sign In
                </Button>
              )}

              {/* Cart */}
              <Link to={createPageUrl('Cart')}>
                <Button variant="ghost" size="sm" className="relative rounded-full flex items-center gap-2">
                  <div className="relative">
                    <ShoppingCart className="w-5 h-5" />
                    {cartCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#8BC34A] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                        {cartCount}
                      </span>
                    )}
                  </div>
                  <span className="hidden md:inline font-medium">Cart</span>
                </Button>
              </Link>

              {/* Mobile Menu Toggle */}
              <button
                className="lg:hidden p-2 text-muted-foreground hover:text-foreground"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                <Menu className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Mobile Search - Expanded */}
          {searchOpen && (
            <div className="lg:hidden pb-4 border-t pt-4 mt-2">
              <Input
                placeholder="Search products..."
                className="w-full h-10 bg-muted"
                autoFocus
              />
            </div>
          )}

          {/* MegaMenu Navigation - Inside container for alignment */}
          <MegaMenu />
        </div>
      </header>


      {/* Mobile Menu */}
      <MobileMenu 
        isOpen={mobileMenuOpen} 
        onClose={() => setMobileMenuOpen(false)}
        onLogin={handleLogin}
        user={user}
      />

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 bg-[#2196F3] rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xl">N</span>
                </div>
                <div>
                  <span className="text-lg font-bold text-white">Netrave</span>
                  <span className="text-lg font-bold text-[#2196F3]">Print</span>
                </div>
              </div>
              <p className="text-slate-400 text-sm mb-4">
                Professional custom signs & banners for businesses nationwide.
              </p>
              <div className="text-slate-400 text-xs space-y-1">
                <p>12240 SW 53rd St, Suite 511</p>
                <p>Cooper City, FL 33330</p>
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-4">Products</h3>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li><Link to={createPageUrl('DesignTool') + '?product=vinyl-banner'} className="hover:text-white transition-colors">Vinyl Banners</Link></li>
                <li><Link to={createPageUrl('RetractableBanner')} className="hover:text-white transition-colors">Retractable Banners</Link></li>
                <li><Link to={createPageUrl('DesignTool') + '?product=yard-sign'} className="hover:text-white transition-colors">Yard Signs</Link></li>
                <li><Link to={createPageUrl('Stickers')} className="hover:text-white transition-colors">Stickers</Link></li>
                <li><Link to={createPageUrl('NameBadgeDesigner')} className="hover:text-white transition-colors">Name Badges</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-4">Company</h3>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li><Link to={createPageUrl('Blog')} className="hover:text-white transition-colors">Blog</Link></li>
                <li><Link to={createPageUrl('PressRoom')} className="hover:text-white transition-colors">Press Room</Link></li>
                <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
                <li><Link to={createPageUrl('RequestQuote')} className="hover:text-white transition-colors">Request Quote</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-4">Support</h3>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Shipping Info</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Returns</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-4">Contact Us</h3>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  <a href="tel:1-800-243-9227" className="hover:text-white">1-800-243-9227</a>
                </li>
                <li>support@netraveprint.com</li>
                <li className="text-xs pt-2">
                  Mon-Fri: 9AM - 8PM EST<br />
                  Sat: 10AM - 2PM EST
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-slate-500 text-sm">
            <p>&copy; {new Date().getFullYear()} NetravePrint. All rights reserved.</p>
            <div className="flex gap-6">
              <a href="#" className="hover:text-white">Privacy Policy</a>
              <a href="#" className="hover:text-white">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

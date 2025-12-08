import Layout from "./Layout.jsx";

import Products from "./Products";

import ProductDetail from "./ProductDetail";

import Cart from "./Cart";

import BannerBuilder from "./BannerBuilder";

import DesignTool from "./DesignTool";

import Account from "./Account";

import Admin from "./Admin";

import Home from "./Home";

import Stickers from "./Stickers";

import StickerBuilder from "./StickerBuilder";

import ProofApproval from "./ProofApproval";

import AllProducts from "./AllProducts";

import RequestQuote from "./RequestQuote";

import RetractableBanner from "./RetractableBanner";

import PlasticSign from "./PlasticSign";

import Blog from "./Blog";

import BlogPost from "./BlogPost";

import Scraper from "./Scraper";

import PressRoom from "./PressRoom";

import NameBadgeNames from "./NameBadgeNames";

import NameBadgeDesigner from "./NameBadgeDesigner";

import CleanupDuplicates from "./CleanupDuplicates";

import RequestSamples from "./RequestSamples";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

const PAGES = {
    
    Products: Products,
    
    ProductDetail: ProductDetail,
    
    Cart: Cart,
    
    BannerBuilder: BannerBuilder,
    
    DesignTool: DesignTool,
    
    Account: Account,
    
    Admin: Admin,
    
    Home: Home,
    
    Stickers: Stickers,
    
    StickerBuilder: StickerBuilder,
    
    ProofApproval: ProofApproval,
    
    AllProducts: AllProducts,
    
    RequestQuote: RequestQuote,
    
    RetractableBanner: RetractableBanner,
    
    PlasticSign: PlasticSign,
    
    Blog: Blog,
    
    BlogPost: BlogPost,
    
    Scraper: Scraper,
    
    PressRoom: PressRoom,
    
    NameBadgeNames: NameBadgeNames,
    
    NameBadgeDesigner: NameBadgeDesigner,
    
    CleanupDuplicates: CleanupDuplicates,
    
    RequestSamples: RequestSamples,
    
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    return (
        <Layout currentPageName={currentPage}>
            <Routes>            
                
                    <Route path="/" element={<Products />} />
                
                
                <Route path="/Products" element={<Products />} />
                
                <Route path="/ProductDetail" element={<ProductDetail />} />
                
                <Route path="/Cart" element={<Cart />} />
                
                <Route path="/BannerBuilder" element={<BannerBuilder />} />
                
                <Route path="/DesignTool" element={<DesignTool />} />
                
                <Route path="/Account" element={<Account />} />
                
                <Route path="/Admin" element={<Admin />} />
                
                <Route path="/Home" element={<Home />} />
                
                <Route path="/Stickers" element={<Stickers />} />
                
                <Route path="/StickerBuilder" element={<StickerBuilder />} />
                
                <Route path="/ProofApproval" element={<ProofApproval />} />
                
                <Route path="/AllProducts" element={<AllProducts />} />
                
                <Route path="/RequestQuote" element={<RequestQuote />} />
                
                <Route path="/RetractableBanner" element={<RetractableBanner />} />
                
                <Route path="/PlasticSign" element={<PlasticSign />} />
                
                <Route path="/Blog" element={<Blog />} />
                
                <Route path="/BlogPost" element={<BlogPost />} />
                
                <Route path="/Scraper" element={<Scraper />} />
                
                <Route path="/PressRoom" element={<PressRoom />} />
                
                <Route path="/NameBadgeNames" element={<NameBadgeNames />} />
                
                <Route path="/NameBadgeDesigner" element={<NameBadgeDesigner />} />
                
                <Route path="/CleanupDuplicates" element={<CleanupDuplicates />} />
                
                <Route path="/RequestSamples" element={<RequestSamples />} />
                
            </Routes>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}
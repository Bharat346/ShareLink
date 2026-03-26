import { Share2 } from 'lucide-react';

export default function NavigationComponent() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/60 backdrop-blur-3xl border-b border-white/5">
      <div className="max-w-[1100px] mx-auto px-6 py-4 flex items-center justify-between relative">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(37,99,235,0.4)]">
             <Share2 className="text-white w-5 h-5 stroke-[2.5]" />
          </div>
          <span className="text-xl font-black tracking-tight text-white uppercase italic">Share Link</span>
        </div>
        
        <div className="absolute right-6 hidden md:flex items-center gap-6">
          <button className="bg-white text-black px-6 py-2 rounded-full text-xs font-bold hover:bg-gray-200 transition-all">
            Documentation
          </button>
          <button className="bg-white text-black px-6 py-2 rounded-full text-xs font-bold hover:bg-gray-200 transition-all">
            Get Started →
          </button>
        </div>
      </div>
    </nav>
  );
}

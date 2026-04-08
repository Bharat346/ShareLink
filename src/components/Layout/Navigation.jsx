"use client";

import { useState } from "react";
import { Terminal, Menu, X, Activity, Shield } from "lucide-react";
import Link from "next/link";

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-[100] glass border-b border-accent-primary/10">
        <div className="container flex items-center justify-between h-14 sm:h-16">
          <Link href="/" className="flex items-center gap-3 group">
            {/* <div className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center bg-accent-primary/10 border border-accent-primary/20 rounded-sm group-hover:border-accent-primary transition-all shadow-[0_0_15px_var(--accent-primary-glow)]"> */}
              <Terminal className="w-4 h-4 sm:w-5 sm:h-5 text-accent-primary" />
            {/* </div> */}
            <div className="flex flex-col">
              <span className="text-sm sm:text-base font-black tracking-tight text-white uppercase leading-none">
                SHARE<span className="text-accent-primary">_LINK</span>
              </span>
              <span className="hidden xs:inline text-[8px] sm:text-[9px] text-accent-primary/40 font-bold uppercase tracking-[0.15em]">P2P_TUNNEL</span>
            </div>
          </Link>

          <div className="flex items-center gap-3 sm:gap-6">
            
            <div className="hidden sm:flex items-center gap-4 md:gap-6">
              <Link href="/security" className="text-[10px] sm:text-xs font-bold text-text-muted hover:text-accent-primary transition-colors uppercase tracking-[0.15em] whitespace-nowrap">
                _Security
              </Link>
              <Link href="/docs" className="text-[10px] sm:text-xs font-bold text-text-muted hover:text-accent-primary transition-colors uppercase tracking-[0.15em] whitespace-nowrap">
                _Docs
              </Link>
            </div>

            <button
              onClick={() => setIsOpen(!isOpen)}
              className="sm:hidden w-10 h-10 flex items-center justify-center glass rounded-sm border border-accent-primary/20 hover:border-accent-primary transition-all"
            >
              {isOpen ? (
                <X className="w-5 h-5 text-accent-primary" />
              ) : (
                <Menu className="w-5 h-5 text-accent-primary" />
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <div className={`fixed inset-0 z-[99] transition-all duration-300 ${isOpen ? 'visible' : 'invisible'}`}>
        <div 
          className={`absolute inset-0 bg-bg-base/95 backdrop-blur-xl transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}
          onClick={() => setIsOpen(false)}
        />
        <div className={`absolute top-0 right-0 w-full max-w-sm h-full glass border-l border-accent-primary/10 transition-transform duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="p-6 border-b border-accent-primary/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-accent-primary" />
              <span className="text-sm font-bold text-accent-primary uppercase tracking-widest">Menu</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="w-10 h-10 flex items-center justify-center glass rounded-sm border border-accent-primary/20"
            >
              <X className="w-5 h-5 text-accent-primary" />
            </button>
          </div>
          
          <div className="p-6 space-y-4">
            <Link 
              href="/" 
              className="block py-3 px-4 glass rounded-sm border border-accent-primary/10 hover:border-accent-primary transition-all"
              onClick={() => setIsOpen(false)}
            >
              <span className="text-xs font-bold text-accent-primary uppercase tracking-widest">_Home</span>
            </Link>
            <Link 
              href="/security" 
              className="block py-3 px-4 glass rounded-sm border border-accent-primary/10 hover:border-accent-primary transition-all"
              onClick={() => setIsOpen(false)}
            >
              <span className="text-xs font-bold text-accent-primary uppercase tracking-widest">_Security</span>
            </Link>
            <Link 
              href="/docs" 
              className="block py-3 px-4 glass rounded-sm border border-accent-primary/10 hover:border-accent-primary transition-all"
              onClick={() => setIsOpen(false)}
            >
              <span className="text-xs font-bold text-accent-primary uppercase tracking-widest">_Docs</span>
            </Link>
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-accent-primary/10">
            <div className="flex items-center justify-center gap-2 text-[9px] font-bold text-text-muted uppercase tracking-widest">
              <div className="w-2 h-2 rounded-full bg-accent-primary animate-pulse" />
              <span>System Online</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

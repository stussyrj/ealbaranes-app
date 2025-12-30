import { useState, useEffect } from "react";

export function LightPageBackground() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if ('requestIdleCallback' in window) {
      const id = requestIdleCallback(() => setIsVisible(true), { timeout: 2000 });
      return () => cancelIdleCallback(id);
    } else {
      const timer = setTimeout(() => setIsVisible(true), 100);
      return () => clearTimeout(timer);
    }
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
      {/* Light theme: Animated gradient background */}
      <div 
        className="absolute inset-0 dark:hidden animate-gradient-shift"
        style={{
          background: "linear-gradient(-45deg, #f0f9ff, #e0f2fe, #fef3c7, #fce7f3, #f0fdf4)",
          backgroundSize: "400% 400%",
        }}
      />
      
      {/* Dark theme: Subtle static gradient */}
      <div className="absolute inset-0 hidden dark:block bg-gradient-to-br from-purple-950/30 via-slate-950/20 to-orange-950/20" />
      
      {/* Light theme: Animated blobs - more visible */}
      <div
        className="absolute dark:hidden rounded-full blur-3xl opacity-40 animate-blob"
        style={{
          width: 400,
          height: 400,
          left: "10%",
          top: "10%",
          background: "linear-gradient(135deg, #93c5fd 0%, #c4b5fd 100%)",
        }}
      />
      
      <div
        className="absolute dark:hidden rounded-full blur-3xl opacity-35 animate-blob-reverse"
        style={{
          width: 350,
          height: 350,
          right: "5%",
          top: "30%",
          background: "linear-gradient(135deg, #fcd34d 0%, #fb923c 100%)",
          animationDelay: "2s",
        }}
      />
      
      <div
        className="absolute dark:hidden rounded-full blur-3xl opacity-30 animate-blob"
        style={{
          width: 300,
          height: 300,
          left: "30%",
          bottom: "10%",
          background: "linear-gradient(135deg, #86efac 0%, #67e8f9 100%)",
          animationDelay: "4s",
        }}
      />
      
      {/* Dark theme: Keep existing subtle circles (md:block for desktop only) */}
      <div
        className="absolute hidden md:dark:block rounded-full border-2 border-purple-600/50 opacity-25 animate-float-slow"
        style={{
          width: 350,
          height: 350,
          left: -175,
          top: 50,
        }}
      />

      <div
        className="absolute hidden md:dark:block rounded-full border-2 border-orange-500/50 opacity-25 animate-float-slow-reverse"
        style={{
          width: 300,
          height: 300,
          right: -150,
          bottom: 100,
        }}
      />

      <div
        className="absolute hidden dark:block rounded-full border border-purple-500/40 opacity-20 animate-pulse-slow"
        style={{
          width: 120,
          height: 120,
          left: "10%",
          top: "20%",
        }}
      />

      <div
        className="absolute hidden dark:block rounded-full border border-orange-500/40 opacity-20 animate-pulse-slow"
        style={{
          width: 100,
          height: 100,
          right: "15%",
          bottom: "25%",
          animationDelay: "0.5s",
        }}
      />
    </div>
  );
}

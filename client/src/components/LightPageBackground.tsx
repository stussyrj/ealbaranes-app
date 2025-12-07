export function LightPageBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/40 via-white/20 to-orange-50/30 dark:from-purple-950/30 dark:via-slate-950/20 dark:to-orange-950/20" />
      <div 
        className="absolute hidden md:block rounded-full border-2 border-blue-300 dark:border-purple-600/50 opacity-20 dark:opacity-25"
        style={{ width: 350, height: 350, left: -175, top: 50 }}
      />
      <div 
        className="absolute hidden md:block rounded-full border-2 border-orange-300 dark:border-orange-500/50 opacity-20 dark:opacity-25"
        style={{ width: 300, height: 300, right: -150, bottom: 100 }}
      />
      <div 
        className="absolute rounded-full border border-blue-300/50 dark:border-purple-500/40 opacity-20 dark:opacity-20"
        style={{ width: 120, height: 120, left: "10%", top: "20%" }}
      />
      <div 
        className="absolute rounded-full border border-orange-300/50 dark:border-orange-500/40 opacity-20 dark:opacity-20"
        style={{ width: 100, height: 100, right: "15%", bottom: "25%" }}
      />
    </div>
  );
}

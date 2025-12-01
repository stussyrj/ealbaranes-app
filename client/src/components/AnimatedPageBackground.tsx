import { motion } from "framer-motion";

export function AnimatedPageBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
      {/* Main gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/40 via-white/20 to-orange-50/30 dark:from-blue-950/20 dark:via-slate-950/10 dark:to-orange-950/20" />
      
      {/* Large left circle - hidden on mobile, visible on desktop */}
      <motion.div
        className="absolute hidden md:block rounded-full border-2 border-blue-300 dark:border-blue-800/50 opacity-20 dark:opacity-15"
        style={{
          width: 350,
          height: 350,
          left: -175,
          top: 50,
        }}
        animate={{
          y: [0, 40, 0],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Large right circle - hidden on mobile, visible on desktop */}
      <motion.div
        className="absolute hidden md:block rounded-full border-2 border-orange-300 dark:border-orange-800/50 opacity-20 dark:opacity-15"
        style={{
          width: 300,
          height: 300,
          right: -150,
          bottom: 100,
        }}
        animate={{
          y: [0, -40, 0],
        }}
        transition={{
          duration: 22,
          delay: 1,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Small center circles visible on all sizes */}
      <motion.div
        className="absolute rounded-full border border-blue-300/50 dark:border-blue-800/30 opacity-20 dark:opacity-10"
        style={{
          width: 120,
          height: 120,
          left: "10%",
          top: "20%",
        }}
        animate={{
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <motion.div
        className="absolute rounded-full border border-orange-300/50 dark:border-orange-800/30 opacity-20 dark:opacity-10"
        style={{
          width: 100,
          height: 100,
          right: "15%",
          bottom: "25%",
        }}
        animate={{
          scale: [1, 1.15, 1],
        }}
        transition={{
          duration: 5,
          delay: 0.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Animated dots */}
      <div className="absolute inset-0">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={`dot-${i}`}
            className="absolute rounded-full bg-gradient-to-r from-blue-500 to-orange-500"
            style={{
              width: 2,
              height: 2,
              left: `${20 + i * 12}%`,
              top: `${40 + (i % 2) * 30}%`,
            }}
            animate={{
              opacity: [0.2, 0.5, 0.2],
              y: [0, 8, 0],
            }}
            transition={{
              duration: 2.5 + i * 0.2,
              delay: i * 0.15,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>
    </div>
  );
}

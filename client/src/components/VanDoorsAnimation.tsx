import { motion } from "framer-motion";

export function VanDoorsAnimation({ onComplete }: { onComplete: () => void }) {
  return (
    <div className="fixed inset-0 bg-gradient-to-b from-slate-100 to-slate-50 dark:from-slate-900 dark:to-slate-800 z-50 flex items-center justify-center overflow-hidden">
      {/* 3D Scene */}
      <div style={{ perspective: "1500px" }} className="w-full h-full flex items-center justify-center">
        <motion.div
          style={{ transformStyle: "preserve-3d" }}
          className="relative"
          initial={{ rotateX: 0 }}
          animate={{ rotateX: 0 }}
        >
          {/* Van Body Container - Rear View */}
          <div className="relative w-96 h-80">
            {/* Van Main Body */}
            <div className="absolute inset-0 bg-gradient-to-b from-slate-800 via-slate-900 to-slate-950 dark:from-slate-700 dark:via-slate-800 dark:to-slate-900 rounded-b-3xl shadow-xl"
              style={{
                clipPath: "polygon(10% 0%, 90% 0%, 100% 30%, 100% 100%, 0% 100%, 0% 30%)"
              }}
            />

            {/* Left Door */}
            <motion.div
              className="absolute left-4 top-12 w-32 h-64 bg-gradient-to-br from-slate-700 to-slate-900 dark:from-slate-600 dark:to-slate-800 rounded-lg border-2 border-slate-600 dark:border-slate-500 shadow-lg"
              style={{
                transformStyle: "preserve-3d",
                transformOrigin: "left center"
              }}
              initial={{ rotateY: 0, rotateZ: 0 }}
              animate={{ rotateY: -105, rotateZ: -5 }}
              transition={{
                duration: 1.4,
                delay: 0.3,
                ease: [0.34, 1.56, 0.64, 1]
              }}
            >
              {/* Door window */}
              <div className="absolute top-3 left-2 w-24 h-20 bg-gradient-to-br from-slate-900 to-black dark:from-black dark:to-slate-950 rounded opacity-70 border border-slate-500 dark:border-slate-600" />
              {/* Door handle */}
              <div className="absolute top-32 right-3 w-3 h-6 bg-slate-600 dark:bg-slate-500 rounded-full opacity-80 shadow-md" />
            </motion.div>

            {/* Right Door */}
            <motion.div
              className="absolute right-4 top-12 w-32 h-64 bg-gradient-to-bl from-slate-700 to-slate-900 dark:from-slate-600 dark:to-slate-800 rounded-lg border-2 border-slate-600 dark:border-slate-500 shadow-lg"
              style={{
                transformStyle: "preserve-3d",
                transformOrigin: "right center"
              }}
              initial={{ rotateY: 0, rotateZ: 0 }}
              animate={{ rotateY: 105, rotateZ: 5 }}
              transition={{
                duration: 1.4,
                delay: 0.3,
                ease: [0.34, 1.56, 0.64, 1]
              }}
            >
              {/* Door window */}
              <div className="absolute top-3 right-2 w-24 h-20 bg-gradient-to-bl from-slate-900 to-black dark:from-black dark:to-slate-950 rounded opacity-70 border border-slate-500 dark:border-slate-600" />
              {/* Door handle */}
              <div className="absolute top-32 left-3 w-3 h-6 bg-slate-600 dark:bg-slate-500 rounded-full opacity-80 shadow-md" />
            </motion.div>

            {/* Van Interior Light Glow */}
            <motion.div
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 1.2 }}
            >
              <div className="absolute w-48 h-32 bg-gradient-to-r from-amber-200 via-amber-100 to-amber-200 dark:from-amber-300 dark:via-amber-200 dark:to-amber-300 rounded-full blur-3xl opacity-15" />
            </motion.div>

            {/* Light Rays from Interior */}
            <motion.svg
              className="absolute inset-0 w-full h-full pointer-events-none"
              viewBox="0 0 384 320"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 1.3 }}
            >
              {/* Ray 1 - Left side up */}
              <line x1="80" y1="140" x2="40" y2="40" stroke="currentColor" strokeWidth="1.5" className="text-amber-300 opacity-30" />
              {/* Ray 2 - Center up */}
              <line x1="192" y1="100" x2="192" y2="20" stroke="currentColor" strokeWidth="1.5" className="text-amber-300 opacity-40" />
              {/* Ray 3 - Right side up */}
              <line x1="304" y1="140" x2="344" y2="40" stroke="currentColor" strokeWidth="1.5" className="text-amber-300 opacity-30" />
            </motion.svg>
          </div>
        </motion.div>
      </div>

      {/* Bottom Shadow Effect */}
      <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 w-96 h-4 bg-gradient-radial from-slate-400 dark:from-slate-600 to-transparent opacity-20 blur-xl rounded-full" />

      {/* Welcome Text */}
      <motion.div
        className="absolute bottom-12 text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 1.7 }}
      >
        <p className="text-slate-900 dark:text-white text-xl font-light tracking-wide">Bienvenido a DirectTransports</p>
        <p className="text-slate-600 dark:text-slate-300 text-sm mt-1">Tu solución de transporte inteligente</p>
      </motion.div>

      {/* Fade out */}
      <motion.div
        className="absolute inset-0 bg-black"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0, 1] }}
        transition={{ duration: 0.7, times: [0, 0.75, 1], delay: 2.4 }}
        onAnimationComplete={onComplete}
      />
    </div>
  );
}

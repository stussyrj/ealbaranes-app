import { motion } from "framer-motion";

export function VanDoorsAnimation({ onComplete }: { onComplete: () => void }) {
  return (
    <div className="fixed inset-0 bg-gradient-to-b from-slate-900 to-slate-800 dark:from-slate-950 dark:to-slate-900 z-50 flex items-center justify-center overflow-hidden">
      {/* 3D Perspective Container */}
      <motion.div
        style={{ perspective: "1200px" }}
        className="relative w-96 h-96"
      >
        {/* Van Body - Main Container */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          style={{ transformStyle: "preserve-3d" }}
        >
          {/* Van cargo area background */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-slate-700 to-slate-600 dark:from-slate-800 dark:to-slate-700 rounded-lg"
            style={{ transformStyle: "preserve-3d" }}
            initial={{ opacity: 0.3 }}
            animate={{ opacity: 0.5 }}
            transition={{ duration: 1.5 }}
          />

          {/* Left Door */}
          <motion.div
            className="absolute left-0 top-1/2 w-1/2 h-3/4 bg-gradient-to-br from-slate-600 to-slate-700 dark:from-slate-700 dark:to-slate-800 origin-left rounded-l-lg border border-slate-500 dark:border-slate-600"
            style={{ transformStyle: "preserve-3d" }}
            initial={{ rotateY: 0 }}
            animate={{ rotateY: -120 }}
            transition={{ duration: 1.2, delay: 0.2, ease: "easeInOut" }}
          >
            {/* Door detail line */}
            <div className="absolute top-1/4 left-1/2 w-0.5 h-1/2 bg-slate-500 dark:bg-slate-500 opacity-40" />
          </motion.div>

          {/* Right Door */}
          <motion.div
            className="absolute right-0 top-1/2 w-1/2 h-3/4 bg-gradient-to-bl from-slate-600 to-slate-700 dark:from-slate-700 dark:to-slate-800 origin-right rounded-r-lg border border-slate-500 dark:border-slate-600"
            style={{ transformStyle: "preserve-3d" }}
            initial={{ rotateY: 0 }}
            animate={{ rotateY: 120 }}
            transition={{ duration: 1.2, delay: 0.2, ease: "easeInOut" }}
          >
            {/* Door detail line */}
            <div className="absolute top-1/4 right-1/2 w-0.5 h-1/2 bg-slate-500 dark:bg-slate-500 opacity-40" />
          </motion.div>

          {/* Inner cabin light glow */}
          <motion.div
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 1 }}
          >
            <div className="w-40 h-40 bg-amber-200 dark:bg-amber-300 rounded-full blur-3xl opacity-20" />
          </motion.div>

          {/* Light rays */}
          <motion.div
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 1.1 }}
          >
            <svg className="w-48 h-48" viewBox="0 0 200 200">
              {/* Ray 1 */}
              <line x1="100" y1="50" x2="100" y2="10" stroke="currentColor" strokeWidth="1" className="text-amber-300 opacity-40" />
              {/* Ray 2 */}
              <line x1="75" y1="60" x2="50" y2="20" stroke="currentColor" strokeWidth="1" className="text-amber-300 opacity-40" />
              {/* Ray 3 */}
              <line x1="125" y1="60" x2="150" y2="20" stroke="currentColor" strokeWidth="1" className="text-amber-300 opacity-40" />
            </svg>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Welcome Text */}
      <motion.div
        className="absolute bottom-24 text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 1.4 }}
      >
        <p className="text-white text-lg font-light tracking-wide">Bienvenido a DirectTransports</p>
        <p className="text-slate-300 text-sm mt-2">Tu solución de transporte inteligente</p>
      </motion.div>

      {/* Fade out */}
      <motion.div
        className="absolute inset-0 bg-black"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0, 1] }}
        transition={{ duration: 0.6, times: [0, 0.7, 1], delay: 2.2 }}
        onAnimationComplete={onComplete}
      />
    </div>
  );
}

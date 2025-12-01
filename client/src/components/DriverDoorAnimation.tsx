import { motion } from "framer-motion";

export function DriverDoorAnimation({ onComplete }: { onComplete: () => void }) {
  return (
    <div className="fixed inset-0 bg-gradient-to-b from-slate-900 to-slate-800 dark:from-slate-950 dark:to-slate-900 z-50 flex items-center justify-center overflow-hidden">
      {/* 3D Perspective Container */}
      <motion.div
        style={{ perspective: "1200px" }}
        className="relative w-80 h-96"
      >
        {/* Van Profile - Main Container */}
        <motion.div
          className="absolute inset-0 flex items-center justify-start"
          style={{ transformStyle: "preserve-3d" }}
        >
          {/* Van driver cabin background */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-slate-700 to-slate-600 dark:from-slate-800 dark:to-slate-700 rounded-lg"
            style={{ transformStyle: "preserve-3d" }}
            initial={{ opacity: 0.3 }}
            animate={{ opacity: 0.5 }}
            transition={{ duration: 1.5 }}
          />

          {/* Driver Door */}
          <motion.div
            className="absolute left-0 top-1/2 w-1/2 h-4/5 bg-gradient-to-br from-slate-600 to-slate-700 dark:from-slate-700 dark:to-slate-800 origin-left rounded-l-lg border border-slate-500 dark:border-slate-600"
            style={{ transformStyle: "preserve-3d" }}
            initial={{ rotateY: 0 }}
            animate={{ rotateY: -130 }}
            transition={{ duration: 1.3, delay: 0.3, ease: "easeInOut" }}
          >
            {/* Door window */}
            <div className="absolute top-1/4 left-1/3 w-1/3 h-1/2 bg-gradient-to-br from-slate-500 to-slate-600 dark:from-slate-600 dark:to-slate-700 rounded opacity-60" />
            {/* Door handle */}
            <div className="absolute top-1/2 right-1/4 w-2 h-4 bg-slate-400 dark:bg-slate-500 rounded-full opacity-70" />
          </motion.div>

          {/* Van body */}
          <motion.div
            className="absolute right-0 w-1/2 h-4/5 bg-gradient-to-l from-slate-600 to-slate-700 dark:from-slate-700 dark:to-slate-800 rounded-r-lg border border-slate-500 dark:border-slate-600"
            style={{ transformStyle: "preserve-3d" }}
            initial={{ opacity: 0.6 }}
            animate={{ opacity: 0.7 }}
            transition={{ duration: 1.5 }}
          />

          {/* Inner cabin light glow */}
          <motion.div
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 1 }}
          >
            <div className="w-32 h-32 bg-amber-200 dark:bg-amber-300 rounded-full blur-3xl opacity-20 ml-12" />
          </motion.div>

          {/* Light rays from cabin */}
          <motion.div
            className="absolute inset-0 flex items-center justify-start pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 1.1 }}
          >
            <svg className="w-56 h-48 ml-4" viewBox="0 0 280 240">
              {/* Ray 1 - up */}
              <line x1="60" y1="100" x2="40" y2="30" stroke="currentColor" strokeWidth="1" className="text-amber-300 opacity-40" />
              {/* Ray 2 - middle */}
              <line x1="60" y1="120" x2="20" y2="120" stroke="currentColor" strokeWidth="1" className="text-amber-300 opacity-40" />
              {/* Ray 3 - down */}
              <line x1="60" y1="140" x2="40" y2="210" stroke="currentColor" strokeWidth="1" className="text-amber-300 opacity-40" />
            </svg>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Admin Text */}
      <motion.div
        className="absolute bottom-24 text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 1.5 }}
      >
        <p className="text-white text-lg font-light tracking-wide">Panel de Control</p>
        <p className="text-slate-300 text-sm mt-2">Gestión inteligente de transporte</p>
      </motion.div>

      {/* Fade out */}
      <motion.div
        className="absolute inset-0 bg-black"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0, 1] }}
        transition={{ duration: 0.6, times: [0, 0.7, 1], delay: 2.3 }}
        onAnimationComplete={onComplete}
      />
    </div>
  );
}

import { motion } from "framer-motion";

export function VanDoorsAnimation({ onComplete }: { onComplete: () => void }) {
  return (
    <div className="fixed inset-0 bg-gradient-to-b from-slate-50 via-slate-100 to-slate-200 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 z-50 flex items-center justify-center overflow-hidden">
      {/* Minimal clean welcome animation */}
      <motion.div
        className="flex flex-col items-center justify-center pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        {/* Animated dots */}
        <div className="flex gap-2 mb-8">
          <motion.div
            className="w-2 h-2 rounded-full bg-slate-400 dark:bg-slate-500"
            animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
          <motion.div
            className="w-2 h-2 rounded-full bg-slate-400 dark:bg-slate-500"
            animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
          />
          <motion.div
            className="w-2 h-2 rounded-full bg-slate-400 dark:bg-slate-500"
            animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
          />
        </div>

        {/* Welcome Text */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
        >
          <h1 className="text-slate-900 dark:text-white text-4xl font-light tracking-wide">Bienvenido</h1>
          <p className="text-slate-600 dark:text-slate-300 text-sm mt-4 font-light">DirectTransports</p>
        </motion.div>
      </motion.div>

      {/* Fade to black */}
      <motion.div
        className="absolute inset-0 bg-black pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0, 1] }}
        transition={{ duration: 0.8, times: [0, 0.6, 1], delay: 3.2 }}
        onAnimationComplete={onComplete}
      />
    </div>
  );
}

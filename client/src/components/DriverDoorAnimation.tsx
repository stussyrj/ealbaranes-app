import { motion } from "framer-motion";

export function DriverDoorAnimation({ onComplete }: { onComplete: () => void }) {
  return (
    <div className="fixed inset-0 bg-black dark:bg-black z-50 flex items-center justify-center">
      <svg
        width="300"
        height="300"
        viewBox="0 0 300 300"
        className="w-80 h-80"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Van profile */}
        <rect x="40" y="100" width="220" height="120" fill="none" stroke="currentColor" strokeWidth="2" className="text-white dark:text-white" />

        {/* Driver door */}
        <motion.rect
          x="40"
          y="100"
          width="80"
          height="120"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="text-white dark:text-white"
          initial={{ rotateZ: 0, transformOrigin: "40px 100px" }}
          animate={{ rotateZ: -110 }}
          transition={{ duration: 1.2, delay: 0.3, ease: "easeInOut" }}
        />

        {/* Door handle indicator */}
        <motion.circle
          cx="70"
          cy="150"
          r="3"
          fill="currentColor"
          className="text-amber-300"
          initial={{ opacity: 0.3 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        />

        {/* Light rays */}
        <motion.line
          x1="40"
          y1="80"
          x2="20"
          y2="40"
          stroke="currentColor"
          strokeWidth="1.5"
          className="text-amber-300"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.1 }}
        />
        <motion.line
          x1="40"
          y1="160"
          x2="15"
          y2="160"
          stroke="currentColor"
          strokeWidth="1.5"
          className="text-amber-300"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.1 }}
        />
        <motion.line
          x1="40"
          y1="210"
          x2="20"
          y2="250"
          stroke="currentColor"
          strokeWidth="1.5"
          className="text-amber-300"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.1 }}
        />
      </svg>

      {/* Admin text */}
      <motion.div
        className="absolute bottom-20 text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 1.5 }}
      >
        <p className="text-white text-xl font-light tracking-wide">Panel de Control</p>
      </motion.div>

      {/* Fade out and complete */}
      <motion.div
        className="absolute inset-0 bg-black"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0 }}
        transition={{ duration: 0.5, delay: 2.5 }}
        onAnimationComplete={onComplete}
      />
    </div>
  );
}

import { motion } from "framer-motion";

export function VanDoorsAnimation({ onComplete }: { onComplete: () => void }) {
  return (
    <div className="fixed inset-0 bg-black dark:bg-black z-50 flex items-center justify-center">
      <svg
        width="300"
        height="300"
        viewBox="0 0 300 300"
        className="w-80 h-80"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Van body */}
        <rect x="50" y="120" width="200" height="100" fill="none" stroke="currentColor" strokeWidth="2" className="text-white dark:text-white" />

        {/* Left door */}
        <motion.rect
          x="50"
          y="120"
          width="100"
          height="100"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="text-white dark:text-white"
          initial={{ rotateZ: 0, transformOrigin: "50px 120px" }}
          animate={{ rotateZ: -90 }}
          transition={{ duration: 1, delay: 0.3, ease: "easeInOut" }}
        />

        {/* Right door */}
        <motion.rect
          x="150"
          y="120"
          width="100"
          height="100"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="text-white dark:text-white"
          initial={{ rotateZ: 0, transformOrigin: "250px 120px" }}
          animate={{ rotateZ: 90 }}
          transition={{ duration: 1, delay: 0.3, ease: "easeInOut" }}
        />

        {/* Light rays coming from inside */}
        <motion.line
          x1="150"
          y1="100"
          x2="150"
          y2="30"
          stroke="currentColor"
          strokeWidth="1.5"
          className="text-amber-300"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.2 }}
        />
        <motion.line
          x1="120"
          y1="100"
          x2="100"
          y2="40"
          stroke="currentColor"
          strokeWidth="1.5"
          className="text-amber-300"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.2 }}
        />
        <motion.line
          x1="180"
          y1="100"
          x2="200"
          y2="40"
          stroke="currentColor"
          strokeWidth="1.5"
          className="text-amber-300"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.2 }}
        />
      </svg>

      {/* Welcome text */}
      <motion.div
        className="absolute bottom-20 text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 1.5 }}
      >
        <p className="text-white text-xl font-light tracking-wide">Bienvenido a DirectTransports</p>
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

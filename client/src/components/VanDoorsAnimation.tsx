import { motion } from "framer-motion";

export function VanDoorsAnimation({ onComplete }: { onComplete: () => void }) {
  return (
    <div className="fixed inset-0 bg-gradient-to-b from-slate-50 via-slate-100 to-slate-200 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 z-50 flex items-center justify-center overflow-hidden">
      {/* 3D Scene with enhanced perspective */}
      <div style={{ perspective: "2000px" }} className="w-full h-full flex items-center justify-center">
        <motion.div
          style={{
            transformStyle: "preserve-3d",
            transform: "rotateX(5deg) rotateZ(0deg)"
          }}
          className="relative"
        >
          {/* Main Van SVG - Ultra Realistic */}
          <motion.svg
            width="500"
            height="420"
            viewBox="0 0 500 420"
            style={{ transformStyle: "preserve-3d" }}
            className="drop-shadow-2xl"
          >
            {/* Define gradients for realistic lighting */}
            <defs>
              <linearGradient id="vanBodyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#1a1a1a" stopOpacity="1" />
                <stop offset="40%" stopColor="#2d2d2d" stopOpacity="1" />
                <stop offset="100%" stopColor="#0f0f0f" stopOpacity="1" />
              </linearGradient>
              <linearGradient id="doorGradientLeft" x1="100%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#404040" stopOpacity="1" />
                <stop offset="50%" stopColor="#1a1a1a" stopOpacity="1" />
                <stop offset="100%" stopColor="#0a0a0a" stopOpacity="1" />
              </linearGradient>
              <linearGradient id="doorGradientRight" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#404040" stopOpacity="1" />
                <stop offset="50%" stopColor="#1a1a1a" stopOpacity="1" />
                <stop offset="100%" stopColor="#0a0a0a" stopOpacity="1" />
              </linearGradient>
              <radialGradient id="lightGlow" cx="50%" cy="30%">
                <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#fbbf24" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* Van Main Body - Rear View */}
            <g>
              {/* Main cargo body with rounded corners */}
              <path
                d="M 80 160 L 120 120 L 380 120 L 420 160 L 420 340 Q 420 370 400 375 L 100 375 Q 80 370 80 340 Z"
                fill="url(#vanBodyGradient)"
                stroke="#000000"
                strokeWidth="1.5"
                strokeOpacity="0.4"
              />

              {/* Highlight on top edge for 3D effect */}
              <path
                d="M 85 165 L 120 125 L 380 125 L 415 165"
                fill="none"
                stroke="#555555"
                strokeWidth="2"
                opacity="0.3"
              />

              {/* Left Door - Animated */}
              <motion.g
                style={{
                  transformOrigin: "85px 250px",
                  transformStyle: "preserve-3d"
                }}
                initial={{ rotateY: 0 }}
                animate={{ rotateY: -115 }}
                transition={{
                  duration: 1.6,
                  delay: 0.4,
                  ease: [0.34, 1.56, 0.64, 1]
                }}
              >
                {/* Door panel */}
                <path
                  d="M 85 160 L 130 130 L 130 340 L 85 340 Z"
                  fill="url(#doorGradientLeft)"
                  stroke="#1a1a1a"
                  strokeWidth="1.5"
                  strokeOpacity="0.6"
                />
                {/* Door window */}
                <rect x="90" y="145" width="35" height="60" fill="#1a1a1a" opacity="0.8" rx="3" />
                {/* Window highlight */}
                <rect x="90" y="145" width="35" height="60" fill="none" stroke="#555555" strokeWidth="1" rx="3" opacity="0.4" />
                {/* Door handle */}
                <circle cx="120" cy="240" r="3.5" fill="#666666" opacity="0.8" />
              </motion.g>

              {/* Right Door - Animated */}
              <motion.g
                style={{
                  transformOrigin: "415px 250px",
                  transformStyle: "preserve-3d"
                }}
                initial={{ rotateY: 0 }}
                animate={{ rotateY: 115 }}
                transition={{
                  duration: 1.6,
                  delay: 0.4,
                  ease: [0.34, 1.56, 0.64, 1]
                }}
              >
                {/* Door panel */}
                <path
                  d="M 415 160 L 370 130 L 370 340 L 415 340 Z"
                  fill="url(#doorGradientRight)"
                  stroke="#1a1a1a"
                  strokeWidth="1.5"
                  strokeOpacity="0.6"
                />
                {/* Door window */}
                <rect x="375" y="145" width="35" height="60" fill="#1a1a1a" opacity="0.8" rx="3" />
                {/* Window highlight */}
                <rect x="375" y="145" width="35" height="60" fill="none" stroke="#555555" strokeWidth="1" rx="3" opacity="0.4" />
                {/* Door handle */}
                <circle cx="380" cy="240" r="3.5" fill="#666666" opacity="0.8" />
              </motion.g>

              {/* Wheels */}
              <circle cx="140" cy="375" r="20" fill="#0a0a0a" stroke="#2a2a2a" strokeWidth="1.5" opacity="0.9" />
              <circle cx="360" cy="375" r="20" fill="#0a0a0a" stroke="#2a2a2a" strokeWidth="1.5" opacity="0.9" />
              {/* Wheel details */}
              <circle cx="140" cy="375" r="15" fill="none" stroke="#3a3a3a" strokeWidth="1" opacity="0.5" />
              <circle cx="360" cy="375" r="15" fill="none" stroke="#3a3a3a" strokeWidth="1" opacity="0.5" />

              {/* Interior light glow */}
              <motion.ellipse
                cx="250"
                cy="200"
                rx="120"
                ry="80"
                fill="url(#lightGlow)"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 1.3 }}
              />

              {/* Light rays */}
              <motion.g
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 1.4 }}
              >
                <line x1="250" y1="120" x2="250" y2="40" stroke="#fbbf24" strokeWidth="1.2" opacity="0.4" />
                <line x1="180" y1="135" x2="140" y2="50" stroke="#fbbf24" strokeWidth="1" opacity="0.3" />
                <line x1="320" y1="135" x2="360" y2="50" stroke="#fbbf24" strokeWidth="1" opacity="0.3" />
                <line x1="150" y1="200" x2="80" y2="200" stroke="#fbbf24" strokeWidth="1" opacity="0.25" />
                <line x1="350" y1="200" x2="420" y2="200" stroke="#fbbf24" strokeWidth="1" opacity="0.25" />
              </motion.g>

              {/* Bottom shadow for depth */}
              <ellipse cx="250" cy="390" rx="140" ry="15" fill="#000000" opacity="0.15" />
            </g>
          </motion.svg>
        </motion.div>
      </div>

      {/* Welcome Text with better styling */}
      <motion.div
        className="absolute bottom-16 text-center pointer-events-none"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 1.8 }}
      >
        <p className="text-slate-900 dark:text-white text-2xl font-light tracking-wider">Bienvenido a DirectTransports</p>
        <p className="text-slate-600 dark:text-slate-300 text-sm mt-2 font-light">Tu solución de transporte inteligente</p>
      </motion.div>

      {/* Fade to black */}
      <motion.div
        className="absolute inset-0 bg-black pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0, 1] }}
        transition={{ duration: 0.8, times: [0, 0.7, 1], delay: 2.5 }}
        onAnimationComplete={onComplete}
      />
    </div>
  );
}

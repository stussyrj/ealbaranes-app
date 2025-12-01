import { motion } from "framer-motion";

export function DriverDoorAnimation({ onComplete }: { onComplete: () => void }) {
  return (
    <div className="fixed inset-0 bg-gradient-to-b from-slate-50 via-slate-100 to-slate-200 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 z-50 flex items-center justify-center overflow-hidden">
      {/* 3D Scene */}
      <div style={{ perspective: "2000px" }} className="w-full h-full flex items-center justify-center">
        <motion.div
          style={{
            transformStyle: "preserve-3d",
            transform: "rotateX(5deg) rotateZ(2deg)"
          }}
          className="relative"
        >
          {/* Van Profile SVG - Ultra Realistic */}
          <motion.svg
            width="520"
            height="420"
            viewBox="0 0 520 420"
            style={{ transformStyle: "preserve-3d" }}
            className="drop-shadow-2xl"
          >
            {/* Define gradients */}
            <defs>
              <linearGradient id="vanProfileGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#1a1a1a" stopOpacity="1" />
                <stop offset="35%" stopColor="#2d2d2d" stopOpacity="1" />
                <stop offset="100%" stopColor="#0f0f0f" stopOpacity="1" />
              </linearGradient>
              <linearGradient id="cabinGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#333333" stopOpacity="1" />
                <stop offset="50%" stopColor="#1a1a1a" stopOpacity="1" />
                <stop offset="100%" stopColor="#0a0a0a" stopOpacity="1" />
              </linearGradient>
              <linearGradient id="driverDoorGradient" x1="100%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#454545" stopOpacity="1" />
                <stop offset="50%" stopColor="#1f1f1f" stopOpacity="1" />
                <stop offset="100%" stopColor="#0d0d0d" stopOpacity="1" />
              </linearGradient>
              <radialGradient id="cabinLight" cx="40%" cy="30%">
                <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#fbbf24" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* Van Profile - Side View */}
            <g>
              {/* Cabin (Rounded front) */}
              <path
                d="M 80 160 Q 40 160 40 200 L 40 320 Q 40 360 80 365 L 180 365 L 180 130 Q 150 130 120 140 Z"
                fill="url(#cabinGradient)"
                stroke="#000000"
                strokeWidth="1.5"
                strokeOpacity="0.4"
              />

              {/* Main cargo body */}
              <path
                d="M 180 130 L 480 130 L 480 340 Q 480 365 460 368 L 180 365 Z"
                fill="url(#vanProfileGradient)"
                stroke="#000000"
                strokeWidth="1.5"
                strokeOpacity="0.4"
              />

              {/* Top highlight */}
              <path
                d="M 85 165 Q 50 165 50 200 M 180 135 L 475 135"
                fill="none"
                stroke="#555555"
                strokeWidth="2"
                opacity="0.25"
              />

              {/* Driver Door - Animated */}
              <motion.g
                style={{
                  transformOrigin: "45px 250px",
                  transformStyle: "preserve-3d"
                }}
                initial={{ rotateY: 0 }}
                animate={{ rotateY: -130 }}
                transition={{
                  duration: 1.7,
                  delay: 0.4,
                  ease: [0.34, 1.56, 0.64, 1]
                }}
              >
                {/* Door panel */}
                <path
                  d="M 45 165 Q 40 165 40 200 L 40 340 Q 40 360 50 365 L 140 365 L 140 140 Q 120 135 80 145 Z"
                  fill="url(#driverDoorGradient)"
                  stroke="#1a1a1a"
                  strokeWidth="1.5"
                  strokeOpacity="0.6"
                />
                {/* Door window - larger for driver view */}
                <rect x="55" y="160" width="50" height="90" fill="#1a1a1a" opacity="0.75" rx="4" />
                {/* Window highlight */}
                <rect x="55" y="160" width="50" height="90" fill="none" stroke="#666666" strokeWidth="1" rx="4" opacity="0.3" />
                {/* Door handle */}
                <circle cx="120" cy="260" r="4" fill="#777777" opacity="0.8" />
                {/* Door frame detail */}
                <line x1="50" y1="200" x2="135" y2="200" stroke="#2a2a2a" strokeWidth="1" opacity="0.4" />
              </motion.g>

              {/* Cargo door (static) */}
              <rect x="185" y="135" width="290" height="230" fill="#2a2a2a" opacity="0.5" stroke="#1a1a1a" strokeWidth="1.5" strokeOpacity="0.5" />

              {/* Windshield on cabin */}
              <path
                d="M 65 175 Q 60 180 65 240 L 100 245"
                fill="none"
                stroke="#555555"
                strokeWidth="1"
                opacity="0.3"
              />

              {/* Front bumper */}
              <rect x="30" y="360" width="130" height="15" fill="#1a1a1a" stroke="#0a0a0a" strokeWidth="1" opacity="0.7" />

              {/* Wheels */}
              <circle cx="120" cy="375" r="22" fill="#0a0a0a" stroke="#2a2a2a" strokeWidth="1.5" opacity="0.95" />
              <circle cx="420" cy="375" r="22" fill="#0a0a0a" stroke="#2a2a2a" strokeWidth="1.5" opacity="0.95" />
              {/* Wheel rims */}
              <circle cx="120" cy="375" r="16" fill="none" stroke="#3a3a3a" strokeWidth="1.5" opacity="0.6" />
              <circle cx="420" cy="375" r="16" fill="none" stroke="#3a3a3a" strokeWidth="1.5" opacity="0.6" />

              {/* Interior light glow from cabin */}
              <motion.ellipse
                cx="100"
                cy="220"
                rx="70"
                ry="90"
                fill="url(#cabinLight)"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 1.4 }}
              />

              {/* Light rays from driver area */}
              <motion.g
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 1.5 }}
              >
                <line x1="50" y1="180" x2="15" y2="100" stroke="#fbbf24" strokeWidth="1.2" opacity="0.35" />
                <line x1="70" y1="140" x2="50" y2="60" stroke="#fbbf24" strokeWidth="1.2" opacity="0.4" />
                <line x1="80" y1="220" x2="20" y2="220" stroke="#fbbf24" strokeWidth="1" opacity="0.3" />
                <line x1="70" y1="300" x2="40" y2="380" stroke="#fbbf24" strokeWidth="1" opacity="0.25" />
              </motion.g>

              {/* Bottom shadow */}
              <ellipse cx="260" cy="395" rx="180" ry="18" fill="#000000" opacity="0.15" />
            </g>
          </motion.svg>
        </motion.div>
      </div>

      {/* Admin Text */}
      <motion.div
        className="absolute bottom-16 text-center pointer-events-none"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 1.9 }}
      >
        <p className="text-slate-900 dark:text-white text-2xl font-light tracking-wider">Panel de Control</p>
        <p className="text-slate-600 dark:text-slate-300 text-sm mt-2 font-light">Gestión inteligente de transporte</p>
      </motion.div>

      {/* Fade to black */}
      <motion.div
        className="absolute inset-0 bg-black pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0, 1] }}
        transition={{ duration: 0.8, times: [0, 0.7, 1], delay: 2.6 }}
        onAnimationComplete={onComplete}
      />
    </div>
  );
}

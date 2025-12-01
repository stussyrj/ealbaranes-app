import { motion } from "framer-motion";

export function VanDoorsAnimation({ onComplete }: { onComplete: () => void }) {
  return (
    <div className="fixed inset-0 bg-gradient-to-b from-gray-100 to-gray-200 dark:from-gray-950 dark:to-gray-900 z-50 flex items-center justify-center overflow-hidden">
      {/* 3D Scene */}
      <div style={{ perspective: "2500px" }} className="w-full h-full flex items-center justify-center">
        <motion.div
          style={{
            transformStyle: "preserve-3d",
            transform: "rotateX(8deg)"
          }}
        >
          {/* Van SVG - Ultra Realistic with proper 3D perspective */}
          <motion.svg
            width="580"
            height="480"
            viewBox="0 0 580 480"
            style={{ transformStyle: "preserve-3d" }}
            className="drop-shadow-2xl"
          >
            <defs>
              {/* Realistic metallic gradient */}
              <linearGradient id="vanMetal" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#3a3a3a" stopOpacity="1" />
                <stop offset="15%" stopColor="#2a2a2a" stopOpacity="1" />
                <stop offset="40%" stopColor="#1a1a1a" stopOpacity="1" />
                <stop offset="60%" stopColor="#0f0f0f" stopOpacity="1" />
                <stop offset="85%" stopColor="#1a1a1a" stopOpacity="1" />
                <stop offset="100%" stopColor="#0a0a0a" stopOpacity="1" />
              </linearGradient>

              {/* Left door gradient with 3D effect */}
              <linearGradient id="doorLeft3D" x1="100%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#4a4a4a" stopOpacity="1" />
                <stop offset="30%" stopColor="#2a2a2a" stopOpacity="1" />
                <stop offset="60%" stopColor="#1a1a1a" stopOpacity="1" />
                <stop offset="100%" stopColor="#0a0a0a" stopOpacity="1" />
              </linearGradient>

              {/* Right door gradient with 3D effect */}
              <linearGradient id="doorRight3D" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#4a4a4a" stopOpacity="1" />
                <stop offset="30%" stopColor="#2a2a2a" stopOpacity="1" />
                <stop offset="60%" stopColor="#1a1a1a" stopOpacity="1" />
                <stop offset="100%" stopColor="#0a0a0a" stopOpacity="1" />
              </linearGradient>

              {/* Interior glow */}
              <radialGradient id="interiorGlow" cx="50%" cy="40%">
                <stop offset="0%" stopColor="#e8d5b7" stopOpacity="0.4" />
                <stop offset="70%" stopColor="#d4c5a9" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#d4c5a9" stopOpacity="0" />
              </radialGradient>

              {/* Steel reflection */}
              <linearGradient id="steel" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="20%" stopColor="#505050" stopOpacity="0.3" />
                <stop offset="50%" stopColor="#707070" stopOpacity="0.5" />
                <stop offset="80%" stopColor="#505050" stopOpacity="0.3" />
              </linearGradient>
            </defs>

            {/* Main Van Body */}
            <g>
              {/* Cargo area - main body */}
              <path
                d="M 100 180 L 150 140 L 480 140 L 530 180 L 530 380 Q 530 410 510 415 L 120 415 Q 100 410 100 380 Z"
                fill="url(#vanMetal)"
                stroke="#0a0a0a"
                strokeWidth="2"
                strokeOpacity="0.5"
              />

              {/* Top edge highlight for 3D depth */}
              <path
                d="M 105 185 L 150 145 L 475 145 L 525 185"
                stroke="#555555"
                strokeWidth="2.5"
                fill="none"
                opacity="0.25"
              />

              {/* Side edge for perspective */}
              <path
                d="M 525 180 L 525 380 Q 525 405 510 412"
                stroke="#000000"
                strokeWidth="1.5"
                fill="none"
                opacity="0.4"
              />

              {/* Interior glow visible from rear */}
              <motion.ellipse
                cx="290"
                cy="240"
                rx="140"
                ry="100"
                fill="url(#interiorGlow)"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1, delay: 1.5 }}
              />

              {/* LEFT DOOR - Main animated element */}
              <motion.g
                style={{
                  transformOrigin: "100px 290px",
                  transformStyle: "preserve-3d"
                }}
                initial={{ rotateY: 0 }}
                animate={{ rotateY: -125 }}
                transition={{
                  duration: 1.8,
                  delay: 0.3,
                  ease: [0.34, 1.56, 0.64, 1]
                }}
              >
                {/* Door panel outer frame */}
                <rect
                  x="100"
                  y="180"
                  width="115"
                  height="200"
                  fill="url(#doorLeft3D)"
                  stroke="#0a0a0a"
                  strokeWidth="2"
                  rx="8"
                  ry="8"
                />

                {/* Door panel highlight edge */}
                <path
                  d="M 105 185 L 105 375 L 210 375 Q 210 180 115 175 Z"
                  fill="none"
                  stroke="#555555"
                  strokeWidth="1.5"
                  opacity="0.2"
                />

                {/* Door window - dark glass reflection */}
                <rect
                  x="110"
                  y="195"
                  width="45"
                  height="75"
                  fill="#0a0a0a"
                  opacity="0.8"
                  rx="4"
                  ry="4"
                />

                {/* Window frame */}
                <rect
                  x="110"
                  y="195"
                  width="45"
                  height="75"
                  fill="none"
                  stroke="#444444"
                  strokeWidth="1.5"
                  rx="4"
                  ry="4"
                  opacity="0.6"
                />

                {/* Door handle */}
                <ellipse cx="197" cy="285" rx="5.5" ry="6.5" fill="#555555" opacity="0.9" />
                <circle cx="197" cy="285" r="3" fill="#666666" opacity="0.5" />

                {/* Weatherstrip shadow */}
                <path
                  d="M 107 180 L 107 380"
                  stroke="#1a1a1a"
                  strokeWidth="1"
                  opacity="0.4"
                />

                {/* Door edge reflection */}
                <path
                  d="M 215 185 L 215 375"
                  stroke="#444444"
                  strokeWidth="1"
                  opacity="0.25"
                />
              </motion.g>

              {/* RIGHT DOOR - Main animated element */}
              <motion.g
                style={{
                  transformOrigin: "530px 290px",
                  transformStyle: "preserve-3d"
                }}
                initial={{ rotateY: 0 }}
                animate={{ rotateY: 125 }}
                transition={{
                  duration: 1.8,
                  delay: 0.3,
                  ease: [0.34, 1.56, 0.64, 1]
                }}
              >
                {/* Door panel outer frame */}
                <rect
                  x="365"
                  y="180"
                  width="115"
                  height="200"
                  fill="url(#doorRight3D)"
                  stroke="#0a0a0a"
                  strokeWidth="2"
                  rx="8"
                  ry="8"
                />

                {/* Door panel highlight edge */}
                <path
                  d="M 475 185 L 475 375 L 370 375 Q 370 180 465 175 Z"
                  fill="none"
                  stroke="#555555"
                  strokeWidth="1.5"
                  opacity="0.2"
                />

                {/* Door window - dark glass reflection */}
                <rect
                  x="425"
                  y="195"
                  width="45"
                  height="75"
                  fill="#0a0a0a"
                  opacity="0.8"
                  rx="4"
                  ry="4"
                />

                {/* Window frame */}
                <rect
                  x="425"
                  y="195"
                  width="45"
                  height="75"
                  fill="none"
                  stroke="#444444"
                  strokeWidth="1.5"
                  rx="4"
                  ry="4"
                  opacity="0.6"
                />

                {/* Door handle */}
                <ellipse cx="383" cy="285" rx="5.5" ry="6.5" fill="#555555" opacity="0.9" />
                <circle cx="383" cy="285" r="3" fill="#666666" opacity="0.5" />

                {/* Weatherstrip shadow */}
                <path
                  d="M 473 180 L 473 380"
                  stroke="#1a1a1a"
                  strokeWidth="1"
                  opacity="0.4"
                />

                {/* Door edge reflection */}
                <path
                  d="M 365 185 L 365 375"
                  stroke="#444444"
                  strokeWidth="1"
                  opacity="0.25"
                />
              </motion.g>

              {/* Light rays streaming from interior */}
              <motion.g
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.7, delay: 1.6 }}
              >
                {/* Ray 1 - top center */}
                <line x1="290" y1="140" x2="290" y2="40" stroke="#d4c5a9" strokeWidth="1.2" opacity="0.5" />
                {/* Ray 2 - top left */}
                <line x1="200" y1="155" x2="150" y2="50" stroke="#d4c5a9" strokeWidth="1" opacity="0.35" />
                {/* Ray 3 - top right */}
                <line x1="380" y1="155" x2="430" y2="50" stroke="#d4c5a9" strokeWidth="1" opacity="0.35" />
                {/* Ray 4 - side left */}
                <line x1="100" y1="250" x2="30" y2="250" stroke="#d4c5a9" strokeWidth="0.8" opacity="0.3" />
                {/* Ray 5 - side right */}
                <line x1="530" y1="250" x2="600" y2="250" stroke="#d4c5a9" strokeWidth="0.8" opacity="0.3" />
              </motion.g>

              {/* Front bumper */}
              <rect
                x="90"
                y="410"
                width="400"
                height="18"
                fill="#1a1a1a"
                stroke="#0a0a0a"
                strokeWidth="1"
                rx="2"
              />

              {/* Bumper reflection */}
              <rect
                x="90"
                y="410"
                width="400"
                height="3"
                fill="#333333"
                opacity="0.4"
                rx="1"
              />

              {/* Left wheel */}
              <circle cx="170" cy="425" r="28" fill="#0a0a0a" stroke="#3a3a3a" strokeWidth="2" opacity="0.95" />
              <circle cx="170" cy="425" r="22" fill="none" stroke="#2a2a2a" strokeWidth="2" opacity="0.7" />
              <circle cx="170" cy="425" r="12" fill="none" stroke="#3a3a3a" strokeWidth="1.5" opacity="0.5" />

              {/* Right wheel */}
              <circle cx="440" cy="425" r="28" fill="#0a0a0a" stroke="#3a3a3a" strokeWidth="2" opacity="0.95" />
              <circle cx="440" cy="425" r="22" fill="none" stroke="#2a2a2a" strokeWidth="2" opacity="0.7" />
              <circle cx="440" cy="425" r="12" fill="none" stroke="#3a3a3a" strokeWidth="1.5" opacity="0.5" />

              {/* Shadow underneath */}
              <ellipse cx="290" cy="450" rx="200" ry="25" fill="#000000" opacity="0.12" />
            </g>
          </motion.svg>
        </motion.div>
      </div>

      {/* Welcome Message */}
      <motion.div
        className="absolute bottom-20 text-center pointer-events-none"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 2 }}
      >
        <h1 className="text-gray-900 dark:text-gray-50 text-3xl font-light tracking-widest">Bienvenido a DirectTransports</h1>
        <p className="text-gray-600 dark:text-gray-300 text-sm mt-3 font-light">Tu solución inteligente de transporte de carga</p>
      </motion.div>

      {/* Fade to black */}
      <motion.div
        className="absolute inset-0 bg-black pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0, 1] }}
        transition={{ duration: 0.9, times: [0, 0.7, 1], delay: 2.8 }}
        onAnimationComplete={onComplete}
      />
    </div>
  );
}

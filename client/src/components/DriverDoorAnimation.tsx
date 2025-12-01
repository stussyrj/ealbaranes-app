import { motion } from "framer-motion";

export function DriverDoorAnimation({ onComplete }: { onComplete: () => void }) {
  // Immediately complete without showing anything
  return (
    <motion.div
      className="fixed inset-0"
      initial={{ opacity: 0 }}
      animate={{ opacity: 0 }}
      onAnimationComplete={onComplete}
    />
  );
}

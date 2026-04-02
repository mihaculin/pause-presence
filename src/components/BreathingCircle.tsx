import { motion } from 'framer-motion';

const BreathingCircle = ({ size = 120 }: { size?: number }) => {
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <motion.div
        className="absolute rounded-full bg-primary/10"
        style={{ width: size, height: size }}
        animate={{ scale: [0.6, 1, 0.6], opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute rounded-full bg-primary/20"
        style={{ width: size * 0.7, height: size * 0.7 }}
        animate={{ scale: [0.7, 1.1, 0.7], opacity: [0.4, 0.7, 0.4] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
      />
      <motion.div
        className="rounded-full bg-primary/30"
        style={{ width: size * 0.4, height: size * 0.4 }}
        animate={{ scale: [0.8, 1.2, 0.8], opacity: [0.5, 0.9, 0.5] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
      />
    </div>
  );
};

export default BreathingCircle;

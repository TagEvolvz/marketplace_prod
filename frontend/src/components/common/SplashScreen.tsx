import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import logo from '../../logo.png';

interface SplashScreenProps {
  onFinish: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onFinish();
    }, 4500); // Extended slightly to enjoy the vibe
    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <div className="fixed inset-0 z-[9999] bg-black flex items-center justify-center overflow-hidden">
      {/* Dynamic Ambient Background Glow */}
      <motion.div
        animate={{
          opacity: [0.3, 0.6, 0.3],
          scale: [1, 1.1, 1],
        }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(57,255,20,0.12)_0%,transparent_75%)]"
      />

      {/*
          The Vibe Entry:
          A smooth glide into a continuous floating (bouncing) state with a glowing pulse.
      */}
      <motion.div
        initial={{
          opacity: 0,
          scale: 0.8,
          filter: 'blur(40px) brightness(0.5)',
        }}
        animate={{
          opacity: 1,
          scale: 1,
          filter: 'blur(0px) brightness(1)',
        }}
        transition={{
          duration: 2.5,
          ease: [0.16, 1, 0.3, 1],
        }}
        className="relative z-10 w-full flex justify-center items-center px-4"
      >
        <motion.div
          animate={{
            y: [0, -20, 0], // The "Bouncing" / Floating vibe
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="relative flex items-center justify-center"
        >
          {/* Animated Glow Halo */}
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.4, 0.8, 0.4],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute inset-0 bg-brand-neon/20 rounded-full blur-[100px] -z-10"
          />

          <img
            src={logo}
            alt="FLOW"
            className="w-auto h-auto object-contain max-w-[150vw] md:max-w-[95vw] max-h-[90vh] drop-shadow-[0_0_80px_rgba(57,255,20,0.5)]"
          />
        </motion.div>
      </motion.div>

      {/* Cinematic Vignette */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_20%,rgba(0,0,0,0.95)_100%)]" />
    </div>
  );
};

export default SplashScreen;

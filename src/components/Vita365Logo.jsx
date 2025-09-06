import React from 'react';
import { motion } from 'framer-motion';

const VitaCard365Logo = ({ className }) => {
  return (
    <motion.img 
      src="https://horizons-cdn.hostinger.com/968e2ff6-489b-4213-8f79-173bd439ef43/9d85e5cd22780f208431da2afb614096.png" 
      alt="VitaCard 365 Logo" 
      className={className}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8, ease: "easeInOut" }}
    />
  );
};

export default VitaCard365Logo;
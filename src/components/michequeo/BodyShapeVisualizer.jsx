import React from 'react';
import { motion } from 'framer-motion';

const paths = {
  underweight: "M150 55 A 25 25 0 1 0 150 5 Z M150 55 L140 70 C130 100 125 150 125 250 C125 350 130 400 140 430 L145 450 L155 450 L160 430 C170 400 175 350 175 250 C175 150 170 100 160 70 Z",
  normal: "M150 55 A 25 25 0 1 0 150 5 Z M150 55 L135 70 C120 100 110 150 110 250 C110 350 120 400 135 430 L145 450 L155 450 L165 430 C180 400 190 350 190 250 C190 150 180 100 165 70 Z",
  overweight: "M150 55 A 25 25 0 1 0 150 5 Z M150 55 L130 75 C110 110 95 170 95 250 C95 330 110 390 130 435 L145 460 L155 460 L170 435 C190 390 205 330 205 250 C205 170 190 110 170 75 Z",
  obese: "M150 55 A 25 25 0 1 0 150 5 Z M150 55 L125 80 C100 120 75 190 75 270 C75 350 100 420 125 460 L145 480 L155 480 L175 460 C200 420 225 350 225 270 C225 190 200 120 175 80 Z"
};

const BodyShapeVisualizer = ({ bmi }) => {
  const getBmiPath = (bmiValue) => {
    if (bmiValue < 18.5) return paths.underweight;
    if (bmiValue < 24.9) return paths.normal;
    if (bmiValue < 29.9) return paths.overweight;
    return paths.obese;
  };

  const path = getBmiPath(bmi);

  return (
    <div className="flex justify-center items-center h-48">
      <motion.svg viewBox="0 0 300 500" className="h-full w-auto">
        <defs>
          <linearGradient id="bodyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#f06340', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#FF5A3C', stopOpacity: 0.8 }} />
          </linearGradient>
        </defs>
        <motion.path
          d={path}
          fill="url(#bodyGradient)"
          stroke="rgba(255, 255, 255, 0.3)"
          strokeWidth="2"
          initial={false}
          animate={{ d: path }}
          transition={{ duration: 0.8, type: 'spring', stiffness: 50, damping: 15 }}
        />
      </motion.svg>
    </div>
  );
};

export default BodyShapeVisualizer;
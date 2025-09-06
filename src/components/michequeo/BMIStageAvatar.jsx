import React, { useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";

/**
 * Avatar IMC con PNGs por etapa: under / normal / over / obese.
 * Props:
 *  - bmi: number
 *  - spin?: boolean (giro 3D sutil)
 *  - scan?: boolean (barra de escaneo)
 *  - height?: px
 */
export default function BMIStageAvatar({ bmi, spin = true, scan = true, height = 260 }) {
  const stage = useMemo(() => {
    if (!bmi) return "normal"; // Default stage if BMI is not provided
    if (bmi < 18.5) return "under";
    if (bmi < 25) return "normal";
    if (bmi < 30) return "over";
    return "obese";
  }, [bmi]);

  const label =
    stage === "under" ? "Bajo peso" :
    stage === "normal" ? "Normal" :
    stage === "over" ? "Sobrepeso" : "Obesidad";

  const src = `/bmi/${stage}.png`; // Path to the PNG assets
  const width = Math.round(height * 0.55); // Adjust width based on height for aspect ratio

  return (
    <div className="relative mx-auto" style={{ width, height, perspective: "1000px" }}>
      <div className={`${spin ? "animate-bmi-spin" : ""} w-full h-full`}>
        <div className="relative w-full h-full">
          <AnimatePresence mode="wait">
            <motion.img
              key={stage}
              src={src}
              alt={`Silueta ${label}`}
              title={label}
              className="w-full h-full object-contain select-none"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
              draggable={false}
            />
          </AnimatePresence>

          {scan && (
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
              <div className="absolute -top-1 h-24 w-full bg-gradient-to-b from-white/25 via-white/10 to-transparent blur-sm animate-bmi-scan" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, AlertTriangle, AlertCircle } from 'lucide-react';

const TriageResult = ({ risk, label, reasons }) => {
  const config = {
    low: {
      icon: CheckCircle,
      color: 'text-green-400',
      bgColor: 'bg-green-500/10',
      title: 'Normal',
    },
    medium: {
      icon: AlertTriangle,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/10',
      title: 'Precaución',
    },
    high: {
      icon: AlertCircle,
      color: 'text-red-400',
      bgColor: 'bg-red-500/10',
      title: 'Alerta',
    },
  };

  const currentConfig = config[risk] || config.low;
  const Icon = currentConfig.icon;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`p-4 rounded-2xl ${currentConfig.bgColor} border border-dashed ${currentConfig.color.replace('text-', 'border-')}/50`}
    >
      <div className="flex items-start space-x-4">
        <Icon className={`h-8 w-8 ${currentConfig.color} mt-1`} />
        <div>
          <h3 className={`text-lg font-bold ${currentConfig.color}`}>{currentConfig.title}: {label}</h3>
          {reasons && reasons.length > 0 && (
            <ul className="mt-2 text-sm text-white list-disc list-inside space-y-1">
              {reasons.map((reason, index) => (
                <li key={index}>{reason}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default TriageResult;
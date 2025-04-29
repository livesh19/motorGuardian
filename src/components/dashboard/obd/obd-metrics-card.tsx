'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { LucideIcon } from 'lucide-react';

interface ObdMetricsCardProps {
  title: string;
  value: string | number;
  unit?: string;
  Icon: LucideIcon;
  colorClass?: string; // e.g., 'text-green-500', 'text-red-500'
}

const ObdMetricsCard: React.FC<ObdMetricsCardProps> = ({ title, value, unit, Icon, colorClass = 'text-primary' }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      whileHover={{ scale: 1.03 }}
    >
      <Card className="shadow-md hover:shadow-lg transition-shadow duration-300 h-full">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
          <Icon className={`h-5 w-5 ${colorClass}`} />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {value}
            {unit && <span className="text-xs text-muted-foreground ml-1">{unit}</span>}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ObdMetricsCard;

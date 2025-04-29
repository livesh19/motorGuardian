'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface RiderHealthGaugeProps {
  score: number; // Score out of 100
  rideCondition: 'Urban' | 'Highway' | 'Rainy';
}

const RiderHealthGauge: React.FC<RiderHealthGaugeProps> = ({ score: initialScore, rideCondition }) => {
  // Adjust score based on condition (simple example)
  let score = initialScore;
   if (rideCondition === 'Rainy') score = Math.max(0, score - 15);
   else if (rideCondition === 'Highway') score = Math.max(0, score - 5); // Higher speeds slightly riskier
   else if (rideCondition === 'Urban') score = Math.max(0, score - 10); // More hazards

   score = Math.round(score); // Ensure integer


  const circumference = 2 * Math.PI * 45; // R = 45 (radius of the circle)
  const offset = circumference - (score / 100) * circumference;

  const getColor = (s: number) => {
    if (s > 75) return 'hsl(var(--success))'; // Green
    if (s > 40) return 'hsl(var(--chart-4))'; // Yellow
    return 'hsl(var(--destructive))'; // Red
  };

  const color = getColor(score);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.4 }}
       className="h-full"
    >
      <Card className="shadow-md h-full flex flex-col">
        <CardHeader>
          <CardTitle>Rider Health Score</CardTitle>
           <CardDescription>Overall riding safety assessment ({rideCondition})</CardDescription>
        </CardHeader>
        <CardContent className="flex-grow flex flex-col items-center justify-center">
          <div className="relative w-40 h-40">
            <svg className="w-full h-full" viewBox="0 0 100 100">
              {/* Background circle */}
              <circle
                cx="50"
                cy="50"
                r="45"
                strokeWidth="10"
                stroke="hsl(var(--muted))"
                fill="transparent"
              />
              {/* Progress circle */}
              <motion.circle
                cx="50"
                cy="50"
                r="45"
                strokeWidth="10"
                stroke={color}
                fill="transparent"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                strokeLinecap="round"
                transform="rotate(-90 50 50)"
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset: offset }}
                transition={{ duration: 1, ease: "easeInOut" }}
              />
              {/* Text in the center */}
              <text
                x="50%"
                y="50%"
                dominantBaseline="middle"
                textAnchor="middle"
                fontSize="24"
                fontWeight="bold"
                fill={color}
              >
                {score}
              </text>
               <text
                x="50%"
                y="65%"
                dominantBaseline="middle"
                textAnchor="middle"
                fontSize="10"
                fill="hsl(var(--muted-foreground))"
              >
                / 100
              </text>
            </svg>
          </div>
          <p className="mt-4 text-sm text-muted-foreground text-center px-4">
            Score based on throttle control, braking habits, and fuel efficiency.
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default RiderHealthGauge;

'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { generateSafetyTips, GenerateSafetyTipsInput, GenerateSafetyTipsOutput } from '@/ai/flows/generate-safety-tips';
import { Loader2, Lightbulb, AlertTriangle } from 'lucide-react';

interface SafetyTipsModalProps {
  isOpen: boolean;
  onClose: () => void;
  rideEvents: GenerateSafetyTipsInput['rideEvents'];
  location: { latitude: number; longitude: number };
}

const SafetyTipsModal: React.FC<SafetyTipsModalProps> = ({ isOpen, onClose, rideEvents, location }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [safetyTips, setSafetyTips] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const fetchTips = async () => {
        setIsLoading(true);
        setError(null);
        setSafetyTips([]); // Clear previous tips

        try {
          const input: GenerateSafetyTipsInput = {
            rideEvents: rideEvents,
            latitude: location.latitude,
            longitude: location.longitude,
          };
          console.log("Fetching safety tips with input:", input);
          const result: GenerateSafetyTipsOutput = await generateSafetyTips(input);
          console.log("Received safety tips:", result);

          if (result.safetyTips && result.safetyTips.length > 0) {
              setSafetyTips(result.safetyTips);
          } else {
               setSafetyTips(["No specific safety tips recommended based on recent activity. Ride safe!"]);
          }

        } catch (err) {
          console.error("Error fetching safety tips:", err);
          setError("Could not generate safety tips at this time. Please try again later.");
           setSafetyTips([]);
        } finally {
          setIsLoading(false);
        }
      };

      fetchTips();
    }
  }, [isOpen, rideEvents, location]); // Re-fetch when modal opens or data changes

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-card text-card-foreground">
        <DialogHeader>
          <DialogTitle className="flex items-center">
             <Lightbulb className="h-5 w-5 mr-2 text-yellow-400" />
            Personalized Safety Tips
            </DialogTitle>
          <DialogDescription>
            Based on your recent ride events and conditions.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 min-h-[150px]">
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center space-y-2 h-full"
              >
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Generating tips...</p>
              </motion.div>
            ) : error ? (
                 <motion.div
                    key="error"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                     className="flex flex-col items-center justify-center space-y-2 text-center h-full"
                 >
                    <AlertTriangle className="h-8 w-8 text-destructive" />
                    <p className="text-sm text-destructive">{error}</p>
                </motion.div>
            ) : (
              <motion.ul
                key="tips"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-3 list-none pl-0"
              >
                {safetyTips.map((tip, index) => (
                  <motion.li
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className="flex items-start text-sm"
                  >
                     <Lightbulb className="h-4 w-4 mr-2 mt-0.5 text-yellow-400 shrink-0" />
                     <span>{tip}</span>
                  </motion.li>
                ))}
              </motion.ul>
            )}
          </AnimatePresence>
        </div>
        <DialogFooter>
          <Button onClick={onClose} variant="outline">Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SafetyTipsModal;


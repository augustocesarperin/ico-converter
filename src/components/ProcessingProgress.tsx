import { motion, AnimatePresence } from "framer-motion";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";

import { Progress } from "@/components/ui/progress";

interface ProcessingProgressProps {
  isProcessing: boolean;
  progress: number;
  currentStep: string;
  error?: string;
}

const ProcessingProgress = ({
  isProcessing,
  progress,
  currentStep,
  error,
}: ProcessingProgressProps) => {
  if (!isProcessing && !error) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.95 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="space-y-3 rounded-lg border border-primary/10 bg-card/60 p-4 shadow-lg backdrop-blur-xl sm:p-6"
        aria-live="polite"
        role="status"
      >
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            {error ? (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
              >
                <AlertCircle className="h-5 w-5 text-red-400" />
              </motion.div>
            ) : progress === 100 ? (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
              >
                <CheckCircle className="h-5 w-5 text-orange-400" />
              </motion.div>
            ) : (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                <Loader2 className="h-5 w-5 text-primary" />
              </motion.div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <motion.p
              className="truncate text-sm font-medium text-foreground sm:text-base"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {error
                ? "Erro no processamento"
                : progress === 100
                  ? "Concluído!"
                  : "Processando..."}
            </motion.p>
            <motion.p
              className="truncate text-xs text-muted-foreground sm:text-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              {error || currentStep}
            </motion.p>
          </div>
        </div>

        {!error && (
          <motion.div
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ delay: 0.4, duration: 0.3 }}
            className="w-full"
          >
            <Progress value={progress} className="h-2 w-full bg-muted/30" />
            <motion.p
              className="mt-1 text-center text-xs text-muted-foreground"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              {progress}%
            </motion.p>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default ProcessingProgress;

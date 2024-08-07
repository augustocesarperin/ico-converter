import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { motion, AnimatePresence } from 'framer-motion';

interface ProcessingProgressProps {
  isProcessing: boolean;
  progress: number;
  currentStep: string;
  error?: string;
}

const ProcessingProgress = ({ isProcessing, progress, currentStep, error }: ProcessingProgressProps) => {
  if (!isProcessing && !error) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0, y: 10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.95 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="space-y-3 p-4 sm:p-6 bg-card/60 backdrop-blur-xl rounded-lg border border-primary/10 shadow-lg"
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
          
          <div className="flex-1 min-w-0">
            <motion.p 
              className="text-foreground font-medium text-sm sm:text-base truncate"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {error ? 'Erro no processamento' : progress === 100 ? 'Concluído!' : 'Processando...'}
            </motion.p>
            <motion.p 
              className="text-xs sm:text-sm text-muted-foreground truncate"
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
            <Progress 
              value={progress} 
              className="w-full h-2 bg-muted/30"
            />
            <motion.p 
              className="text-xs text-muted-foreground mt-1 text-center"
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

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import { ImageIcon, AlertCircle } from 'lucide-react';

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  className?: string;
  containerClassName?: string;
  fallbackSrc?: string;
  placeholderColor?: string;
}

export function OptimizedImage({
  src,
  alt,
  className,
  containerClassName,
  fallbackSrc = 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=1000&auto=format&fit=crop',
  placeholderColor = 'bg-slate-100',
  ...props
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState<string>(src);

  useEffect(() => {
    setIsLoaded(false);
    setError(false);
    setCurrentSrc(src);
  }, [src]);

  const handleLoad = () => {
    setIsLoaded(true);
  };

  const handleError = () => {
    if (currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc);
    } else {
      setError(true);
      setIsLoaded(true); // Stop showing skeleton
    }
  };

  return (
    <div className={cn("relative overflow-hidden", containerClassName)}>
      <AnimatePresence>
        {!isLoaded && !error && (
          <motion.div
            key="placeholder"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={cn(
              "absolute inset-0 z-10 flex items-center justify-center animate-pulse",
              placeholderColor
            )}
          >
            <ImageIcon className="w-8 h-8 text-slate-300" />
          </motion.div>
        )}

        {error && (
          <motion.div
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-50 text-slate-400 p-4 text-center"
          >
            <AlertCircle className="w-8 h-8 mb-2 opacity-20" />
            <span className="text-xs">Failed to load image</span>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.img
        src={currentSrc}
        alt={alt}
        loading="lazy"
        onLoad={handleLoad}
        onError={handleError}
        initial={{ opacity: 0 }}
        animate={{ opacity: isLoaded ? 1 : 0 }}
        transition={{ duration: 0.5 }}
        className={cn(
          "w-full h-full object-cover",
          className
        )}
        referrerPolicy="no-referrer"
        {...props}
      />
    </div>
  );
}

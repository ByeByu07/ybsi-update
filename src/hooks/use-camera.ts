import { useRef, useState, useCallback, useEffect } from 'react';

interface UseCameraOptions {
  facingMode?: 'user' | 'environment';
  imageQuality?: number;
  maxImages?: number;
}

interface UseCameraReturn {
  // State
  images: string[];
  isCameraOpen: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Camera controls
  startCamera: () => Promise<void>;
  stopCamera: () => void;
  captureImage: () => void;
  
  // Image management
  addImagesFromFiles: (files: FileList | null) => Promise<void>;
  removeImage: (index: number) => void;
  clearAllImages: () => void;
  
  // Refs for components
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
}

export const useCamera = (options: UseCameraOptions = {}): UseCameraReturn => {
  const {
    facingMode = 'environment',
    imageQuality = 0.8,
    maxImages = 10
  } = options;

  // State
  const [images, setImages] = useState<string[]>([]);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Start camera
  const startCamera = useCallback(async () => {
    setError(null);
    setIsLoading(true);

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode }
      });
      
      setStream(mediaStream);
      setIsCameraOpen(true);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to access camera';
      setError(`Camera error: ${errorMessage}`);
      console.error('Camera access error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [facingMode]);

  // Stop camera
  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCameraOpen(false);
    setError(null);
  }, [stream]);

  // Capture image from video
  const captureImage = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) {
      setError('Camera not ready');
      return;
    }

    if (images.length >= maxImages) {
      setError(`Maximum ${maxImages} images allowed`);
      return;
    }

    try {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      const context = canvas.getContext('2d');
      
      if (!context) {
        setError('Canvas context not available');
        return;
      }

      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Draw video frame to canvas
      context.drawImage(video, 0, 0);
      
      // Convert to base64
      const imageDataUrl = canvas.toDataURL('image/jpeg', imageQuality);
      
      setImages(prev => [...prev, imageDataUrl]);
      setError(null);
    } catch (err) {
      setError('Failed to capture image');
      console.error('Image capture error:', err);
    }
  }, [images.length, maxImages, imageQuality]);

  // Add images from file input
  const addImagesFromFiles = useCallback(async (files: FileList | null) => {
    if (!files) return;

    const remainingSlots = maxImages - images.length;
    const filesToProcess = Array.from(files).slice(0, remainingSlots);

    if (filesToProcess.length < files.length) {
      setError(`Only ${filesToProcess.length} images added. Maximum ${maxImages} allowed.`);
    }

    setIsLoading(true);
    
    try {
      const newImages: string[] = [];
      
      for (const file of filesToProcess) {
        if (!file.type.startsWith('image/')) {
          continue;
        }
        
        const imageDataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            if (e.target?.result) {
              resolve(e.target.result as string);
            } else {
              reject(new Error('Failed to read file'));
            }
          };
          reader.onerror = () => reject(new Error('File reading error'));
          reader.readAsDataURL(file);
        });
        
        newImages.push(imageDataUrl);
      }
      
      setImages(prev => [...prev, ...newImages]);
      setError(null);
    } catch (err) {
      setError('Failed to process some images');
      console.error('File processing error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [images.length, maxImages]);

  // Remove specific image
  const removeImage = useCallback((index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setError(null);
  }, []);

  // Clear all images
  const clearAllImages = useCallback(() => {
    setImages([]);
    setError(null);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  return {
    // State
    images,
    isCameraOpen,
    isLoading,
    error,
    
    // Camera controls
    startCamera,
    stopCamera,
    captureImage,
    
    // Image management
    addImagesFromFiles,
    removeImage,
    clearAllImages,
    
    // Refs
    videoRef: videoRef as React.RefObject<HTMLVideoElement>,
    canvasRef: canvasRef as React.RefObject<HTMLCanvasElement>
  };
};
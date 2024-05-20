
import { useCallback, useState } from 'react';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface UploadAreaProps {
  onImageUpload: (file: File) => void;
  isProcessing: boolean;
  onReset: () => void;
  hasProcessedImage: boolean;
}

const UploadArea = ({ onImageUpload, isProcessing, onReset, hasProcessedImage }: UploadAreaProps) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(file => 
      file.type === 'image/png' || file.type === 'image/jpeg' || file.type === 'image/jpg'
    );
    
    if (imageFile) {
      console.log('File dropped:', imageFile.name, imageFile.type);
      onImageUpload(imageFile);
    }
  }, [onImageUpload]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && (file.type === 'image/png' || file.type === 'image/jpeg' || file.type === 'image/jpg')) {
      console.log('File selected:', file.name, file.type);
      onImageUpload(file);
    }
  }, [onImageUpload]);

  return (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold text-white">Upload Your Image</h2>
        <p className="text-gray-400 text-lg">Drop a PNG or JPG image to get started</p>
      </div>

      <div className="relative group">
        <div
          className={cn(
            "relative border-2 border-dashed rounded-lg p-16 text-center transition-all duration-500 cursor-pointer overflow-hidden",
            "bg-[#1a1a1a]/50 backdrop-blur-xl",
            "hover:bg-[#1a1a1a]/80 hover:scale-[1.02]",
            isDragOver && "border-[#ff6b35] bg-[#ff6b35]/5 scale-[1.02] shadow-[0_0_50px_rgba(255,107,53,0.2)]",
            !isDragOver && "border-[#ff6b35]/30 hover:border-[#ff6b35]/60",
            isProcessing && "pointer-events-none opacity-60"
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !isProcessing && document.getElementById('file-input')?.click()}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-[#ff6b35]/5 via-transparent to-[#ff6b35]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          
          <input
            id="file-input"
            type="file"
            accept="image/png,image/jpeg,image/jpg"
            onChange={handleFileSelect}
            className="hidden"
            disabled={isProcessing}
          />

          <div className="relative z-10 space-y-6">
            {isProcessing ? (
              <div className="flex flex-col items-center space-y-6">
                <div className="relative">
                  <Loader2 className="h-16 w-16 text-[#ff6b35] animate-spin" />
                  <div className="absolute inset-0 bg-[#ff6b35] rounded-full blur-xl opacity-20 animate-pulse"></div>
                </div>
                <div className="space-y-3">
                  <p className="font-semibold text-xl text-white">Processing your image...</p>
                  <p className="text-gray-400">Generating multiple resolutions with pixel-perfect quality</p>
                </div>
              </div>
            ) : (
              <>
                <div className="mx-auto w-20 h-20 bg-gradient-to-br from-[#ff6b35]/20 to-[#ff8c42]/20 rounded-lg flex items-center justify-center group-hover:scale-110 transition-all duration-500 relative">
                  <div className="absolute inset-0 bg-[#ff6b35] rounded-lg blur-xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
                  {isDragOver ? (
                    <ImageIcon className="h-10 w-10 text-[#ff6b35] relative z-10" />
                  ) : (
                    <Upload className="h-10 w-10 text-[#ff6b35] relative z-10" />
                  )}
                </div>
                
                <div className="space-y-3">
                  <p className="font-semibold text-2xl text-white">
                    {isDragOver ? 'Drop your image here' : 'Drag & drop your image'}
                  </p>
                  <p className="text-gray-400 text-lg">
                    or <span className="text-[#ff6b35] font-semibold cursor-pointer hover:underline">browse files</span>
                  </p>
                </div>
                
                <div className="flex flex-wrap justify-center gap-3">
                  {['PNG', 'JPG', 'JPEG'].map((format) => (
                    <span key={format} className="bg-[#ff6b35]/10 border border-[#ff6b35]/30 text-[#ff6b35] px-4 py-2 rounded-xl text-sm font-medium backdrop-blur-sm">
                      {format}
                    </span>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className={cn(
            "absolute inset-0 rounded-lg opacity-0 transition-all duration-500",
            "bg-gradient-to-r from-[#ff6b35]/20 via-[#ff8c42]/20 to-[#ff6b35]/20",
            isDragOver && "opacity-100 animate-pulse"
          )} />
        </div>
      </div>

      {hasProcessedImage && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={onReset}
            className="group relative rounded-lg px-8 py-3 border-[#ff6b35]/30 bg-[#1a1a1a]/50 hover:bg-[#ff6b35]/10 hover:border-[#ff6b35]/60 text-gray-300 hover:text-white transition-all duration-300 hover:scale-105"
          >
            <div className="absolute inset-0 bg-[#ff6b35]/5 rounded-lg blur-sm opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <X className="h-4 w-4 mr-3 relative z-10" />
            <span className="relative z-10 font-medium">Upload New Image</span>
          </Button>
        </div>
      )}
    </div>
  );
};

export default UploadArea;

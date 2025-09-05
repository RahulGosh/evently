"use client"

import Image from "next/image";
import React, { useEffect, useState } from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MediaUploadProps {
  disabled?: boolean;
  onChange: (value: File[]) => void;
  onRemove: (index: number) => void;
  value: File[];
  previewWidth?: number;
  previewHeight?: number;
}

const ImageUpload = ({
  disabled,
  onChange,
  onRemove,
  value,
  previewWidth = 200,
  previewHeight = 200,
}: MediaUploadProps) => {
  const [isMounted, setIsMounted] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [previews, setPreviews] = useState<string[]>([]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    // Create object URLs for previews
    const urls = value.map(file => URL.createObjectURL(file));
    setPreviews(urls);

    // Cleanup function to revoke object URLs
    return () => {
      urls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [value]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      onChange([...value, ...Array.from(files)]);
    }
    // Reset the input value so the same file can be selected again
    event.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      onChange([...value, ...files]);
    }
  };

  if (!isMounted) {
    return null;
  }

  return (
    <div className="w-full space-y-4">
      {value.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {previews.map((preview, index) => (
            <div key={preview} className="relative group aspect-square">
              <Image
                src={preview}
                alt={`Preview ${index + 1}`}
                fill
                className="rounded-lg object-cover"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                <button
                  type="button"
                  onClick={() => onRemove(index)}
                  className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 6L6 18M6 6l12 12"/>
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div
        className={`border-2 border-dashed rounded-lg p-8 transition-colors ${
          isDragging 
            ? "border-primary bg-primary/5" 
            : "border-gray-300 hover:border-primary"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center justify-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Upload className="w-8 h-8 text-primary" />
          </div>
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-1">Drag photos here</h3>
            <p className="text-sm text-gray-500 mb-4">SVG, PNG, JPG (max. 800x400px)</p>
          </div>
          <input
            type="file"
            id="image-upload"
            multiple
            accept="image/*"
            className="hidden"
            onChange={handleFileSelect}
            disabled={disabled}
          />
          <Button 
            type="button" 
            onClick={() => document.getElementById('image-upload')?.click()}
            variant="outline"
            className="rounded-full"
            disabled={disabled}
          >
            Select from computer
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ImageUpload;
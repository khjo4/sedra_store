'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { X, Upload, Image as ImageIcon } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { generateReactHelpers } from '@uploadthing/react';
import type { OurFileRouter } from '@/app/api/uploadthing/core';

const { useUploadThing } = generateReactHelpers<OurFileRouter>();

interface ImageUploadProps {
  value: string[];
  onChange: (urls: string[]) => void;
  maxFiles?: number;
}

export function ImageUpload({ value, onChange, maxFiles = 5 }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const { startUpload } = useUploadThing("imageUploader", {
    onClientUploadComplete: (res) => {
      const urls = res?.map((file) => file.url) || [];
      onChange([...value, ...urls]);
      setUploading(false);
    },
    onUploadError: () => {
      alert("حدث خطأ في رفع الصورة");
      setUploading(false);
    },
  });

  const { getRootProps, getInputProps } = useDropzone({
    accept: { 'image/*': [] },
    onDrop: async (acceptedFiles) => {
      setUploading(true);
      await startUpload(acceptedFiles);
    },
    maxFiles: maxFiles - value.length,
  });

  const removeImage = (url: string) => {
    onChange(value.filter((img) => img !== url));
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-3">
        {value.map((url, index) => (
          <div key={index} className="relative group">
            <img
              src={url}
              alt={`صورة ${index + 1}`}
              className="w-full h-24 object-cover rounded-lg border"
            />
            <button
              type="button"
              onClick={() => removeImage(url)}
              className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
        
        {value.length < maxFiles && (
          <div
            {...getRootProps()}
            className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-primary transition h-24 flex flex-col items-center justify-center"
          >
            <input {...getInputProps()} />
            {uploading ? (
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
            ) : (
              <>
                <Upload className="h-5 w-5 text-muted-foreground" />
                <p className="text-xs text-muted-foreground mt-1">
                  {value.length === 0 ? 'اختر صورة' : 'أضف صورة أخرى'}
                </p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
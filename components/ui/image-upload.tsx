'use client'

import { useState } from 'react'
import { Upload, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useUploadThing } from '@/lib/uploadthing'
import Image from 'next/image'

interface ImageUploadProps {
  value: string[]
  onChange: (urls: string[]) => void
  maxFiles?: number
}

export function ImageUpload({ value, onChange, maxFiles = 5 }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const { startUpload } = useUploadThing("imageUploader")

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    if (value.length + files.length > maxFiles) {
      alert(`يمكنك رفع ${maxFiles} صور كحد أقصى`)
      return
    }

    setUploading(true)
    try {
      const uploaded = await startUpload(Array.from(files))
      if (uploaded) {
        const newUrls = [...value, ...uploaded.map((file) => file.url)]
        onChange(newUrls)
      }
    } catch (error) {
      console.error('Error uploading:', error)
      alert('حدث خطأ في رفع الصور')
    } finally {
      setUploading(false)
    }
  }

  const removeImage = (index: number) => {
    onChange(value.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {value.map((url, index) => (
          <div key={index} className="relative aspect-square rounded-lg overflow-hidden border group">
            <Image src={url} alt={`صورة ${index + 1}`} fill className="object-cover" />
            <button
              type="button"
              onClick={() => removeImage(index)}
              className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
        
        {value.length < maxFiles && (
          <label className="aspect-square rounded-lg border-2 border-dashed border-muted-foreground/25 flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors">
            <Upload className="h-8 w-8 text-muted-foreground mb-2" />
            <span className="text-xs text-muted-foreground">رفع صورة</span>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleUpload}
              className="hidden"
              disabled={uploading}
            />
          </label>
        )}
      </div>
      {uploading && <p className="text-sm text-muted-foreground">جاري رفع الصور...</p>}
    </div>
  )
}
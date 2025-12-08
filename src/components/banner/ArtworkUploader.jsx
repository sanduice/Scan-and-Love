import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Upload, Palette, FileImage, X, Check, AlertCircle, 
  Download, Image, Loader2, Info
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';

export default function ArtworkUploader({ 
  artwork, 
  artworkPreview, 
  isUploading, 
  designMethod,
  setDesignMethod,
  onUpload, 
  onRemove,
  width,
  height
}) {
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      onUpload(file);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      onUpload(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">3. Add Your Artwork</h3>
      
      <Tabs value={designMethod} onValueChange={setDesignMethod}>
        <TabsList className="grid grid-cols-3 mb-6">
          <TabsTrigger value="upload" className="flex items-center gap-2">
            <Upload className="w-4 h-4" />
            Upload File
          </TabsTrigger>
          <TabsTrigger value="design" className="flex items-center gap-2">
            <Palette className="w-4 h-4" />
            Design Online
          </TabsTrigger>
          <TabsTrigger value="later" className="flex items-center gap-2">
            <FileImage className="w-4 h-4" />
            Add Later
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="mt-0">
          {artworkPreview ? (
            // File Uploaded State
            <div className="border-2 border-[#8BC34A] rounded-xl p-6 bg-[#8BC34A]/5">
              <div className="flex items-start gap-4">
                <div className="w-24 h-24 rounded-lg overflow-hidden bg-white border shadow-sm flex-shrink-0">
                  <img src={artworkPreview} alt="Uploaded" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 text-[#8BC34A] mb-2">
                    <Check className="w-5 h-5" />
                    <span className="font-medium">File Uploaded Successfully</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    Your artwork has been uploaded and will be printed on your banner.
                  </p>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Replace File
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={onRemove}
                    >
                      <X className="w-4 h-4 mr-1" />
                      Remove
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ) : isUploading ? (
            // Uploading State
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center">
              <Loader2 className="w-12 h-12 text-[#2196F3] mx-auto mb-4 animate-spin" />
              <p className="text-gray-600 font-medium">Uploading your file...</p>
              <Progress value={66} className="w-48 mx-auto mt-4" />
            </div>
          ) : (
            // Upload Area
            <div 
              className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center hover:border-[#2196F3] hover:bg-[#2196F3]/5 transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
            >
              <div className="w-16 h-16 rounded-full bg-[#2196F3]/10 flex items-center justify-center mx-auto mb-4">
                <Upload className="w-8 h-8 text-[#2196F3]" />
              </div>
              <p className="text-gray-900 font-medium mb-2">
                Drag and drop your file here
              </p>
              <p className="text-gray-500 text-sm mb-4">
                or click to browse
              </p>
              <Button variant="outline" className="mb-4">
                <Upload className="w-4 h-4 mr-2" />
                Choose File
              </Button>
              <p className="text-xs text-gray-400">
                Accepted formats: PDF, AI, EPS, PSD, JPG, PNG (Max 100MB)
              </p>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.ai,.eps,.psd,.jpg,.jpeg,.png"
            onChange={handleFileChange}
            className="hidden"
          />

          {/* File Requirements */}
          <div className="mt-6 p-4 bg-blue-50 rounded-xl">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900 mb-2">File Requirements</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Recommended size: <strong>{width}" × {height}"</strong> at 150 DPI</li>
                  <li>• Add 0.25" bleed on all sides for edge-to-edge printing</li>
                  <li>• Convert text to outlines to avoid font issues</li>
                  <li>• Use CMYK color mode for best results</li>
                </ul>
                <Button variant="link" className="text-blue-600 p-0 h-auto mt-2">
                  <Download className="w-4 h-4 mr-1" />
                  Download Template ({width}×{height})
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="design" className="mt-0">
          <div className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-4">
              <Palette className="w-8 h-8 text-purple-600" />
            </div>
            <h4 className="text-lg font-medium text-gray-900 mb-2">Design Your Banner Online</h4>
            <p className="text-gray-500 text-sm mb-6 max-w-md mx-auto">
              Use our easy online design tool to create your custom banner. 
              Add text, images, shapes, and more!
            </p>
            <a href={`/DesignTool?product=vinyl-banner&width=${width}&height=${height}`}>
              <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                <Palette className="w-4 h-4 mr-2" />
                Open Design Tool
              </Button>
            </a>
            <p className="text-xs text-gray-400 mt-4">
              Canvas size: {width}" × {height}" at 150 DPI
            </p>
          </div>
        </TabsContent>

        <TabsContent value="later" className="mt-0">
          <div className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <FileImage className="w-8 h-8 text-gray-500" />
            </div>
            <h4 className="text-lg font-medium text-gray-900 mb-2">Add Artwork Later</h4>
            <p className="text-gray-500 text-sm mb-4 max-w-md mx-auto">
              You can complete your order now and upload your artwork later. 
              We'll send you a link to upload after checkout.
            </p>
            <div className="flex items-center justify-center gap-2 text-amber-600 text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>Production won't start until artwork is received</span>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
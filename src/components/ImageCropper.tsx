"use client";

import { useState, useCallback } from "react";
import Cropper from "react-easy-crop";

type Point = { x: number; y: number };
type Area = { width: number; height: number; x: number; y: number };

export default function ImageCropper({
  imageUrl,
  onCropComplete,
  onCancel,
}: {
  imageUrl: string;
  onCropComplete: (croppedBlob: Blob) => void;
  onCancel: () => void;
}) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const handleCropComplete = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener("load", () => resolve(image));
      image.addEventListener("error", (error) => reject(error));
      image.setAttribute("crossOrigin", "anonymous"); 
      image.src = url;
    });

  const getCroppedImg = async (
    imageSrc: string,
    pixelCrop: Area,
  ): Promise<Blob | null> => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) return null;

    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height
    );

    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error("Canvas is empty"));
          return;
        }
        resolve(blob);
      }, "image/jpeg", 0.9);
    });
  };

  const handleSave = async () => {
    if (croppedAreaPixels) {
      try {
        const croppedBlob = await getCroppedImg(imageUrl, croppedAreaPixels);
        if (croppedBlob) {
          onCropComplete(croppedBlob);
        }
      } catch (e) {
        console.error(e);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black/80 flex flex-col">
      <div className="flex-1 relative">
        <Cropper
          image={imageUrl}
          crop={crop}
          zoom={zoom}
          aspect={16 / 9}
          onCropChange={setCrop}
          onCropComplete={handleCropComplete}
          onZoomChange={setZoom}
        />
      </div>
      <div className="h-24 bg-zinc-900 flex items-center justify-between px-6 shrink-0">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2 rounded-xl text-white font-semibold hover:bg-white/10 transition-colors"
        >
          Cancel
        </button>
        <div className="flex items-center gap-4 w-64">
           <span className="material-symbols-outlined text-white text-sm">zoom_out</span>
           <input
            type="range"
            value={zoom}
            min={1}
            max={3}
            step={0.1}
            aria-label="Zoom"
            onChange={(e) => setZoom(Number(e.target.value))}
            className="flex-1 accent-primary"
          />
          <span className="material-symbols-outlined text-white text-sm">zoom_in</span>
        </div>
        <button
          type="button"
          onClick={handleSave}
          className="px-6 py-2 bg-primary text-white font-semibold rounded-xl hover:bg-primary/90 transition-colors"
        >
          Crop & Save
        </button>
      </div>
    </div>
  );
}

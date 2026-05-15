"use client";

import { useState, useTransition, useRef } from "react";
import { uploadPaymentProofAction } from "./actions";

type Props = {
  orderId: string;
  totalAmount: number;
  existingProofUrl?: string | null;
};

export default function PaymentProofUpload({ orderId, totalAmount, existingProofUrl }: Props) {
  const [isPending, startTransition] = useTransition();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploaded, setUploaded] = useState(!!existingProofUrl);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(existingProofUrl || null);
  const [error, setError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (selected: File) => {
    setError("");
    setFile(selected);
    if (selected.type.startsWith("image/")) {
      const url = URL.createObjectURL(selected);
      setPreview(url);
    } else {
      setPreview(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) handleFile(dropped);
  };

  const handleSubmit = () => {
    if (!file) return;
    setError("");

    startTransition(async () => {
      const formData = new FormData();
      formData.append("proof", file);
      const res = await uploadPaymentProofAction(orderId, formData);

      if (res.error) {
        setError(res.error);
      } else if (res.success && res.url) {
        setUploaded(true);
        setUploadedUrl(res.url);
        setFile(null);
        setPreview(null);
      }
    });
  };

  // Already uploaded state
  if (uploaded && uploadedUrl) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-emerald-600">check_circle</span>
          </div>
          <div className="flex-1">
            <p className="font-semibold text-emerald-800 text-sm">Payment Proof Submitted!</p>
            <p className="text-xs text-emerald-600 mt-1 mb-3">
              We've received your payment proof. Our team will review and confirm your registration shortly.
            </p>
            {uploadedUrl.match(/\.(jpg|jpeg|png|webp)$/i) && (
              <a href={uploadedUrl} target="_blank" rel="noreferrer" className="block">
                <img
                  src={uploadedUrl}
                  alt="Payment proof"
                  className="h-24 w-auto rounded-lg border border-emerald-200 object-cover"
                />
              </a>
            )}
            {!uploadedUrl.match(/\.(jpg|jpeg|png|webp)$/i) && (
              <a
                href={uploadedUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-emerald-700 font-semibold hover:underline"
              >
                <span className="material-symbols-outlined text-[14px]">description</span>
                View uploaded proof
              </a>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-2xl overflow-hidden">
      <div className="p-5 border-b border-amber-200">
        <div className="flex items-center gap-2 mb-1">
          <span className="material-symbols-outlined text-amber-600">upload_file</span>
          <h3 className="font-bold text-amber-800 text-sm">Submit Payment Proof</h3>
        </div>
        <p className="text-xs text-amber-700">
          Upload your bank transfer receipt to confirm your spot. Accepted: JPG, PNG, PDF (max 5MB).
        </p>
      </div>

      <div className="p-5">
        {/* Drop zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
            isDragging
              ? "border-amber-400 bg-amber-100"
              : file
              ? "border-amber-400 bg-amber-50"
              : "border-amber-300 hover:border-amber-400 hover:bg-amber-50/50"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />

          {preview ? (
            <div className="flex flex-col items-center gap-2">
              <img src={preview} alt="Preview" className="h-28 w-auto rounded-lg object-contain mb-1" />
              <p className="text-xs text-amber-700 font-medium truncate max-w-full">{file?.name}</p>
              <p className="text-xs text-amber-500">Click to change file</p>
            </div>
          ) : file ? (
            <div className="flex flex-col items-center gap-2">
              <span className="material-symbols-outlined text-3xl text-amber-600">description</span>
              <p className="text-sm font-medium text-amber-800 truncate max-w-xs">{file.name}</p>
              <p className="text-xs text-amber-500">PDF selected — click to change</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <span className="material-symbols-outlined text-3xl text-amber-400">cloud_upload</span>
              <p className="text-sm font-semibold text-amber-700">Drop file here or click to browse</p>
              <p className="text-xs text-amber-500">JPG, PNG, WebP or PDF • Max 5MB</p>
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600 flex items-center gap-2">
            <span className="material-symbols-outlined text-[14px]">error</span>
            {error}
          </div>
        )}

        {/* Submit */}
        {file && (
          <button
            onClick={handleSubmit}
            disabled={isPending}
            className="w-full mt-4 py-3 bg-amber-600 text-white font-semibold text-sm rounded-xl hover:bg-amber-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-md"
          >
            {isPending ? (
              <>
                <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
                Uploading...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[18px]">upload</span>
                Submit Payment Proof
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

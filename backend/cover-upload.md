Rencana Implementasi Lengkap
Tahap 1 — Go Backend: Endpoint Upload
go// internal/handler/upload_handler.go
package handler

import (
    "fmt"
    "net/http"
    "path/filepath"
    "time"
    "github.com/aws/aws-sdk-go-v2/aws"
    "github.com/aws/aws-sdk-go-v2/config"
    "github.com/aws/aws-sdk-go-v2/credentials"
    "github.com/aws/aws-sdk-go-v2/service/s3"
)

type UploadHandler struct {
    s3Client   *s3.Client
    bucketName string
    publicURL  string
}

func NewUploadHandler(endpoint, region, bucket, accessKey, secretKey, publicURL string) (*UploadHandler, error) {
    cfg, err := config.LoadDefaultConfig(context.TODO(),
        config.WithRegion(region),
        config.WithCredentialsProvider(
            credentials.NewStaticCredentialsProvider(accessKey, secretKey, ""),
        ),
        config.WithEndpointResolverWithOptions(
            aws.EndpointResolverWithOptionsFunc(func(service, reg string, opts ...interface{}) (aws.Endpoint, error) {
                return aws.Endpoint{
                    URL:               endpoint,
                    HostnameImmutable: true, // PENTING untuk MinIO/S3-compatible
                }, nil
            }),
        ),
    )
    if err != nil {
        return nil, err
    }

    return &UploadHandler{
        s3Client:   s3.NewFromConfig(cfg),
        bucketName: bucket,
        publicURL:  publicURL,
    }, nil
}

func (h *UploadHandler) UploadCover(w http.ResponseWriter, r *http.Request) {
    // Limit ukuran file: 5MB
    r.Body = http.MaxBytesReader(w, r.Body, 5<<20)

    file, header, err := r.FormFile("cover")
    if err != nil {
        http.Error(w, "Gagal membaca file", http.StatusBadRequest)
        return
    }
    defer file.Close()

    // Validasi tipe file
    ext := filepath.Ext(header.Filename)
    allowedExts := map[string]bool{".jpg": true, ".jpeg": true, ".png": true, ".webp": true}
    if !allowedExts[ext] {
        http.Error(w, "Format tidak didukung. Gunakan JPG, PNG, atau WebP", http.StatusBadRequest)
        return
    }

    // Generate nama file unik
    objectKey := fmt.Sprintf("covers/%d%s", time.Now().UnixNano(), ext)

    // Upload ke S3
    _, err = h.s3Client.PutObject(r.Context(), &s3.PutObjectInput{
        Bucket:      aws.String(h.bucketName),
        Key:         aws.String(objectKey),
        Body:        file,
        ContentType: aws.String(header.Header.Get("Content-Type")),
        ACL:         "public-read", // agar URL bisa diakses publik
    })
    if err != nil {
        http.Error(w, "Gagal mengunggah ke storage", http.StatusInternalServerError)
        return
    }

    publicImageURL := fmt.Sprintf("%s/%s", h.publicURL, objectKey)

    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(map[string]string{
        "url": publicImageURL,
    })
}
Tahap 2 — Register Route di Go
go// Di main.go atau router Anda
uploadHandler, err := handler.NewUploadHandler(
    os.Getenv("S3_ENDPOINT"),
    os.Getenv("S3_REGION"),
    os.Getenv("S3_BUCKET_NAME"),
    os.Getenv("S3_ACCESS_KEY"),
    os.Getenv("S3_SECRET_KEY"),
    os.Getenv("S3_PUBLIC_URL"),
)
if err != nil {
    log.Fatal("Gagal inisialisasi S3:", err)
}

// Route khusus admin dengan middleware auth
router.With(adminMiddleware).Post("/api/upload/cover", uploadHandler.UploadCover)
Tahap 3 — Frontend: Image Crop Component
Install dependency dulu:
bashnpm install react-easy-crop
tsx// components/admin/ImageCropUploader.tsx
"use client";

import { useState, useCallback } from "react";
import Cropper from "react-easy-crop";

interface CroppedArea {
  x: number; y: number; width: number; height: number;
}

interface Props {
  onUploadComplete: (url: string) => void;
  aspectRatio?: number; // default 16/9
}

export function ImageCropUploader({ onUploadComplete, aspectRatio = 16 / 9 }: Props) {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<CroppedArea | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // Handler drag & drop / file picker
  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setImageSrc(reader.result as string);
      setShowModal(true);
    };
    reader.readAsDataURL(file);
  };

  const onCropComplete = useCallback((_: unknown, croppedPixels: CroppedArea) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  // Fungsi core: ambil hasil crop sebagai Blob
  const getCroppedImage = async (): Promise<Blob> => {
    const image = new Image();
    image.src = imageSrc!;
    await new Promise((res) => (image.onload = res));

    const canvas = document.createElement("canvas");
    const { x, y, width, height } = croppedAreaPixels!;
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(image, x, y, width, height, 0, 0, width, height);

    return new Promise((res) => canvas.toBlob((blob) => res(blob!), "image/jpeg", 0.9));
  };

  const handleCropAndUpload = async () => {
    if (!croppedAreaPixels) return;
    setIsUploading(true);

    try {
      const blob = await getCroppedImage();
      const formData = new FormData();
      formData.append("cover", blob, "cover.jpg");

      const res = await fetch("/api/upload/cover", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Upload gagal");

      const { url } = await res.json();
      onUploadComplete(url); // kirim URL ke parent form
      setShowModal(false);
      setImageSrc(null);
    } catch (err) {
      console.error(err);
      alert("Gagal mengunggah gambar. Coba lagi.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
      {/* Drag & Drop Zone */}
      <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-600 rounded-xl cursor-pointer hover:border-blue-500 transition-colors bg-gray-800/50">
        <span className="text-gray-400 text-sm">Klik atau drag & drop gambar di sini</span>
        <span className="text-gray-500 text-xs mt-1">JPG, PNG, WebP — Maks. 5MB</span>
        <input type="file" accept="image/*" className="hidden" onChange={onFileChange} />
      </label>

      {/* Modal Cropper */}
      {showModal && imageSrc && (
        <div className="fixed inset-0 z-50 bg-black/80 flex flex-col items-center justify-center">
          <div className="bg-gray-900 rounded-2xl p-6 w-full max-w-2xl">
            <h3 className="text-white font-semibold mb-4">Sesuaikan Gambar</h3>

            {/* Area Cropper */}
            <div className="relative w-full h-72 bg-gray-800 rounded-xl overflow-hidden">
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={aspectRatio}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </div>

            {/* Zoom Slider */}
            <div className="mt-4">
              <label className="text-gray-400 text-sm">Zoom</label>
              <input
                type="range" min={1} max={3} step={0.1} value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-full mt-1"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-5 justify-end">
              <button
                onClick={() => { setShowModal(false); setImageSrc(null); }}
                className="px-4 py-2 rounded-lg text-gray-300 hover:bg-gray-700"
              >
                Batal
              </button>
              <button
                onClick={handleCropAndUpload}
                disabled={isUploading}
                className="px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium disabled:opacity-50"
              >
                {isUploading ? "Mengunggah..." : "Crop & Simpan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
Tahap 4 — Integrasi ke Form Event
tsx// Di halaman create/edit event Anda
import { ImageCropUploader } from "@/components/admin/ImageCropUploader";

// Di dalam komponen form:
const [coverImageUrl, setCoverImageUrl] = useState("");

<div className="space-y-2">
  <label>Banner Acara</label>

  <ImageCropUploader
    onUploadComplete={(url) => setCoverImageUrl(url)}
    aspectRatio={16 / 9}
  />

  {/* Preview jika sudah ada URL */}
  {coverImageUrl && (
    <div className="relative mt-3">
      <img src={coverImageUrl} alt="Preview" className="w-full rounded-xl aspect-video object-cover" />
      <button
        onClick={() => setCoverImageUrl("")}
        className="absolute top-2 right-2 bg-red-600 text-white rounded-full w-7 h-7 text-xs"
      >✕</button>
    </div>
  )}

  {/* Hidden input untuk dikirim bersama form */}
  <input type="hidden" name="coverImageUrl" value={coverImageUrl} />
</div>
Tahap 5 — Environment Variables
env# .env (Go Backend)
S3_ENDPOINT=https://s3.vps-anda.com
S3_REGION=us-east-1
S3_BUCKET_NAME=ministry-assets
S3_ACCESS_KEY=your_access_key_here
S3_SECRET_KEY=your_secret_key_here
S3_PUBLIC_URL=https://s3.vps-anda.com/ministry-assets

Alur Lengkap (Summary)
Admin pilih gambar
       ↓
Frontend tampilkan Cropper (16:9 locked)
       ↓
Admin klik "Crop & Simpan"
       ↓
Canvas API hasilkan Blob (JPEG 90%)
       ↓
POST /api/upload/cover → Go Backend
       ↓
Go validasi + upload ke VPS S3
       ↓
Go return { url: "https://s3.vps/.../cover.jpg" }
       ↓
URL masuk ke state coverImageUrl
       ↓
Form submit seperti biasa (tidak ada perubahan)
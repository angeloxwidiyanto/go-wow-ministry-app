package handlers

import (
	"net/http"
	"path/filepath"

	"github.com/wowministry/api/internal/upload"
)

var coverUploadHandler *upload.UploadHandler

// SetUploadHandler dependency injection for the handler
func SetUploadHandler(h *upload.UploadHandler) {
	coverUploadHandler = h
}

// UploadCoverImage handles POST /api/upload/cover
func UploadCoverImage(w http.ResponseWriter, r *http.Request) {
	if coverUploadHandler == nil {
		RespondError(w, http.StatusInternalServerError, "S3 upload is not configured")
		return
	}

	// Limit ukuran file: 5MB
	r.Body = http.MaxBytesReader(w, r.Body, 5<<20)

	file, header, err := r.FormFile("cover")
	if err != nil {
		RespondError(w, http.StatusBadRequest, "Gagal membaca file: "+err.Error())
		return
	}
	defer file.Close()

	// Validasi tipe file
	ext := filepath.Ext(header.Filename)
	allowedExts := map[string]bool{".jpg": true, ".jpeg": true, ".png": true, ".webp": true}
	if !allowedExts[ext] {
		RespondError(w, http.StatusBadRequest, "Format tidak didukung. Gunakan JPG, PNG, atau WebP")
		return
	}

	url, err := coverUploadHandler.UploadCover(file, header.Size, header.Filename, header.Header.Get("Content-Type"))
	if err != nil {
		RespondError(w, http.StatusInternalServerError, err.Error())
		return
	}

	RespondJSON(w, http.StatusOK, map[string]string{
		"url": url,
	})
}

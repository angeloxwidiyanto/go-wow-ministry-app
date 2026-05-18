package upload

import (
	"context"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
)

type UploadHandler struct {
	minioClient *minio.Client
	bucketName  string
	publicURL   string
}

// InitUploadHandler initializes the S3 client using environment variables.
func InitUploadHandler() (*UploadHandler, error) {
	endpoint := os.Getenv("S3_ENDPOINT")
	region := os.Getenv("S3_REGION")
	bucket := os.Getenv("S3_BUCKET_NAME")
	accessKey := os.Getenv("S3_ACCESS_KEY")
	secretKey := os.Getenv("S3_SECRET_KEY")
	publicURL := os.Getenv("S3_PUBLIC_URL")

	if endpoint == "" || bucket == "" || accessKey == "" || secretKey == "" || publicURL == "" {
		return nil, fmt.Errorf("missing S3 environment variables (S3_ENDPOINT, S3_BUCKET_NAME, S3_ACCESS_KEY, S3_SECRET_KEY, S3_PUBLIC_URL)")
	}

	// Minio SDK expects the endpoint without the scheme
	secure := strings.HasPrefix(endpoint, "https://")
	cleanEndpoint := strings.TrimPrefix(endpoint, "https://")
	cleanEndpoint = strings.TrimPrefix(cleanEndpoint, "http://")

	minioClient, err := minio.New(cleanEndpoint, &minio.Options{
		Creds:  credentials.NewStaticV4(accessKey, secretKey, ""),
		Secure: secure,
		Region: region,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to initialize minio client: %w", err)
	}

	return &UploadHandler{
		minioClient: minioClient,
		bucketName:  bucket,
		publicURL:   publicURL,
	}, nil
}

func (h *UploadHandler) UploadCover(file io.Reader, size int64, filename string, contentType string) (string, error) {
	ext := filepath.Ext(filename)
	objectKey := fmt.Sprintf("covers/%d%s", time.Now().UnixNano(), ext)

	// Set user metadata to make it public read if needed.
	// Most CDNs / S3 providers handle ACLs or bucket policies separately,
	// but we'll upload it as standard public object.
	opts := minio.PutObjectOptions{
		ContentType: contentType,
		UserMetadata: map[string]string{
			"x-amz-acl": "public-read",
		},
	}

	_, err := h.minioClient.PutObject(context.TODO(), h.bucketName, objectKey, file, size, opts)
	if err != nil {
		return "", fmt.Errorf("gagal mengunggah ke storage: %w", err)
	}

	publicImageURL := fmt.Sprintf("%s/%s", h.publicURL, objectKey)
	return publicImageURL, nil
}

func (h *UploadHandler) UploadPaymentProof(file io.Reader, size int64, filename string, contentType string, orderID string) (string, error) {
	ext := filepath.Ext(filename)
	// Use orderID in the filename for better traceability
	objectKey := fmt.Sprintf("payment-proofs/%s-%d%s", orderID, time.Now().UnixNano(), ext)

	opts := minio.PutObjectOptions{
		ContentType: contentType,
		UserMetadata: map[string]string{
			"x-amz-acl": "public-read",
		},
	}

	_, err := h.minioClient.PutObject(context.TODO(), h.bucketName, objectKey, file, size, opts)
	if err != nil {
		return "", fmt.Errorf("gagal mengunggah payment proof ke storage: %w", err)
	}

	publicImageURL := fmt.Sprintf("%s/%s", h.publicURL, objectKey)
	return publicImageURL, nil
}

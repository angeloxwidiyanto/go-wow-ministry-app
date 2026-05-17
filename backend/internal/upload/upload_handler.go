package upload

import (
	"context"
	"fmt"
	"io"
	"os"
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

// InitUploadHandler initializes the AWS S3 client using environment variables.
func InitUploadHandler() (*UploadHandler, error) {
	endpoint := os.Getenv("S3_ENDPOINT")
	region := os.Getenv("S3_REGION")
	bucket := os.Getenv("S3_BUCKET_NAME")
	accessKey := os.Getenv("S3_ACCESS_KEY")
	secretKey := os.Getenv("S3_SECRET_KEY")
	publicURL := os.Getenv("S3_PUBLIC_URL")

	if endpoint == "" || region == "" || bucket == "" || accessKey == "" || secretKey == "" || publicURL == "" {
		return nil, fmt.Errorf("missing S3 environment variables (S3_ENDPOINT, S3_REGION, S3_BUCKET_NAME, S3_ACCESS_KEY, S3_SECRET_KEY, S3_PUBLIC_URL)")
	}

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

func (h *UploadHandler) UploadCover(file io.Reader, filename string, contentType string) (string, error) {
	ext := filepath.Ext(filename)
	objectKey := fmt.Sprintf("covers/%d%s", time.Now().UnixNano(), ext)

	_, err := h.s3Client.PutObject(context.TODO(), &s3.PutObjectInput{
		Bucket:      aws.String(h.bucketName),
		Key:         aws.String(objectKey),
		Body:        file,
		ContentType: aws.String(contentType),
		ACL:         "public-read", // agar URL bisa diakses publik
	})

	if err != nil {
		return "", fmt.Errorf("gagal mengunggah ke storage: %w", err)
	}

	publicImageURL := fmt.Sprintf("%s/%s", h.publicURL, objectKey)
	return publicImageURL, nil
}

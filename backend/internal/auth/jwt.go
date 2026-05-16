package auth

import (
	"fmt"
	"os"
	"strings"

	"github.com/MicahParks/keyfunc/v3"
	"github.com/golang-jwt/jwt/v5"
)

// Claims represents the payload inside a Supabase-issued JWT.
type Claims struct {
	Sub   string `json:"sub"`   // User UUID
	Email string `json:"email"` // User email
	Role  string `json:"role"`  // "authenticated" | "anon" | "service_role"
	jwt.RegisteredClaims
}

// jwks is the global JWKS cache used to validate tokens
var jwks keyfunc.Keyfunc

// InitJWKS initializes the JWKS cache by fetching keys from Supabase
func InitJWKS() error {
	supabaseURL := os.Getenv("SUPABASE_URL")
	if supabaseURL == "" {
		return fmt.Errorf("SUPABASE_URL is not configured")
	}

	jwksURL := fmt.Sprintf("%s/auth/v1/.well-known/jwks.json", supabaseURL)

	// Create a new JWKS from the given URL. This will fetch the keys and
	// cache them. It will automatically refresh the keys in the background
	// according to default settings (usually cache-control headers).
	k, err := keyfunc.NewDefault([]string{jwksURL})
	if err != nil {
		return fmt.Errorf("failed to create JWKS from URL: %w", err)
	}

	jwks = k
	return nil
}

// ValidateToken parses and validates a Supabase JWT using the JWKS endpoint.
// Returns the parsed claims on success, or an error if the token is invalid/expired.
func ValidateToken(tokenString string) (*Claims, error) {
	if jwks == nil {
		return nil, fmt.Errorf("JWKS cache is not initialized")
	}

	claims := &Claims{}

	// Parse the token using the JWKS keyfunc which handles selecting the correct
	// key based on the 'kid' header and verifying the ES256 signature
	token, err := jwt.ParseWithClaims(tokenString, claims, jwks.Keyfunc, jwt.WithValidMethods([]string{"ES256", "RS256", "HS256"}))

	if err != nil {
		return nil, fmt.Errorf("invalid token: %w", err)
	}
	if !token.Valid {
		return nil, fmt.Errorf("token is not valid")
	}

	return claims, nil
}

// ExtractBearer extracts the raw token string from an "Authorization: Bearer <token>" header.
func ExtractBearer(authHeader string) (string, error) {
	const prefix = "Bearer "
	if !strings.HasPrefix(authHeader, prefix) {
		return "", fmt.Errorf("authorization header must start with 'Bearer '")
	}
	token := strings.TrimPrefix(authHeader, prefix)
	if token == "" {
		return "", fmt.Errorf("bearer token is empty")
	}
	return token, nil
}

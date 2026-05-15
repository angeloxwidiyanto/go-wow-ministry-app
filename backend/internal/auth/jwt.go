package auth

import (
	"fmt"
	"os"
	"strings"

	"github.com/golang-jwt/jwt/v5"
)

// Claims represents the payload inside a Supabase-issued JWT.
type Claims struct {
	Sub   string `json:"sub"`   // User UUID
	Email string `json:"email"` // User email
	Role  string `json:"role"`  // "authenticated" | "anon" | "service_role"
	jwt.RegisteredClaims
}

// ValidateToken parses and validates a Supabase JWT using SUPABASE_JWT_SECRET.
// Returns the parsed claims on success, or an error if the token is invalid/expired.
func ValidateToken(tokenString string) (*Claims, error) {
	secret := os.Getenv("SUPABASE_JWT_SECRET")
	if secret == "" {
		return nil, fmt.Errorf("SUPABASE_JWT_SECRET is not configured")
	}

	claims := &Claims{}
	token, err := jwt.ParseWithClaims(tokenString, claims, func(t *jwt.Token) (interface{}, error) {
		// Supabase uses HMAC-SHA256
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", t.Header["alg"])
		}
		return []byte(secret), nil
	})

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

package middleware

import (
	"context"
	"encoding/json"
	"net/http"
	"strings"

	"github.com/wowministry/api/internal/auth"
)

type contextKey string

// UserClaimsKey is used to store/retrieve *auth.Claims from the request context.
const UserClaimsKey contextKey = "userClaims"

// RequireAuth is an HTTP middleware that validates the Supabase JWT.
//
// Token lookup order:
//  1. Authorization: Bearer <token> header
//  2. Cookie named "sb-access-token" (set by Supabase SSR on Next.js)
//
// On success, the *auth.Claims are injected into the request context.
// On failure, returns HTTP 401 with a JSON error body.
func RequireAuth(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		tokenString := extractToken(r)
		if tokenString == "" {
			respondJSON(w, http.StatusUnauthorized, map[string]string{"error": "missing authentication token"})
			return
		}

		claims, err := auth.ValidateToken(tokenString)
		if err != nil {
			respondJSON(w, http.StatusUnauthorized, map[string]string{"error": err.Error()})
			return
		}

		ctx := context.WithValue(r.Context(), UserClaimsKey, claims)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// GetClaims retrieves the authenticated user's claims from the request context.
// Returns nil if not present (i.e., called on an unprotected route).
func GetClaims(r *http.Request) *auth.Claims {
	claims, _ := r.Context().Value(UserClaimsKey).(*auth.Claims)
	return claims
}

// extractToken finds the JWT from the request, checking the Authorization header
// first, then falling back to a Supabase SSR session cookie.
func extractToken(r *http.Request) string {
	// 1. Authorization: Bearer <token>
	if authHeader := r.Header.Get("Authorization"); authHeader != "" {
		if t, err := auth.ExtractBearer(authHeader); err == nil {
			return t
		}
	}

	// 2. Supabase SSR cookie — the cookie name starts with "sb-" and ends with "-auth-token"
	for _, cookie := range r.Cookies() {
		if strings.HasPrefix(cookie.Name, "sb-") && strings.HasSuffix(cookie.Name, "-auth-token") {
			return cookie.Value
		}
	}

	return ""
}

// respondJSON writes a JSON-encoded response with the given status code.
func respondJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}

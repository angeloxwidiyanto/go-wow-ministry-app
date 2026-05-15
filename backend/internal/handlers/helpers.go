// Package handlers provides shared utilities for all HTTP handlers.
package handlers

import (
	"encoding/json"
	"net/http"
)

// RespondJSON writes a JSON-encoded response with the given HTTP status code.
func RespondJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}

// RespondError writes a JSON error response: {"error": "<msg>"}.
func RespondError(w http.ResponseWriter, status int, msg string) {
	RespondJSON(w, status, map[string]string{"error": msg})
}

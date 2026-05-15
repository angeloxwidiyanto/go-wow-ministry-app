package handlers

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"

	"github.com/wowministry/api/internal/db"
	"github.com/wowministry/api/internal/fonnte"
)

// SendWhatsApp handles POST /api/fonnte/send (admin only)
// Body: { "target": "08xxx", "message": "..." }
func SendWhatsApp(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Target  string `json:"target"`
		Message string `json:"message"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil || body.Target == "" || body.Message == "" {
		RespondError(w, http.StatusBadRequest, "target and message are required")
		return
	}

	var token string
	_ = db.Pool.QueryRow(r.Context(), `SELECT value FROM app_settings WHERE key='fonnte_token'`).Scan(&token)

	result := fonnte.SendWhatsApp(token, body.Target, body.Message)
	if !result.Success {
		RespondJSON(w, http.StatusBadGateway, result)
		return
	}
	RespondJSON(w, http.StatusOK, result)
}

// FonnteWebhook handles POST /api/fonnte/webhook (public — called by Fonnte)
// Fonnte requires a valid JSON response to confirm the webhook is reachable.
func FonnteWebhook(w http.ResponseWriter, r *http.Request) {
	// Accept both JSON and form-encoded payloads
	var data map[string]interface{}
	contentType := r.Header.Get("Content-Type")

	if contentType == "application/json" {
		raw, _ := io.ReadAll(r.Body)
		_ = json.Unmarshal(raw, &data)
	} else {
		// multipart/form-data or application/x-www-form-urlencoded
		if err := r.ParseForm(); err == nil {
			data = make(map[string]interface{})
			for k, v := range r.Form {
				if len(v) == 1 {
					data[k] = v[0]
				} else {
					data[k] = v
				}
			}
		}
	}

	log.Printf("Fonnte webhook received: %v", data)

	RespondJSON(w, http.StatusOK, map[string]interface{}{
		"status":  true,
		"message": "Webhook received successfully",
	})
}

// FonnteWebhookGet handles GET /api/fonnte/webhook (browser sanity check)
func FonnteWebhookGet(w http.ResponseWriter, r *http.Request) {
	RespondJSON(w, http.StatusOK, map[string]interface{}{
		"status":  true,
		"message": fmt.Sprintf("Fonnte Webhook endpoint is active. Use POST to send data."),
	})
}

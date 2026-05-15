package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/wowministry/api/internal/db"
	"github.com/wowministry/api/internal/fonnte"
	"github.com/wowministry/api/internal/models"
)

// GetSettings handles GET /api/settings (admin only)
// Returns all app_settings key-value pairs.
func GetSettings(w http.ResponseWriter, r *http.Request) {
	rows, err := db.Pool.Query(r.Context(), `SELECT key, value, updated_at FROM app_settings ORDER BY key`)
	if err != nil {
		RespondError(w, http.StatusInternalServerError, err.Error())
		return
	}
	defer rows.Close()

	settings := []models.AppSetting{}
	for rows.Next() {
		var s models.AppSetting
		if err := rows.Scan(&s.Key, &s.Value, &s.UpdatedAt); err != nil {
			RespondError(w, http.StatusInternalServerError, err.Error())
			return
		}
		settings = append(settings, s)
	}

	RespondJSON(w, http.StatusOK, settings)
}

// SaveFonnteToken handles PUT /api/settings/fonnte-token (admin only)
// Upserts the Fonnte API token in app_settings.
func SaveFonnteToken(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Token string `json:"token"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		RespondError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	_, err := db.Pool.Exec(r.Context(), `
		INSERT INTO app_settings (key, value, updated_at)
		VALUES ('fonnte_token', $1, NOW())
		ON CONFLICT (key) DO UPDATE SET value=$1, updated_at=NOW()
	`, body.Token)
	if err != nil {
		RespondError(w, http.StatusInternalServerError, err.Error())
		return
	}

	RespondJSON(w, http.StatusOK, map[string]interface{}{
		"success": true,
		"message": "Token saved successfully.",
	})
}

// TestFonnteToken handles GET /api/settings/fonnte-test (admin only)
// Reads the saved token from DB and pings the Fonnte device endpoint.
func TestFonnteToken(w http.ResponseWriter, r *http.Request) {
	var token string
	_ = db.Pool.QueryRow(r.Context(),
		`SELECT value FROM app_settings WHERE key='fonnte_token'`,
	).Scan(&token)

	result := fonnte.TestToken(token)
	RespondJSON(w, http.StatusOK, result)
}

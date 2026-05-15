package handlers

import (
	"encoding/json"
	"net/http"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/wowministry/api/internal/db"
	"github.com/wowministry/api/internal/models"
)

// ListMembers handles GET /api/members[?search=<query>&limit=<n>]
// Returns all people with their church name and roles.
// If search= is provided, filters by name, email, or WhatsApp (case-insensitive).
func ListMembers(w http.ResponseWriter, r *http.Request) {
	search := strings.TrimSpace(r.URL.Query().Get("search"))

	var (
		rows interface{ Next() bool; Scan(...any) error; Close() }
		err  error
	)

	if search != "" {
		pattern := "%" + search + "%"
		rows, err = db.Pool.Query(r.Context(), `
			SELECT p.id, p.email, p.whatsapp_number, p.full_name, p.church_title,
			       p.gender, p.birth_date, p.church_id, p.created_at, p.last_updated_at,
			       c.name AS church_name,
			       COALESCE(
			         (SELECT string_agg(mr.name, ', ')
			          FROM person_roles pr
			          JOIN ministry_roles mr ON mr.id = pr.role_id
			          WHERE pr.person_id = p.id),
			         ''
			       ) AS roles
			FROM people p
			LEFT JOIN churches c ON c.id = p.church_id
			WHERE p.full_name ILIKE $1
			   OR p.email ILIKE $1
			   OR p.whatsapp_number ILIKE $1
			ORDER BY p.full_name ASC
			LIMIT 50
		`, pattern)
	} else {
		rows, err = db.Pool.Query(r.Context(), `
			SELECT p.id, p.email, p.whatsapp_number, p.full_name, p.church_title,
			       p.gender, p.birth_date, p.church_id, p.created_at, p.last_updated_at,
			       c.name AS church_name,
			       COALESCE(
			         (SELECT string_agg(mr.name, ', ')
			          FROM person_roles pr
			          JOIN ministry_roles mr ON mr.id = pr.role_id
			          WHERE pr.person_id = p.id),
			         ''
			       ) AS roles
			FROM people p
			LEFT JOIN churches c ON c.id = p.church_id
			ORDER BY p.full_name ASC
		`)
	}
	if err != nil {
		RespondError(w, http.StatusInternalServerError, err.Error())
		return
	}
	defer rows.Close()

	members := []models.Person{}
	for rows.Next() {
		var p models.Person
		var rolesStr string
		if err := rows.Scan(
			&p.ID, &p.Email, &p.WhatsappNumber, &p.FullName, &p.ChurchTitle,
			&p.Gender, &p.BirthDate, &p.ChurchID, &p.CreatedAt, &p.LastUpdatedAt,
			&p.ChurchName, &rolesStr,
		); err != nil {
			RespondError(w, http.StatusInternalServerError, err.Error())
			return
		}
		if rolesStr != "" {
			for _, role := range strings.Split(rolesStr, ", ") {
				p.Roles = append(p.Roles, strings.TrimSpace(role))
			}
		}
		members = append(members, p)
	}

	RespondJSON(w, http.StatusOK, members)
}

type memberRequest struct {
	FullName       string  `json:"full_name"`
	Email          *string `json:"email"`
	WhatsappNumber *string `json:"whatsapp_number"`
	ChurchTitle    *string `json:"church_title"`
	Gender         *string `json:"gender"`
	BirthDate      *string `json:"birth_date"`
	OriginChurch   *string `json:"origin_church"`  // resolved to church_id
	MinistryRole   *string `json:"ministry_role"`  // comma-separated, auto-created
}

// CreateMember handles POST /api/members (admin only)
func CreateMember(w http.ResponseWriter, r *http.Request) {
	var req memberRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		RespondError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if req.FullName == "" {
		RespondError(w, http.StatusBadRequest, "full_name is required")
		return
	}

	churchID, err := getOrCreateChurch(r, req.OriginChurch)
	if err != nil {
		RespondError(w, http.StatusInternalServerError, err.Error())
		return
	}

	var personID string
	err = db.Pool.QueryRow(r.Context(), `
		INSERT INTO people (full_name, email, whatsapp_number, church_title, gender, birth_date, church_id)
		VALUES ($1,$2,$3,$4,$5,$6,$7)
		RETURNING id
	`, req.FullName, req.Email, req.WhatsappNumber, req.ChurchTitle,
		req.Gender, req.BirthDate, churchID,
	).Scan(&personID)
	if err != nil {
		if strings.Contains(err.Error(), "23505") {
			RespondError(w, http.StatusConflict, "a member with this email or WhatsApp number already exists")
			return
		}
		RespondError(w, http.StatusInternalServerError, err.Error())
		return
	}

	if err := linkRoles(r, personID, req.MinistryRole, false); err != nil {
		// Non-fatal: member was created, roles just didn't attach
	}

	RespondJSON(w, http.StatusCreated, map[string]string{"id": personID})
}

// UpdateMember handles PUT /api/members/{id} (admin only)
func UpdateMember(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	var req memberRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		RespondError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if req.FullName == "" {
		RespondError(w, http.StatusBadRequest, "full_name is required")
		return
	}

	churchID, err := getOrCreateChurch(r, req.OriginChurch)
	if err != nil {
		RespondError(w, http.StatusInternalServerError, err.Error())
		return
	}

	_, err = db.Pool.Exec(r.Context(), `
		UPDATE people SET full_name=$1, email=$2, whatsapp_number=$3, church_title=$4,
		  gender=$5, birth_date=$6, church_id=$7, last_updated_at=NOW()
		WHERE id=$8
	`, req.FullName, req.Email, req.WhatsappNumber, req.ChurchTitle,
		req.Gender, req.BirthDate, churchID, id,
	)
	if err != nil {
		if strings.Contains(err.Error(), "23505") {
			RespondError(w, http.StatusConflict, "a member with this email or WhatsApp number already exists")
			return
		}
		RespondError(w, http.StatusInternalServerError, err.Error())
		return
	}

	// Replace roles: delete then re-link
	if err := linkRoles(r, id, req.MinistryRole, true); err != nil {
		// Non-fatal
	}

	RespondJSON(w, http.StatusOK, map[string]bool{"success": true})
}

// BulkAddMembers handles POST /api/members/bulk (admin only)
func BulkAddMembers(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Members     []memberRequest `json:"members"`
		TargetEventID *string       `json:"target_event_id"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		RespondError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	imported := 0
	for _, m := range body.Members {
		if m.FullName == "" {
			continue
		}

		churchID, _ := getOrCreateChurch(r, m.OriginChurch)

		var personID string
		err := db.Pool.QueryRow(r.Context(), `
			INSERT INTO people (full_name, email, whatsapp_number, church_title, gender, birth_date, church_id)
			VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id
		`, m.FullName, m.Email, m.WhatsappNumber, m.ChurchTitle,
			m.Gender, m.BirthDate, churchID,
		).Scan(&personID)

		if err != nil && strings.Contains(err.Error(), "23505") {
			// Person exists — find by email or whatsapp
			if m.Email != nil && *m.Email != "" {
				_ = db.Pool.QueryRow(r.Context(), `SELECT id FROM people WHERE email=$1`, *m.Email).Scan(&personID)
			} else if m.WhatsappNumber != nil && *m.WhatsappNumber != "" {
				_ = db.Pool.QueryRow(r.Context(), `SELECT id FROM people WHERE whatsapp_number=$1`, *m.WhatsappNumber).Scan(&personID)
			}
		} else if err != nil {
			continue
		}

		if personID == "" {
			continue
		}

		_ = linkRoles(r, personID, m.MinistryRole, false)

		// Link to target event if specified
		if body.TargetEventID != nil && *body.TargetEventID != "" {
			var orderID string
			err := db.Pool.QueryRow(r.Context(), `
				INSERT INTO registration_orders
				  (event_id, pic_name, pic_email, pic_whatsapp, total_tickets, total_amount, status)
				VALUES ($1,$2,$3,$4,1,0,'PAID') RETURNING id
			`, *body.TargetEventID, m.FullName,
				coalesceStr(m.Email, "imported@wow.ministry"),
				coalesceStr(m.WhatsappNumber, "0"),
			).Scan(&orderID)

			if err == nil && orderID != "" {
				regNum := generateRegNumber()
				_, _ = db.Pool.Exec(r.Context(), `
					INSERT INTO event_attendees
					  (order_id, person_id, registration_number, registration_type,
					   attendee_name, attendee_email, attendee_whatsapp,
					   church_title, gender, birth_date, origin_church, ministry_role)
					VALUES ($1,$2,$3,'IMPORTED',$4,$5,$6,$7,$8,$9,$10,$11)
				`, orderID, personID, regNum, m.FullName,
					m.Email, m.WhatsappNumber, m.ChurchTitle,
					m.Gender, m.BirthDate, m.OriginChurch, m.MinistryRole)
			}
		}
		imported++
	}

	RespondJSON(w, http.StatusOK, map[string]int{"imported": imported})
}

// ─── Helpers ────────────────────────────────────────────────────────────────

// getOrCreateChurch resolves a church name to its UUID, creating it if needed.
func getOrCreateChurch(r *http.Request, name *string) (*string, error) {
	if name == nil || strings.TrimSpace(*name) == "" {
		return nil, nil
	}
	n := strings.TrimSpace(*name)

	var id string
	err := db.Pool.QueryRow(r.Context(), `SELECT id FROM churches WHERE name ILIKE $1 LIMIT 1`, n).Scan(&id)
	if err == nil {
		return &id, nil
	}

	err = db.Pool.QueryRow(r.Context(), `INSERT INTO churches (name) VALUES ($1) RETURNING id`, n).Scan(&id)
	if err != nil {
		return nil, err
	}
	return &id, nil
}

// linkRoles resolves comma-separated role names and links them to a person.
// If replace=true, existing roles are deleted first.
func linkRoles(r *http.Request, personID string, rolesStr *string, replace bool) error {
	if replace {
		_, _ = db.Pool.Exec(r.Context(), `DELETE FROM person_roles WHERE person_id=$1`, personID)
	}

	if rolesStr == nil || strings.TrimSpace(*rolesStr) == "" {
		return nil
	}

	for _, roleName := range strings.Split(*rolesStr, ",") {
		roleName = strings.TrimSpace(roleName)
		if roleName == "" {
			continue
		}

		var roleID string
		err := db.Pool.QueryRow(r.Context(), `SELECT id FROM ministry_roles WHERE name ILIKE $1 LIMIT 1`, roleName).Scan(&roleID)
		if err != nil {
			err = db.Pool.QueryRow(r.Context(), `INSERT INTO ministry_roles (name) VALUES ($1) RETURNING id`, roleName).Scan(&roleID)
			if err != nil {
				continue
			}
		}

		_, _ = db.Pool.Exec(r.Context(),
			`INSERT INTO person_roles (person_id, role_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`,
			personID, roleID,
		)
	}
	return nil
}

func coalesceStr(s *string, fallback string) string {
	if s != nil && *s != "" {
		return *s
	}
	return fallback
}

func generateRegNumber() string {
	return "IMP-" + randomSuffix()
}

func randomSuffix() string {
	const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
	n := time.Now().UnixNano()
	result := make([]byte, 6)
	for i := range result {
		result[i] = chars[n%int64(len(chars))]
		n /= int64(len(chars))
	}
	return string(result)
}

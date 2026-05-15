package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"strings"

	"github.com/wowministry/api/internal/db"
	"github.com/wowministry/api/internal/models"
)

// PendingContactRow is an attendee row that has no linked person yet.
type PendingContactRow struct {
	models.EventAttendee
	EventTitle *string `json:"event_title,omitempty"`
}

// ListPendingContacts handles GET /api/pending-contacts (admin only)
// Returns paginated attendees where person_id IS NULL, with event title joined.
func ListPendingContacts(w http.ResponseWriter, r *http.Request) {
	pageStr := r.URL.Query().Get("page")
	pageSizeStr := r.URL.Query().Get("page_size")

	page, err := strconv.Atoi(pageStr)
	if err != nil || page < 1 {
		page = 1
	}
	pageSize, err := strconv.Atoi(pageSizeStr)
	if err != nil || pageSize < 1 || pageSize > 200 {
		pageSize = 50
	}
	offset := (page - 1) * pageSize

	// Count total
	var total int
	_ = db.Pool.QueryRow(r.Context(),
		`SELECT COUNT(*) FROM event_attendees WHERE person_id IS NULL`,
	).Scan(&total)

	// Fetch page
	rows, err := db.Pool.Query(r.Context(), `
		SELECT
			ea.id, ea.order_id, ea.person_id, ea.ticket_tier_id,
			ea.registration_number, ea.registration_type,
			ea.attendee_name, ea.attendee_email, ea.attendee_whatsapp,
			ea.church_title, ea.gender, ea.birth_date, ea.origin_church,
			ea.ministry_role, ea.attended_at, ea.created_at,
			e.title AS event_title
		FROM event_attendees ea
		JOIN registration_orders ro ON ro.id = ea.order_id
		JOIN events e ON e.id = ro.event_id
		WHERE ea.person_id IS NULL
		ORDER BY ea.created_at DESC
		LIMIT $1 OFFSET $2
	`, pageSize, offset)
	if err != nil {
		RespondError(w, http.StatusInternalServerError, err.Error())
		return
	}
	defer rows.Close()

	contacts := []PendingContactRow{}
	for rows.Next() {
		var c PendingContactRow
		if err := rows.Scan(
			&c.ID, &c.OrderID, &c.PersonID, &c.TicketTierID,
			&c.RegistrationNumber, &c.RegistrationType,
			&c.AttendeeName, &c.AttendeeEmail, &c.AttendeeWhatsapp,
			&c.ChurchTitle, &c.Gender, &c.BirthDate, &c.OriginChurch,
			&c.MinistryRole, &c.AttendedAt, &c.CreatedAt,
			&c.EventTitle,
		); err != nil {
			RespondError(w, http.StatusInternalServerError, err.Error())
			return
		}
		contacts = append(contacts, c)
	}

	RespondJSON(w, http.StatusOK, map[string]interface{}{
		"data":  contacts,
		"total": total,
	})
}

type createPersonFromAttendeeRequest struct {
	// Attendee-sourced fields
	ID              string  `json:"id"`               // attendee ID
	AttendeeName    string  `json:"attendee_name"`
	AttendeeEmail   *string `json:"attendee_email"`
	AttendeeWhatsapp *string `json:"attendee_whatsapp"`
	ChurchTitle     *string `json:"church_title"`
	Gender          *string `json:"gender"`
	BirthDate       *string `json:"birth_date"`
	OriginChurch    *string `json:"origin_church"`
	MinistryRole    *string `json:"ministry_role"`
}

// CreatePersonFromAttendee handles POST /api/pending-contacts/create-person (admin only)
// Creates a new person record from attendee data, then links the attendee to that person.
func CreatePersonFromAttendee(w http.ResponseWriter, r *http.Request) {
	var req createPersonFromAttendeeRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		RespondError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if req.ID == "" || req.AttendeeName == "" {
		RespondError(w, http.StatusBadRequest, "id and attendee_name are required")
		return
	}

	// Resolve church
	churchID, err := getOrCreateChurch(r, req.OriginChurch)
	if err != nil {
		RespondError(w, http.StatusInternalServerError, fmt.Sprintf("church resolution failed: %v", err))
		return
	}

	// Insert person
	var personID string
	err = db.Pool.QueryRow(r.Context(), `
		INSERT INTO people (full_name, email, whatsapp_number, church_title, gender, birth_date, church_id)
		VALUES ($1,$2,$3,$4,$5,$6,$7)
		RETURNING id
	`, req.AttendeeName, req.AttendeeEmail, req.AttendeeWhatsapp,
		req.ChurchTitle, req.Gender, req.BirthDate, churchID,
	).Scan(&personID)
	if err != nil {
		if strings.Contains(err.Error(), "23505") {
			RespondError(w, http.StatusConflict, "a person with this email or WhatsApp already exists")
			return
		}
		RespondError(w, http.StatusInternalServerError, err.Error())
		return
	}

	// Link roles
	_ = linkRoles(r, personID, req.MinistryRole, false)

	// Link attendee → person
	_, err = db.Pool.Exec(r.Context(),
		`UPDATE event_attendees SET person_id=$1 WHERE id=$2`,
		personID, req.ID,
	)
	if err != nil {
		RespondError(w, http.StatusInternalServerError, fmt.Sprintf("failed to link attendee: %v", err))
		return
	}

	RespondJSON(w, http.StatusCreated, map[string]string{"person_id": personID})
}

// MergeWithExistingPerson handles POST /api/pending-contacts/merge (admin only)
// Links an unmatched attendee to an existing person record.
func MergeWithExistingPerson(w http.ResponseWriter, r *http.Request) {
	var req struct {
		AttendeeID string `json:"attendee_id"`
		PersonID   string `json:"person_id"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		RespondError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if req.AttendeeID == "" || req.PersonID == "" {
		RespondError(w, http.StatusBadRequest, "attendee_id and person_id are required")
		return
	}

	_, err := db.Pool.Exec(r.Context(),
		`UPDATE event_attendees SET person_id=$1 WHERE id=$2`,
		req.PersonID, req.AttendeeID,
	)
	if err != nil {
		RespondError(w, http.StatusInternalServerError, err.Error())
		return
	}

	RespondJSON(w, http.StatusOK, map[string]bool{"success": true})
}

// BulkCreatePersonsFromAttendees handles POST /api/pending-contacts/bulk-create (admin only)
// Creates a person for each unmatched attendee in the batch.
func BulkCreatePersonsFromAttendees(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Attendees []createPersonFromAttendeeRequest `json:"attendees"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		RespondError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	created := 0
	errors := []string{}

	for _, req := range body.Attendees {
		if req.ID == "" || req.AttendeeName == "" {
			continue
		}

		churchID, _ := getOrCreateChurch(r, req.OriginChurch)

		var personID string
		err := db.Pool.QueryRow(r.Context(), `
			INSERT INTO people (full_name, email, whatsapp_number, church_title, gender, birth_date, church_id)
			VALUES ($1,$2,$3,$4,$5,$6,$7)
			RETURNING id
		`, req.AttendeeName, req.AttendeeEmail, req.AttendeeWhatsapp,
			req.ChurchTitle, req.Gender, req.BirthDate, churchID,
		).Scan(&personID)

		if err != nil {
			if strings.Contains(err.Error(), "23505") {
				// Find existing person by email or WhatsApp
				if req.AttendeeEmail != nil && *req.AttendeeEmail != "" {
					_ = db.Pool.QueryRow(r.Context(),
						`SELECT id FROM people WHERE email=$1`, *req.AttendeeEmail,
					).Scan(&personID)
				} else if req.AttendeeWhatsapp != nil && *req.AttendeeWhatsapp != "" {
					_ = db.Pool.QueryRow(r.Context(),
						`SELECT id FROM people WHERE whatsapp_number=$1`, *req.AttendeeWhatsapp,
					).Scan(&personID)
				}
			}
			if personID == "" {
				errors = append(errors, fmt.Sprintf("failed for %s: %v", req.AttendeeName, err))
				continue
			}
		}

		_ = linkRoles(r, personID, req.MinistryRole, false)

		_, _ = db.Pool.Exec(r.Context(),
			`UPDATE event_attendees SET person_id=$1 WHERE id=$2`,
			personID, req.ID,
		)
		created++
	}

	RespondJSON(w, http.StatusOK, map[string]interface{}{
		"created": created,
		"errors":  errors,
	})
}

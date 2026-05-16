package handlers

import (
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/wowministry/api/internal/db"
	"github.com/wowministry/api/internal/models"
)

// ListAttendees handles GET /api/attendees
// Supports optional ?event_id= and ?order_id= query params.
func ListAttendees(w http.ResponseWriter, r *http.Request) {
	eventID := r.URL.Query().Get("event_id")
	orderID := r.URL.Query().Get("order_id")

	var eventIDArg, orderIDArg interface{}
	if eventID != "" {
		eventIDArg = eventID
	}
	if orderID != "" {
		orderIDArg = orderID
	}

	rows, err := db.Pool.Query(r.Context(), `
		SELECT a.id, a.order_id, a.person_id, a.ticket_tier_id,
		       a.registration_number, a.registration_type,
		       a.attendee_name, a.attendee_email, a.attendee_whatsapp,
		       a.church_title, a.gender, a.birth_date::TEXT,
		       a.origin_church, a.ministry_role, a.attended_at, a.created_at,
		       COALESCE(o.status, 'PENDING') AS status, 
		       COALESCE(o.event_id, $1::uuid) AS event_id, 
		       o.pic_name, 
		       t.name AS ticket_tier_name
		FROM event_attendees a
		LEFT JOIN registration_orders o ON o.id = a.order_id
		LEFT JOIN ticket_tiers t ON t.id = a.ticket_tier_id
		WHERE ($1::uuid IS NULL OR o.event_id = $1::uuid)
		  AND ($2::uuid IS NULL OR a.order_id = $2::uuid)
		ORDER BY a.created_at DESC
	`, eventIDArg, orderIDArg)
	if err != nil {
		RespondError(w, http.StatusInternalServerError, err.Error())
		return
	}
	defer rows.Close()

	attendees := []models.EventAttendee{}
	for rows.Next() {
		var a models.EventAttendee
		if err := rows.Scan(
			&a.ID, &a.OrderID, &a.PersonID, &a.TicketTierID,
			&a.RegistrationNumber, &a.RegistrationType,
			&a.AttendeeName, &a.AttendeeEmail, &a.AttendeeWhatsapp,
			&a.ChurchTitle, &a.Gender, &a.BirthDate,
			&a.OriginChurch, &a.MinistryRole, &a.AttendedAt, &a.CreatedAt,
			&a.Status, &a.EventID, &a.PicName, &a.TicketTierName,
		); err != nil {
			RespondError(w, http.StatusInternalServerError, err.Error())
			return
		}
		attendees = append(attendees, a)
	}

	RespondJSON(w, http.StatusOK, attendees)
}

// GetAttendeeByRegNumber handles GET /api/attendees/lookup?reg={registrationNumber}
// Used by the public ticket lookup and QR check-in scanner.
func GetAttendeeByRegNumber(w http.ResponseWriter, r *http.Request) {
	reg := r.URL.Query().Get("reg")
	if reg == "" {
		RespondError(w, http.StatusBadRequest, "reg query parameter is required")
		return
	}

	var a models.EventAttendee
	err := db.Pool.QueryRow(r.Context(), `
		SELECT id, order_id, person_id, ticket_tier_id,
		       registration_number, registration_type,
		       attendee_name, attendee_email, attendee_whatsapp,
		       church_title, gender, birth_date,
		       origin_church, ministry_role, attended_at, created_at
		FROM event_attendees WHERE registration_number = $1
	`, reg).Scan(
		&a.ID, &a.OrderID, &a.PersonID, &a.TicketTierID,
		&a.RegistrationNumber, &a.RegistrationType,
		&a.AttendeeName, &a.AttendeeEmail, &a.AttendeeWhatsapp,
		&a.ChurchTitle, &a.Gender, &a.BirthDate,
		&a.OriginChurch, &a.MinistryRole, &a.AttendedAt, &a.CreatedAt,
	)
	if err != nil {
		RespondError(w, http.StatusNotFound, "attendee not found")
		return
	}

	RespondJSON(w, http.StatusOK, a)
}

// CheckInAttendee handles POST /api/attendees/{id}/checkin (admin only)
// Sets attended_at to the current timestamp.
func CheckInAttendee(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	now := time.Now()
	tag, err := db.Pool.Exec(r.Context(),
		`UPDATE event_attendees SET attended_at=$1 WHERE id=$2`,
		now, id,
	)
	if err != nil {
		RespondError(w, http.StatusInternalServerError, err.Error())
		return
	}
	if tag.RowsAffected() == 0 {
		RespondError(w, http.StatusNotFound, "attendee not found")
		return
	}

	RespondJSON(w, http.StatusOK, map[string]interface{}{
		"success":     true,
		"attended_at": now,
	})
}

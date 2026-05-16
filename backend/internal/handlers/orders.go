package handlers

import (
	"context"
	"encoding/json"
	"net/http"
	"os"

	"github.com/go-chi/chi/v5"
	"github.com/wowministry/api/internal/db"
	"github.com/wowministry/api/internal/fonnte"
	"github.com/wowministry/api/internal/models"
)

// ListOrders handles GET /api/orders
// Supports optional ?status=PENDING|PAID|CANCELLED and ?event_id= query params.
func ListOrders(w http.ResponseWriter, r *http.Request) {
	status := r.URL.Query().Get("status")
	eventID := r.URL.Query().Get("event_id")

	// Use NULL-safe comparison so omitted params don't filter
	var args []interface{}
	var statusArg, eventIDArg interface{}
	if status != "" {
		statusArg = status
	}
	if eventID != "" {
		eventIDArg = eventID
	}
	args = append(args, statusArg, eventIDArg)

	rows, err := db.Pool.Query(r.Context(), `
		SELECT o.id, o.event_id, o.pic_name, o.pic_email, o.pic_whatsapp,
		       o.total_tickets, o.total_amount, o.applied_voucher, o.discount_amount,
		       o.payment_method, o.payment_reference_id, o.payment_proof_url,
		       o.status, o.created_at, e.title
		FROM registration_orders o
		LEFT JOIN events e ON e.id = o.event_id
		WHERE ($1::text IS NULL OR o.status = $1)
		  AND ($2::uuid IS NULL OR o.event_id = $2::uuid)
		ORDER BY o.created_at DESC
	`, args...)
	if err != nil {
		RespondError(w, http.StatusInternalServerError, err.Error())
		return
	}
	defer rows.Close()

	orders := []models.RegistrationOrder{}
	for rows.Next() {
		var o models.RegistrationOrder
		if err := rows.Scan(
			&o.ID, &o.EventID, &o.PICName, &o.PICEmail, &o.PICWhatsapp,
			&o.TotalTickets, &o.TotalAmount, &o.AppliedVoucher, &o.DiscountAmount,
			&o.PaymentMethod, &o.PaymentReferenceID, &o.PaymentProofURL,
			&o.Status, &o.CreatedAt, &o.EventTitle,
		); err != nil {
			RespondError(w, http.StatusInternalServerError, err.Error())
			return
		}
		orders = append(orders, o)
	}

	RespondJSON(w, http.StatusOK, orders)
}

// PublicSearchOrders handles GET /api/orders/search
func PublicSearchOrders(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query().Get("q")
	if len(q) < 3 {
		RespondError(w, http.StatusBadRequest, "search query too short")
		return
	}

	searchPattern := "%" + q + "%"
	rows, err := db.Pool.Query(r.Context(), `
		SELECT o.id, o.pic_name, o.pic_email, o.pic_whatsapp,
		       o.total_tickets, o.total_amount, o.status, o.created_at,
		       e.id, e.title, e.event_date::text, e.location, e.slug
		FROM registration_orders o
		LEFT JOIN events e ON e.id = o.event_id
		WHERE o.pic_email ILIKE $1 OR o.pic_whatsapp ILIKE $1 OR o.pic_name ILIKE $1
		ORDER BY o.created_at DESC
		LIMIT 10
	`, searchPattern)
	if err != nil {
		RespondError(w, http.StatusInternalServerError, err.Error())
		return
	}
	defer rows.Close()

	type OrderResult struct {
		ID            string      `json:"id"`
		PICName       string      `json:"pic_name"`
		PICEmail      string      `json:"pic_email"`
		PICWhatsapp   string      `json:"pic_whatsapp"`
		TotalTickets  int         `json:"total_tickets"`
		TotalAmount   float64     `json:"total_amount"`
		Status        string      `json:"status"`
		CreatedAt     string      `json:"created_at"`
		Events        interface{} `json:"events"`
	}

	results := []OrderResult{}
	for rows.Next() {
		var o OrderResult
		var e struct {
			ID        string  `json:"id"`
			Title     string  `json:"title"`
			EventDate string  `json:"event_date"`
			Location  *string `json:"location"`
			Slug      string  `json:"slug"`
		}
		
		if err := rows.Scan(
			&o.ID, &o.PICName, &o.PICEmail, &o.PICWhatsapp,
			&o.TotalTickets, &o.TotalAmount, &o.Status, &o.CreatedAt,
			&e.ID, &e.Title, &e.EventDate, &e.Location, &e.Slug,
		); err != nil {
			RespondError(w, http.StatusInternalServerError, err.Error())
			return
		}
		o.Events = e
		results = append(results, o)
	}

	RespondJSON(w, http.StatusOK, results)
}

// GetOrder handles GET /api/orders/{id}
func GetOrder(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	var o models.RegistrationOrder
	err := db.Pool.QueryRow(r.Context(), `
		SELECT o.id, o.event_id, o.pic_name, o.pic_email, o.pic_whatsapp,
		       o.total_tickets, o.total_amount, o.applied_voucher, o.discount_amount,
		       o.payment_method, o.payment_reference_id, o.payment_proof_url,
		       o.status, o.created_at, e.title
		FROM registration_orders o
		LEFT JOIN events e ON e.id = o.event_id
		WHERE o.id = $1
	`, id).Scan(
		&o.ID, &o.EventID, &o.PICName, &o.PICEmail, &o.PICWhatsapp,
		&o.TotalTickets, &o.TotalAmount, &o.AppliedVoucher, &o.DiscountAmount,
		&o.PaymentMethod, &o.PaymentReferenceID, &o.PaymentProofURL,
		&o.Status, &o.CreatedAt, &o.EventTitle,
	)
	if err != nil {
		RespondError(w, http.StatusNotFound, "order not found")
		return
	}

	// Fetch event details matching Next.js query shape
	var event struct {
		Title         string      `json:"title"`
		Description   *string     `json:"description"`
		Location      *string     `json:"location"`
		MeetingURL    *string     `json:"meeting_url"`
		CheckinWindowMinutes *int `json:"checkin_window_minutes"`
		EventDate     string      `json:"event_date"`
		CoverImageURL *string     `json:"cover_image_url"`
		ThemeColor    string      `json:"theme_color"`
	}
	err = db.Pool.QueryRow(r.Context(), `
		SELECT title, description, location, meeting_url, checkin_window_minutes, event_date::text, cover_image_url, theme_color
		FROM events WHERE id = $1
	`, o.EventID).Scan(
		&event.Title, &event.Description, &event.Location, &event.MeetingURL, &event.CheckinWindowMinutes, &event.EventDate, &event.CoverImageURL, &event.ThemeColor,
	)
	if err != nil {
		RespondError(w, http.StatusInternalServerError, err.Error())
		return
	}

	// Fetch attendees matching Next.js query shape
	attendees := []struct {
		ID                 string  `json:"id"`
		AttendeeName       string  `json:"attendee_name"`
		RegistrationNumber string  `json:"registration_number"`
		RegistrationType   string  `json:"registration_type"`
		OriginChurch       *string `json:"origin_church"`
	}{}
	rows, err := db.Pool.Query(r.Context(), `
		SELECT id, attendee_name, registration_number, registration_type, origin_church
		FROM event_attendees
		WHERE order_id = $1
	`, o.ID)
	if err != nil {
		RespondError(w, http.StatusInternalServerError, err.Error())
		return
	}
	defer rows.Close()

	for rows.Next() {
		var a struct {
			ID                 string  `json:"id"`
			AttendeeName       string  `json:"attendee_name"`
			RegistrationNumber string  `json:"registration_number"`
			RegistrationType   string  `json:"registration_type"`
			OriginChurch       *string `json:"origin_church"`
		}
		if err := rows.Scan(&a.ID, &a.AttendeeName, &a.RegistrationNumber, &a.RegistrationType, &a.OriginChurch); err != nil {
			RespondError(w, http.StatusInternalServerError, err.Error())
			return
		}
		attendees = append(attendees, a)
	}

	// Build the response struct that matches what frontend expects
	response := struct {
		models.RegistrationOrder
		Events         interface{} `json:"events"`
		EventAttendees interface{} `json:"event_attendees"`
	}{
		RegistrationOrder: o,
		Events:            event,
		EventAttendees:    attendees,
	}

	RespondJSON(w, http.StatusOK, response)
}

// UpdateOrderStatus handles PUT /api/orders/{id}/status (admin only)
// When status changes to PAID, fires an async WhatsApp notification via Fonnte.
func UpdateOrderStatus(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	var body struct {
		Status string `json:"status"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil || body.Status == "" {
		RespondError(w, http.StatusBadRequest, "status is required")
		return
	}

	_, err := db.Pool.Exec(r.Context(),
		`UPDATE registration_orders SET status=$1 WHERE id=$2`,
		body.Status, id,
	)
	if err != nil {
		RespondError(w, http.StatusInternalServerError, err.Error())
		return
	}

	// Fire WhatsApp notification in background — never blocks the response
	if body.Status == "PAID" {
		go sendPaidNotification(id)
	}

	RespondJSON(w, http.StatusOK, map[string]bool{"success": true})
}

// UpdateOrderProof handles PUT /api/orders/{id}/proof (public — called by attendee)
func UpdateOrderProof(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	var body struct {
		PaymentProofURL string `json:"payment_proof_url"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil || body.PaymentProofURL == "" {
		RespondError(w, http.StatusBadRequest, "payment_proof_url is required")
		return
	}

	_, err := db.Pool.Exec(r.Context(),
		`UPDATE registration_orders SET payment_proof_url=$1, status='PENDING' WHERE id=$2`,
		body.PaymentProofURL, id,
	)
	if err != nil {
		RespondError(w, http.StatusInternalServerError, err.Error())
		return
	}

	RespondJSON(w, http.StatusOK, map[string]bool{"success": true})
}

// BulkUpdateOrderStatus handles PUT /api/orders/bulk-status (admin only)
func BulkUpdateOrderStatus(w http.ResponseWriter, r *http.Request) {
	var body struct {
		OrderIDs []string `json:"order_ids"`
		Status   string   `json:"status"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil || body.Status == "" || len(body.OrderIDs) == 0 {
		RespondError(w, http.StatusBadRequest, "order_ids and status are required")
		return
	}

	_, err := db.Pool.Exec(r.Context(),
		`UPDATE registration_orders SET status=$2 WHERE id = ANY($1)`,
		body.OrderIDs, body.Status,
	)
	if err != nil {
		RespondError(w, http.StatusInternalServerError, err.Error())
		return
	}

	// Fire WhatsApp notification in background for each
	if body.Status == "PAID" {
		for _, id := range body.OrderIDs {
			go func(orderID string) {
				sendPaidNotification(orderID)
			}(id)
		}
	}

	RespondJSON(w, http.StatusOK, map[string]bool{"success": true})
}

// sendPaidNotification fetches order details and sends a WhatsApp confirmation.
// Always runs in a goroutine so it never blocks the HTTP response.
func sendPaidNotification(orderID string) {
	ctx := context.Background()

	var token string
	_ = db.Pool.QueryRow(ctx,
		`SELECT value FROM app_settings WHERE key='fonnte_token'`,
	).Scan(&token)

	if token == "" {
		return
	}

	var picWhatsapp, picName, eventTitle string
	_ = db.Pool.QueryRow(ctx, `
		SELECT o.pic_whatsapp, o.pic_name, COALESCE(e.title, 'event')
		FROM registration_orders o
		LEFT JOIN events e ON e.id = o.event_id
		WHERE o.id = $1
	`, orderID).Scan(&picWhatsapp, &picName, &eventTitle)

	if picWhatsapp == "" {
		return
	}

	appURL := os.Getenv("APP_URL")
	if appURL == "" {
		appURL = "https://wowministry.id"
	}

	message := "Halo " + picName + "! 🎉\n\n" +
		"Pembayaran kamu untuk *" + eventTitle + "* sudah kami konfirmasi!\n\n" +
		"Tiket kamu sekarang sudah aktif. Kamu bisa cek tiket kamu di sini:\n" +
		appURL + "/my-ticket\n\n" +
		"Sampai jumpa di acara! 🙏"

	fonnte.SendWhatsApp(token, picWhatsapp, message)
}

package handlers

import (
	"encoding/json"
	"log"
	"net/http"
	"regexp"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/wowministry/api/internal/db"
	"github.com/wowministry/api/internal/models"
)

// ListEvents handles GET /api/events
// Returns all events ordered by event_date desc, with their ticket tiers.
func ListEvents(w http.ResponseWriter, r *http.Request) {
	rows, err := db.Pool.Query(r.Context(), `
		SELECT id, title, description, slug, event_type, parent_event_id,
		       event_date, event_end_date, location, meeting_url, checkin_window_minutes, is_published,
		       theme_color, cover_image_url, content_blocks, created_at
		FROM events
		ORDER BY event_date DESC
	`)
	if err != nil {
		RespondError(w, http.StatusInternalServerError, err.Error())
		return
	}
	defer rows.Close()

	events := []models.Event{}
	for rows.Next() {
		var e models.Event
		var contentBlocksRaw []byte
		if err := rows.Scan(
			&e.ID, &e.Title, &e.Description, &e.Slug, &e.EventType, &e.ParentEventID,
			&e.EventDate, &e.EventEndDate, &e.Location, &e.MeetingURL, &e.CheckinWindowMinutes, &e.IsPublished,
			&e.ThemeColor, &e.CoverImageURL, &contentBlocksRaw, &e.CreatedAt,
		); err != nil {
			RespondError(w, http.StatusInternalServerError, err.Error())
			return
		}
		_ = json.Unmarshal(contentBlocksRaw, &e.ContentBlocks)
		events = append(events, e)
	}

	RespondJSON(w, http.StatusOK, events)
}

// ListPublicEvents handles GET /api/events/public
// Returns only published events ordered by event_date desc.
func ListPublicEvents(w http.ResponseWriter, r *http.Request) {
	rows, err := db.Pool.Query(r.Context(), `
		SELECT id, title, description, slug, event_type, parent_event_id,
		       event_date, event_end_date, location, meeting_url, checkin_window_minutes, is_published,
		       theme_color, cover_image_url, content_blocks, created_at
		FROM events
		WHERE is_published = true
		ORDER BY event_date DESC
	`)
	if err != nil {
		RespondError(w, http.StatusInternalServerError, err.Error())
		return
	}
	defer rows.Close()

	events := []models.Event{}
	for rows.Next() {
		var e models.Event
		var contentBlocksRaw []byte
		if err := rows.Scan(
			&e.ID, &e.Title, &e.Description, &e.Slug, &e.EventType, &e.ParentEventID,
			&e.EventDate, &e.EventEndDate, &e.Location, &e.MeetingURL, &e.CheckinWindowMinutes, &e.IsPublished,
			&e.ThemeColor, &e.CoverImageURL, &contentBlocksRaw, &e.CreatedAt,
		); err != nil {
			RespondError(w, http.StatusInternalServerError, err.Error())
			return
		}
		_ = json.Unmarshal(contentBlocksRaw, &e.ContentBlocks)
		events = append(events, e)
	}

	RespondJSON(w, http.StatusOK, events)
}

// GetEvent handles GET /api/events/{id}
// Returns a single event with all its ticket tiers.
func GetEvent(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	var e models.Event
	var contentBlocksRaw []byte
	err := db.Pool.QueryRow(r.Context(), `
		SELECT id, title, description, slug, event_type, parent_event_id,
		       event_date, event_end_date, location, meeting_url, checkin_window_minutes, is_published,
		       theme_color, cover_image_url, content_blocks, created_at
		FROM events WHERE id = $1
	`, id).Scan(
		&e.ID, &e.Title, &e.Description, &e.Slug, &e.EventType, &e.ParentEventID,
		&e.EventDate, &e.EventEndDate, &e.Location, &e.MeetingURL, &e.CheckinWindowMinutes, &e.IsPublished,
		&e.ThemeColor, &e.CoverImageURL, &contentBlocksRaw, &e.CreatedAt,
	)
	if err != nil {
		RespondError(w, http.StatusNotFound, "event not found")
		return
	}
	_ = json.Unmarshal(contentBlocksRaw, &e.ContentBlocks)

	// Fetch ticket tiers
	tierRows, err := db.Pool.Query(r.Context(), `
		SELECT id, event_id, name, price, description, min_qty, max_qty,
		       start_date, end_date, capacity, is_active, created_at
		FROM ticket_tiers WHERE event_id = $1 ORDER BY price ASC
	`, id)
	if err == nil {
		defer tierRows.Close()
		for tierRows.Next() {
			var t models.TicketTier
			_ = tierRows.Scan(
				&t.ID, &t.EventID, &t.Name, &t.Price, &t.Description, &t.MinQty, &t.MaxQty,
				&t.StartDate, &t.EndDate, &t.Capacity, &t.IsActive, &t.CreatedAt,
			)
			e.TicketTiers = append(e.TicketTiers, t)
		}
	}

	RespondJSON(w, http.StatusOK, e)
}

// GetEventBySlug handles GET /api/events/slug/{slug}
// Used by the public registration page.
func GetEventBySlug(w http.ResponseWriter, r *http.Request) {
	slug := chi.URLParam(r, "slug")

	var e models.Event
	var contentBlocksRaw []byte
	err := db.Pool.QueryRow(r.Context(), `
		SELECT id, title, description, slug, event_type, parent_event_id,
		       event_date, event_end_date, location, meeting_url, checkin_window_minutes, is_published,
		       theme_color, cover_image_url, content_blocks, created_at
		FROM events WHERE slug = $1 AND is_published = true
	`, slug).Scan(
		&e.ID, &e.Title, &e.Description, &e.Slug, &e.EventType, &e.ParentEventID,
		&e.EventDate, &e.EventEndDate, &e.Location, &e.MeetingURL, &e.CheckinWindowMinutes, &e.IsPublished,
		&e.ThemeColor, &e.CoverImageURL, &contentBlocksRaw, &e.CreatedAt,
	)
	if err != nil {
		RespondError(w, http.StatusNotFound, "event not found")
		return
	}
	_ = json.Unmarshal(contentBlocksRaw, &e.ContentBlocks)

	tierRows, _ := db.Pool.Query(r.Context(), `
		SELECT id, event_id, name, price, description, min_qty, max_qty,
		       start_date, end_date, capacity, is_active, created_at
		FROM ticket_tiers WHERE event_id = $1 AND is_active = true ORDER BY price ASC
	`, e.ID)
	if tierRows != nil {
		defer tierRows.Close()
		for tierRows.Next() {
			var t models.TicketTier
			_ = tierRows.Scan(
				&t.ID, &t.EventID, &t.Name, &t.Price, &t.Description, &t.MinQty, &t.MaxQty,
				&t.StartDate, &t.EndDate, &t.Capacity, &t.IsActive, &t.CreatedAt,
			)
			e.TicketTiers = append(e.TicketTiers, t)
		}
	}

	voucherRows, _ := db.Pool.Query(r.Context(), `
		SELECT id, event_id, code, discount_amount, discount_type, usage_limit,
		       usage_count, start_date, end_date, is_active, created_at
		FROM event_vouchers WHERE event_id = $1 AND is_active = true
	`, e.ID)
	if voucherRows != nil {
		defer voucherRows.Close()
		for voucherRows.Next() {
			var v models.EventVoucher
			_ = voucherRows.Scan(
				&v.ID, &v.EventID, &v.Code, &v.DiscountAmount, &v.DiscountType, &v.UsageLimit,
				&v.UsageCount, &v.StartDate, &v.EndDate, &v.IsActive, &v.CreatedAt,
			)
			e.EventVouchers = append(e.EventVouchers, v)
		}
	}

	RespondJSON(w, http.StatusOK, e)
}

type createEventRequest struct {
	Title         string      `json:"title"`
	Description   *string     `json:"description"`
	Slug          string      `json:"slug"`
	EventType     string      `json:"event_type"`
	ParentEventID *string     `json:"parent_event_id"`
	EventDate     string      `json:"event_date"` // RFC3339
	EventEndDate  *string     `json:"event_end_date"`
	Location      *string     `json:"location"`
	MeetingURL    *string     `json:"meeting_url"`
	CheckinWindowMinutes *int `json:"checkin_window_minutes"`
	IsPublished   bool        `json:"is_published"`
	ThemeColor    string      `json:"theme_color"`
	CoverImageURL *string     `json:"cover_image_url"`
	ContentBlocks interface{} `json:"content_blocks"`
	TicketTiers   []struct {
		ID          *string  `json:"id"`
		Name        string   `json:"name"`
		Price       float64  `json:"price"`
		Description *string  `json:"description"`
		MinQty      int      `json:"min_qty"`
		MaxQty      *int     `json:"max_qty"`
		StartDate   *string  `json:"start_date"`
		EndDate     *string  `json:"end_date"`
		Capacity    *int     `json:"capacity"`
	} `json:"ticket_tiers"`
	Vouchers []struct {
		Code       string   `json:"code"`
		Discount   float64  `json:"discount"`
		Type       string   `json:"type"`
		UsageLimit *int     `json:"usage_limit"`
		StartDate  *string  `json:"start_date"`
		EndDate    *string  `json:"end_date"`
	} `json:"vouchers"`
}

func slugify(s string) string {
	s = strings.ToLower(s)
	re := regexp.MustCompile(`[^a-z0-9-]+`)
	s = re.ReplaceAllString(s, "-")
	s = strings.Trim(s, "-")
	return s
}

// CreateEvent handles POST /api/events (admin only)
func CreateEvent(w http.ResponseWriter, r *http.Request) {
	var req createEventRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		RespondError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if req.Title == "" || req.Slug == "" || req.EventDate == "" {
		RespondError(w, http.StatusBadRequest, "title, slug, and event_date are required")
		return
	}

	slug := slugify(req.Slug)
	eventType := req.EventType
	if eventType == "" {
		eventType = "SINGLE"
	}
	themeColor := req.ThemeColor
	if themeColor == "" {
		themeColor = "purple"
	}

	contentBlocksJSON, _ := json.Marshal(req.ContentBlocks)
	if contentBlocksJSON == nil {
		contentBlocksJSON = []byte("[]")
	}

	eventDate, err := time.Parse(time.RFC3339, req.EventDate)
	if err != nil {
		RespondError(w, http.StatusBadRequest, "invalid event_date format, use RFC3339")
		return
	}
	eventEndDate := parseOptionalTime(req.EventEndDate)

	var eventID string
	err = db.Pool.QueryRow(r.Context(), `
		INSERT INTO events (title, description, slug, event_type, parent_event_id,
		                    event_date, event_end_date, location, meeting_url, checkin_window_minutes, is_published,
		                    theme_color, cover_image_url, content_blocks)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
		RETURNING id
	`,
		req.Title, req.Description, slug, eventType, req.ParentEventID,
		eventDate, eventEndDate, req.Location, req.MeetingURL, req.CheckinWindowMinutes, req.IsPublished,
		themeColor, req.CoverImageURL, contentBlocksJSON,
	).Scan(&eventID)
	if err != nil {
		if strings.Contains(err.Error(), "23505") {
			RespondError(w, http.StatusConflict, "an event with this slug already exists")
			return
		}
		RespondError(w, http.StatusInternalServerError, err.Error())
		return
	}

	// Insert ticket tiers
	for _, tier := range req.TicketTiers {
		name := tier.Name
		if name == "" {
			name = "Regular"
		}
		_, _ = db.Pool.Exec(r.Context(), `
			INSERT INTO ticket_tiers (event_id, name, price, description, min_qty, max_qty,
			                         start_date, end_date, capacity, is_active)
			VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,true)
		`, eventID, name, tier.Price, tier.Description, tier.MinQty, tier.MaxQty,
			parseOptionalTime(tier.StartDate), parseOptionalTime(tier.EndDate), tier.Capacity)
	}

	// Insert vouchers
	for _, v := range req.Vouchers {
		code := strings.ToUpper(strings.TrimSpace(v.Code))
		if code == "" {
			continue
		}
		discountType := strings.ToUpper(v.Type)
		if discountType == "" {
			discountType = "PERCENT"
		}
		_, _ = db.Pool.Exec(r.Context(), `
			INSERT INTO event_vouchers (event_id, code, discount_amount, discount_type, usage_limit, start_date, end_date, is_active)
			VALUES ($1,$2,$3,$4,$5,$6,$7,true)
		`, eventID, code, v.Discount, discountType, v.UsageLimit,
			parseOptionalTime(v.StartDate), parseOptionalTime(v.EndDate))
	}

	RespondJSON(w, http.StatusCreated, map[string]string{"id": eventID})
}

// UpdateEvent handles PUT /api/events/{id} (admin only)
func UpdateEvent(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	var req createEventRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		RespondError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if req.Title == "" || req.Slug == "" || req.EventDate == "" {
		RespondError(w, http.StatusBadRequest, "title, slug, and event_date are required")
		return
	}

	slug := slugify(req.Slug)
	eventType := req.EventType
	if eventType == "" {
		eventType = "SINGLE"
	}
	themeColor := req.ThemeColor
	if themeColor == "" {
		themeColor = "purple"
	}

	eventDate, err := time.Parse(time.RFC3339, req.EventDate)
	if err != nil {
		RespondError(w, http.StatusBadRequest, "invalid event_date format, use RFC3339")
		return
	}
	eventEndDate := parseOptionalTime(req.EventEndDate)

	contentBlocksJSON, _ := json.Marshal(req.ContentBlocks)
	if contentBlocksJSON == nil {
		contentBlocksJSON = []byte("[]")
	}

	_, err = db.Pool.Exec(r.Context(), `
		UPDATE events SET title=$1, description=$2, slug=$3, event_type=$4, 
		                 parent_event_id=$5, event_date=$6, event_end_date=$7,
		                 location=$8, meeting_url=$9, checkin_window_minutes=$10, is_published=$11, 
		                 theme_color=$12, cover_image_url=$13, content_blocks=$14
		WHERE id=$15
	`,
		req.Title, req.Description, slug, eventType, req.ParentEventID,
		eventDate, eventEndDate, req.Location, req.MeetingURL, req.CheckinWindowMinutes, req.IsPublished,
		themeColor, req.CoverImageURL, contentBlocksJSON, id,
	)
	if err != nil {
		if strings.Contains(err.Error(), "23505") {
			RespondError(w, http.StatusConflict, "an event with this slug already exists")
			return
		}
		RespondError(w, http.StatusInternalServerError, err.Error())
		return
	}

	// Sync ticket tiers: upsert/delete
	existingRows, _ := db.Pool.Query(r.Context(), `SELECT id FROM ticket_tiers WHERE event_id=$1`, id)
	existingIDs := map[string]bool{}
	if existingRows != nil {
		defer existingRows.Close()
		for existingRows.Next() {
			var tid string
			_ = existingRows.Scan(&tid)
			existingIDs[tid] = true
		}
	}

	incomingIDs := map[string]bool{}
	for _, tier := range req.TicketTiers {
		if tier.ID != nil && *tier.ID != "" {
			incomingIDs[*tier.ID] = true
		}
	}

	// Delete tiers no longer present
	for eid := range existingIDs {
		if !incomingIDs[eid] {
			_, _ = db.Pool.Exec(r.Context(), `DELETE FROM ticket_tiers WHERE id=$1`, eid)
		}
	}

	// Upsert tiers
	for _, tier := range req.TicketTiers {
		name := tier.Name
		if name == "" {
			name = "Regular"
		}
		startDate := parseOptionalTime(tier.StartDate)
		endDate := parseOptionalTime(tier.EndDate)
		if tier.ID != nil && existingIDs[*tier.ID] {
			_, _ = db.Pool.Exec(r.Context(), `
				UPDATE ticket_tiers SET name=$1, price=$2, description=$3, min_qty=$4,
				  max_qty=$5, start_date=$6, end_date=$7, capacity=$8
				WHERE id=$9
			`, name, tier.Price, tier.Description, tier.MinQty,
				tier.MaxQty, startDate, endDate, tier.Capacity, tier.ID)
		} else {
			_, _ = db.Pool.Exec(r.Context(), `
				INSERT INTO ticket_tiers (event_id, name, price, description, min_qty, max_qty,
				                         start_date, end_date, capacity, is_active)
				VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,true)
			`, id, name, tier.Price, tier.Description, tier.MinQty,
				tier.MaxQty, startDate, endDate, tier.Capacity)
		}
	}

	// Sync vouchers: load existing by code, then update/insert/delete without ON CONFLICT
	log.Printf("[voucher-sync] incoming vouchers count: %d", len(req.Vouchers))
	type existingVoucher struct{ id string }
	existingByCode := map[string]existingVoucher{}
	voucherCodeRows, _ := db.Pool.Query(r.Context(), `SELECT id, code FROM event_vouchers WHERE event_id=$1`, id)
	if voucherCodeRows != nil {
		for voucherCodeRows.Next() {
			var vid, vcode string
			_ = voucherCodeRows.Scan(&vid, &vcode)
			existingByCode[vcode] = existingVoucher{id: vid}
		}
		voucherCodeRows.Close()
	}
	log.Printf("[voucher-sync] existing vouchers in db: %d", len(existingByCode))

	incomingVoucherCodes := map[string]bool{}
	for _, v := range req.Vouchers {
		code := strings.ToUpper(strings.TrimSpace(v.Code))
		if code == "" {
			continue
		}
		incomingVoucherCodes[code] = true
		discountType := strings.ToUpper(v.Type)
		if discountType == "" {
			discountType = "PERCENT"
		}
		if existing, found := existingByCode[code]; found {
			_, err := db.Pool.Exec(r.Context(), `
				UPDATE event_vouchers
				SET discount_amount=$1, discount_type=$2, usage_limit=$3, start_date=$4, end_date=$5
				WHERE id=$6
			`, v.Discount, discountType, v.UsageLimit,
				parseOptionalTime(v.StartDate), parseOptionalTime(v.EndDate), existing.id)
			log.Printf("[voucher-sync] UPDATE %s err=%v", code, err)
		} else {
			_, err := db.Pool.Exec(r.Context(), `
				INSERT INTO event_vouchers (event_id, code, discount_amount, discount_type, usage_limit, start_date, end_date, is_active)
				VALUES ($1,$2,$3,$4,$5,$6,$7,true)
			`, id, code, v.Discount, discountType, v.UsageLimit,
				parseOptionalTime(v.StartDate), parseOptionalTime(v.EndDate))
			log.Printf("[voucher-sync] INSERT %s discount=%.2f type=%s err=%v", code, v.Discount, discountType, err)
		}
	}

	// Delete vouchers no longer in the list
	for code, existing := range existingByCode {
		if !incomingVoucherCodes[code] {
			_, err := db.Pool.Exec(r.Context(), `DELETE FROM event_vouchers WHERE id=$1`, existing.id)
			log.Printf("[voucher-sync] DELETE %s err=%v", code, err)
		}
	}

	RespondJSON(w, http.StatusOK, map[string]bool{"success": true})
}

// DeleteEvent handles DELETE /api/events/{id} (admin only)
func DeleteEvent(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	_, err := db.Pool.Exec(r.Context(), `DELETE FROM events WHERE id=$1`, id)
	if err != nil {
		RespondError(w, http.StatusInternalServerError, err.Error())
		return
	}
	RespondJSON(w, http.StatusOK, map[string]bool{"success": true})
}

// RegisterForEvent handles POST /api/events/register (public)
// Calls the `register_for_event` Postgres RPC function after resolving CRM records.
func RegisterForEvent(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Order     map[string]interface{}   `json:"order"`
		Attendees []map[string]interface{} `json:"attendees"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		RespondError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	eventSlug := ""
	if slug, ok := body.Order["event_slug"].(string); ok {
		eventSlug = slug
	}
	if eventSlug == "" {
		eventSlug = "EVNT"
	}

	baseRegNumber := eventSlug
	if len(baseRegNumber) > 4 {
		baseRegNumber = baseRegNumber[:4]
	}
	baseRegNumber = strings.ToUpper(baseRegNumber) + "-" + time.Now().Format("0500")

	// Resolve person IDs via CRM soft-match
	for i, attendee := range body.Attendees {
		var matchedPersonID *string
		email, _ := attendee["email"].(string)
		whatsapp, _ := attendee["whatsapp"].(string)
		name, _ := attendee["name"].(string)
		gender, _ := attendee["gender"].(string)
		birthDate, _ := attendee["birth_date"].(string)
		churchTitle, _ := attendee["origin_church"].(string)

		if email != "" || whatsapp != "" {
			var id string
			err := db.Pool.QueryRow(r.Context(), `
				SELECT id FROM people
				WHERE ($1 != '' AND email = $1) OR ($2 != '' AND whatsapp_number = $2)
				LIMIT 1
			`, email, whatsapp).Scan(&id)
			
			if err == nil {
				matchedPersonID = &id
				// Update existing person
				_, _ = db.Pool.Exec(r.Context(), `
					UPDATE people 
					SET full_name = COALESCE(NULLIF($1, ''), full_name),
					    email = COALESCE(NULLIF($2, ''), email),
					    whatsapp_number = COALESCE(NULLIF($3, ''), whatsapp_number),
					    gender = COALESCE(NULLIF($4, ''), gender),
					    birth_date = COALESCE(NULLIF($5, ''), birth_date),
					    church_title = COALESCE(NULLIF($6, ''), church_title)
					WHERE id = $7
				`, name, email, whatsapp, gender, birthDate, churchTitle, id)
			}
		}

		if matchedPersonID == nil {
			// Insert new person
			var newID string
			err := db.Pool.QueryRow(r.Context(), `
				INSERT INTO people (full_name, email, whatsapp_number, gender, birth_date, church_title)
				VALUES ($1, NULLIF($2, ''), NULLIF($3, ''), NULLIF($4, ''), NULLIF($5, ''), NULLIF($6, ''))
				RETURNING id
			`, name, email, whatsapp, gender, birthDate, churchTitle).Scan(&newID)
			if err == nil {
				matchedPersonID = &newID
			}
		}

		// Link Ministry Roles to the person in CRM
		if matchedPersonID != nil {
			if rolesString, ok := attendee["ministry_role"].(string); ok && rolesString != "" {
				roles := strings.Split(rolesString, ",")
				for _, roleName := range roles {
					roleName = strings.TrimSpace(roleName)
					if roleName == "" {
						continue
					}
					var roleID string
					err := db.Pool.QueryRow(r.Context(), `SELECT id FROM ministry_roles WHERE name ILIKE $1 LIMIT 1`, roleName).Scan(&roleID)
	if err != nil {
						_ = db.Pool.QueryRow(r.Context(), `INSERT INTO ministry_roles (name) VALUES ($1) RETURNING id`, roleName).Scan(&roleID)
					}
					if roleID != "" {
						_, _ = db.Pool.Exec(r.Context(), `
							INSERT INTO person_roles (person_id, role_id) VALUES ($1, $2)
							ON CONFLICT (person_id, role_id) DO NOTHING
						`, *matchedPersonID, roleID)
					}
				}
			}
			body.Attendees[i]["person_id"] = *matchedPersonID
		}
		
		body.Attendees[i]["registration_number"] = baseRegNumber
		if rType, ok := attendee["type"].(string); ok {
			body.Attendees[i]["registration_type"] = rType
		} else {
			body.Attendees[i]["registration_type"] = "GENERAL"
		}
		body.Attendees[i]["attendee_name"] = name
		body.Attendees[i]["attendee_email"] = email
		body.Attendees[i]["attendee_whatsapp"] = whatsapp
		body.Attendees[i]["church_title"] = churchTitle
	}

	orderJSON, _ := json.Marshal(body.Order)
	attendeesJSON, _ := json.Marshal(body.Attendees)

	var orderID string
	err := db.Pool.QueryRow(r.Context(),
		`SELECT register_for_event($1::jsonb, $2::jsonb)`,
		string(orderJSON), string(attendeesJSON),
	).Scan(&orderID)
	if err != nil {
		RespondError(w, http.StatusBadRequest, err.Error())
		return
	}

	RespondJSON(w, http.StatusCreated, map[string]string{"order_id": orderID})
}

// parseOptionalTime safely parses an optional RFC 3339 timestamp pointer.
// Returns nil if the pointer is nil, empty, or unparseable.
func parseOptionalTime(ts *string) *time.Time {
	if ts == nil || *ts == "" {
		return nil
	}
	t, err := time.Parse(time.RFC3339, *ts)
	if err != nil {
		// Also try without nanoseconds (e.g. "2006-01-02T15:04:05Z")
		t, err = time.Parse("2006-01-02T15:04:05Z07:00", *ts)
		if err != nil {
			return nil
		}
	}
	return &t
}

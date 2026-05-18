// Package models defines Go structs that map to the Supabase PostgreSQL schema.
// Field names use json tags to match the database column names exactly.
package models

import "time"

// Church maps to the `churches` table.
type Church struct {
	ID        string    `json:"id"`
	Name      string    `json:"name"`
	CreatedAt time.Time `json:"created_at"`
}

// MinistryRole maps to the `ministry_roles` table.
type MinistryRole struct {
	ID        string    `json:"id"`
	Name      string    `json:"name"`
	CreatedAt time.Time `json:"created_at"`
}

// Person maps to the `people` table (CRM master record).
type Person struct {
	ID             string    `json:"id"`
	Email          *string   `json:"email"`
	WhatsappNumber *string   `json:"whatsapp_number"`
	FullName       string    `json:"full_name"`
	ChurchTitle    *string   `json:"church_title"`
	Gender         *string   `json:"gender"`
	BirthDate      *string   `json:"birth_date"` // DATE stored as string for simplicity
	ChurchID       *string   `json:"church_id"`
	CreatedAt      time.Time `json:"created_at"`
	LastUpdatedAt  time.Time `json:"last_updated_at"`
	// Joined fields (not in table, populated by query)
	ChurchName *string  `json:"church_name,omitempty"`
	Roles      []string `json:"roles,omitempty"`
}

// PersonRole maps to the `person_roles` join table.
type PersonRole struct {
	PersonID string `json:"person_id"`
	RoleID   string `json:"role_id"`
}

// Event maps to the `events` table.
type Event struct {
	ID                   string      `json:"id"`
	Title                string      `json:"title"`
	Description          *string     `json:"description"`
	Slug                 string      `json:"slug"`
	EventType            string      `json:"event_type"`
	ParentEventID        *string     `json:"parent_event_id"`
	EventDate            time.Time   `json:"event_date"`
	EventEndDate         *time.Time  `json:"event_end_date"`
	Location             *string     `json:"location"`
	MeetingURL           *string     `json:"meeting_url"`
	CheckinWindowMinutes *int        `json:"checkin_window_minutes"`
	IsPublished          bool        `json:"is_published"`
	ThemeColor           string      `json:"theme_color"`
	CoverImageURL        *string     `json:"cover_image_url"`
	ContentBlocks        interface{} `json:"content_blocks"` // JSONB — raw JSON
	CreatedAt            time.Time   `json:"created_at"`
	// Joined
	TicketTiers   []TicketTier   `json:"ticket_tiers,omitempty"`
	EventVouchers []EventVoucher `json:"event_vouchers,omitempty"`
}

// TicketTier maps to the `ticket_tiers` table.
type TicketTier struct {
	ID          string     `json:"id"`
	EventID     string     `json:"event_id"`
	Name        string     `json:"name"`
	Price       float64    `json:"price"`
	Description *string    `json:"description"`
	MinQty      int        `json:"min_qty"`
	MaxQty      *int       `json:"max_qty"`
	StartDate   *time.Time `json:"start_date"`
	EndDate     *time.Time `json:"end_date"`
	Capacity    *int       `json:"capacity"`
	IsActive    bool       `json:"is_active"`
	CreatedAt   time.Time  `json:"created_at"`
}

// EventVoucher maps to the `event_vouchers` table.
type EventVoucher struct {
	ID             string     `json:"id"`
	EventID        string     `json:"event_id"`
	Code           string     `json:"code"`
	DiscountAmount float64    `json:"discount_amount"`
	DiscountType   string     `json:"discount_type"`
	UsageLimit     *int       `json:"usage_limit"`
	UsageCount     int        `json:"usage_count"`
	StartDate      *time.Time `json:"start_date"`
	EndDate        *time.Time `json:"end_date"`
	IsActive       bool       `json:"is_active"`
	CreatedAt      time.Time  `json:"created_at"`
}

// RegistrationOrder maps to the `registration_orders` table.
type RegistrationOrder struct {
	ID                 string    `json:"id"`
	EventID            string    `json:"event_id"`
	PICName            string    `json:"pic_name"`
	PICEmail           string    `json:"pic_email"`
	PICWhatsapp        string    `json:"pic_whatsapp"`
	TotalTickets       int       `json:"total_tickets"`
	TotalAmount        float64   `json:"total_amount"`
	AppliedVoucher     *string   `json:"applied_voucher"`
	DiscountAmount     float64   `json:"discount_amount"`
	PaymentMethod      *string   `json:"payment_method"`
	PaymentReferenceID *string   `json:"payment_reference_id"`
	PaymentProofURL    *string   `json:"payment_proof_url"`
	Status             string    `json:"status"`
	CreatedAt          time.Time `json:"created_at"`
	// Joined
	EventTitle *string `json:"event_title,omitempty"`
}

// EventAttendee maps to the `event_attendees` table.
type EventAttendee struct {
	ID                 string     `json:"id"`
	OrderID            string     `json:"order_id"`
	PersonID           *string    `json:"person_id"`
	TicketTierID       *string    `json:"ticket_tier_id"`
	RegistrationNumber string     `json:"registration_number"`
	RegistrationType   string     `json:"registration_type"`
	AttendeeName       string     `json:"attendee_name"`
	AttendeeEmail      *string    `json:"attendee_email"`
	AttendeeWhatsapp   *string    `json:"attendee_whatsapp"`
	ChurchTitle        *string    `json:"church_title"`
	Gender             *string    `json:"gender"`
	BirthDate          *string    `json:"birth_date"`
	OriginChurch       *string    `json:"origin_church"`
	MinistryRole       *string    `json:"ministry_role"`
	AttendedAt         *time.Time `json:"attended_at"`
	CreatedAt          time.Time  `json:"created_at"`
	// Joined
	Status         string  `json:"status,omitempty"`
	EventID        string  `json:"event_id,omitempty"`
	PicName        *string `json:"pic_name,omitempty"`
	TicketTierName *string `json:"ticket_tier_name,omitempty"`
}

// AppSetting maps to the `app_settings` table (key-value store).
type AppSetting struct {
	Key       string    `json:"key"`
	Value     string    `json:"value"`
	UpdatedAt time.Time `json:"updated_at"`
}

// DashboardStats is a computed response for the analytics endpoint.
type DashboardStats struct {
	TotalMembers   int     `json:"total_members"`
	TotalEvents    int     `json:"total_events"`
	TotalOrders    int     `json:"total_orders"`
	PendingOrders  int     `json:"pending_orders"`
	TotalRevenue   float64 `json:"total_revenue"`
	TotalAttendees int     `json:"total_attendees"`
	// Distribution maps (populated by analytics handler)
	GenderDistribution map[string]int `json:"gender_distribution,omitempty"`
	ChurchDistribution map[string]int `json:"church_distribution,omitempty"`
	RoleDistribution   map[string]int `json:"role_distribution,omitempty"`
}

package handlers

import (
	"net/http"

	"github.com/wowministry/api/internal/db"
	"github.com/wowministry/api/internal/models"
)

// GetDashboardStats handles GET /api/analytics/dashboard (admin only)
// Returns aggregate counts AND distribution breakdowns for the analytics page.
func GetDashboardStats(w http.ResponseWriter, r *http.Request) {
	stats := models.DashboardStats{}

	// ── Core counts ────────────────────────────────────────────────────────
	counts := []struct {
		sql  string
		dest interface{}
	}{
		{`SELECT COUNT(*) FROM people`, &stats.TotalMembers},
		{`SELECT COUNT(*) FROM events`, &stats.TotalEvents},
		{`SELECT COUNT(*) FROM registration_orders`, &stats.TotalOrders},
		{`SELECT COUNT(*) FROM registration_orders WHERE status='PENDING'`, &stats.PendingOrders},
		{`SELECT COALESCE(SUM(total_amount),0) FROM registration_orders WHERE status='PAID'`, &stats.TotalRevenue},
		{`SELECT COUNT(*) FROM event_attendees`, &stats.TotalAttendees},
	}
	for _, q := range counts {
		if err := db.Pool.QueryRow(r.Context(), q.sql).Scan(q.dest); err != nil {
			RespondError(w, http.StatusInternalServerError, err.Error())
			return
		}
	}

	// ── Gender distribution ─────────────────────────────────────────────────
	genderRows, err := db.Pool.Query(r.Context(), `
		SELECT COALESCE(gender, 'Unknown') AS gender, COUNT(*) AS cnt
		FROM people
		GROUP BY gender
		ORDER BY cnt DESC
	`)
	if err == nil {
		defer genderRows.Close()
		stats.GenderDistribution = map[string]int{}
		for genderRows.Next() {
			var gender string
			var cnt int
			if err := genderRows.Scan(&gender, &cnt); err == nil {
				stats.GenderDistribution[gender] = cnt
			}
		}
	}

	// ── Church distribution (by member count) ──────────────────────────────
	churchRows, err := db.Pool.Query(r.Context(), `
		SELECT COALESCE(c.name, 'Unknown / No Church Listed') AS church_name, COUNT(p.id) AS cnt
		FROM people p
		LEFT JOIN churches c ON c.id = p.church_id
		GROUP BY c.name
		ORDER BY cnt DESC
		LIMIT 30
	`)
	if err == nil {
		defer churchRows.Close()
		stats.ChurchDistribution = map[string]int{}
		for churchRows.Next() {
			var name string
			var cnt int
			if err := churchRows.Scan(&name, &cnt); err == nil {
				stats.ChurchDistribution[name] = cnt
			}
		}
	}

	// ── Ministry role distribution ──────────────────────────────────────────
	roleRows, err := db.Pool.Query(r.Context(), `
		SELECT mr.name, COUNT(pr.person_id) AS cnt
		FROM ministry_roles mr
		JOIN person_roles pr ON pr.role_id = mr.id
		GROUP BY mr.name
		ORDER BY cnt DESC
		LIMIT 20
	`)
	if err == nil {
		defer roleRows.Close()
		stats.RoleDistribution = map[string]int{}
		for roleRows.Next() {
			var name string
			var cnt int
			if err := roleRows.Scan(&name, &cnt); err == nil {
				stats.RoleDistribution[name] = cnt
			}
		}
	}

	RespondJSON(w, http.StatusOK, stats)
}

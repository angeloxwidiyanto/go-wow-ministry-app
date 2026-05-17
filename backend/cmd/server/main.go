package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/go-chi/chi/v5"
	chiMiddleware "github.com/go-chi/chi/v5/middleware"
	"github.com/joho/godotenv"
	"github.com/rs/cors"
	"github.com/wowministry/api/internal/auth"
	"github.com/wowministry/api/internal/db"
	"github.com/wowministry/api/internal/handlers"
	"github.com/wowministry/api/internal/middleware"
)

func main() {
	// Load .env file (ignored in production where env vars are injected by Docker)
	_ = godotenv.Load()

	// Connect to Supabase Postgres
	ctx := context.Background()
	if err := db.Connect(ctx); err != nil {
		log.Fatalf("❌ Database connection failed: %v", err)
	}
	defer db.Close()
	log.Println("✅ Database connected")

	// Initialize JWKS cache for validating Supabase JWTs
	if err := auth.InitJWKS(); err != nil {
		log.Fatalf("❌ JWKS initialization failed: %v", err)
	}
	log.Println("✅ JWKS cache initialized")

	r := chi.NewRouter()

	// ── Global Middleware ────────────────────────────────────────────────────
	r.Use(chiMiddleware.Logger)
	r.Use(chiMiddleware.Recoverer)
	r.Use(chiMiddleware.RealIP)
	r.Use(chiMiddleware.Timeout(30 * time.Second))

	// CORS — only Next.js frontend needs direct access in dev.
	// In production, Caddy proxies both so CORS is less critical.
	frontendURL := os.Getenv("FRONTEND_URL")
	if frontendURL == "" {
		frontendURL = "http://localhost:3000"
	}
	c := cors.New(cors.Options{
		AllowedOrigins:   []string{frontendURL},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Authorization", "Content-Type"},
		AllowCredentials: true, // needed for cookie-based auth
	})
	r.Use(c.Handler)

	// ── Health Check ─────────────────────────────────────────────────────────
	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		handlers.RespondJSON(w, http.StatusOK, map[string]string{"status": "ok"})
	})

	// ── Public Routes (no auth required) ────────────────────────────────────
	r.Group(func(r chi.Router) {
		// Public event listing (published events only)
		r.Get("/api/events/public", handlers.ListPublicEvents)
		r.Get("/api/events/slug/{slug}", handlers.GetEventBySlug)

		// Event registration (public form submission)
		r.Post("/api/events/register", handlers.RegisterForEvent)

		// Payment proof upload (attendee self-service)
		r.Put("/api/orders/{id}/proof", handlers.UpdateOrderProof)

		// Ticket lookup by registration number
		r.Get("/api/attendees/lookup", handlers.GetAttendeeByRegNumber)

		// Public ticket search by email/whatsapp
		r.Get("/api/orders/search", handlers.PublicSearchOrders)

		// Fonnte webhook (Fonnte calls this, no auth)
		r.Get("/api/fonnte/webhook", handlers.FonnteWebhookGet)
		r.Post("/api/fonnte/webhook", handlers.FonnteWebhook)
	})

	// ── Protected Routes (JWT required) ──────────────────────────────────────
	r.Group(func(r chi.Router) {
		r.Use(middleware.RequireAuth)

		// Events (admin CRUD)
		r.Get("/api/events", handlers.ListEvents)
		r.Get("/api/events/{id}", handlers.GetEvent)
		r.Post("/api/events", handlers.CreateEvent)
		r.Put("/api/events/{id}", handlers.UpdateEvent)
		r.Delete("/api/events/{id}", handlers.DeleteEvent)

		// Orders
		r.Get("/api/orders", handlers.ListOrders)
		r.Get("/api/orders/{id}", handlers.GetOrder)
		r.Put("/api/orders/{id}/status", handlers.UpdateOrderStatus)
		r.Put("/api/orders/bulk-status", handlers.BulkUpdateOrderStatus)

		// Attendees
		r.Get("/api/attendees", handlers.ListAttendees)
		r.Post("/api/attendees/{id}/checkin", handlers.CheckInAttendee)

		// Members (CRM)
		r.Get("/api/members", handlers.ListMembers)
		r.Post("/api/members", handlers.CreateMember)
		r.Put("/api/members/{id}", handlers.UpdateMember)
		r.Post("/api/members/bulk", handlers.BulkAddMembers)

		// Settings
		r.Get("/api/settings", handlers.GetSettings)
		r.Put("/api/settings/fonnte-token", handlers.SaveFonnteToken)
		r.Get("/api/settings/fonnte-test", handlers.TestFonnteToken)

		// Uploads
		r.Post("/api/upload/cover", handlers.UploadCoverImage)

		// Fonnte send
		r.Post("/api/fonnte/send", handlers.SendWhatsApp)

		// Analytics
		r.Get("/api/analytics/dashboard", handlers.GetDashboardStats)

		// Pending Contacts (unmatched attendees → CRM)
		r.Get("/api/pending-contacts", handlers.ListPendingContacts)
		r.Post("/api/pending-contacts/create-person", handlers.CreatePersonFromAttendee)
		r.Post("/api/pending-contacts/merge", handlers.MergeWithExistingPerson)
		r.Post("/api/pending-contacts/bulk-create", handlers.BulkCreatePersonsFromAttendees)
	})

	// ── Start Server ─────────────────────────────────────────────────────────
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	srv := &http.Server{
		Addr:         fmt.Sprintf(":%s", port),
		Handler:      r,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	// Graceful shutdown
	go func() {
		quit := make(chan os.Signal, 1)
		signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
		<-quit
		log.Println("⏳ Shutting down server...")

		shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()
		if err := srv.Shutdown(shutdownCtx); err != nil {
			log.Printf("⚠️  Server forced to shutdown: %v", err)
		}
	}()

	log.Printf("🚀 Go API server running on :%s", port)
	if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		log.Fatalf("❌ Server error: %v", err)
	}
	log.Println("✅ Server stopped")
}

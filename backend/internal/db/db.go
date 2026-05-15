package db

import (
	"context"
	"fmt"
	"os"

	"github.com/jackc/pgx/v5/pgxpool"
)

// Pool is the shared database connection pool.
// Initialized once at startup via Connect().
var Pool *pgxpool.Pool

// Connect establishes the pgxpool using DATABASE_URL from environment.
func Connect(ctx context.Context) error {
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		return fmt.Errorf("DATABASE_URL environment variable is not set")
	}

	pool, err := pgxpool.New(ctx, dsn)
	if err != nil {
		return fmt.Errorf("unable to create connection pool: %w", err)
	}

	// Verify connectivity
	if err := pool.Ping(ctx); err != nil {
		pool.Close()
		return fmt.Errorf("unable to ping database: %w", err)
	}

	Pool = pool
	return nil
}

// Close gracefully shuts down the pool.
func Close() {
	if Pool != nil {
		Pool.Close()
	}
}

package postgres

import (
	"context"
	"log"
	"os"
	"sync"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

var (
	pool *pgxpool.Pool
	once sync.Once
)

// GetPool devuelve una instancia única del pool de conexiones.
func GetPool(ctx context.Context) (*pgxpool.Pool, error) {
	var err error
	once.Do(func() {
		connStr := os.Getenv("DATABASE_URL")
		if connStr == "" {
			log.Printf("⚠️ DATABASE_URL no está definida")
		}
		
		config, cfgErr := pgxpool.ParseConfig(connStr)
		if cfgErr != nil {
			err = cfgErr
			return
		}

		// Configuración crítica para PgBouncer (Supabase)
		// Desactiva el caché de sentencias preparadas para evitar el error 42P05
		config.ConnConfig.DefaultQueryExecMode = pgx.QueryExecModeSimpleProtocol
		config.MaxConns = 10
		
		pool, err = pgxpool.NewWithConfig(ctx, config)
		if err == nil {
			log.Printf("✅ Pool de base de datos inicializado")
		}
	})
	return pool, err
}

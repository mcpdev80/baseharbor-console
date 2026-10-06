// Test-only fixture copied into the checked-out Core module before execution.
package main

import (
	"context"
	"fmt"
	"os"
	"time"

	"github.com/mcpdev80/baseharbor/internal/authorization"
	"github.com/mcpdev80/baseharbor/internal/database"
)

func main() {
	ctx, cancel := context.WithTimeout(context.Background(), time.Minute)
	defer cancel()
	pool, err := database.Open(ctx, database.Config{DSN: os.Getenv("BASEHARBOR_API_DATABASE_URL")})
	if err != nil {
		panic(err)
	}
	defer pool.Close()
	if err = database.Migrate(ctx, pool); err != nil {
		panic(err)
	}
	issuer := os.Getenv("BASEHARBOR_API_OIDC_ISSUER")
	if issuer != "https://localhost:8443/realms/baseharbor-browser" {
		panic("fixture issuer differs")
	}
	tx, err := pool.Begin(ctx)
	if err != nil {
		panic(err)
	}
	defer tx.Rollback(ctx)
	if _, err = tx.Exec(ctx, `INSERT INTO tenants(id,slug,name) VALUES('11111111-1111-4111-8111-111111111111','browser-fixture','Browser fixture')`); err != nil {
		panic(err)
	}
	if _, err = tx.Exec(ctx, `INSERT INTO external_identities(id,issuer,subject) VALUES('33333333-3333-4333-8333-333333333333',$1,'22222222-2222-4222-8222-222222222222')`, issuer); err != nil {
		panic(err)
	}
	if _, err = tx.Exec(ctx, `INSERT INTO memberships(id,tenant_id,external_identity_id,role) VALUES('44444444-4444-4444-8444-444444444444','11111111-1111-4111-8111-111111111111','33333333-3333-4333-8333-333333333333',$1)`, authorization.RoleViewer); err != nil {
		panic(err)
	}
	if err = tx.Commit(ctx); err != nil {
		panic(err)
	}
	fmt.Println("Native Core migrations and isolated OIDC membership seeded")
}

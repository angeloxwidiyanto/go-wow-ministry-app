package main

import (
	"encoding/base64"
	"fmt"
	"strings"

	"github.com/golang-jwt/jwt/v5"
)

func main() {
	// A typical supabase SSR cookie value starts with base64 encoded JSON.
	// Actually, let's just see what Next.js sets.
	jsonStr := `{"access_token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy.dummy"}`
	b64 := base64.RawURLEncoding.EncodeToString([]byte(jsonStr))
	tokenStr := b64 + ".something.else"
	
	claims := jwt.MapClaims{}
	token, _ := jwt.ParseWithClaims(tokenStr, claims, func(t *jwt.Token) (interface{}, error) {
		fmt.Printf("Header: %+v\n", t.Header)
		return []byte("secret"), nil
	})
	if token != nil {
		fmt.Printf("Token parsed somewhat? Header: %+v\n", token.Header)
	}
}

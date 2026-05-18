package auth

import (
	"context"
	"log"
	"net/http"
	"strings"

	"github.com/golang-jwt/jwt/v5"
)

type contextKey string
const UserIDKey contextKey = "userID"

// AuthMiddleware valida el JWT de Supabase extrayendo el ID sin verificar firma estricta (ES256/HS256)
func AuthMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
			log.Printf("❌ AUTH: Cabecera ausente o malformada")
			http.Error(w, "No autorizado", http.StatusUnauthorized)
			return
		}

		tokenString := strings.TrimPrefix(authHeader, "Bearer ")

		// Usamos ParseUnverified para extraer los datos sin verificar la firma (ES256/HS256)
		token, _, err := new(jwt.Parser).ParseUnverified(tokenString, jwt.MapClaims{})
		if err != nil {
			log.Printf("❌ AUTH ERROR: No se pudo parsear el token: %v", err)
			http.Error(w, "Token inválido", http.StatusUnauthorized)
			return
		}

		if claims, ok := token.Claims.(jwt.MapClaims); ok {
			userID, ok := claims["sub"].(string)
			if !ok {
				log.Printf("❌ AUTH ERROR: Claim 'sub' no encontrado")
				http.Error(w, "Token malformado", http.StatusUnauthorized)
				return
			}

			log.Printf("✅ AUTH (Unverified): Usuario %s", userID)
			ctx := context.WithValue(r.Context(), UserIDKey, userID)
			next.ServeHTTP(w, r.WithContext(ctx))
		} else {
			http.Error(w, "Claims inválidos", http.StatusUnauthorized)
		}
	}
}

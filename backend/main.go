package main

import (
	"clash_and_card/battle"
	"clash_and_card/upgrade"
	"clash_and_card/user"
	"context"
	"fmt"
	"os"

	"log"
	"net/http"

	"github.com/gorilla/mux"
	"github.com/joho/godotenv"
)

func main() {

	dir, _ := os.Getwd()
	log.Println("Current working dir:", dir)

	err := godotenv.Load()
	if err != nil {
		log.Fatal(err)
	}

	db := ConnectDB()
	defer db.Close()

	r := mux.NewRouter()

	r.Use(middlewareCORS)

	// User routes
	r.HandleFunc("/api/login", user.LoginHandler(db)).Methods("POST", "OPTIONS")
	r.HandleFunc("/api/check-email", user.CheckEmailHandler(db)).Methods("POST", "OPTIONS")
	r.HandleFunc("/api/register", user.RegisterHandler(db)).Methods("POST", "OPTIONS")
	r.Handle("/api/user", authMiddleware(user.GetUserHandler(db))).Methods("GET", "OPTIONS")
	r.Handle("/api/deck", authMiddleware(user.GetUserDeckHandler(db))).Methods("GET", "OPTIONS")

	// Battle routes
	r.Handle("/api/battle/start", authMiddleware(battle.StartBattleHandler(db))).Methods("POST", "OPTIONS")
	r.Handle("/api/battle/{matchID}/play", authMiddleware(battle.PlayCardHandler(db))).Methods("PUT", "OPTIONS")
	r.Handle("/api/battle/{matchID}/play/true-sight", authMiddleware(battle.TrueSightHandler())).Methods("PUT", "OPTIONS")
	r.HandleFunc("/ws/pvp", battle.HandlePVPWebSocket(db)).Methods("GET")

	// Upgrade routes
	r.Handle("/api/change-class", authMiddleware(upgrade.ChangeClassHandler(db))).Methods("PUT", "OPTIONS") // เปลี่ยน class ถือเป็นแก้ข้อมูล
	r.Handle("/api/upgrade-stat", authMiddleware(upgrade.UpgradeStatHandler(db))).Methods("PUT", "OPTIONS") // เพิ่ม stat คือแก้ข้อมูล
	r.Handle("/api/buy-card", authMiddleware(upgrade.BuyCardHandler(db))).Methods("POST", "OPTIONS")        // ซื้อการ์ดถือเป็นการสร้างรายการใหม่ (POST)

	port := os.Getenv("PORT")

	http.ListenAndServe(":"+port, r)

	log.Println("Server running at :" + port)
}

func middlewareCORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		origin := r.Header.Get("Origin")
		fmt.Println("Origin:", origin)

		allowedOrigins := map[string]bool{
			"http://localhost:5173":                        true,
			"https://clash-and-card.punpunpunnawat.online": true,
		}

		if allowedOrigins[origin] {
			w.Header().Set("Access-Control-Allow-Origin", origin)
			w.Header().Set("Access-Control-Allow-Credentials", "true")
		} else {
			//
		}

		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With")
		w.Header().Set("Vary", "Origin")

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(w, r)
	})
}

func authMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			http.Error(w, "Missing Authorization header", http.StatusUnauthorized)
			return
		}

		var tokenStr string
		fmt.Sscanf(authHeader, "Bearer %s", &tokenStr)
		if tokenStr == "" {
			http.Error(w, "Invalid Authorization header", http.StatusUnauthorized)
			return
		}
		fmt.Println("[DEBUG] token:", tokenStr)

		userID, err := user.ExtractUserIDFromToken(tokenStr)
		if err != nil {
			http.Error(w, "Invalid token", http.StatusUnauthorized)
			return
		}
		fmt.Println("[DEBUG] userID:", userID)

		ctx := context.WithValue(r.Context(), "userID", userID)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

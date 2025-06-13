package main

import (
	"log"
	"net/http"

	"github.com/gorilla/mux"
)

// var db *sql.DB

func main() {
	db := ConnectDB()
	defer db.Close()

	r := mux.NewRouter()

	// เพิ่ม middleware CORS
	r.Use(middlewareCORS)
	r.HandleFunc("/api/login", loginHandler(db)).Methods("POST", "OPTIONS")

	r.HandleFunc("/api/check-email", checkEmailHandler(db)).Methods("POST", "OPTIONS")
	r.HandleFunc("/api/register", registerHandler(db)).Methods("POST", "OPTIONS")
	r.HandleFunc("/api/user", GetUserHandler(db)).Methods("GET", "OPTIONS")
	r.HandleFunc("/api/deck", GetUserDeckHandler(db)).Methods("GET", "OPTIONS")

	r.HandleFunc("/api/battle/start", StartBattleHandler(db)).Methods("POST", "OPTIONS")
	r.HandleFunc("/api/battle/{matchID}/play", PlayCardHandler(db)).Methods("POST", "OPTIONS")

	r.HandleFunc("/api/upgrade-stat", UpgradeStatHandler(db)).Methods("POST", "OPTIONS")
	r.HandleFunc("/api/buy-card", BuyCardHandler(db)).Methods("POST", "OPTIONS")

	r.HandleFunc("/ws/pvp", HandlePVPWebSocket(db))
	//r.HandleFunc("/ws/pvp", HandlePVPWebSocket)

	log.Println("Server running at :8080")
	http.ListenAndServe(":8080", r)
}

func middlewareCORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*") // หรือเจาะจง origin ที่ใช้
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		w.Header().Set("Vary", "Origin")

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(w, r)
	})
}

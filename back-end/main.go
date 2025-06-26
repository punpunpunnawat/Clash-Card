package main

import (
	"clash_and_card/battle"
	"clash_and_card/upgrade"
	"clash_and_card/user"
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

	//user
	r.HandleFunc("/api/login", user.LoginHandler(db)).Methods("POST", "OPTIONS")
	r.HandleFunc("/api/check-email", user.CheckEmailHandler(db)).Methods("POST", "OPTIONS")
	r.HandleFunc("/api/register", user.RegisterHandler(db)).Methods("POST", "OPTIONS")
	r.HandleFunc("/api/user", user.GetUserHandler(db)).Methods("GET", "OPTIONS")
	r.HandleFunc("/api/deck", user.GetUserDeckHandler(db)).Methods("GET", "OPTIONS")

	//battle
	r.HandleFunc("/api/battle/start", battle.StartBattleHandler(db)).Methods("POST", "OPTIONS")
	r.HandleFunc("/api/battle/{matchID}/play", battle.PlayCardHandler(db)).Methods("POST", "OPTIONS")
	r.HandleFunc("/api/battle/{matchID}/play/true-sight", battle.TrueSightHandler()).Methods("POST", "OPTIONS")
	r.HandleFunc("/ws/pvp", battle.HandlePVPWebSocket(db))
	//upgrade
	r.HandleFunc("/api/change-class", upgrade.ChangeClassHandler(db)).Methods("POST", "OPTIONS")
	r.HandleFunc("/api/upgrade-stat", upgrade.UpgradeStatHandler(db)).Methods("POST", "OPTIONS")
	r.HandleFunc("/api/buy-card", upgrade.BuyCardHandler(db)).Methods("POST", "OPTIONS")

	port := os.Getenv("PORT")
	// if port == "" {
	// 	port = "8080"
	// }
	http.ListenAndServe(":"+port, r)

	log.Println("Server running at :8080")
	//http.ListenAndServe(":8080", r)
}

func middlewareCORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
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

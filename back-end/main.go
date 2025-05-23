package main

import (
	"log"
	"net/http"

	"github.com/gorilla/mux"
)

func main() {
	db := ConnectDB()
	defer db.Close()

	r := mux.NewRouter()

	// เพิ่ม middleware CORS
	r.Use(middlewareCORS)

	r.HandleFunc("/api/user/{id}", GetUserHandler(db)).Methods("GET")
	r.HandleFunc("/api/user/{id}/deck", GetUserDeckHandler(db)).Methods("GET")

	r.HandleFunc("/api/battle/start", StartBattleHandler(db)).Methods("POST", "OPTIONS")
	r.HandleFunc("/api/battle/{matchID}/play", PlayCardHandler).Methods("POST", "OPTIONS")

	log.Println("Server running at :8080")
	http.ListenAndServe(":8080", r)
}

func middlewareCORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*") // อนุญาตทุกโดเมน
		w.Header().Set("Access-Control-Allow-Methods", "*")
		w.Header().Set("Access-Control-Allow-Headers", "*")

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(w, r)
	})
}

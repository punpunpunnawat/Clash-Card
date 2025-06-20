package upgrade

import (
	"clash_and_card/user"
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
)

func UpgradeStatHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
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

		userID, err := user.ExtractUserIDFromToken(tokenStr)
		if err != nil || userID == "0" {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

		var req struct {
			Type string `json:"type"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "Invalid request body", http.StatusBadRequest)
			return
		}

		stat := req.Type

		statValues := map[string]int{
			"atk": 1,
			"def": 1,
			"spd": 1,
			"hp":  10,
		}

		increase, ok := statValues[stat]
		if !ok {
			http.Error(w, "Invalid stat field", http.StatusBadRequest)
			return
		}

		var statPoint int
		err = db.QueryRow("SELECT stat_point FROM users WHERE id = ?", userID).Scan(&statPoint)
		if err != nil {
			http.Error(w, "User not found", http.StatusNotFound)
			return
		}
		if statPoint < 1 {
			http.Error(w, "Not enough stat points", http.StatusBadRequest)
			return
		}

		query := fmt.Sprintf(`
			UPDATE users
			SET %s = %s + ?, stat_point = stat_point - 1
			WHERE id = ?
		`, stat, stat)

		_, err = db.Exec(query, increase, userID)
		if err != nil {
			http.Error(w, "Failed to update stat", http.StatusInternalServerError)
			return
		}

		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"message":"Stat upgraded successfully"}`))
	}
}
func BuyCardHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		fmt.Println("Buy call")

		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			fmt.Println("Missing Authorization header")
			http.Error(w, "Missing Authorization header", http.StatusUnauthorized)
			return
		}

		var tokenStr string
		fmt.Sscanf(authHeader, "Bearer %s", &tokenStr)
		if tokenStr == "" {
			fmt.Println("Invalid Authorization header")
			http.Error(w, "Invalid Authorization header", http.StatusUnauthorized)
			return
		}

		userID, err := user.ExtractUserIDFromToken(tokenStr)
		if err != nil || userID == "0" {
			fmt.Println("Unauthorized:", err)
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

		var req struct {
			Type string `json:"type"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil || (req.Type != "rock" && req.Type != "paper" && req.Type != "scissors") {
			fmt.Println("Invalid card type or decode error:", err)
			http.Error(w, "Invalid card type", http.StatusBadRequest)
			return
		}

		tx, err := db.Begin()
		if err != nil {
			fmt.Println("Failed to begin transaction:", err)
			http.Error(w, "Failed to begin transaction", http.StatusInternalServerError)
			return
		}

		defer func() {
			if p := recover(); p != nil {
				fmt.Println("Panic recovered:", p)
				tx.Rollback()
				http.Error(w, "Internal server error", http.StatusInternalServerError)
			}
		}()

		var gold int
		err = tx.QueryRow(`SELECT gold FROM users WHERE id = ? FOR UPDATE`, userID).Scan(&gold)
		if err != nil {
			fmt.Println("User not found or query error:", err)
			tx.Rollback()
			http.Error(w, "User not found", http.StatusNotFound)
			return
		}

		if gold < 500 {
			fmt.Println("Not enough gold:", gold)
			tx.Rollback()
			http.Error(w, "Not enough gold", http.StatusBadRequest)
			return
		}

		_, err = tx.Exec(`UPDATE users SET gold = gold - 500 WHERE id = ?`, userID)
		if err != nil {
			fmt.Println("Failed to deduct gold:", err)
			tx.Rollback()
			http.Error(w, "Failed to deduct gold", http.StatusInternalServerError)
			return
		}

		res, err := tx.Exec(`UPDATE decks SET quantity = quantity + 1 WHERE user_id = ? AND card_type = ?`, userID, req.Type)
		if err != nil {
			fmt.Println("Failed to update deck:", err)
			tx.Rollback()
			http.Error(w, "Failed to update deck", http.StatusInternalServerError)
			return
		}

		rowsAffected, err := res.RowsAffected()
		if err != nil {
			fmt.Println("Failed to check update result:", err)
			tx.Rollback()
			http.Error(w, "Failed to check update result", http.StatusInternalServerError)
			return
		}

		if rowsAffected == 0 {
			_, err = tx.Exec(`INSERT INTO decks (user_id, card_type, quantity) VALUES (?, ?, 1)`, userID, req.Type)
			if err != nil {
				fmt.Println("Failed to insert new deck row:", err)
				tx.Rollback()
				http.Error(w, "Failed to insert new deck row", http.StatusInternalServerError)
				return
			}
		}

		if err = tx.Commit(); err != nil {
			fmt.Println("Failed to commit transaction:", err)
			http.Error(w, "Failed to commit transaction", http.StatusInternalServerError)
			return
		}

		fmt.Println("Card purchased successfully for user:", userID)
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"message":"Card purchased successfully"}`))
	}
}

package upgrade

import (
	"clash_and_card/user"
	"clash_and_card/utilities"
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
)

func UpgradeStatHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			utilities.WriteJSONError(w, "Missing Authorization header", http.StatusUnauthorized)
			return
		}

		var tokenStr string
		fmt.Sscanf(authHeader, "Bearer %s", &tokenStr)
		if tokenStr == "" {
			utilities.WriteJSONError(w, "Invalid Authorization header", http.StatusUnauthorized)
			return
		}

		userID, err := user.ExtractUserIDFromToken(tokenStr)
		if err != nil || userID == "0" {
			utilities.WriteJSONError(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

		var req struct {
			Type string `json:"type"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			utilities.WriteJSONError(w, "Invalid request body", http.StatusBadRequest)
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
			utilities.WriteJSONError(w, "Invalid stat field", http.StatusBadRequest)
			return
		}

		var statPoint int
		err = db.QueryRow("SELECT stat_point FROM users WHERE id = ?", userID).Scan(&statPoint)
		if err != nil {
			utilities.WriteJSONError(w, "User not found", http.StatusNotFound)
			return
		}
		if statPoint < 1 {
			utilities.WriteJSONError(w, "Not enough stat points", http.StatusBadRequest)
			return
		}

		query := fmt.Sprintf(`
			UPDATE users
			SET %s = %s + ?, stat_point = stat_point - 1
			WHERE id = ?
		`, stat, stat)

		_, err = db.Exec(query, increase, userID)
		if err != nil {
			utilities.WriteJSONError(w, "Failed to update stat", http.StatusInternalServerError)
			return
		}

		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"message":"Stat upgraded successfully"}`))
	}
}

func BuyCardHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			utilities.WriteJSONError(w, "Missing Authorization header", http.StatusUnauthorized)
			return
		}

		var tokenStr string
		fmt.Sscanf(authHeader, "Bearer %s", &tokenStr)
		if tokenStr == "" {
			utilities.WriteJSONError(w, "Invalid Authorization header", http.StatusUnauthorized)
			return
		}

		userID, err := user.ExtractUserIDFromToken(tokenStr)
		if err != nil || userID == "0" {
			utilities.WriteJSONError(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

		var req struct {
			Type string `json:"type"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil || (req.Type != "rock" && req.Type != "paper" && req.Type != "scissors") {
			utilities.WriteJSONError(w, "Invalid card type", http.StatusBadRequest)
			return
		}

		tx, err := db.Begin()
		if err != nil {
			utilities.WriteJSONError(w, "Failed to begin transaction", http.StatusInternalServerError)
			return
		}

		defer func() {
			if p := recover(); p != nil {
				tx.Rollback()
				utilities.WriteJSONError(w, "Internal server error", http.StatusInternalServerError)
			}
		}()

		var gold int
		err = tx.QueryRow(`SELECT gold FROM users WHERE id = ? FOR UPDATE`, userID).Scan(&gold)
		if err != nil {
			tx.Rollback()
			utilities.WriteJSONError(w, "User not found", http.StatusNotFound)
			return
		}

		if gold < 500 {
			tx.Rollback()
			utilities.WriteJSONError(w, "Not enough gold", http.StatusBadRequest)
			return
		}

		_, err = tx.Exec(`UPDATE users SET gold = gold - 500 WHERE id = ?`, userID)
		if err != nil {
			tx.Rollback()
			utilities.WriteJSONError(w, "Failed to deduct gold", http.StatusInternalServerError)
			return
		}

		res, err := tx.Exec(`UPDATE decks SET quantity = quantity + 1 WHERE user_id = ? AND card_type = ?`, userID, req.Type)
		if err != nil {
			tx.Rollback()
			utilities.WriteJSONError(w, "Failed to update deck", http.StatusInternalServerError)
			return
		}

		rowsAffected, err := res.RowsAffected()
		if err != nil {
			tx.Rollback()
			utilities.WriteJSONError(w, "Failed to check update result", http.StatusInternalServerError)
			return
		}

		if rowsAffected == 0 {
			_, err = tx.Exec(`INSERT INTO decks (user_id, card_type, quantity) VALUES (?, ?, 1)`, userID, req.Type)
			if err != nil {
				tx.Rollback()
				utilities.WriteJSONError(w, "Failed to insert new deck row", http.StatusInternalServerError)
				return
			}
		}

		if err = tx.Commit(); err != nil {
			utilities.WriteJSONError(w, "Failed to commit transaction", http.StatusInternalServerError)
			return
		}

		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"message":"Card purchased successfully"}`))
	}
}

func ChangeClassHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			utilities.WriteJSONError(w, "Missing Authorization header", http.StatusUnauthorized)
			return
		}

		var tokenStr string
		fmt.Sscanf(authHeader, "Bearer %s", &tokenStr)
		if tokenStr == "" {
			utilities.WriteJSONError(w, "Invalid Authorization header", http.StatusUnauthorized)
			return
		}

		userID, err := user.ExtractUserIDFromToken(tokenStr)
		if err != nil || userID == "0" {
			utilities.WriteJSONError(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

		var req struct {
			Class string `json:"class"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.Class == "" {
			utilities.WriteJSONError(w, "Invalid class", http.StatusBadRequest)
			return
		}

		validClasses := map[string]bool{
			"warrior":  true,
			"mage":     true,
			"assassin": true,
		}
		if !validClasses[req.Class] {
			utilities.WriteJSONError(w, "Invalid class type", http.StatusBadRequest)
			return
		}

		tx, err := db.Begin()
		if err != nil {
			utilities.WriteJSONError(w, "Failed to start transaction", http.StatusInternalServerError)
			return
		}
		defer tx.Rollback()

		var gold int
		err = tx.QueryRow(`SELECT gold FROM users WHERE id = ? FOR UPDATE`, userID).Scan(&gold)
		if err != nil {
			utilities.WriteJSONError(w, "User not found", http.StatusNotFound)
			return
		}
		if gold < 1000 {
			w.WriteHeader(http.StatusOK)
			w.Write([]byte(`{"message":"Not enough gold to change class"}`))
			return
		}

		_, err = tx.Exec(`UPDATE users SET class = ?, gold = gold - 1000 WHERE id = ?`, req.Class, userID)
		if err != nil {
			utilities.WriteJSONError(w, "Failed to update class", http.StatusInternalServerError)
			return
		}

		if err = tx.Commit(); err != nil {
			utilities.WriteJSONError(w, "Failed to commit transaction", http.StatusInternalServerError)
			return
		}

		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"message":"Class changed successfully"}`))
	}
}

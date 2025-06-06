package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
)

func GetUserHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		fmt.Println("🔍 [GetUserHandler] Called")

		authHeader := r.Header.Get("Authorization")
		fmt.Println("🔑 Authorization Header:", authHeader)
		if authHeader == "" {
			http.Error(w, "Missing Authorization header", http.StatusUnauthorized)
			fmt.Println("❌ Missing Authorization header")
			return
		}

		tokenStr := ""
		fmt.Sscanf(authHeader, "Bearer %s", &tokenStr)
		fmt.Println("🧾 Extracted Token:", tokenStr)
		if tokenStr == "" {
			http.Error(w, "Invalid Authorization header", http.StatusUnauthorized)
			fmt.Println("❌ Invalid Authorization format")
			return
		}

		userID, err := extractUserIDFromToken(tokenStr)
		if err != nil {
			http.Error(w, "Invalid token", http.StatusUnauthorized)
			fmt.Println("❌ Token extraction failed:", err)
			return
		}
		fmt.Println("✅ Extracted userID:", userID)

		query := `SELECT id, username, email, atk, def, hp, spd, level, current_campaign_level, exp, money, created_at, class, stat_point FROM users WHERE id = ?`
		fmt.Println("🔎 SQL Query:", query)

		row := db.QueryRow(query, userID)

		type Stat struct {
			Atk int `json:"atk"`
			Def int `json:"def"`
			Hp  int `json:"hp"`
			Spd int `json:"spd"`
		}

		var user struct {
			ID                   int    `json:"id"`
			Username             string `json:"username"`
			Email                string `json:"email"`
			Stat                 Stat   `json:"stat"`
			Level                int    `json:"level"`
			CurrentCampaignLevel int    `json:"currentCampaignLevel"`
			Exp                  int    `json:"exp"`
			Money                int    `json:"money"`
			CreatedAt            string `json:"created_at"`
			Class                string `json:"class"`
			StatPoint            int    `json:"statPoint"`
		}

		err = row.Scan(
			&user.ID,
			&user.Username,
			&user.Email,
			&user.Stat.Atk,
			&user.Stat.Def,
			&user.Stat.Hp,
			&user.Stat.Spd,
			&user.Level,
			&user.CurrentCampaignLevel,
			&user.Exp,
			&user.Money,
			&user.CreatedAt,
			&user.Class,
			&user.StatPoint,
		)

		if err == sql.ErrNoRows {
			http.Error(w, "User not found", http.StatusNotFound)
			fmt.Println("❌ User not found for ID:", userID)
			return
		} else if err != nil {
			http.Error(w, "Server error", http.StatusInternalServerError)
			fmt.Println("❌ SQL Scan Error:", err)
			return
		}

		fmt.Println("✅ User data fetched successfully:", user)

		w.Header().Set("Content-Type", "application/json")
		err = json.NewEncoder(w).Encode(user)
		if err != nil {
			fmt.Println("❌ Failed to encode user JSON:", err)
		} else {
			fmt.Println("📤 User JSON sent")
		}
	}
}

func GetUserDeckHandler(db *sql.DB) http.HandlerFunc {
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

		userID, err := extractUserIDFromToken(tokenStr)
		if err != nil {
			http.Error(w, "Invalid token", http.StatusUnauthorized)
			return
		}

		rows, err := db.Query("SELECT card_type FROM decks WHERE user_id = ?", userID)
		if err != nil {
			http.Error(w, "Error loading deck", http.StatusInternalServerError)
			return
		}
		defer rows.Close()

		var deck []DeckCard
		for rows.Next() {
			var card DeckCard
			if err := rows.Scan(&card.CardType); err != nil {
				http.Error(w, "Error reading card", http.StatusInternalServerError)
				return
			}
			deck = append(deck, card)
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(deck)
	}
}

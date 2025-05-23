package main

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/gorilla/mux"
)

func GetUserHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		vars := mux.Vars(r)
		id, err := strconv.Atoi(vars["id"])
		if err != nil {
			http.Error(w, "Invalid ID", http.StatusBadRequest)
			return
		}

		var user User
		var atk, def, hp, spd int // temp stat fields
		query := `SELECT id, username, email, atk, def, hp, spd, level, current_campaign_level, exp, money, created_at FROM users WHERE id = ?`
		row := db.QueryRow(query, id)
		err = row.Scan(
			&user.ID,
			&user.Username,
			&user.Email,
			&atk,
			&def,
			&hp,
			&spd,
			&user.Level,
			&user.CurrentCampaignLevel,
			&user.Exp,
			&user.Money,
			&user.CreatedAt,
		)
		if err != nil {
			http.Error(w, "ไม่สามารถโหลดผู้เล่น: "+err.Error(), http.StatusInternalServerError)
			return
		}

		// assign nested Stat
		user.Stat = UnitStat{
			Atk: atk,
			Def: def,
			HP:  hp,
			Spd: spd,
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(user)
	}
}

func GetUserDeckHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		vars := mux.Vars(r)
		userID, err := strconv.Atoi(vars["id"])
		if err != nil {
			http.Error(w, "Invalid user ID", http.StatusBadRequest)
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

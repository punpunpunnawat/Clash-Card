// main.go
package main

import (
	"database/sql"
	"encoding/json"
	"errors"
	"net/http"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

var jwtSecret = []byte("SECRET_KEY")

type LoginRequest struct {
	UserID int `json:"user_id"`
}

func loginHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		type LoginRequest struct {
			UserID int `json:"user_id"`
		}

		var req LoginRequest
		err := json.NewDecoder(r.Body).Decode(&req)
		if err != nil {
			http.Error(w, "Invalid request", http.StatusBadRequest)
			return
		}

		query := `SELECT id, username, email, atk, def, hp, spd, level, current_campaign_level, exp, money, created_at FROM users WHERE id = ?`
		row := db.QueryRow(query, req.UserID)

		var user struct {
			ID                   int
			Username             string
			Email                string
			Atk, Def, Hp, Spd    int
			Level                int
			CurrentCampaignLevel int
			Exp                  int
			Money                int
			CreatedAt            string
		}

		err = row.Scan(
			&user.ID,
			&user.Username,
			&user.Email,
			&user.Atk,
			&user.Def,
			&user.Hp,
			&user.Spd,
			&user.Level,
			&user.CurrentCampaignLevel,
			&user.Exp,
			&user.Money,
			&user.CreatedAt,
		)

		if err == sql.ErrNoRows {
			http.Error(w, "User not found", http.StatusUnauthorized)
			return
		} else if err != nil {
			http.Error(w, "Server error", http.StatusInternalServerError)
			return
		}

		// สร้าง JWT token (สมมติมีฟังก์ชัน CreateToken)
		token, err := CreateToken(user.ID)
		if err != nil {
			http.Error(w, "Failed to create token", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{"token": token})
	}
}

func extractUserIDFromToken(tokenStr string) (int, error) {
	token, err := jwt.Parse(tokenStr, func(token *jwt.Token) (interface{}, error) {
		// ถ้าต้องการเช็ค alg เพิ่มเติมก็บอกได้ที่นี่
		return jwtSecret, nil
	})
	if err != nil || !token.Valid {
		return 0, err
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return 0, errors.New("invalid token claims")
	}

	userIDFloat, ok := claims["user_id"].(float64)
	if !ok {
		return 0, errors.New("user_id claim missing or invalid")
	}

	userID := int(userIDFloat)
	return userID, nil
}

func CreateToken(userID int) (string, error) {
	claims := jwt.MapClaims{
		"user_id": userID,
		"exp":     time.Now().Add(time.Hour * 24).Unix(), // token หมดอายุ 24 ชั่วโมง
		"iat":     time.Now().Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(jwtSecret)
}

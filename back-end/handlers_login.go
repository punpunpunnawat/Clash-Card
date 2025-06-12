// main.go
package main

import (
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

var jwtSecret = []byte("SECRET_KEY")

type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type RegisterRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

func loginHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req LoginRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "Invalid request", http.StatusBadRequest)
			return
		}
		fmt.Println("Email:", req.Email)
		fmt.Println("Password:", req.Password)

		// ดึง hash password จาก db
		var userID string
		var hashedPassword string
		err := db.QueryRow(`SELECT id, password FROM users WHERE email = ?`, req.Email).Scan(&userID, &hashedPassword)
		if err == sql.ErrNoRows {
			http.Error(w, "Invalid email or password", http.StatusUnauthorized)
			return
		} else if err != nil {
			http.Error(w, "Server error", http.StatusInternalServerError)
			return
		}

		// bytes, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
		// fmt.Println("Hashed : " + string(bytes))

		fmt.Println("userID from DB:", userID)
		fmt.Println("hashedPassword from DB:", hashedPassword)

		// เปรียบเทียบ password
		if err := bcrypt.CompareHashAndPassword([]byte(hashedPassword), []byte(req.Password)); err != nil {
			fmt.Println("Password compare failed:", err)
			http.Error(w, "Invalid email or password", http.StatusUnauthorized)
			return
		}

		// ออก token
		token, err := CreateToken(userID)
		if err != nil {
			http.Error(w, "Token generation failed", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{"token": token})
	}
}

func registerHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		var req RegisterRequest
		err := json.NewDecoder(r.Body).Decode(&req)
		if err != nil || req.Email == "" || req.Password == "" {
			http.Error(w, "Invalid input", http.StatusBadRequest)
			return
		}

		// เช็คว่ามี email นี้อยู่ใน db หรือยัง
		var exists bool
		err = db.QueryRow("SELECT EXISTS(SELECT 1 FROM users WHERE email = ?)", req.Email).Scan(&exists)
		if err != nil {
			fmt.Println("DB error:", err)
			http.Error(w, "Server error", http.StatusInternalServerError)
			return
		}
		if exists {
			http.Error(w, "Email already registered", http.StatusConflict)
			return
		}

		// hash password
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
		if err != nil {
			fmt.Println("Hash error:", err)
			http.Error(w, "Server error", http.StatusInternalServerError)
			return
		}

		userID := uuid.New().String()

		_, err = db.Exec("INSERT INTO users (id, username, email, password, atk, def, spd, hp, level, current_campaign_level, exp, gold, created_at, class, stat_point) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
			userID, "Player", req.Email, string(hashedPassword), 20, 10, 10, 100, 1, 1, 0, 0, time.Now(), "none", 0)
		if err != nil {
			fmt.Println("Insert error:", err)
			http.Error(w, "Server error", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"message":"Register success"}`))
	}
}

func extractUserIDFromToken(tokenStr string) (string, error) {
	token, err := jwt.Parse(tokenStr, func(token *jwt.Token) (interface{}, error) {
		return jwtSecret, nil
	})
	if err != nil || !token.Valid {
		return "", err
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return "", errors.New("invalid token claims")
	}

	userID, ok := claims["user_id"].(string)
	if !ok {
		return "", errors.New("user_id claim missing or invalid")
	}

	return userID, nil
}

func CreateToken(userID string) (string, error) {
	claims := jwt.MapClaims{
		"user_id": userID,
		"exp":     time.Now().Add(time.Hour * 24).Unix(), // token หมดอายุ 24 ชั่วโมง
		"iat":     time.Now().Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(jwtSecret)
}

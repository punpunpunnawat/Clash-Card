package user

import (
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"os"
	"time"

	"clash_and_card/utilities"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

var jwtSecret = []byte(os.Getenv("JWT_SECRET"))

type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type RegisterRequest struct {
	Username string `json:"username"`
	Email    string `json:"email"`
	Password string `json:"password"`
	Class    string `json:"class"`
}

func isEmailExists(db *sql.DB, email string) (bool, error) {
	var exists bool
	err := db.QueryRow("SELECT EXISTS(SELECT 1 FROM users WHERE email = ?)", email).Scan(&exists)
	return exists, err
}

func LoginHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		fmt.Println("login")
		var req LoginRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			utilities.WriteJSONError(w, "Invalid request", http.StatusBadRequest)
			return
		}

		var userID string
		var hashedPassword string
		err := db.QueryRow(`SELECT id, password FROM users WHERE email = ?`, req.Email).Scan(&userID, &hashedPassword)
		if err == sql.ErrNoRows {
			utilities.WriteJSONError(w, "Invalid email or password", http.StatusUnauthorized)
			return
		} else if err != nil {
			utilities.WriteJSONError(w, "Server error", http.StatusInternalServerError)
			return
		}

		if err := bcrypt.CompareHashAndPassword([]byte(hashedPassword), []byte(req.Password)); err != nil {
			utilities.WriteJSONError(w, "Invalid email or password", http.StatusUnauthorized)
			return
		}

		token, err := CreateToken(userID)
		if err != nil {
			utilities.WriteJSONError(w, "Token generation failed", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{"token": token})
	}
}

func CheckEmailHandler(db *sql.DB) http.HandlerFunc {
	type Req struct {
		Email string `json:"email"`
	}
	type Res struct {
		Exists bool `json:"exists"`
	}

	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			utilities.WriteJSONError(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}
		var req Req
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.Email == "" {
			utilities.WriteJSONError(w, "Invalid input", http.StatusBadRequest)
			return
		}
		exists, err := isEmailExists(db, req.Email)
		if err != nil {
			utilities.WriteJSONError(w, "Server error", http.StatusInternalServerError)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(Res{Exists: exists})
	}
}

func initDeck(class string) (rock int, paper int, scissors int) {
	switch class {
	case "warrior":
		return 10, 5, 5
	case "mage":
		return 5, 10, 5
	case "assassin":
		return 5, 5, 10
	default:
		return 5, 5, 5
	}
}

func RegisterHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			utilities.WriteJSONError(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}
		var req RegisterRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil ||
			req.Email == "" || req.Password == "" || req.Class == "" {
			utilities.WriteJSONError(w, "Invalid input", http.StatusBadRequest)
			return
		}
		exists, err := isEmailExists(db, req.Email)
		if err != nil {
			utilities.WriteJSONError(w, "Server error", http.StatusInternalServerError)
			return
		}
		if exists {
			utilities.WriteJSONError(w, "Email already registered", http.StatusConflict)
			return
		}
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
		if err != nil {
			utilities.WriteJSONError(w, "Server error", http.StatusInternalServerError)
			return
		}
		userID := uuid.New().String()
		_, err = db.Exec(
			`INSERT INTO users (
                id, username, email, password,
                atk, def, spd, hp,
                level, current_campaign_level,
                exp, gold, created_at,
                class, stat_point
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
			userID,
			req.Username, req.Email, string(hashedPassword), 20, 10, 10, 50, 1, 1, 0, 0, time.Now(), req.Class, 0,
		)
		if err != nil {
			utilities.WriteJSONError(w, "Server error", http.StatusInternalServerError)
			return
		}

		initRock, initPaper, initScissors := initDeck(req.Class)

		_, err = db.Exec("INSERT INTO decks (user_id, card_type, quantity) VALUES (?, ?, ?), (?, ?, ?), (?, ?, ?)",
			userID, "rock", initRock,
			userID, "paper", initPaper,
			userID, "scissors", initScissors,
		)
		if err != nil {
			utilities.WriteJSONError(w, "Server error", http.StatusInternalServerError)
			return
		}

		token, err := CreateToken(userID)
		if err != nil {
			utilities.WriteJSONError(w, "Token generation failed", http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{"token": token})
	}
}

func ExtractUserIDFromToken(tokenStr string) (string, error) {
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
		"exp":     time.Now().Add(time.Hour * 24).Unix(), // token 24hr exp
		"iat":     time.Now().Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(jwtSecret)
}

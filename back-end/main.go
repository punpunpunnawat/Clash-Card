package main

import (
	"encoding/json"
	"log"
	"math/rand"
	"net/http"
	"time"
)

type PlayRequest struct {
	PlayerCard string   `json:"playerCard"`
	BotLevel   int      `json:"botLevel"`
	PlayerDeck []string `json:"playerDeck"`
	EnemyDeck  []string `json:"enemyDeck"`
}

type PlayResponse struct {
	EnemyCard  string   `json:"enemyCard"`
	Result     string   `json:"result"`
	PlayerCard string   `json:"playerCard"`
	BotLevel   int      `json:"botLevel"`
	PlayerDeck []string `json:"playerDeck"`
	EnemyDeck  []string `json:"enemyDeck"`
}

func main() {
	rand.Seed(time.Now().UnixNano())

	http.HandleFunc("/play/bot", playHandler)

	log.Println("Server started at :8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}

func playHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req PlayRequest
	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		http.Error(w, "Bad request", http.StatusBadRequest)
		return
	}

	// ตรวจสอบว่าผู้เล่นเลือกการ์ดใน deck หรือไม่
	if !contains(req.PlayerDeck, req.PlayerCard) {
		http.Error(w, "Player card not in deck", http.StatusBadRequest)
		return
	}

	// ลบการ์ดที่เล่นออกจาก deck ผู้เล่น
	req.PlayerDeck = removeCard(req.PlayerDeck, req.PlayerCard)

	// บอทเลือกการ์ดจาก deck ที่เหลือ
	botCard := botChooseCardFromDeck(req.BotLevel, req.EnemyDeck, req.PlayerCard)

	if botCard == "" {
		http.Error(w, "Enemy deck empty", http.StatusBadRequest)
		return
	}

	// ลบการ์ดบอทออกจาก deck
	req.EnemyDeck = removeCard(req.EnemyDeck, botCard)

	// คำนวณผลลัพธ์
	result := getResult(req.PlayerCard, botCard)

	res := PlayResponse{
		EnemyCard:  botCard,
		Result:     result,
		PlayerCard: req.PlayerCard,
		BotLevel:   req.BotLevel,
		PlayerDeck: req.PlayerDeck,
		EnemyDeck:  req.EnemyDeck,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(res)
}

// helper ฟังก์ชันเช็คว่าการ์ดอยู่ใน deck หรือไม่
func contains(deck []string, card string) bool {
	for _, c := range deck {
		if c == card {
			return true
		}
	}
	return false
}

// helper ฟังก์ชันลบการ์ดออกจาก deck
func removeCard(deck []string, card string) []string {
	for i, c := range deck {
		if c == card {
			return append(deck[:i], deck[i+1:]...)
		}
	}
	return deck
}

// บอทเลือกการ์ดจาก deck ที่เหลือ โดยใช้ logic เลเวลง่ายกับยาก
func botChooseCardFromDeck(level int, enemyDeck []string, playerCard string) string {
	if len(enemyDeck) == 0 {
		return ""
	}
	if level == 1 {
		// เลือกสุ่ม
		return enemyDeck[rand.Intn(len(enemyDeck))]
	}

	// เลเวล 2 พยายามเลือกการ์ดที่ชนะ player
	winAgainst := map[string]string{
		"rock":     "paper",
		"paper":    "scissors",
		"scissors": "rock",
	}

	target := winAgainst[playerCard]
	for _, c := range enemyDeck {
		if c == target {
			return c
		}
	}

	// ถ้าไม่มีเลือกสุ่ม
	return enemyDeck[rand.Intn(len(enemyDeck))]
}

// คำนวณผลลัพธ์แพ้-ชนะ-เสมอ
func getResult(playerCard, enemyCard string) string {
	if playerCard == enemyCard {
		return "draw"
	}

	winAgainst := map[string]string{
		"rock":     "scissors",
		"paper":    "rock",
		"scissors": "paper",
	}

	if winAgainst[playerCard] == enemyCard {
		return "win"
	}
	return "lose"
}

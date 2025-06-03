package main

import (
	"bytes"
	"database/sql"
	"encoding/json"
	"fmt"
	"io"
	"math/rand"
	"net/http"
	"strconv"
	"strings"
	"sync"

	"github.com/google/uuid"
	"github.com/gorilla/mux"
)

// ----------- Models -----------

type Card struct {
	ID   string `json:"id"`
	Type string `json:"type"`
}

type GameState struct {
	sync.Mutex   // ล็อกภายใน state เอง
	Player       PlayerData
	Bot          PlayerData
	PlayingLevel int
}

// map เก็บสถานะเกมทุกแมตช์
var gameStates = make(map[string]*GameState)
var gameStatesMutex sync.Mutex

// ----------- Utilities -----------
func logGameState(gs *GameState) {
	gs.Lock()
	defer gs.Unlock()

	fmt.Println("------ GAME STATE ------")

	fmt.Println("PlayerDeck:", len(gs.Player.Deck), "cards left")
	fmt.Println("PlayerHand:", formatHand(gs.Player.Hand))
	fmt.Printf("Player - HP: %d/%d | ATK: %d | DEF: %d | SPD: %d\n",
		gs.Player.CurrentHP, gs.Player.Stat.HP, gs.Player.Stat.ATK, gs.Player.Stat.DEF, gs.Player.Stat.SPD)

	fmt.Println("BotDeck:", len(gs.Bot.Deck), "cards left")
	fmt.Println("BotHand:", formatHand(gs.Bot.Hand))
	fmt.Printf("Bot - HP: %d/%d | ATK: %d | DEF: %d | SPD: %d\n",
		gs.Bot.CurrentHP, gs.Bot.Stat.HP, gs.Bot.Stat.ATK, gs.Bot.Stat.DEF, gs.Bot.Stat.SPD)

	fmt.Println("------------------------")
}

func formatHand(hand []Card) string {
	var result []string
	for _, c := range hand {
		result = append(result, fmt.Sprintf("(ID:%s, Type:%s)", c.ID, c.Type))
	}
	return strings.Join(result, ", ")
}

func getUserByIDFromDB(db *sql.DB, userID int) (*User, error) {
	var user User
	query := `SELECT id, username, email, atk, def, hp, spd, level, current_campaign_level, exp, money, created_at, class FROM users WHERE id = ?`
	row := db.QueryRow(query, userID)
	err := row.Scan(
		&user.ID,
		&user.Username,
		&user.Email,
		&user.Stat.Atk,
		&user.Stat.Def,
		&user.Stat.HP,
		&user.Stat.Spd,
		&user.Level,
		&user.CurrentCampaignLevel,
		&user.Exp,
		&user.Money,
		&user.CreatedAt,
		&user.Class,
	)
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func getDeckByUserIDFromDB(db *sql.DB, userID int) ([]Card, error) {
	rows, err := db.Query("SELECT card_type FROM decks WHERE user_id = ?", userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var cards []Card
	idCounter := 1
	for rows.Next() {
		var dc DeckCard
		if err := rows.Scan(&dc.CardType); err != nil {
			return nil, err
		}
		cardID := "c" + strconv.Itoa(idCounter)
		cards = append(cards, Card{ID: cardID, Type: dc.CardType})
		idCounter++
	}

	if len(cards) == 0 {
		return nil, fmt.Errorf("deck is empty")
	}

	// Shuffle the player's deck here
	rand.Shuffle(len(cards), func(i, j int) {
		cards[i], cards[j] = cards[j], cards[i]
	})

	return cards, nil
}

func newShuffledDeck() []Card {
	var cards []Card
	types := []string{"rock", "paper", "scissors"}
	idCounter := 1
	for _, t := range types {
		for i := 0; i < 1; i++ {
			cards = append(cards, Card{ID: "bot" + strconv.Itoa(idCounter), Type: t})
			idCounter++
		}
	}
	rand.Shuffle(len(cards), func(i, j int) {
		cards[i], cards[j] = cards[j], cards[i]
	})
	return cards
}

func drawCards(deck *[]Card, n int) []Card {
	fmt.Println("draw call")
	fmt.Println("before ", len(*deck))
	if len(*deck) < n {
		n = len(*deck)
	}
	hand := (*deck)[:n]
	*deck = (*deck)[n:]
	fmt.Println("after ", len(*deck))
	return hand
}

func generateBotStats(level int) (atk, def, spd, hp int) {
	baseATK := 10
	baseDEF := 5
	baseSPD := 5
	baseHP := 50

	atk = baseATK + level*2
	def = baseDEF + level
	spd = baseSPD + (level / 2)
	hp = baseHP + level*10

	return
}

func countCardRemaining(deck []Card, hand []Card) map[string]int {
	allCards := append(deck, hand...) // รวม deck และ hand เข้าด้วยกัน

	countByType := make(map[string]int)
	for _, card := range allCards {
		countByType[card.Type]++
	}
	return countByType
}
func handlePlayerWin(userID int, db *sql.DB, wonLevel int) error {

	fmt.Println("HandleWin")
	fmt.Println("Won Level = ", wonLevel)
	fmt.Println("UserID = ", userID)

	var currentLevel int
	// ดึง current_campaign_level ของผู้เล่น
	query := `SELECT current_campaign_level FROM users WHERE id = ?`
	fmt.Println("Query curLevel = ", query)
	err := db.QueryRow(query, userID).Scan(&currentLevel)
	if err != nil {
		return fmt.Errorf("failed to get current campaign level: %v", err)
	}

	var expReward, moneyReward int
	shouldUpdateLevel := false

	// เช็คว่าเป็นด่านปัจจุบันไหม
	if wonLevel == currentLevel {
		// รางวัลเยอะ + จะอัปเดตเลเวล
		expReward = 20 * wonLevel
		moneyReward = 20 * wonLevel
		shouldUpdateLevel = true
	} else {
		// รางวัลน้อย เพราะย้อนกลับไปเล่นด่านเดิม
		expReward = 5 * wonLevel
		moneyReward = 5 * wonLevel
	}

	// เตรียม SQL update
	if shouldUpdateLevel {
		query = `
			UPDATE users
			SET exp = exp + ?,
				money = money + ?,
				current_campaign_level = current_campaign_level + 1
			WHERE id = ?
		`
	} else {
		query = `
			UPDATE users
			SET exp = exp + ?,
				money = money + ?
			WHERE id = ?
		`
	}

	_, err = db.Exec(query, expReward, moneyReward, userID)
	if err != nil {
		return fmt.Errorf("failed to update user rewards: %v", err)
	}

	return nil
}

func removeCardFromHand(hand *[]Card, cardID string) bool {
	found := false
	newHand := (*hand)[:0] // reuse slice memory

	for _, card := range *hand {
		if card.ID == cardID && !found {
			found = true
			continue // ข้ามอันนี้เพื่อ "ลบ"
		}
		newHand = append(newHand, card)
	}

	*hand = newHand
	return found
}

// ----------- Handlers -----------

func StartBattleHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req struct {
			//UserID   int `json:"userId"`
			BotLevel int `json:"levelId"`
		}
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
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

		if err := json.NewDecoder(r.Body).Decode(&req); err != nil || userID == 0 {
			fmt.Println("T T")
			http.Error(w, "Invalid or missing userId", http.StatusBadRequest)
			return
		}

		user, err := getUserByIDFromDB(db, userID)
		if err != nil {
			http.Error(w, "User not found", http.StatusNotFound)
			return
		}

		deck, err := getDeckByUserIDFromDB(db, userID)
		if err != nil {
			http.Error(w, "Deck not found", http.StatusNotFound)
			return
		}

		botDeck := newShuffledDeck()
		playerHand := drawCards(&deck, 3)
		botHand := drawCards(&botDeck, 3)
		botATK, botDEF, botSPD, botHP := generateBotStats(req.BotLevel)

		gameState := &GameState{
			Player: PlayerData{
				//ID:        user.ID,
				Name:      user.Username,
				Level:     user.Level,
				CurrentHP: user.Stat.HP,
				Deck:      deck,
				Hand:      playerHand,
				Stat: Stat{
					ATK: user.Stat.Atk,
					DEF: user.Stat.Def,
					SPD: user.Stat.Spd,
					HP:  user.Stat.HP,
				},
			},
			Bot: PlayerData{
				//ID:        -1, // หรือจะใส่ bot ID ก็ได้ถ้ามี
				Name:      "Mad Bot",
				Level:     req.BotLevel,
				CurrentHP: botHP,
				Deck:      botDeck,
				Hand:      botHand,
				Stat: Stat{
					ATK: botATK,
					DEF: botDEF,
					SPD: botSPD,
					HP:  botHP,
				},
			},
			PlayingLevel: req.BotLevel,
		}

		matchID := uuid.New().String() // สร้าง match id ใหม่

		gameStatesMutex.Lock()
		gameStates[matchID] = gameState
		gameStatesMutex.Unlock()

		res := map[string]interface{}{
			"matchId":       matchID,
			"playerHand":    gameState.Player.Hand,
			"playerHP":      gameState.Player.CurrentHP,
			"enemyHandSize": len(gameState.Bot.Hand),
			"enemyHP":       gameState.Bot.CurrentHP,
			"playerStats": map[string]int{
				"ATK": gameState.Player.Stat.ATK,
				"DEF": gameState.Player.Stat.DEF,
				"SPD": gameState.Player.Stat.SPD,
			},
			"enemyStats": map[string]int{
				"ATK": gameState.Bot.Stat.ATK,
				"DEF": gameState.Bot.Stat.DEF,
				"SPD": gameState.Bot.Stat.SPD,
			},
			"cardRemaining": map[string]interface{}{
				"player": countCardRemaining(gameState.Player.Deck, gameState.Player.Hand),
				"enemy":  countCardRemaining(gameState.Bot.Deck, gameState.Bot.Hand),
			},
		}

		fmt.Println("[DEBUG] Created matchID:", matchID)
		fmt.Printf("[DEBUG] Stored gameState for matchID: %s | PlayerHand: %+v\n", matchID, playerHand)

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(res)
	}
}

func PlayCardHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		vars := mux.Vars(r)
		matchID := vars["matchID"]

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
		bodyBytes, err := io.ReadAll(r.Body)
		if err != nil {
			fmt.Println("Failed to read body:", err)
			http.Error(w, "Failed to read body", http.StatusBadRequest)
			return
		}
		fmt.Println("📥 Raw request body:", string(bodyBytes))
		r.Body = io.NopCloser(bytes.NewBuffer(bodyBytes))

		var req struct {
			UserID int    `json:"userID"`
			CardID string `json:"cardID"`
		}

		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "Invalid request body", http.StatusBadRequest)
			fmt.Println("Failed to decode JSON:", err)
			return
		}

		fmt.Println("card id = ", req.CardID)
		gameStatesMutex.Lock()
		gs, ok := gameStates[matchID]
		gameStatesMutex.Unlock()
		if !ok {
			http.Error(w, "Game not started", http.StatusBadRequest)
			return
		}

		gs.Lock()
		defer gs.Unlock()

		var playerCard *Card
		var newHand []Card
		for _, c := range gs.Player.Hand {
			if c.ID == req.CardID {
				playerCard = &c
			} else {
				newHand = append(newHand, c)
			}
		}
		if playerCard == nil {
			fmt.Println("Hand ", gs.Player.Hand)
			fmt.Println("Card select ", playerCard)
			http.Error(w, "Card not found in hand", http.StatusBadRequest)
			return
		}
		gs.Player.Hand = newHand

		botIndex := rand.Intn(len(gs.Bot.Hand))
		botCard := gs.Bot.Hand[botIndex]
		gs.Bot.Hand = append(gs.Bot.Hand[:botIndex], gs.Bot.Hand[botIndex+1:]...)

		winner := ""
		damageToBot := 0
		damageToPlayer := 0

		switch playerCard.Type {
		case "rock":
			if botCard.Type == "scissors" {
				winner = "player"
				damageToBot = gs.Player.Stat.ATK - gs.Bot.Stat.DEF
			} else if botCard.Type == "paper" {
				winner = "enemy"
				damageToPlayer = gs.Bot.Stat.ATK - gs.Player.Stat.DEF
			} else {
				winner = "draw"
			}
		case "paper":
			if botCard.Type == "rock" {
				winner = "player"
				damageToBot = gs.Player.Stat.ATK - gs.Bot.Stat.DEF
			} else if botCard.Type == "scissors" {
				winner = "enemy"
				damageToPlayer = gs.Bot.Stat.ATK - gs.Player.Stat.DEF
			} else {
				winner = "draw"
			}
		case "scissors":
			if botCard.Type == "paper" {
				winner = "player"
				damageToBot = gs.Player.Stat.ATK - gs.Bot.Stat.DEF
			} else if botCard.Type == "rock" {
				winner = "enemy"
				damageToPlayer = gs.Bot.Stat.ATK - gs.Player.Stat.DEF
			} else {
				winner = "draw"
			}
		default:
			winner = "draw"
		}

		gs.Bot.CurrentHP -= damageToBot
		if gs.Bot.CurrentHP < 0 {
			gs.Bot.CurrentHP = 0
		}
		gs.Player.CurrentHP -= damageToPlayer
		if gs.Player.CurrentHP < 0 {
			gs.Player.CurrentHP = 0
		}

		if len(gs.Player.Deck) > 0 && len(gs.Player.Hand) < 3 {
			gs.Player.Hand = append(gs.Player.Hand, drawCards(&gs.Player.Deck, 1)...)
		}
		if len(gs.Bot.Deck) > 0 && len(gs.Bot.Hand) < 3 {
			gs.Bot.Hand = append(gs.Bot.Hand, drawCards(&gs.Bot.Deck, 1)...)
		}

		playerOutOfCards := len(gs.Player.Hand) == 0 && len(gs.Player.Deck) == 0
		botOutOfCards := len(gs.Bot.Hand) == 0 && len(gs.Bot.Deck) == 0

		botTypes := countCardRemaining(gs.Bot.Deck, gs.Bot.Hand)
		playerTypes := countCardRemaining(gs.Player.Deck, gs.Player.Hand)

		gameResult := "onGoing"

		// เช็คผลจาก HP ก่อน
		if gs.Player.CurrentHP == 0 && gs.Bot.CurrentHP == 0 {
			gameResult = "draw"
		} else if gs.Player.CurrentHP == 0 {
			gameResult = "botWin"
		} else if gs.Bot.CurrentHP == 0 {
			gameResult = "playerWin"
			if err := handlePlayerWin(userID, db, gs.PlayingLevel); err != nil {
				fmt.Println("Failed to update player after win:", err)
			}
		} else {
			// เช็คจากการ์ดถ้าเลือดยังเหลือ
			if playerOutOfCards && botOutOfCards {
				gameResult = "draw"
			} else if playerOutOfCards {
				gameResult = "botWin"
			} else if botOutOfCards {
				gameResult = "playerWin"
				if err := handlePlayerWin(userID, db, gs.PlayingLevel); err != nil {
					fmt.Println("Failed to update player after win:", err)
				}
			}
		}

		res := map[string]interface{}{
			"winner":     winner,
			"result":     gameResult,
			"playerCard": playerCard,
			"enemyCard":  botCard,
			"damage": map[string]int{
				"playerToEnemy": damageToBot,
				"enemyToPlayer": damageToPlayer,
			},
			"hp": map[string]int{
				"player": gs.Player.CurrentHP,
				"enemy":  gs.Bot.CurrentHP,
			},
			"playerHand": gs.Player.Hand,
			"enemyHand":  gs.Bot.CurrentHP,
			"cardRemaining": map[string]interface{}{
				"player": playerTypes,
				"enemy":  botTypes,
			},
		}
		logGameState(gs)
		fmt.Println("Received card play for match:", matchID, "CardID:", req.CardID)

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(res)
	}
}

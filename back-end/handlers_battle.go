package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
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
	sync.Mutex      // ล็อกภายใน state เอง
	PlayerDeck      []Card
	BotDeck         []Card
	PlayerHand      []Card
	BotHand         []Card
	PlayerATK       int
	BotATK          int
	PlayerDEF       int
	BotDEF          int
	PlayerSPD       int
	BotSPD          int
	PlayerMaxHP     int
	BotMaxHP        int
	PlayerCurrentHP int
	BotCurrentHP    int
	PlayingLevel    int
}

// map เก็บสถานะเกมทุกแมตช์
var gameStates = make(map[string]*GameState)
var gameStatesMutex sync.Mutex

// ----------- Utilities -----------
func logGameState(gs *GameState) {
	fmt.Println("------ GAME STATE ------")

	fmt.Println("PlayerDeck:", len(gs.PlayerDeck), "cards left")
	fmt.Println("PlayerHand:", formatHand(gs.PlayerHand))

	fmt.Println("BotDeck:", len(gs.BotDeck), "cards left")
	fmt.Println("BotHand:", formatHand(gs.BotHand))

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
	query := `SELECT id, username, email, atk, def, hp, spd, level, current_campaign_level, exp, money, created_at FROM users WHERE id = ?`
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
		for i := 0; i < 10; i++ {
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
	if len(*deck) < n {
		n = len(*deck)
	}
	hand := (*deck)[:n]
	*deck = (*deck)[n:]

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

func countCardLeft(deck []Card, hand []Card) map[string]int {
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

// ----------- Handlers -----------

func StartBattleHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req struct {
			UserID   int `json:"userId"`
			BotLevel int `json:"levelId"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.UserID == 0 {
			fmt.Println("T T")
			http.Error(w, "Invalid or missing userId", http.StatusBadRequest)
			return
		}

		user, err := getUserByIDFromDB(db, req.UserID)
		if err != nil {
			http.Error(w, "User not found", http.StatusNotFound)
			return
		}

		deck, err := getDeckByUserIDFromDB(db, req.UserID)
		if err != nil {
			http.Error(w, "Deck not found", http.StatusNotFound)
			return
		}

		botDeck := newShuffledDeck()
		playerHand := drawCards(&deck, 3)
		botHand := drawCards(&botDeck, 3)
		botATK, botDEF, botSPD, botHP := generateBotStats(req.BotLevel)

		gameState := &GameState{
			PlayerDeck:      deck,
			BotDeck:         botDeck,
			PlayerHand:      playerHand,
			BotHand:         botHand,
			PlayerATK:       user.Stat.Atk,
			BotATK:          botATK,
			PlayerDEF:       user.Stat.Def,
			BotDEF:          botDEF,
			PlayerSPD:       user.Stat.Spd,
			BotSPD:          botSPD,
			PlayerMaxHP:     user.Stat.HP,
			BotMaxHP:        botHP,
			PlayerCurrentHP: user.Stat.HP,
			BotCurrentHP:    botHP,
			PlayingLevel:    req.BotLevel,
		}

		matchID := uuid.New().String() // สร้าง match id ใหม่

		gameStatesMutex.Lock()
		gameStates[matchID] = gameState
		gameStatesMutex.Unlock()

		res := map[string]interface{}{
			"matchId":       matchID,
			"playerHand":    playerHand,
			"playerHP":      gameState.PlayerCurrentHP,
			"enemyHandSize": len(botHand),
			"enemyHP":       gameState.BotCurrentHP,
			"playerStats": map[string]int{
				"ATK": user.Stat.Atk,
				"DEF": user.Stat.Def,
				"SPD": user.Stat.Spd,
			},
			"enemyStats": map[string]int{
				"ATK": botATK,
				"DEF": botDEF,
				"SPD": botSPD,
			},
			"cardRemaining": map[string]interface{}{
				"player": countCardLeft(gameState.PlayerDeck, gameState.PlayerHand),
				"enemy":  countCardLeft(gameState.BotDeck, gameState.BotHand),
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

		var req struct {
			UserID int    `json:"userID"`
			CardID string `json:"cardId"`
		}

		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "Invalid request body", http.StatusBadRequest)
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
		for _, c := range gs.PlayerHand {
			if c.ID == req.CardID {
				playerCard = &c
			} else {
				newHand = append(newHand, c)
			}
		}
		if playerCard == nil {
			fmt.Println("Hand ", gs.PlayerHand)
			fmt.Println("Card select ", playerCard)
			http.Error(w, "Card not found in hand", http.StatusBadRequest)
			return
		}
		gs.PlayerHand = newHand

		botIndex := rand.Intn(len(gs.BotHand))
		botCard := gs.BotHand[botIndex]
		gs.BotHand = append(gs.BotHand[:botIndex], gs.BotHand[botIndex+1:]...)

		winner := ""
		damageToBot := 0
		damageToPlayer := 0

		switch playerCard.Type {
		case "rock":
			if botCard.Type == "scissors" {
				winner = "player"
				damageToBot = gs.PlayerATK - gs.BotDEF
			} else if botCard.Type == "paper" {
				winner = "enemy"
				damageToPlayer = gs.BotATK - gs.PlayerDEF
			} else {
				winner = "draw"
			}
		case "paper":
			if botCard.Type == "rock" {
				winner = "player"
				damageToBot = gs.PlayerATK - gs.BotDEF
			} else if botCard.Type == "scissors" {
				winner = "enemy"
				damageToPlayer = gs.BotATK - gs.PlayerDEF
			} else {
				winner = "draw"
			}
		case "scissors":
			if botCard.Type == "paper" {
				winner = "player"
				damageToBot = gs.PlayerATK - gs.BotDEF
			} else if botCard.Type == "rock" {
				winner = "enemy"
				damageToPlayer = gs.BotATK - gs.PlayerDEF
			} else {
				winner = "draw"
			}
		default:
			winner = "draw"
		}

		gs.BotCurrentHP -= damageToBot
		if gs.BotCurrentHP < 0 {
			gs.BotCurrentHP = 0
		}
		gs.PlayerCurrentHP -= damageToPlayer
		if gs.PlayerCurrentHP < 0 {
			gs.PlayerCurrentHP = 0
		}

		if len(gs.PlayerDeck) > 0 && len(gs.PlayerHand) < 3 {
			gs.PlayerHand = append(gs.PlayerHand, drawCards(&gs.PlayerDeck, 1)...)
		}
		if len(gs.BotDeck) > 0 && len(gs.BotHand) < 3 {
			gs.BotHand = append(gs.BotHand, drawCards(&gs.BotDeck, 1)...)
		}

		playerOutOfCards := len(gs.PlayerHand) == 0 && len(gs.PlayerDeck) == 0
		botOutOfCards := len(gs.BotHand) == 0 && len(gs.BotDeck) == 0

		botTypes := countCardLeft(gs.BotDeck, gs.BotHand)
		playerTypes := countCardLeft(gs.PlayerDeck, gs.PlayerHand)

		gameResult := "onGoing"
		if gs.PlayerCurrentHP == 0 || playerOutOfCards {
			gameResult = "botWin"
		} else if gs.BotCurrentHP == 0 || botOutOfCards {
			gameResult = "playerWin"
			// ✅ เรียกฟังก์ชันที่ใช้ DB พร้อมส่ง db เข้าไป
			if err := handlePlayerWin(req.UserID, db, gs.PlayingLevel); err != nil {
				fmt.Println("Failed to update player after win:", err)
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
				"player": gs.PlayerCurrentHP,
				"enemy":  gs.BotCurrentHP,
			},
			"playerHand": gs.PlayerHand,
			"enemyHand":  gs.BotHand,
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

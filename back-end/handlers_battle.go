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
)

// ----------- Models -----------

type Card struct {
	ID   string `json:"id"`
	Type string `json:"type"`
}

type GameState struct {
	PlayerDeck      []Card
	BotDeck         []Card
	PlayerHand      []Card
	BotHand         []Card
	PlayerATK       int
	BotATK          int
	PlayerDEF       int
	BotDEF          int
	PlayerMaxHP     int
	BotMaxHP        int
	PlayerCurrentHP int
	BotCurrentHP    int
	PlayerSPD       int
	BotSPD          int
	mutex           sync.Mutex
}

var gameStates = make(map[int]*GameState)
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
	query := `SELECT id, username, email, atk, def, hp, spd, level, current_level, exp, money, created_at FROM users WHERE id = ?`
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

func endGame(userID int, winner string) {
	fmt.Printf("Game ended for user %d. Winner: %s\n", userID, winner)
	// TODO: อัปเดต DB, เพิ่มเงิน, เก็บ log, ลบ game state ฯลฯ
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

// ----------- Handlers -----------

func StartBattleHandler(db *sql.DB) http.HandlerFunc {

	return func(w http.ResponseWriter, r *http.Request) {
		fmt.Println("start call")
		var req struct {
			UserID   int `json:"userId"`
			BotLevel int `json:"levelId"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.UserID == 0 {
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
		fmt.Println("bot stat ", botATK, botDEF, botSPD, botHP)
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
		}

		gameStatesMutex.Lock()
		gameStates[req.UserID] = gameState
		gameStatesMutex.Unlock()

		botTypes := countCardLeft(gameState.BotDeck, gameState.BotHand)
		playerTypes := countCardLeft(gameState.PlayerDeck, gameState.PlayerHand)

		res := map[string]interface{}{
			"playerHand":  playerHand,
			"playerHP":    gameState.PlayerCurrentHP,
			"botHandSize": len(botHand),
			"botHP":       gameState.BotCurrentHP,
			"playerStats": map[string]int{
				"ATK": user.Stat.Atk,
				"DEF": user.Stat.Def,
				"SPD": user.Stat.Def,
			},
			"botStats": map[string]int{
				"ATK": user.Stat.Atk,
				"DEF": user.Stat.Def,
				"SPD": user.Stat.Def,
			},
			"cardRemaining": map[string]interface{}{
				"player": playerTypes,
				"bot":    botTypes,
			},
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(res)
	}
}

func PlayCardHandler(w http.ResponseWriter, r *http.Request) {
	fmt.Println("play call")
	// fmt.Println(PlayerDeck)
	var req struct {
		UserID int    `json:"userId"`
		CardID string `json:"cardId"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.UserID == 0 {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}

	gameStatesMutex.Lock()
	gs, ok := gameStates[req.UserID]
	gameStatesMutex.Unlock()
	if !ok {
		http.Error(w, "Game not started", http.StatusBadRequest)
		return
	}

	gs.mutex.Lock()
	defer gs.mutex.Unlock()

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
		fmt.Println(w, "Card not found in hand")
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
			winner = "bot"
			damageToPlayer = gs.BotATK - gs.PlayerDEF
		} else {
			winner = "draw"
		}
	case "paper":
		if botCard.Type == "rock" {
			winner = "player"
			damageToBot = gs.PlayerATK - gs.BotDEF
		} else if botCard.Type == "scissors" {
			winner = "bot"
			damageToPlayer = gs.BotATK - gs.PlayerDEF
		} else {
			winner = "draw"
		}
	case "scissors":
		if botCard.Type == "paper" {
			winner = "player"
			damageToBot = gs.PlayerATK - gs.BotDEF
		} else if botCard.Type == "rock" {
			winner = "bot"
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

	// ตรวจสอบว่าฝ่ายไหนการ์ดหมด
	playerOutOfCards := len(gs.PlayerHand) == 0 && len(gs.PlayerDeck) == 0
	botOutOfCards := len(gs.BotHand) == 0 && len(gs.BotDeck) == 0

	botTypes := countCardLeft(gs.BotDeck, gs.BotHand)
	playerTypes := countCardLeft(gs.PlayerDeck, gs.PlayerHand)

	gameResult := "onGoing"
	if gs.PlayerCurrentHP == 0 || playerOutOfCards {
		gameResult = "botWin"
		endGame(req.UserID, "bot")
	} else if gs.BotCurrentHP == 0 || botOutOfCards {
		gameResult = "playerWin"
		endGame(req.UserID, "player")
	}

	res := map[string]interface{}{
		"winner":     winner,
		"result":     gameResult,
		"playerCard": playerCard,
		"botCard":    botCard,
		"damage": map[string]int{
			"playerToBot": damageToBot,
			"botToPlayer": damageToPlayer,
		},
		"hp": map[string]int{
			"player": gs.PlayerCurrentHP,
			"bot":    gs.BotCurrentHP,
		},
		"playerHand": gs.PlayerHand,
		"botHand":    gs.BotHand,
		"cardRemaining": map[string]interface{}{
			"player": playerTypes, // ส่งเป็น map[string]int ของ playerTypes
			"bot":    botTypes,    // ส่งเป็น map[string]int ของ botTypes
		},
	}
	logGameState(gs)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(res)
}

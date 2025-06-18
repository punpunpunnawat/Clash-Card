package main

import (
	"bytes"
	"database/sql"
	"encoding/json"
	"fmt"
	"io"
	"math"
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
	PVPState
	PlayingLevel int
}

// map เก็บสถานะเกมทุกแมตช์
var gameStates = make(map[string]*GameState)
var gameStatesMutex sync.Mutex

// ----------- Utilities -----------
// func logGameState(gs *GameState) {
// 	gs.Lock()
// 	defer gs.Unlock()

// 	fmt.Println("------ GAME STATE ------")

// 	fmt.Println("PlayerDeck:", len(gs.Player.Deck), "cards left")
// 	fmt.Println("PlayerHand:", formatHand(gs.Player.Hand))
// 	fmt.Printf("Player - HP: %d/%d | ATK: %d | DEF: %d | SPD: %d\n",
// 		gs.Player.CurrentHP, gs.Player.Stat.HP, gs.Player.Stat.ATK, gs.Player.Stat.DEF, gs.Player.Stat.SPD)

// 	fmt.Println("BotDeck:", len(gs.Bot.Deck), "cards left")
// 	fmt.Println("BotHand:", formatHand(gs.Bot.Hand))
// 	fmt.Printf("Bot - HP: %d/%d | ATK: %d | DEF: %d | SPD: %d\n",
// 		gs.Bot.CurrentHP, gs.Bot.Stat.HP, gs.Bot.Stat.ATK, gs.Bot.Stat.DEF, gs.Bot.Stat.SPD)

// 	fmt.Println("------------------------")
// }

func formatHand(hand []Card) string {
	var result []string
	for _, c := range hand {
		result = append(result, fmt.Sprintf("(ID:%s, Type:%s)", c.ID, c.Type))
	}
	return strings.Join(result, ", ")
}

func getUserByIDFromDB(db *sql.DB, userID string) (*User, error) {
	var user User
	query := `SELECT id, username, email, atk, def, hp, spd, level, current_campaign_level, exp, gold, created_at, class FROM users WHERE id = ?`
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
		&user.Gold,
		&user.CreatedAt,
		&user.Class,
	)
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func getDeckByUserIDFromDB(db *sql.DB, userID string) ([]Card, error) {
	rows, err := db.Query("SELECT card_type, quantity FROM decks WHERE user_id = ?", userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var cards []Card
	idCounter := 1

	for rows.Next() {
		var cardType string
		var quantity int
		if err := rows.Scan(&cardType, &quantity); err != nil {
			return nil, err
		}

		// สร้างการ์ดตามจำนวน quantity
		for i := 0; i < quantity; i++ {
			cardID := "c" + strconv.Itoa(idCounter)
			cards = append(cards, Card{ID: cardID, Type: cardType})
			idCounter++
		}
	}

	if len(cards) == 0 {
		return nil, fmt.Errorf("deck is empty")
	}

	// shuffle การ์ด
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

func countCard(card []Card) map[string]int {

	countByType := map[string]int{
		"rock":     0,
		"paper":    0,
		"scissors": 0,
	}

	for _, card := range card {
		countByType[card.Type]++
	}

	return countByType
}

func handlePlayerWin(userID string, db *sql.DB, wonLevel int) (statGain UnitStat, levelGain, expGain, goldGain int, err error) {
	var currentLevel int
	err = db.QueryRow(`SELECT current_campaign_level FROM users WHERE id = ?`, userID).Scan(&currentLevel)
	if err != nil {
		err = fmt.Errorf("failed to get current campaign level: %v", err)
		return
	}

	fmt.Println("[DEBUG] cLVL ", currentLevel)
	fmt.Println("[DEBUG] wLVL ", wonLevel)
	// คำนวณรางวัล
	if wonLevel == currentLevel {
		fmt.Println("[DEBUG] ??? ")
		expGain = 50 + (20 * wonLevel)
		goldGain = 20 * wonLevel
		levelGain = 1 // เพราะเลเวลเพิ่มแน่ๆ
	} else {
		expGain = 5 * wonLevel
		goldGain = 5 * wonLevel
		levelGain = 0
	}
	fmt.Println("[DEBUG] exp gain ", expGain)
	fmt.Println("[DEBUG] gold gain ", goldGain)

	// ดึงข้อมูลปัจจุบัน
	var level, currentExp int
	var class string
	query := `SELECT level, exp, class FROM users WHERE id = ?`
	err = db.QueryRow(query, userID).Scan(&level, &currentExp, &class)
	if err != nil {
		err = fmt.Errorf("failed to get user level/class/exp: %v", err)
		return
	}

	totalExp := currentExp + expGain
	newLevel := level
	levelUpCount := 0

	// คำนวณเลเวลใหม่ (ถ้าเก็บ exp เพิ่มเลเวล)
	for {
		requiredExp := 50 + (newLevel * 50)
		if totalExp >= requiredExp {
			totalExp -= requiredExp
			newLevel++
			levelUpCount++
		} else {
			break
		}
	}

	levelGain = levelUpCount

	// คำนวณ stat bonus ตามคลาส
	switch class {
	case "warrior":
		statGain.Atk = 2 * levelUpCount
		statGain.Def = 2 * levelUpCount
		statGain.Spd = 1 * levelUpCount
		statGain.HP = 20 * levelUpCount
	case "mage":
		statGain.Atk = 2 * levelUpCount
		statGain.Def = 1 * levelUpCount
		statGain.Spd = 2 * levelUpCount
		statGain.HP = 20 * levelUpCount
	case "assassin":
		statGain.Atk = 2 * levelUpCount
		statGain.Def = 1 * levelUpCount
		statGain.Spd = 3 * levelUpCount
		statGain.HP = 10 * levelUpCount
	}

	statPointUp := levelUpCount * 2

	// สร้าง SQL update
	var updateQuery string
	if wonLevel == currentLevel {
		updateQuery = `
			UPDATE users
			SET exp = ?, gold = gold + ?, current_campaign_level = current_campaign_level + 1,
				level = ?, stat_point = stat_point + ?,
				atk = atk + ?, def = def + ?, spd = spd + ?, hp = hp + ?
			WHERE id = ?
		`
		_, err = db.Exec(updateQuery, totalExp, goldGain, newLevel, statPointUp,
			statGain.Atk, statGain.Def, statGain.Spd, statGain.HP, userID)
	} else {
		updateQuery = `
			UPDATE users
			SET exp = ?, gold = gold + ?,
				level = ?, stat_point = stat_point + ?,
				atk = atk + ?, def = def + ?, spd = spd + ?, hp = hp + ?
			WHERE id = ?
		`
		_, err = db.Exec(updateQuery, totalExp, goldGain, newLevel, statPointUp,
			statGain.Atk, statGain.Def, statGain.Spd, statGain.HP, userID)
	}

	if err != nil {
		err = fmt.Errorf("failed to update user data: %v", err)
		return
	}

	return
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
			BotLevel int `json:"levelId"`
		}
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			fmt.Println("[ERROR] Missing Authorization header")
			http.Error(w, "Missing Authorization header", http.StatusUnauthorized)
			return
		}

		var tokenStr string
		fmt.Sscanf(authHeader, "Bearer %s", &tokenStr)
		if tokenStr == "" {
			fmt.Println("[ERROR] Invalid Authorization header format:", authHeader)
			http.Error(w, "Invalid Authorization header", http.StatusUnauthorized)
			return
		}

		userID, err := extractUserIDFromToken(tokenStr)
		if err != nil {
			fmt.Println("[ERROR] Failed to extract user ID from token:", err)
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}
		fmt.Println("[INFO] userID from token:", userID)

		if err := json.NewDecoder(r.Body).Decode(&req); err != nil || userID == "0" {
			fmt.Println("[ERROR] Failed to decode request body or invalid userID, body decode error:", err)
			http.Error(w, "Invalid or missing userId", http.StatusBadRequest)
			return
		}
		fmt.Println("[INFO] BotLevel requested:", req.BotLevel)

		user, err := getUserByIDFromDB(db, userID)
		if err != nil {
			fmt.Println("[ERROR] Failed to get user by ID:", userID, "err:", err)
			http.Error(w, "User not found", http.StatusNotFound)
			return
		}
		fmt.Println("[INFO] Fetched user:", user.Username)

		deck, err := getDeckByUserIDFromDB(db, userID)
		if err != nil {
			fmt.Println("[ERROR] Failed to get deck for user:", userID, "err:", err)
			http.Error(w, "Deck not found", http.StatusNotFound)
			return
		}
		fmt.Println("[INFO] Deck fetched for user:", userID, "| deck len:", len(deck))

		botDeck := newShuffledDeck()
		playerHand := drawCards(&deck, 3)
		botHand := drawCards(&botDeck, 3)
		botATK, botDEF, botSPD, botHP := generateBotStats(req.BotLevel)

		gameState := &GameState{
			PVPState: PVPState{
				PlayerA: PlayerData{
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
					Class:     user.Class,
					TrueSight: 0,
				},
				PlayerB: PlayerData{
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
					Class:     "none",
					TrueSight: 0,
				},
			},
			PlayingLevel: req.BotLevel,
		}

		matchID := uuid.New().String() // สร้าง match id ใหม่

		gameStatesMutex.Lock()
		gameStates[matchID] = gameState
		gameStatesMutex.Unlock()

		// res := map[string]interface{}{
		// 	"matchId":       matchID,
		// 	"playerHand":    gameState.PVPState.PlayerA.Hand,
		// 	"playerHP":      gameState.PVPState.PlayerA.CurrentHP,
		// 	"enemyHandSize": len(gameState.PVPState.PlayerB.Hand),
		// 	"enemyHP":       gameState.PVPState.PlayerB.CurrentHP,
		// 	"playerStats": map[string]int{
		// 		"ATK": gameState.PVPState.PlayerA.Stat.ATK,
		// 		"DEF": gameState.PVPState.PlayerA.Stat.DEF,
		// 		"SPD": gameState.PVPState.PlayerA.Stat.SPD,
		// 	},
		// 	"enemyStats": map[string]int{
		// 		"ATK": gameState.PVPState.PlayerB.Stat.ATK,
		// 		"DEF": gameState.PVPState.PlayerB.Stat.DEF,
		// 		"SPD": gameState.PVPState.PlayerB.Stat.SPD,
		// 	},
		// 	"cardRemaining": map[string]interface{}{
		// 		"player": countCard(append(gameState.PVPState.PlayerA.Deck, gameState.PVPState.PlayerA.Hand...)),
		// 		"enemy":  countCard(append(gameState.PVPState.PlayerB.Deck, gameState.PVPState.PlayerB.Hand...)),
		// 	},
		// }

		playerCardRemaining := countCard(append(gameState.PVPState.PlayerA.Deck, gameState.PVPState.PlayerA.Hand...))
		botCardRemaining := countCard(append(gameState.PVPState.PlayerB.Deck, gameState.PVPState.PlayerB.Hand...))
		res := map[string]interface{}{
			"type":    "initialData",
			"matchID": matchID,
			"player": map[string]interface{}{
				"name":          gameState.PVPState.PlayerA.Name,
				"level":         gameState.PVPState.PlayerA.Level,
				"currentHP":     gameState.PVPState.PlayerA.CurrentHP,
				"cardRemaining": playerCardRemaining,
				"hand":          gameState.PVPState.PlayerA.Hand,
				"stat": map[string]interface{}{
					"atk": gameState.PVPState.PlayerA.Stat.ATK,
					"def": gameState.PVPState.PlayerA.Stat.DEF,
					"spd": gameState.PVPState.PlayerA.Stat.SPD,
					"hp":  gameState.PVPState.PlayerA.Stat.HP,
				},
				"class":     gameState.PVPState.PlayerA.Class,
				"trueSight": gameState.PVPState.PlayerA.TrueSight,
			},
			"opponent": map[string]interface{}{
				"name":          gameState.PVPState.PlayerB.Name,
				"level":         gameState.PVPState.PlayerB.Level,
				"currentHP":     gameState.PVPState.PlayerB.CurrentHP,
				"cardRemaining": botCardRemaining,
				"handSize":      len(gameState.PVPState.PlayerB.Hand),
				"stat": map[string]interface{}{
					"atk": gameState.PVPState.PlayerB.Stat.ATK,
					"def": gameState.PVPState.PlayerB.Stat.DEF,
					"spd": gameState.PVPState.PlayerB.Stat.SPD,
					"hp":  gameState.PVPState.PlayerB.Stat.HP,
				},
				"class":     gameState.PVPState.PlayerB.Class,
				"trueSight": gameState.PVPState.PlayerB.TrueSight,
			},
		}
		// response := map[string]interface{}{
		// 	"type": "initialData",
		// 	"player": map[string]interface{}{
		// 		"name":          state.PlayerA.Name,
		// 		"level":         state.PlayerA.Level,
		// 		"currentHP":     state.PlayerA.CurrentHP,
		// 		"cardRemaining": A_CardRemaining,
		// 		"hand":          state.PlayerA.Hand,
		// 		"stat": map[string]interface{}{
		// 			"atk": state.PlayerA.Stat.ATK,
		// 			"def": state.PlayerA.Stat.DEF,
		// 			"spd": state.PlayerA.Stat.SPD,
		// 			"hp":  state.PlayerA.Stat.HP,
		// 		},
		// 		"class":     state.PlayerA.Class,
		// 		"trueSight": state.PlayerA.TrueSight,
		// 	},
		// 	"opponent": map[string]interface{}{
		// 		"name":          state.PlayerB.Name,
		// 		"level":         state.PlayerB.Level,
		// 		"currentHP":     state.PlayerB.CurrentHP,
		// 		"cardRemaining": B_CardRemaining,
		// 		"handSize":      len(state.PlayerB.Hand),
		// 		"stat": map[string]interface{}{
		// 			"atk": state.PlayerB.Stat.ATK,
		// 			"def": state.PlayerB.Stat.DEF,
		// 			"spd": state.PlayerB.Stat.SPD,
		// 			"hp":  state.PlayerB.Stat.HP,
		// 		},
		// 		"class":     state.PlayerB.Class,
		// 		"trueSight": state.PlayerB.TrueSight,
		// 	},
		// }

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
		fmt.Println("[DEBUG] matchID:", matchID)

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
		fmt.Println("[DEBUG] token:", tokenStr)

		userID, err := extractUserIDFromToken(tokenStr)
		if err != nil {
			http.Error(w, "Invalid token", http.StatusUnauthorized)
			return
		}
		fmt.Println("[DEBUG] userID:", userID)

		bodyBytes, err := io.ReadAll(r.Body)
		if err != nil {
			fmt.Println("[ERROR] Failed to read body:", err)
			http.Error(w, "Failed to read body", http.StatusBadRequest)
			return
		}
		r.Body = io.NopCloser(bytes.NewBuffer(bodyBytes))

		var req struct {
			CardID string `json:"cardID"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			fmt.Println("[ERROR] Failed to decode body:", err)
			http.Error(w, "Invalid request body", http.StatusBadRequest)
			return
		}
		fmt.Println("[DEBUG] cardID:", req.CardID)

		gameStatesMutex.Lock()
		gs, ok := gameStates[matchID]
		gameStatesMutex.Unlock()
		if !ok {
			fmt.Println("[ERROR] Game state not found for matchID:", matchID)
			http.Error(w, "Game not started", http.StatusBadRequest)
			return
		}

		gs.Lock()
		defer gs.Unlock()

		var playerCard Card
		for _, card := range gs.PlayerA.Hand {
			if card.ID == req.CardID {
				playerCard = card
			}
		}
		fmt.Println("[DEBUG] playerCard chosen:", playerCard)

		botIndex := rand.Intn(len(gs.PlayerB.Hand))
		botCard := gs.PlayerB.Hand[botIndex]
		fmt.Println("[DEBUG] botCard chosen:", botCard)

		removeCardFromHand(&gs.PlayerA.Hand, playerCard.ID)
		removeCardFromHand(&gs.PlayerB.Hand, botCard.ID)

		winner := findWinner(playerCard, botCard)
		fmt.Println("[DEBUG] round winner:", winner)

		damageToA, damageToB, specialEventA, specialEventB := doDamage(&gs.PVPState, playerCard, botCard, winner)
		fmt.Printf("[DEBUG] Damage A: %d | Damage B: %d\n", damageToA, damageToB)
		fmt.Printf("[DEBUG] Event A: %+v | Event B: %+v\n", specialEventA, specialEventB)

		gameStatus, result, detail, _, _ := checkGameResult(&gs.PVPState)
		fmt.Printf("[DEBUG] gameStatus: %s | result: %s | detail: %s\n", gameStatus, result, detail)

		postGameDetail := PostGameDetail{
			Result:   result,
			Detail:   detail,
			Exp:      0,
			Gold:     0,
			LvlUp:    0,
			StatGain: UnitStat{Atk: 0, Def: 0, Spd: 0, HP: 0},
		}

		if gameStatus == "end" && result == "Win" {
			statGain, levelGain, expGain, goldGain, err := handlePlayerWin(userID, db, gs.PlayingLevel)
			if err != nil {
				fmt.Println("[ERROR] handlePlayerWin:", err)
			} else {
				fmt.Printf("[DEBUG] Rewards - EXP: %d, Gold: %d, LvlUp: %d, StatGain: %+v\n", expGain, goldGain, levelGain, statGain)
			}
			postGameDetail = PostGameDetail{
				Result:   result,
				Detail:   detail,
				Exp:      expGain,
				Gold:     goldGain,
				LvlUp:    levelGain,
				StatGain: statGain,
			}
		}

		// Draw card
		if gameStatus == "onGoing" {
			if len(gs.PlayerA.Deck) > 0 && len(gs.PlayerA.Hand) < 3 {
				gs.PlayerA.Hand = append(gs.PlayerA.Hand, drawCards(&gs.PlayerA.Deck, 1)...)
				fmt.Println("[DEBUG] Player A draws a card")
			}
			if len(gs.PlayerB.Deck) > 0 && len(gs.PlayerB.Hand) < 3 {
				gs.PlayerB.Hand = append(gs.PlayerB.Hand, drawCards(&gs.PlayerB.Deck, 1)...)
				fmt.Println("[DEBUG] Player B draws a card")
			}
		}

		A_CardRemaining := countCard(append(gs.PlayerA.Deck, gs.PlayerA.Hand...))
		B_CardRemaining := countCard(append(gs.PlayerB.Deck, gs.PlayerB.Hand...))

		res := map[string]interface{}{
			"type": "round_result",
			"player": map[string]interface{}{
				"hp":            gs.PlayerA.CurrentHP,
				"hand":          gs.PlayerA.Hand,
				"cardPlayed":    playerCard,
				"doDamage":      damageToB,
				"cardRemaining": A_CardRemaining,
				"trueSight":     gs.PlayerA.TrueSight,
				"specialEvent":  specialEventA,
			},
			"opponent": map[string]interface{}{
				"hp":            gs.PlayerB.CurrentHP,
				"handLength":    len(gs.PlayerB.Hand),
				"cardPlayed":    botCard,
				"doDamage":      damageToA,
				"cardRemaining": B_CardRemaining,
				"trueSight":     gs.PlayerB.TrueSight,
				"specialEvent":  specialEventB,
			},
			"gameStatus": func() string {
				if gameStatus == "Awin" {
					return "playerWin"
				} else if gameStatus == "Bwin" {
					return "opponentWin"
				}
				return gameStatus
			}(),
			"roundWinner": func() string {
				if winner == "A" {
					return "player"
				} else if winner == "B" {
					return "opponent"
				}
				return "draw"
			}(),
			"postGameDetail": postGameDetail,
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(res)
	}

}

func doDamage(
	state *PVPState,
	cardA Card,
	cardB Card,
	winner string,
) (damageToA int, damageToB int, specialEventA string, specialEventB string) {

	damageToB = 0
	damageToA = 0
	specialEventA = "nothing"
	specialEventB = "nothing"

	evasionA := math.Max(0.15, math.Min(0.1+float64(state.PlayerA.Stat.SPD-state.PlayerB.Stat.SPD)*0.01, 0.75))
	evasionB := math.Max(0.15, math.Min(0.1+float64(state.PlayerB.Stat.SPD-state.PlayerA.Stat.SPD)*0.01, 0.75))

	attackToAMiss := rand.Float64() < evasionA
	attackToBMiss := rand.Float64() < evasionB

	if winner == "A" {
		damageToB = int(math.Max(float64(state.PlayerA.Stat.ATK-state.PlayerB.Stat.DEF), 1))

		if state.PlayerA.Class == "assassin" && cardA.Type == "scissors" {
			damageToB = int(math.Max(float64(state.PlayerA.Stat.ATK), 1))
			attackToBMiss = false
			specialEventA = "True Strike"
		} else if state.PlayerA.Class == "mage" && cardA.Type == "paper" {
			state.PlayerA.TrueSight += 1
			specialEventA = "True Sight"
		}
	} else if winner == "B" {
		damageToA = int(math.Max(float64(state.PlayerB.Stat.ATK-state.PlayerA.Stat.DEF), 1))

		if state.PlayerB.Class == "assassin" && cardB.Type == "scissors" {
			damageToA = int(math.Max(float64(state.PlayerB.Stat.ATK), 1))
			attackToAMiss = false
			specialEventB = "True Strike"
		} else if state.PlayerB.Class == "mage" && cardB.Type == "paper" {
			state.PlayerB.TrueSight += 1
			specialEventB = "True Sight"
		}
	} else if winner == "draw" {
		if state.PlayerA.Class == "warrior" && cardA.Type == "rock" {
			damageToB = int(math.Max(float64(state.PlayerA.Stat.ATK-state.PlayerB.Stat.DEF)/2, 1))
			attackToBMiss = false
			specialEventA = "Warrior Blood"
		}
		if state.PlayerB.Class == "warrior" && cardB.Type == "rock" {
			damageToA = int(math.Max(float64(state.PlayerB.Stat.ATK-state.PlayerA.Stat.DEF)/2, 1))
			attackToAMiss = false
			specialEventB = "Warrior Blood"
		}
	}

	if damageToA != 0 {
		if attackToAMiss {
			damageToA = -1
		} else {
			state.PlayerA.CurrentHP = int(math.Max(float64(state.PlayerA.CurrentHP-damageToA), 0))
		}
	}

	if damageToB != 0 {
		if attackToBMiss {
			damageToB = -1
		} else {
			state.PlayerB.CurrentHP = int(math.Max(float64(state.PlayerB.CurrentHP-damageToB), 0))
		}
	}

	return
}

func checkGameResult(state *PVPState) (gameStatus, resultA, detailA, resultB, detailB string) {
	playerOutOfHP := state.PlayerA.CurrentHP == 0
	opponentOutOfHP := state.PlayerB.CurrentHP == 0
	playerOutOfCard := len(state.PlayerA.Deck)+len(state.PlayerA.Hand) == 0
	opponentOutOfCard := len(state.PlayerB.Deck)+len(state.PlayerB.Hand) == 0
	gameStatus = "onGoing"
	switch {
	case playerOutOfHP && opponentOutOfHP:
		gameStatus = "end"
		resultA, detailA = "Draw", "Both out of HP"
		resultB, detailB = "Draw", "Both out of HP"

	case playerOutOfHP:
		gameStatus = "end"
		resultA, detailA = "Lose", "You out of HP"
		resultB, detailB = "Win", "Opponent out of HP"

	case opponentOutOfHP:
		gameStatus = "end"
		resultA, detailA = "Win", "Opponent out of HP"
		resultB, detailB = "Lose", "You out of HP"

	case playerOutOfCard && opponentOutOfCard:
		gameStatus = "end"
		resultA, detailA = "Draw", "Both out of Card"
		resultB, detailB = "Draw", "Both out of Card"

	case playerOutOfCard:
		gameStatus = "end"
		resultA, detailA = "Lose", "You out of Card"
		resultB, detailB = "Win", "Opponent out of Card"

	case opponentOutOfCard:
		gameStatus = "end"
		resultA, detailA = "Win", "Opponent out of Card"
		resultB, detailB = "Lose", "You out of Card"
	}

	return
}

func findWinner(cardA Card, cardB Card) (winner string) {
	if cardA.Type == cardB.Type {
		winner = "draw"
	} else if cardA.Type == "rock" && cardB.Type == "scissors" {
		winner = "A"
	} else if cardA.Type == "scissors" && cardB.Type == "paper" {
		winner = "A"
	} else if cardA.Type == "paper" && cardB.Type == "rock" {
		winner = "A"
	} else {
		winner = "B"
	}
	return winner
}

func TrueSightHandler() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		vars := mux.Vars(r)
		matchID := vars["matchID"]
		if matchID == "" {
			http.Error(w, "Missing matchID", http.StatusBadRequest)
			return
		}

		gameStatesMutex.Lock()
		gs, ok := gameStates[matchID]
		gameStatesMutex.Unlock()

		if !ok {
			http.Error(w, "Game not found", http.StatusNotFound)
			return
		}

		gs.Lock()
		defer gs.Unlock()

		if gs.PlayerA.TrueSight <= 0 {
			w.WriteHeader(http.StatusForbidden)
			json.NewEncoder(w).Encode(map[string]string{
				"type":  "error",
				"error": "No TrueSight left",
			})
			return
		}

		gs.PlayerA.TrueSight--

		opponentCardCount := countCard(gs.PlayerB.Hand)

		response := map[string]interface{}{
			"type":          "true_sight_result",
			"opponentHand":  opponentCardCount,
			"trueSightLeft": gs.PlayerA.TrueSight,
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(response)
	}
}

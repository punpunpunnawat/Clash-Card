package battle

import (
	"clash_and_card/models"
	"database/sql"
	"fmt"
	"math"
	"math/rand"
	"strconv"
)

// func (g *GameState) Unlock() {
// 	panic("unimplemented")
// }

// func (g *GameState) Lock() {
// 	panic("unimplemented")
// }

// func logGameState(gs *GameState) {
// 	gs.Lock()
// 	defer gs.Unlock()

// 	fmt.Println("------ GAME STATE ------")

// 	fmt.Println("PlayerDeck:", len(gs.PVPState.PlayerA.Deck), "cards left")
// 	fmt.Println("PlayerHand:", formatHand(gs.PVPState.PlayerA.Hand))
// 	fmt.Printf("Player - HP: %d/%d | ATK: %d | DEF: %d | SPD: %d\n",
// 		gs.PVPState.PlayerA.CurrentHP, gs.PVPState.PlayerA.Stat.HP, gs.PVPState.PlayerA.Stat.ATK, gs.PVPState.PlayerA.Stat.DEF, gs.PVPState.PlayerA.Stat.SPD)

// 	fmt.Println("BotDeck:", len(gs.PVPState.PlayerB.Deck), "cards left")
// 	fmt.Println("BotHand:", formatHand(gs.PVPState.PlayerB.Hand))
// 	fmt.Printf("Bot - HP: %d/%d | ATK: %d | DEF: %d | SPD: %d\n",
// 		gs.PVPState.PlayerB.CurrentHP, gs.PVPState.PlayerB.Stat.HP, gs.PVPState.PlayerB.Stat.ATK, gs.PVPState.PlayerB.Stat.DEF, gs.PVPState.PlayerB.Stat.SPD)

// 	fmt.Println("------------------------")
// }

// func formatHand(hand []Card) string {
// 	var result []string
// 	for _, c := range hand {
// 		result = append(result, fmt.Sprintf("(ID:%s, Type:%s)", c.ID, c.Type))
// 	}
// 	return strings.Join(result, ", ")
// }

func getUserByIDFromDB(db *sql.DB, userID string) (*models.User, error) {
	var user models.User
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

	rand.Shuffle(len(cards), func(i, j int) {
		cards[i], cards[j] = cards[j], cards[i]
	})

	return cards, nil
}

func drawCards(deck *[]Card, n int) []Card {
	if len(*deck) < n {
		n = len(*deck)
	}
	hand := (*deck)[:n]
	*deck = (*deck)[n:]
	return hand
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

	switch winner {
	case "A":
		damageToB = int(math.Max(float64(state.PlayerA.Stat.ATK-state.PlayerB.Stat.DEF), 1))

		if state.PlayerA.Class == "assassin" && cardA.Type == "scissors" {
			damageToB = int(math.Max(float64(state.PlayerA.Stat.ATK), 1))
			attackToBMiss = false
			specialEventA = "True Strike"
		} else if state.PlayerA.Class == "mage" && cardA.Type == "paper" {
			state.PlayerA.TrueSight += 1
			specialEventA = "True Sight"
		}
	case "B":
		damageToA = int(math.Max(float64(state.PlayerB.Stat.ATK-state.PlayerA.Stat.DEF), 1))

		if state.PlayerB.Class == "assassin" && cardB.Type == "scissors" {
			damageToA = int(math.Max(float64(state.PlayerB.Stat.ATK), 1))
			attackToAMiss = false
			specialEventB = "True Strike"
		} else if state.PlayerB.Class == "mage" && cardB.Type == "paper" {
			state.PlayerB.TrueSight += 1
			specialEventB = "True Sight"
		}
	case "draw":
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

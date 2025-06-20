package battle

import (
	"clash_and_card/models"
	"clash_and_card/user"
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool { return true },
}

type CardType string

const (
	Rock     CardType = "rock"
	Paper    CardType = "paper"
	Scissors CardType = "scissors"
)

type Message struct {
	Type   string `json:"type"`
	CardID string `json:"cardID,omitempty"` // ใช้เมื่อ Type = "selected_card"
}

type PVPClient struct {
	conn   *websocket.Conn
	roomID string
	slot   string // "A" หรือ "B"
	userID string // เก็บ userID ที่ถอดจาก token
	send   chan []byte
}

type PVPMatch struct {
	Clients  map[string]*PVPClient // key: "A", "B"
	Selected map[string]*Card      // key: slot, value: selected card
}

type PVPManager struct {
	rooms map[string]*PVPMatch
	lock  sync.Mutex
}

var pvpManager = PVPManager{
	rooms: make(map[string]*PVPMatch),
}

// pvpStates เก็บสถานะเกมจริง (Deck, Stat, HP...) ของแต่ละห้อง
var (
	pvpStates   = make(map[string]*PVPState)
	pvpStatesMu sync.Mutex
)

type PVPState struct {
	sync.Mutex // ล็อกภายใน state เอง
	PlayerA    PlayerData
	PlayerB    PlayerData
}

type Stat struct {
	ATK int
	DEF int
	SPD int
	HP  int
}

type PlayerData struct {
	//ID        int
	Name      string
	Level     int
	CurrentHP int
	Deck      []Card
	Hand      []Card
	Stat      Stat
	Class     string
	TrueSight int
}

func loadPVPStateFromDB(db *sql.DB, userAID, userBID string) (*PVPState, error) {
	userA, err := getUserByIDFromDB(db, userAID)
	if err != nil {
		return nil, err
	}
	userB, err := getUserByIDFromDB(db, userBID)
	if err != nil {
		return nil, err
	}

	deckA, err := getDeckByUserIDFromDB(db, userAID)
	if err != nil {
		return nil, err
	}
	deckB, err := getDeckByUserIDFromDB(db, userBID)
	if err != nil {
		return nil, err
	}

	state := &PVPState{
		PlayerA: PlayerData{
			Name:      userA.Username,
			Level:     userA.Level,
			Deck:      deckA,
			CurrentHP: userA.Stat.HP,
			Hand:      []Card{},
			Stat: Stat{
				ATK: userA.Stat.Atk,
				DEF: userA.Stat.Def,
				SPD: userA.Stat.Spd,
				HP:  userA.Stat.HP,
			},
			Class:     userA.Class,
			TrueSight: 0,
		},
		PlayerB: PlayerData{
			Name:      userB.Username,
			Level:     userB.Level,
			Deck:      deckB,
			Hand:      []Card{},
			CurrentHP: userB.Stat.HP,
			Stat: Stat{
				ATK: userB.Stat.Atk,
				DEF: userB.Stat.Def,
				SPD: userB.Stat.Spd,
				HP:  userB.Stat.HP,
			},
			Class:     userB.Class,
			TrueSight: 0,
		},
	}

	return state, nil
}

// Handler
func HandlePVPWebSocket(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {

		tokenStr := r.Header.Get("Sec-WebSocket-Protocol")
		if tokenStr == "" {
			http.Error(w, "missing token", http.StatusUnauthorized)
			return
		}

		header := http.Header{}
		header.Add("Sec-WebSocket-Protocol", tokenStr) // ส่งกลับ client ด้วย

		userID, err := user.ExtractUserIDFromToken(tokenStr)

		if err != nil {
			http.Error(w, "invalid token", http.StatusUnauthorized)
			return
		}

		conn, err := upgrader.Upgrade(w, r, header) // ต้องใส่ header กลับไป
		if err != nil {
			log.Println("WebSocket upgrade error:", err)
			return
		}

		roomID := r.URL.Query().Get("room")
		if roomID == "" {
			http.Error(w, "room required", http.StatusBadRequest)
			return
		}

		pvpManager.lock.Lock()
		match, exists := pvpManager.rooms[roomID]
		if !exists {
			match = &PVPMatch{
				Clients:  make(map[string]*PVPClient),
				Selected: make(map[string]*Card),
			}
			pvpManager.rooms[roomID] = match
		}

		var slot string
		if _, ok := match.Clients["A"]; !ok {
			slot = "A"
		} else if _, ok := match.Clients["B"]; !ok {
			slot = "B"
		} else {
			pvpManager.lock.Unlock()
			http.Error(w, "room full", http.StatusForbidden)
			return
		}

		client := &PVPClient{
			conn:   conn,
			roomID: roomID,
			slot:   slot,
			userID: userID,
			send:   make(chan []byte, 256),
		}

		match.Clients[slot] = client
		pvpManager.lock.Unlock()

		if len(match.Clients) == 2 {
			clientA := match.Clients["A"]
			clientB := match.Clients["B"]

			go func() {
				state, err := loadPVPStateFromDB(db, clientA.userID, clientB.userID)
				if err != nil {
					log.Println("loadPVPStateFromDB error:", err)
					return
				}

				pvpManager.lock.Lock()
				match, ok := pvpManager.rooms[roomID]
				if !ok {
					pvpManager.lock.Unlock()
					return
				}
				clientA, okA := match.Clients["A"]
				clientB, okB := match.Clients["B"]
				pvpManager.lock.Unlock()

				state.PlayerA.Hand = drawCards(&state.PlayerA.Deck, 3)
				state.PlayerB.Hand = drawCards(&state.PlayerB.Deck, 3)

				A_CardRemaining := countCard(append(state.PlayerA.Deck, state.PlayerA.Hand...))
				B_CardRemaining := countCard(append(state.PlayerB.Deck, state.PlayerB.Hand...))

				if okA {
					response := map[string]interface{}{
						"type": "initialData",
						"player": map[string]interface{}{
							"name":          state.PlayerA.Name,
							"level":         state.PlayerA.Level,
							"currentHP":     state.PlayerA.CurrentHP,
							"cardRemaining": A_CardRemaining,
							"hand":          state.PlayerA.Hand,
							"stat": map[string]interface{}{
								"atk": state.PlayerA.Stat.ATK,
								"def": state.PlayerA.Stat.DEF,
								"spd": state.PlayerA.Stat.SPD,
								"hp":  state.PlayerA.Stat.HP,
							},
							"class":     state.PlayerA.Class,
							"trueSight": state.PlayerA.TrueSight,
						},
						"opponent": map[string]interface{}{
							"name":          state.PlayerB.Name,
							"level":         state.PlayerB.Level,
							"currentHP":     state.PlayerB.CurrentHP,
							"cardRemaining": B_CardRemaining,
							"handSize":      len(state.PlayerB.Hand),
							"stat": map[string]interface{}{
								"atk": state.PlayerB.Stat.ATK,
								"def": state.PlayerB.Stat.DEF,
								"spd": state.PlayerB.Stat.SPD,
								"hp":  state.PlayerB.Stat.HP,
							},
							"class":     state.PlayerB.Class,
							"trueSight": state.PlayerB.TrueSight,
						},
					}
					respJSON, err := json.Marshal(response)
					if err == nil {
						clientA.send <- respJSON
					}
				}
				if okB {
					response := map[string]interface{}{
						"type":             "initialData",
						"opponentHandSize": len(state.PlayerA.Hand),
						"player": map[string]interface{}{
							"name":          state.PlayerB.Name,
							"level":         state.PlayerB.Level,
							"currentHP":     state.PlayerB.CurrentHP,
							"cardRemaining": B_CardRemaining,
							"hand":          state.PlayerB.Hand,
							"stat": map[string]interface{}{
								"atk": state.PlayerB.Stat.ATK,
								"def": state.PlayerB.Stat.DEF,
								"spd": state.PlayerB.Stat.SPD,
								"hp":  state.PlayerB.Stat.HP,
							},
							"class":     state.PlayerB.Class,
							"trueSight": state.PlayerB.TrueSight,
						},
						"opponent": map[string]interface{}{
							"handSize":      len(state.PlayerA.Hand),
							"name":          state.PlayerA.Name,
							"level":         state.PlayerA.Level,
							"currentHP":     state.PlayerA.CurrentHP,
							"cardRemaining": A_CardRemaining,
							"stat": map[string]interface{}{
								"atk": state.PlayerA.Stat.ATK,
								"def": state.PlayerA.Stat.DEF,
								"spd": state.PlayerA.Stat.SPD,
								"hp":  state.PlayerA.Stat.HP,
							},
							"class":     state.PlayerA.Class,
							"trueSight": state.PlayerA.TrueSight,
						},
					}
					respJSON, err := json.Marshal(response)
					if err == nil {
						clientB.send <- respJSON
					}
				}
				//logPVPState(roomID, state)
				pvpStatesMu.Lock()
				pvpStates[roomID] = state
				pvpStatesMu.Unlock()
			}()
		}

		// ส่ง slot assigned ทันทีหลัง unlock
		go func() {
			response := map[string]interface{}{
				"type": "slot_assigned",
				"slot": slot,
			}
			respJSON, err := json.Marshal(response)
			if err == nil {
				client.send <- respJSON
			}
		}()

		go pvpRead(client)
		go pvpWrite(client)

	}
}

func pvpRead(c *PVPClient) {
	defer func() {
		c.conn.Close()
		pvpRemoveClient(c)
	}()

	for {
		_, msg, err := c.conn.ReadMessage()
		if err != nil {
			break
		}

		var m Message
		if err := json.Unmarshal(msg, &m); err != nil {
			log.Println("Invalid message:", err)
			continue
		}

		switch m.Type {
		case "selected_card":
			// ตรวจสอบและดึง state กับ match
			pvpStatesMu.Lock()
			state, ok := pvpStates[c.roomID]
			pvpStatesMu.Unlock()
			if !ok {
				fmt.Println("Error PvP State")
				return
			}

			pvpManager.lock.Lock()
			match, ok := pvpManager.rooms[c.roomID]
			if !ok {
				pvpManager.lock.Unlock()
				return
			}

			pvpManager.lock.Unlock()

			// แก้ไขมือผู้เล่น
			state.Lock()

			var hand []Card
			switch c.slot {
			case "A":
				hand = state.PlayerA.Hand
			case "B":
				hand = state.PlayerB.Hand
			default:
				state.Unlock()
				fmt.Println("Invalid slot:", c.slot)
				return
			}

			var playerCard *Card
			for _, card := range hand {
				if card.ID == m.CardID {
					playerCard = &card
				}
			}

			if playerCard == nil {
				state.Unlock()
				fmt.Println("Card not found in hand")
				return
			}

			// อัปเดต selected card ของฝั่งนั้น
			fmt.Println("CT " + CardType(playerCard.Type))
			match.Selected[c.slot] = playerCard
			fmt.Println("Player ", c.slot, " Selected Card")

			state.Unlock()

			//sent to opponent
			switch c.slot {
			case "A":
				responseForB := map[string]interface{}{
					"type":             "selection_status",
					"playerSelected":   match.Selected["B"] != nil,
					"opponentSelected": match.Selected["A"] != nil,
				}

				respBJSON, _ := json.Marshal(responseForB)
				// A เป็นคนเลือก → ส่งให้ B
				if clientB, ok := match.Clients["B"]; ok {
					select {
					case clientB.send <- respBJSON:
					default:
					}
				}
			case "B":
				// สร้าง response ที่แยกฝั่ง
				responseForA := map[string]interface{}{
					"type":             "selection_status",
					"playerSelected":   match.Selected["A"] != nil,
					"opponentSelected": match.Selected["B"] != nil,
				}
				respAJSON, _ := json.Marshal(responseForA)

				// B เป็นคนเลือก → ส่งให้ A
				if clientA, ok := match.Clients["A"]; ok {
					select {
					case clientA.send <- respAJSON:
					default:
					}
				}
			}

			//เช็คว่าเลือกครบ 2 คนยัง
			if match.Selected["A"] != nil && match.Selected["B"] != nil {

				// remove card from hand
				removeCardFromHand(&state.PlayerA.Hand, match.Selected["A"].ID)
				removeCardFromHand(&state.PlayerB.Hand, match.Selected["B"].ID)

				var winner = findWinner(*match.Selected["A"], *match.Selected["B"])

				damageToA, damageToB, specialEventA, specialEventB := doDamage(state, *match.Selected["A"], *match.Selected["B"], winner)

				gameStatus, resultA, detailA, resultB, detailB := checkGameResult(state)

				postGameDetailA := models.PostGameDetail{
					Result:   resultA,
					Detail:   detailA,
					Exp:      0,
					Gold:     0,
					LvlUp:    0,
					StatGain: models.UnitStat{Atk: 0, Def: 0, Spd: 0, HP: 0},
				}

				postGameDetailB := models.PostGameDetail{
					Result:   resultB,
					Detail:   detailB,
					Exp:      0,
					Gold:     0,
					LvlUp:    0,
					StatGain: models.UnitStat{Atk: 0, Def: 0, Spd: 0, HP: 0},
				}

				//draw card
				if gameStatus == "onGoing" {
					if len(state.PlayerA.Deck) > 0 && len(state.PlayerA.Hand) < 3 {
						state.PlayerA.Hand = append(state.PlayerA.Hand, drawCards(&state.PlayerA.Deck, 1)...)
					}
					if len(state.PlayerB.Deck) > 0 && len(state.PlayerB.Hand) < 3 {
						state.PlayerB.Hand = append(state.PlayerB.Hand, drawCards(&state.PlayerB.Deck, 1)...)
					}
				}

				A_CardRemaining := countCard(append(state.PlayerA.Deck, state.PlayerA.Hand...))
				B_CardRemaining := countCard(append(state.PlayerB.Deck, state.PlayerB.Hand...))

				//ส่งผลลัพธ์แยกกัน
				respA := map[string]interface{}{
					"type": "round_result",
					"player": map[string]interface{}{
						"hp":            state.PlayerA.CurrentHP,
						"hand":          state.PlayerA.Hand,
						"cardPlayed":    match.Selected["A"],
						"doDamage":      damageToB,
						"cardRemaining": A_CardRemaining,
						"trueSight":     state.PlayerA.TrueSight,
						"specialEvent":  specialEventA,
					},
					"opponent": map[string]interface{}{
						"hp":            state.PlayerB.CurrentHP,
						"handLength":    len(state.PlayerB.Hand),
						"cardPlayed":    match.Selected["B"],
						"doDamage":      damageToA,
						"cardRemaining": B_CardRemaining,
						"trueSight":     state.PlayerB.TrueSight,
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
					"postGameDetail": postGameDetailA,
				}
				respB := map[string]interface{}{
					"type": "round_result",
					"player": map[string]interface{}{
						"hp":            state.PlayerB.CurrentHP,
						"hand":          state.PlayerB.Hand,
						"cardPlayed":    match.Selected["B"],
						"doDamage":      damageToA,
						"cardRemaining": B_CardRemaining,
						"trueSight":     state.PlayerB.TrueSight,
						"specialEvent":  specialEventB,
					},
					"opponent": map[string]interface{}{
						"hp":            state.PlayerA.CurrentHP,
						"handLength":    len(state.PlayerA.Hand),
						"cardPlayed":    match.Selected["A"],
						"doDamage":      damageToB,
						"cardRemaining": A_CardRemaining,
						"trueSight":     state.PlayerA.TrueSight,
						"specialEvent":  specialEventA,
					},
					"gameStatus": func() string {
						if gameStatus == "Bwin" {
							return "playerWin"
						} else if gameStatus == "Awin" {
							return "opponentWin"
						}
						return gameStatus
					}(),
					"roundWinner": func() string {
						if winner == "B" {
							return "player"
						} else if winner == "A" {
							return "opponent"
						}
						return "draw"
					}(),
					"postGameDetail": postGameDetailB,
				}

				respAJSON, _ := json.Marshal(respA)
				respBJSON, _ := json.Marshal(respB)

				// ส่งกลับ client A และ B
				if clientA, ok := match.Clients["A"]; ok {
					select {
					case clientA.send <- respAJSON:
					default:
					}
				}
				if clientB, ok := match.Clients["B"]; ok {
					select {
					case clientB.send <- respBJSON:
					default:
					}
				}

				if gameStatus == "Awin" || gameStatus == "Bwin" || gameStatus == "draw" {
					go func(roomID string) {
						time.Sleep(100 * time.Millisecond)
						disconnectAllClients(roomID)
					}(c.roomID)
				}

				//logPVPState(c.roomID, state)
				pvpManager.lock.Lock()
				match.Selected = make(map[string]*Card)
				pvpManager.lock.Unlock()
			}
		case "use_true_sight":

			pvpStatesMu.Lock()
			state, ok := pvpStates[c.roomID]
			pvpStatesMu.Unlock()
			if !ok {
				fmt.Println("Error PvP State")
				return
			}

			state.Lock()

			var player *PlayerData
			var opponent *PlayerData

			if c.slot == "A" {
				player = &state.PlayerA
				opponent = &state.PlayerB
			} else if c.slot == "B" {
				player = &state.PlayerB
				opponent = &state.PlayerA
			} else {
				state.Unlock()
				fmt.Println("Invalid slot:", c.slot)
				return
			}

			if player.TrueSight <= 0 {
				state.Unlock()
				fmt.Println("No TrueSight left")
				errorResp := map[string]interface{}{
					"type":  "error",
					"error": "No TrueSight left",
				}

				errorJSON, err := json.Marshal(errorResp)
				if err == nil {
					if client, ok := pvpManager.rooms[c.roomID].Clients[c.slot]; ok {
						select {
						case client.send <- errorJSON:
						default:
						}
					}
				}
				return
			}

			player.TrueSight--
			opponentCardCount := countCard(opponent.Hand)

			state.Unlock()

			response := map[string]interface{}{
				"type":          "true_sight_result",
				"opponentHand":  opponentCardCount,
				"trueSightLeft": player.TrueSight,
			}

			respJSON, err := json.Marshal(response)
			if err != nil {
				fmt.Println("JSON marshal error:", err)
				return
			}

			if client, ok := pvpManager.rooms[c.roomID].Clients[c.slot]; ok {
				select {
				case client.send <- respJSON:
				default:
				}
			}

			fmt.Println("trueeee")

			notify := map[string]interface{}{
				"type": "true_sight_alert",
			}

			notifyJSON, err := json.Marshal(notify)
			if err != nil {
				fmt.Println("JSON marshal error:", err)
				return
			}

			opponentSlot := "A"
			if c.slot == "A" {
				opponentSlot = "B"
			}
			if client, ok := pvpManager.rooms[c.roomID].Clients[opponentSlot]; ok {
				select {
				case client.send <- notifyJSON:
				default:
				}
			}

		}
	}
}

func pvpWrite(c *PVPClient) {
	for msg := range c.send {
		err := c.conn.WriteMessage(websocket.TextMessage, msg)
		if err != nil {
			break
		}
	}
}

func pvpRemoveClient(c *PVPClient) {
	pvpManager.lock.Lock()
	defer pvpManager.lock.Unlock()

	match, ok := pvpManager.rooms[c.roomID]
	if !ok {
		return
	}

	// แจ้งอีกฝั่งก่อนลบ
	var opponent *PVPClient
	if c.slot == "A" {
		opponent = match.Clients["B"]
	} else if c.slot == "B" {
		opponent = match.Clients["A"]
	}

	if opponent != nil {
		leaveMsg := map[string]interface{}{
			"type": "opponent_left",
		}
		data, _ := json.Marshal(leaveMsg)
		select {
		case opponent.send <- data:
		default:
		}
	}

	delete(match.Clients, c.slot)
	delete(match.Selected, c.slot)

	if len(match.Clients) == 0 {
		delete(pvpManager.rooms, c.roomID)
		pvpStatesMu.Lock()
		delete(pvpStates, c.roomID)
		pvpStatesMu.Unlock()
	}
}

func disconnectAllClients(roomID string) {
	pvpManager.lock.Lock()
	defer pvpManager.lock.Unlock()

	match, ok := pvpManager.rooms[roomID]
	if !ok {
		return
	}

	for _, client := range match.Clients {
		if client.conn != nil {
			client.conn.Close()
		}
	}

	delete(pvpManager.rooms, roomID)

	pvpStatesMu.Lock()
	delete(pvpStates, roomID)
	pvpStatesMu.Unlock()
}

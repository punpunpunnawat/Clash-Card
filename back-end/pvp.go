package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"math"
	"net/http"
	"sync"

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
	userID int    // เก็บ userID ที่ถอดจาก token
	send   chan []byte
}

type PVPMatch struct {
	Clients  map[string]*PVPClient // key: "A", "B"
	Selected map[string]CardType   // key: slot, value: selected card
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
	Name      int
	Level     int
	CurrentHP int
	Deck      []Card
	Hand      []Card
	Stat      Stat
}

func loadPVPStateFromDB(db *sql.DB, userAID, userBID int) (*PVPState, error) {
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
			Name:      userA.ID, // หรือ userA.Name ถ้าเป็น string
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
		},
		PlayerB: PlayerData{
			Name:      userB.ID, // หรือ userB.Name ถ้าเป็น string
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
		},
	}

	return state, nil
}

func logPVPState(roomID string, ps *PVPState) {
	ps.Lock()
	defer ps.Unlock()

	fmt.Println("====== PVP STATE ======")
	fmt.Println("Room ID:", roomID)

	fmt.Println("--- Player A ---")
	fmt.Println("ID:", ps.PlayerA.Name, "Level:", ps.PlayerA.Level)
	fmt.Println("Deck:", len(ps.PlayerA.Deck), "cards left")
	fmt.Println("Hand:", formatHand(ps.PlayerA.Hand))
	fmt.Println("ATK:", ps.PlayerA.Stat.ATK, "HP:", ps.PlayerA.CurrentHP, "/", ps.PlayerA.Stat.HP, "DEF:", ps.PlayerA.Stat.DEF, "SPD:", ps.PlayerA.Stat.SPD)

	fmt.Println("--- Player B ---")
	fmt.Println("ID:", ps.PlayerB.Name, "Level:", ps.PlayerB.Level)
	fmt.Println("Deck:", len(ps.PlayerB.Deck), "cards left")
	fmt.Println("Hand:", formatHand(ps.PlayerB.Hand))
	fmt.Println("ATK:", ps.PlayerB.Stat.ATK, "HP:", ps.PlayerB.CurrentHP, "/", ps.PlayerB.Stat.HP, "DEF:", ps.PlayerA.Stat.DEF, "SPD:", ps.PlayerA.Stat.SPD)

	fmt.Println("========================")
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

		userID, err := extractUserIDFromToken(tokenStr)
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
				Selected: make(map[string]CardType),
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

		// ปลดล็อกก่อนเลย ถ้าจะทำงานหนักหรือเรียก DB ข้างนอก
		pvpManager.lock.Unlock()

		// โหลดสถานะ DB เฉพาะเมื่อครบ 2 คน
		if len(match.Clients) == 2 {
			clientA := match.Clients["A"]
			clientB := match.Clients["B"]

			go func() {
				state, err := loadPVPStateFromDB(db, clientA.userID, clientB.userID)
				if err != nil {
					log.Println("loadPVPStateFromDB error:", err)
					return
				}

				// ส่งข้อมูลกลับ client ต้องล็อกก่อนดึง client ใหม่
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

				A_CardRemaining := countCardRemaining(state.PlayerA.Deck, state.PlayerA.Hand)
				B_CardRemaining := countCardRemaining(state.PlayerB.Deck, state.PlayerB.Hand)

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
								"def": state.PlayerA.Stat.ATK,
								"spd": state.PlayerA.Stat.ATK,
								"hp":  state.PlayerA.Stat.ATK,
							},
						},
						"opponent": map[string]interface{}{
							"name":          state.PlayerB.Name,
							"level":         state.PlayerB.Level,
							"currentHP":     state.PlayerB.CurrentHP,
							"cardRemaining": B_CardRemaining,
							"handSize":      len(state.PlayerB.Hand),
							"stat": map[string]interface{}{
								"atk": state.PlayerB.Stat.ATK,
								"def": state.PlayerB.Stat.ATK,
								"spd": state.PlayerB.Stat.ATK,
								"hp":  state.PlayerB.Stat.ATK,
							},
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
						},
					}
					respJSON, err := json.Marshal(response)
					if err == nil {
						clientB.send <- respJSON
					}
				}
				logPVPState(roomID, state)
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
			if c.slot == "A" {
				hand = state.PlayerA.Hand
			} else if c.slot == "B" {
				hand = state.PlayerB.Hand
			} else {
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
			match.Selected[c.slot] = CardType(playerCard.Type)

			state.Unlock()

			// สร้าง response ที่แยกฝั่ง
			responseForA := map[string]interface{}{
				"type":             "selection_status",
				"opponentSelected": match.Selected["B"] != "",
			}
			responseForB := map[string]interface{}{
				"type":             "selection_status",
				"opponentSelected": match.Selected["A"] != "",
			}

			respAJSON, _ := json.Marshal(responseForA)
			respBJSON, _ := json.Marshal(responseForB)

			// ส่งให้ client A
			if clientA, ok := match.Clients["A"]; ok {
				select {
				case clientA.send <- respAJSON:
				default:
				}
			}

			// ส่งให้ client B
			if clientB, ok := match.Clients["B"]; ok {
				select {
				case clientB.send <- respBJSON:
				default:
				}
			}

			//เช็คว่าเลือกครบ 2 คนยัง
			if match.Selected["A"] != "" && match.Selected["B"] != "" {
				// do something เช่น คำนวณผล
				var winner string
				// สมมติ result แบบง่ายๆ
				if match.Selected["A"] == match.Selected["B"] {
					winner = "draw"
				} else if match.Selected["A"] == "rock" && match.Selected["B"] == "scissors" {
					winner = "A"
				} else if match.Selected["A"] == "scissors" && match.Selected["B"] == "paper" {
					winner = "A"
				} else if match.Selected["A"] == "paper" && match.Selected["B"] == "rock" {
					winner = "A"
				} else {
					winner = "B"
				}

				gameStatus := "onGoing"
				damageToB := 0
				damageToA := 0
				// caldamage
				if winner == "A" {
					damageToB = int(math.Max(float64(state.PlayerA.Stat.ATK-state.PlayerB.Stat.DEF), 1))
					state.PlayerB.CurrentHP = int(math.Max(float64(state.PlayerB.CurrentHP-damageToB), 0))
				} else if winner == "B" {
					damageToA = int(math.Max(float64(state.PlayerB.Stat.ATK-state.PlayerA.Stat.DEF), 1))
					state.PlayerA.CurrentHP = int(math.Max(float64(state.PlayerA.CurrentHP-damageToA), 0))
				} else if winner == "draw" {
					//logic
				}

				//check winner if hp = 0
				if state.PlayerA.CurrentHP == 0 {
					gameStatus = "Bwin"
				} else if state.PlayerB.CurrentHP == 0 {
					gameStatus = "Awin"
				} else {
					if len(state.PlayerA.Deck)+len(state.PlayerA.Hand) == 0 && len(state.PlayerA.Deck)+len(state.PlayerB.Hand) == 0 {
						gameStatus = "draw"
					} else if len(state.PlayerA.Deck)+len(state.PlayerA.Hand) == 0 {
						gameStatus = "Bwin"
					} else if len(state.PlayerB.Deck)+len(state.PlayerB.Hand) == 0 {
						gameStatus = "Awin"
					}
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

				A_CardRemaining := countCardRemaining(state.PlayerA.Deck, state.PlayerA.Hand)
				B_CardRemaining := countCardRemaining(state.PlayerB.Deck, state.PlayerB.Hand)

				//ส่งผลลัพธ์แยกกัน
				respA := map[string]interface{}{
					"type":       "round_result",
					"gameStatus": gameStatus,
					"roundWinner": func() string {
						if winner == "A" {
							return "player"
						} else if winner == "B" {
							return "opponent"
						}
						return "draw"
					}(),
					"opponentPlayed": match.Selected["B"],
					"playerPlayed":   match.Selected["A"],
					"playerHand":     state.PlayerA.Hand,
					"damage": map[string]interface{}{
						"opponent": damageToB,
						"player":   damageToA,
					},
					"hp": map[string]interface{}{
						"opponent": state.PlayerB.CurrentHP,
						"player":   state.PlayerA.CurrentHP,
					},
					"cardRemaining": map[string]interface{}{
						"player":   A_CardRemaining,
						"opponent": B_CardRemaining,
					},
				}
				respB := map[string]interface{}{
					"type":       "round_result",
					"gameStatus": gameStatus,
					"roundWinner": func() string {
						if winner == "B" {
							return "player"
						} else if winner == "A" {
							return "opponent"
						}
						return "draw"
					}(),
					"opponentPlayed": match.Selected["A"],
					"playerPlayed":   match.Selected["B"],
					"playerHand":     state.PlayerB.Hand,
					"damage": map[string]interface{}{
						"opponent": damageToA,
						"player":   damageToB,
					},
					"hp": map[string]interface{}{
						"opponent": state.PlayerA.CurrentHP,
						"player":   state.PlayerB.CurrentHP,
					},
					"cardRemaining": map[string]interface{}{
						"player":   B_CardRemaining,
						"opponent": A_CardRemaining,
					},
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

				// ล้างสถานะเลือกไพ่เพื่อรอรอบใหม่
				pvpManager.lock.Lock()
				match.Selected = make(map[string]CardType)
				pvpManager.lock.Unlock()
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

	delete(match.Clients, c.slot)
	delete(match.Selected, c.slot)

	if len(match.Clients) == 0 {
		delete(pvpManager.rooms, c.roomID)
		// ลบสถานะเกมถ้าไม่มีคนในห้องแล้ว
		pvpStatesMu.Lock()
		delete(pvpStates, c.roomID)
		pvpStatesMu.Unlock()
	}
}

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
	sync.Mutex  // ล็อกภายใน state เอง
	A_Deck      []Card
	B_Deck      []Card
	A_Hand      []Card
	B_Hand      []Card
	A_ATK       int
	B_ATK       int
	A_DEF       int
	B_DEF       int
	A_SPD       int
	B_SPD       int
	A_MaxHP     int
	B_MaxHP     int
	A_CurrentHP int
	B_CurrentHP int
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
		A_Deck:      deckA,
		B_Deck:      deckB,
		A_Hand:      []Card{}, // เริ่มมือว่าง
		B_Hand:      []Card{},
		A_ATK:       userA.Stat.Atk,
		B_ATK:       userB.Stat.Atk,
		A_DEF:       userA.Stat.Def,
		B_DEF:       userB.Stat.Def,
		A_SPD:       userA.Stat.Spd,
		B_SPD:       userB.Stat.Spd,
		A_MaxHP:     userA.Stat.HP,
		B_MaxHP:     userB.Stat.HP,
		A_CurrentHP: userA.Stat.HP,
		B_CurrentHP: userB.Stat.HP,
	}
	return state, nil
}

func logPVPState(roomID string, ps *PVPState) {
	ps.Lock()
	defer ps.Unlock()

	fmt.Println("====== PVP STATE ======")
	fmt.Println("Room ID:", roomID)

	fmt.Println("--- Player A ---")
	fmt.Println("Deck:", len(ps.A_Deck), "cards left")
	fmt.Println("Hand:", ps.A_Hand)
	fmt.Println("Hand:", formatHand(ps.A_Hand))
	fmt.Println("ATK:", ps.A_ATK, "HP:", ps.A_CurrentHP, "DEF:", ps.A_DEF, "SPD:", ps.A_SPD)

	fmt.Println("--- Player B ---")
	fmt.Println("Deck:", len(ps.B_Deck), "cards left")
	fmt.Println("Hand:", formatHand(ps.B_Hand))
	fmt.Println("ATK:", ps.B_ATK, "HP:", ps.B_CurrentHP, "DEF:", ps.B_DEF, "SPD:", ps.B_SPD)

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

				state.A_Hand = drawCards(&state.A_Deck, 3)
				state.B_Hand = drawCards(&state.B_Deck, 3)
				if okA {
					response := map[string]interface{}{
						"type":       "player_hand",
						"playerHand": state.A_Hand,
					}
					respJSON, err := json.Marshal(response)
					if err == nil {
						clientA.send <- respJSON
					}
				}
				if okB {
					response := map[string]interface{}{
						"type":       "player_hand",
						"playerHand": state.B_Hand,
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
				hand = state.A_Hand
			} else if c.slot == "B" {
				hand = state.B_Hand
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
					damageToB = int(math.Max(float64(state.A_ATK-state.B_DEF), 1))
					state.B_CurrentHP = int(math.Max(float64(state.B_CurrentHP-damageToB), 0))
				} else if winner == "B" {
					damageToA = int(math.Max(float64(state.B_ATK-state.A_DEF), 1))
					state.A_CurrentHP = int(math.Max(float64(state.A_CurrentHP-damageToA), 0))
				} else if winner == "draw" {
					//logic
				}

				//check winner if hp = 0
				if state.A_CurrentHP == 0 {
					gameStatus = "Bwin"
				} else if state.B_CurrentHP == 0 {
					gameStatus = "Awin"
				} else {
					if len(state.A_Deck)+len(state.A_Hand) == 0 && len(state.A_Deck)+len(state.B_Hand) == 0 {
						gameStatus = "draw"
					} else if len(state.A_Deck)+len(state.A_Hand) == 0 {
						gameStatus = "Bwin"
					} else if len(state.B_Deck)+len(state.B_Hand) == 0 {
						gameStatus = "Awin"
					}
				}

				//draw card
				if gameStatus == "onGoing" {
					if len(state.A_Deck) > 0 && len(state.A_Hand) < 3 {
						state.A_Hand = append(state.A_Hand, drawCards(&state.A_Deck, 1)...)
					}
					if len(state.B_Deck) > 0 && len(state.B_Hand) < 3 {
						state.B_Hand = append(state.B_Hand, drawCards(&state.B_Deck, 1)...)
					}
				}

				A_CardLeft := countCardLeft(state.A_Deck, state.A_Hand)
				B_CardLeft := countCardLeft(state.B_Deck, state.B_Hand)

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
					"playerHand":     state.A_Hand,
					"damage": map[string]interface{}{
						"opponent": damageToB,
						"player":   damageToA,
					},
					"hp": map[string]interface{}{
						"opponent": state.B_CurrentHP,
						"player":   state.A_CurrentHP,
					},
					"cardRemaining": map[string]interface{}{
						"player":   A_CardLeft,
						"opponent": B_CardLeft,
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
					"playerHand":     state.B_Hand,
					"damage": map[string]interface{}{
						"opponent": damageToA,
						"player":   damageToB,
					},
					"hp": map[string]interface{}{
						"opponent": state.A_CurrentHP,
						"player":   state.B_CurrentHP,
					},
					"cardRemaining": map[string]interface{}{
						"player":   B_CardLeft,
						"opponent": A_CardLeft,
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

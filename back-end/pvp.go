package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
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
	Type string   `json:"type"`
	Card CardType `json:"card,omitempty"` // ใช้เมื่อ Type = "selected_card"
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

				pvpStatesMu.Lock()
				pvpStates[roomID] = state
				pvpStatesMu.Unlock()

				logPVPState(roomID, state)

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

				if okA {
					response := map[string]interface{}{
						"type": "A_hand",
						"slot": "testa",
					}
					respJSON, err := json.Marshal(response)
					if err == nil {
						clientA.send <- respJSON
					}
				}
				if okB {
					response := map[string]interface{}{
						"type": "B_Hand",
						"slot": "testb",
					}
					respJSON, err := json.Marshal(response)
					if err == nil {
						clientB.send <- respJSON
					}
				}
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
			pvpManager.lock.Lock()
			match, ok := pvpManager.rooms[c.roomID]
			if !ok {
				pvpManager.lock.Unlock()
				continue
			}
			match.Selected[c.slot] = m.Card
			pvpManager.lock.Unlock()

			// ส่งสถานะเลือกไพ่ให้ client ทั้งห้อง (แบบเดิม)
			response := map[string]interface{}{
				"type":      "selection_status",
				"Aselected": false,
				"Bselected": false,
			}
			if _, ok := match.Selected["A"]; ok {
				response["Aselected"] = true
			}
			if _, ok := match.Selected["B"]; ok {
				response["Bselected"] = true
			}

			respJSON, err := json.Marshal(response)
			if err == nil {
				for _, client := range match.Clients {
					select {
					case client.send <- respJSON:
					default:
						// channel เต็ม ข้ามไป
					}
				}
			}

			// เช็คว่าเลือกครบ 2 คนยัง
			if len(match.Selected) == 2 {
				// do something เช่น คำนวณผล
				var resultA, resultB string
				// สมมติ result แบบง่ายๆ
				if match.Selected["A"] == match.Selected["B"] {
					resultA = "draw"
					resultB = "draw"
				} else if match.Selected["A"] == "rock" && match.Selected["B"] == "scissors" {
					resultA = "win"
					resultB = "lose"
				} else if match.Selected["A"] == "scissors" && match.Selected["B"] == "paper" {
					resultA = "win"
					resultB = "lose"
				} else if match.Selected["A"] == "paper" && match.Selected["B"] == "rock" {
					resultA = "win"
					resultB = "lose"
				} else {
					resultA = "lose"
					resultB = "win"
				}

				// ส่งผลลัพธ์แยกกัน
				respA := map[string]interface{}{
					"type":   "round_result",
					"result": resultA,
				}
				respB := map[string]interface{}{
					"type":   "round_result",
					"result": resultB,
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

			// ตัวอย่างแก้ HP ใน state ตามเดิม (ถ้ามี)
			pvpStatesMu.Lock()
			state, ok := pvpStates[c.roomID]
			pvpStatesMu.Unlock()
			if ok {
				state.Lock()
				if c.slot == "A" {
					state.B_CurrentHP -= 10
					if state.B_CurrentHP < 0 {
						state.B_CurrentHP = 0
					}
				} else if c.slot == "B" {
					state.A_CurrentHP -= 10
					if state.A_CurrentHP < 0 {
						state.A_CurrentHP = 0
					}
				}
				state.Unlock()
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

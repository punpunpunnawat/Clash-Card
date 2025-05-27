package main

import (
	"encoding/json"
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

func HandlePVPWebSocket(w http.ResponseWriter, r *http.Request) {
	roomID := r.URL.Query().Get("room")
	if roomID == "" {
		http.Error(w, "room required", http.StatusBadRequest)
		return
	}

	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println("WebSocket upgrade error:", err)
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
		send:   make(chan []byte, 256),
	}

	match.Clients[slot] = client
	pvpManager.lock.Unlock()

	// ส่ง slot assigned กลับ client ทันที
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

			// สร้างสถานะเลือกไพ่
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
				// ส่งให้ทุก client ในห้อง
				for _, client := range match.Clients {
					select {
					case client.send <- respJSON:
					default:
						// ถ้า send channel เต็ม ให้ข้าม
					}
				}
			}
			pvpManager.lock.Unlock()
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
	}
}

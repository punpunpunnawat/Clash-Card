package main

type UnitStat struct {
	Atk int `json:"atk"`
	Def int `json:"def"`
	HP  int `json:"hp"`
	Spd int `json:"spd"`
}

type User struct {
	ID                   string   `json:"id"`
	Username             string   `json:"username"`
	Email                string   `json:"email"`
	Stat                 UnitStat `json:"stat"`
	Level                int      `json:"level"`
	CurrentCampaignLevel int      `json:"currentCampaignLevel"`
	Exp                  int      `json:"exp"`
	Gold                 int      `json:"gold"`
	CreatedAt            string   `json:"createdAt"`
	Class                string   `json:"class"`
}

type DeckCard struct {
	CardType string `json:"card_type"`
	Quantity int    `json:"quantity"`
}

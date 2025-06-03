package main

type UnitStat struct {
	Atk int `json:"atk"`
	Def int `json:"def"`
	HP  int `json:"hp"`
	Spd int `json:"spd"`
}

type User struct {
	ID                   int      `json:"id"`
	Username             string   `json:"username"`
	Email                string   `json:"email"`
	Stat                 UnitStat `json:"stat"`
	Level                int      `json:"level"`
	CurrentCampaignLevel int      `json:"currentCampaignLevel"`
	Exp                  int      `json:"exp"`
	Money                int      `json:"money"`
	CreatedAt            string   `json:"createdAt"`
	Class                string   `json:"class"`
}

type DeckCard struct {
	CardType string `json:"cardType"`
}

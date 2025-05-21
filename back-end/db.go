package main

import (
	"database/sql"
	"log"

	_ "github.com/go-sql-driver/mysql"
)

func ConnectDB() *sql.DB {
	dsn := "root:1234@tcp(127.0.0.1:3306)/clash_and_card"
	db, err := sql.Open("mysql", dsn)
	if err != nil {
		log.Fatal("Connect error:", err)
	}
	if err := db.Ping(); err != nil {
		log.Fatal("Ping error:", err)
	}
	return db
}

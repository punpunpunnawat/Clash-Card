// package main

// import (
// 	"database/sql"
// 	"log"

// 	_ "github.com/go-sql-driver/mysql"
// )

// func ConnectDB() *sql.DB {
// 	dsn := "root:1234@tcp(db:3306)/clash_and_card"
// 	db, err := sql.Open("mysql", dsn)
// 	if err != nil {
// 		log.Fatal("Connect error:", err)
// 	}
// 	if err := db.Ping(); err != nil {
// 		log.Fatal("Ping error:", err)
// 	}
// 	return db
// }

package main

import (
	"database/sql"
	"log"
	"os"

	_ "github.com/go-sql-driver/mysql"
	"github.com/joho/godotenv"
)

func ConnectDB() *sql.DB {
	err := godotenv.Load()
	if err != nil {
		log.Println("Warning: No .env file found, fallback to env vars")
	}

	user := os.Getenv("DB_USER")
	pass := os.Getenv("DB_PASS")
	host := os.Getenv("DB_HOST")
	port := os.Getenv("DB_PORT")
	dbname := os.Getenv("DB_NAME")

	dsn := user + ":" + pass + "@tcp(" + host + ":" + port + ")/" + dbname

	db, err := sql.Open("mysql", dsn)
	if err != nil {
		log.Fatal("Connect error:", err)
	}
	if err := db.Ping(); err != nil {
		log.Fatal("Ping error:", err)
	}

	return db
}

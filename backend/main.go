// main.go
package main

import (
	"database/sql"
	"encoding/json"
	"log"
	"net/http"
	"os"
	"sync"

	"github.com/gorilla/websocket"
	_ "github.com/mattn/go-sqlite3"
)

// --- WebSocket Globals ---
var clients = make(map[*websocket.Conn]bool)
var broadcast = make(chan []Name)
var upgrader = websocket.Upgrader{}
var clientsMu sync.Mutex

// --- DB ---
var db *sql.DB

// --- Тип для имени ---
type Name struct {
	ID        int    `json:"id"`
	Name      string `json:"name"`
	CreatedAt string `json:"created_at"`
}

func main() {
	var err error
	db, err = sql.Open("sqlite3", "./names.db")
	if err != nil {
		log.Fatal(err)
	}

	_, err = db.Exec(`CREATE TABLE IF NOT EXISTS names (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		name TEXT,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	);`)
	if err != nil {
		log.Fatal(err)
	}

	// API endpoints
	http.HandleFunc("/api/message", enableCORS(messageHandler))
	http.HandleFunc("/api/hello", enableCORS(helloHandler))
	http.HandleFunc("/api/all", enableCORS(getAllHandler))
	http.HandleFunc("/api/update", enableCORS(updateNameHandler))
	http.HandleFunc("/api/delete", enableCORS(deleteAllHandler))

	// WebSocket маршрут
	http.HandleFunc("/ws", enableCORS(handleWS))

	// CORS preflight
	http.HandleFunc("/api/", enableCORS(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}
		http.NotFound(w, r)
	}))

	// Раздача фронта
	fs := http.FileServer(http.Dir("./frontend/dist"))
	http.Handle("/", fs)

	// 📡 Горутина рассылки WebSocket клиентам
	go func() {
		for {
			names := <-broadcast
			clientsMu.Lock()
			for client := range clients {
				err := client.WriteJSON(names)
				if err != nil {
					log.Println("WebSocket write error:", err)
					client.Close()
					delete(clients, client)
				}
			}
			clientsMu.Unlock()
		}
	}()

	// Порт
	port := os.Getenv("PORT")
	if port == "" {
		port = "3300"
	}
	log.Println("Server is running on http://localhost:" + port)
	log.Fatal(http.ListenAndServe(":"+port, nil))
}

// --- WebSocket Handler ---
func handleWS(w http.ResponseWriter, r *http.Request) {
	upgrader.CheckOrigin = func(r *http.Request) bool { return true }
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println("WebSocket upgrade error:", err)
		return
	}

	clientsMu.Lock()
	clients[conn] = true
	clientsMu.Unlock()

	defer func() {
		clientsMu.Lock()
		delete(clients, conn)
		clientsMu.Unlock()
		conn.Close()
	}()
}

// --- API Handlers ---
func messageHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	resp := struct {
		Text string `json:"text"`
	}{
		Text: "Привет от сервера!",
	}
	json.NewEncoder(w).Encode(resp)
}

func helloHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	var payload struct {
		Name string `json:"name"`
	}
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	_, err := db.Exec("INSERT INTO names (name) VALUES (?)", payload.Name)
	if err != nil {
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}

	// После добавления — сразу рассылаем обновлённый список
	rows, err := db.Query("SELECT id, name, created_at FROM names")
	if err == nil {
		var names []Name
		defer rows.Close()
		for rows.Next() {
			var n Name
			rows.Scan(&n.ID, &n.Name, &n.CreatedAt)
			names = append(names, n)
		}
		go func() { broadcast <- names }()
	}

	json.NewEncoder(w).Encode(map[string]string{
		"message": "Name saved successfully",
	})
}

func getAllHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	rows, err := db.Query("SELECT id, name, created_at FROM names")
	if err != nil {
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}
	defer rows.Close()
	var names []map[string]interface{}
	for rows.Next() {
		var id int
		var name string
		var createdAt string
		rows.Scan(&id, &name, &createdAt)
		names = append(names, map[string]interface{}{
			"id":         id,
			"name":       name,
			"created_at": createdAt,
		})
	}
	json.NewEncoder(w).Encode(names)
}

func updateNameHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	if r.Method != http.MethodPut {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	var payload struct {
		OldName string `json:"oldName"`
		NewName string `json:"newName"`
	}
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	result, err := db.Exec("UPDATE names SET name = ? WHERE name = ?", payload.NewName, payload.OldName)
	if err != nil {
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}
	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		http.Error(w, "Name not found", http.StatusNotFound)
		return
	}
	json.NewEncoder(w).Encode(map[string]string{
		"message": "Name updated successfully",
	})
}

func deleteAllHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	if r.Method != http.MethodDelete {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	_, err := db.Exec("DELETE FROM names")
	if err != nil {
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}

	// Очистили — отправим пустой список
	go func() { broadcast <- []Name{} }()

	json.NewEncoder(w).Encode(map[string]string{
		"message": "All names deleted",
	})
}

func enableCORS(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS, DELETE, PUT")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		if r.Method == http.MethodOptions {
			return
		}
		next(w, r)
	}
}

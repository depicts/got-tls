package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net"
	"net/http"
	"os"
	"sync"
	"syscall"
	"time"

	"github.com/fatih/color"

	proxy "github.com/evade99/got-tls-proxy/proxyService"
	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
}

type WsConn struct {
	Conn *websocket.Conn
	Mux  sync.Mutex
}

func logger(t string, message string) {
	now := time.Now().Format("2006-01-02 15:04:05.000000")
	magenta := color.New(color.FgMagenta).SprintFunc()
	if t == "info" {
		cyan := color.New(color.FgCyan).SprintFunc()
		yellow := color.New(color.FgYellow).SprintFunc()
		fmt.Printf("[%s] [%s] > %s.\n", yellow(t), magenta(now), cyan(message))
	}
	if t == "error" {
		red := color.New(color.FgRed).SprintFunc()
		yellow := color.New(color.FgYellow).SprintFunc()
		fmt.Printf("[%s] [%s] > %s.\n", yellow(t), magenta(now), red(message))
	}
	if t == "success" {
		green := color.New(color.FgGreen).SprintFunc()
		yellow := color.New(color.FgYellow).SprintFunc()
		fmt.Printf("[%s] [%s] > %s.\n", yellow(t), magenta(now), green(message))
	}

}

func (c *WsConn) execute(messageType int, p []byte) {

	var responseData = proxy.ProxyRequest(p)

	jsonData, err := json.Marshal(responseData)

	if err != nil {

		logger("error", "Error Reading Message - "+err.Error())

		return
	}

	c.Mux.Lock()

	defer c.Mux.Unlock()

	if err := c.Conn.WriteMessage(messageType, jsonData); err != nil {
		logger("error", "Error Writing Message - "+err.Error())
		return
	}

}

func reader(conn *websocket.Conn) {
	c := WsConn{Conn: conn}

	for {

		messageType, p, err := conn.ReadMessage()

		if err != nil {

			logger("error", "Error Reading Message - "+err.Error())

			return
		}

		go c.execute(messageType, p)

	}
}

func clientEndpoint(w http.ResponseWriter, r *http.Request) {

	ws, err := upgrader.Upgrade(w, r, nil)

	if err != nil {
		log.Println(err)
	}

	logger("info", "Node Client Connected :)")

	reader(ws)

}

func setupRoutes() {
	http.HandleFunc("/client", clientEndpoint)
}

func main() {

	var rLimit syscall.Rlimit
	err := syscall.Getrlimit(syscall.RLIMIT_NOFILE, &rLimit)

	if err != nil {
		logger("error", "Error Getting Rlimit "+err.Error())
	}

	rLimit.Max = 64000
	rLimit.Cur = 64000

	err = syscall.Setrlimit(syscall.RLIMIT_NOFILE, &rLimit)

	if err != nil {
		logger("error", "Error Setting Rlimit "+err.Error())
	}

	err = syscall.Getrlimit(syscall.RLIMIT_NOFILE, &rLimit)
	if err != nil {
		logger("error", "Error Getting Rlimit "+err.Error())
	}

	setupRoutes()

	logger("info", "Starting Client...")

	l, err := net.Listen("tcp", ":"+os.Getenv("PROXY_PORT"))

	if err != nil {
		logger("error", "Failed To Start Client - "+err.Error())
	}

	logger("success", "Successfully Started Client")

	if err := http.Serve(l, nil); err != nil {
		logger("error", "Failed To Start Client - "+err.Error())
	}

}

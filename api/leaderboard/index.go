package handler

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"regexp"
	"strconv"
	"strings"

	"github.com/gnolang/gno/gno.land/pkg/gnoclient"
	rpc_client "github.com/gnolang/gno/tm2/pkg/bft/rpc/client"
)

const (
	Remote = "https://rpc.gno.land:443"
	Realm  = "gno.land/r/greg007/gnobounty_v2"
)

type LeaderboardEntry struct {
	Address              string `json:"address"`
	BountiesCreated      int    `json:"bountiesCreated"`
	BountiesApplied      int    `json:"bountiesApplied"`
	ValidationsPerformed int    `json:"validationsPerformed"`
	Score                int    `json:"score"`
}

func Handler(w http.ResponseWriter, r *http.Request) {
	// CORS headers
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
	w.Header().Set("Content-Type", "application/json")

	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}

	// Initialize clients
	rpcClient, err := rpc_client.NewHTTPClient(Remote)
	if err != nil {
		log.Printf("Failed to create RPC client: %v", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	client := &gnoclient.Client{
		RPCClient: rpcClient,
	}

	leaderboard, err := fetchLeaderboard(client)
	if err != nil {
		log.Printf("Error fetching leaderboard: %v", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(leaderboard)
}

func fetchLeaderboard(client *gnoclient.Client) ([]LeaderboardEntry, error) {
	qEval := "GetLeaderboard()"
	res, _, err := client.QEval(Realm, qEval)
	if err != nil {
		return nil, fmt.Errorf("failed to get leaderboard: %w", err)
	}

	log.Printf("Raw leaderboard response: %s", res)

	var leaderboard []LeaderboardEntry

	if strings.Contains(res, "slice[]") || strings.Contains(res, "(nil") {
		return []LeaderboardEntry{}, nil
	}

	sliceStart := strings.Index(res, "slice[")
	if sliceStart == -1 {
		return []LeaderboardEntry{}, nil
	}

	content := res[sliceStart+6:]
	parenDepth := 0
	sliceEnd := -1
	for i, ch := range content {
		if ch == '(' {
			parenDepth++
		} else if ch == ')' {
			parenDepth--
		} else if ch == ']' && parenDepth == 0 {
			sliceEnd = i
			break
		}
	}

	if sliceEnd == -1 {
		return []LeaderboardEntry{}, nil
	}

	sliceContent := content[:sliceEnd]
	structs := strings.Split(sliceContent, "struct{")
	for _, structStr := range structs[1:] {
		entry := LeaderboardEntry{}

		fields := strings.Split(structStr, "),(")

		if len(fields) >= 5 {
			addrMatch := regexp.MustCompile(`"([g][1][a-z0-9]{38})"`).FindStringSubmatch(fields[0])
			if len(addrMatch) > 1 {
				entry.Address = addrMatch[1]
			}

			bcMatch := regexp.MustCompile(`(\d+)\s+int`).FindStringSubmatch(fields[1])
			if len(bcMatch) > 1 {
				entry.BountiesCreated, _ = strconv.Atoi(bcMatch[1])
			}

			baMatch := regexp.MustCompile(`(\d+)\s+int`).FindStringSubmatch(fields[2])
			if len(baMatch) > 1 {
				entry.BountiesApplied, _ = strconv.Atoi(baMatch[1])
			}

			vpMatch := regexp.MustCompile(`(\d+)\s+int`).FindStringSubmatch(fields[3])
			if len(vpMatch) > 1 {
				entry.ValidationsPerformed, _ = strconv.Atoi(vpMatch[1])
			}

			scoreMatch := regexp.MustCompile(`(\d+)\s+int`).FindStringSubmatch(fields[4])
			if len(scoreMatch) > 1 {
				entry.Score, _ = strconv.Atoi(scoreMatch[1])
			}
		}

		if entry.Address != "" {
			leaderboard = append(leaderboard, entry)
		}
	}

	return leaderboard, nil
}

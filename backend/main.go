package main

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

type Bounty struct {
	ID          string `json:"id"`
	Title       string `json:"title"`
	IssueURL    string `json:"issueUrl"`
	Description string `json:"description"`
	Amount      string `json:"amount"`
	Creator     string `json:"creator"`
	CreatedAt   string `json:"createdAt"`
	IsClaimed   bool   `json:"isClaimed"`
	Claimer     string `json:"claimer"`
	ClaimedAt   string `json:"claimedAt"`
}

func main() {
	// Initialize RPC client
	rpcClient, err := rpc_client.NewHTTPClient(Remote)
	if err != nil {
		log.Fatalf("Failed to create RPC client: %v", err)
	}

	// Initialize Gno client
	client := &gnoclient.Client{
		RPCClient: rpcClient,
	}

	mux := http.NewServeMux()

	// Leaderboard endpoint
	mux.HandleFunc("/api/leaderboard", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")

		leaderboard, err := fetchLeaderboard(client)
		if err != nil {
			log.Printf("Error fetching leaderboard: %v", err)
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		json.NewEncoder(w).Encode(leaderboard)
	})

	mux.HandleFunc("/api/bounties/", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")

		path := strings.TrimPrefix(r.URL.Path, "/api/bounties")
		path = strings.TrimPrefix(path, "/")

		if path == "" {
			// List all
			bounties, err := fetchBounties(client)
			if err != nil {
				log.Printf("Error fetching bounties: %v", err)
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}
			json.NewEncoder(w).Encode(bounties)
		} else {
			// Check if it's an applications request
			// Format: /api/bounties/{id}/applications
			parts := strings.Split(path, "/")
			if len(parts) == 2 && parts[1] == "applications" {
				id := parts[0]
				apps, err := fetchBountyApplications(client, id)
				if err != nil {
					log.Printf("Error fetching applications for bounty %s: %v", id, err)
					// Return empty list instead of error for now if not found/supported
					json.NewEncoder(w).Encode([]interface{}{})
					return
				}
				json.NewEncoder(w).Encode(apps)
				return
			}

			// Get one bounty
			bounty, err := fetchBounty(client, path)
			if err != nil {
				log.Printf("Error fetching bounty %s: %v", path, err)
				http.Error(w, err.Error(), http.StatusNotFound)
				return
			}
			json.NewEncoder(w).Encode(bounty)
		}
	})

	// Wrap mux with CORS middleware
	handler := corsMiddleware(mux)

	log.Println("Server starting on :8080")
	log.Fatal(http.ListenAndServe(":8080", handler))
}

func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Set CORS headers
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		// Handle preflight OPTIONS request
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(w, r)
	})
}

func fetchBounties(client *gnoclient.Client) ([]Bounty, error) {
	// 1. Get count
	qEval := "GetBountyCount()"
	res, _, err := client.QEval(Realm, qEval)
	if err != nil {
		return nil, fmt.Errorf("failed to get count: %w", err)
	}

	// res is like "(uint64) 3"
	countStr := regexp.MustCompile(`\d+`).FindString(res)
	count, _ := strconv.Atoi(countStr)

	if count == 0 {
		return []Bounty{}, nil
	}

	var bounties []Bounty
	for i := 1; i <= count; i++ {
		bounty, err := fetchBounty(client, strconv.Itoa(i))
		if err != nil {
			log.Printf("Failed to get bounty %d: %v", i, err)
			continue
		}
		bounties = append(bounties, *bounty)
	}

	return bounties, nil
}

func fetchBounty(client *gnoclient.Client, id string) (*Bounty, error) {
	qEval := fmt.Sprintf("GetBounty(%s)", id)
	res, _, err := client.QEval(Realm, qEval)
	if err != nil {
		return nil, err
	}

	if strings.Contains(res, "nil") {
		return nil, fmt.Errorf("bounty not found")
	}

	bounty := parseBounty(res)
	bounty.ID = id
	return &bounty, nil
}

// Placeholder for application struct
type BountyApplication struct {
	ID         string   `json:"id"`
	BountyID   string   `json:"bountyId"`
	Applicant  string   `json:"applicant"`
	PRLink     string   `json:"prLink"`
	AppliedAt  string   `json:"appliedAt"`
	Status     string   `json:"status"` // "Pending", "Approved", "Rejected"
	Validators []string `json:"validators,omitempty"`
}

type LeaderboardEntry struct {
	Address              string `json:"address"`
	BountiesCreated      int    `json:"bountiesCreated"`
	BountiesApplied      int    `json:"bountiesApplied"`
	ValidationsPerformed int    `json:"validationsPerformed"`
	Score                int    `json:"score"`
}

func fetchBountyApplications(client *gnoclient.Client, bountyId string) ([]BountyApplication, error) {
	// Call GetApplicationsForBounty function from the contract
	qEval := fmt.Sprintf("GetApplicationsForBounty(%s)", bountyId)
	res, _, err := client.QEval(Realm, qEval)
	if err != nil {
		return nil, err
	}

	// Log the raw response for debugging
	log.Printf("Raw applications response for bounty %s: %s", bountyId, res)

	// Check if the slice is empty (not just contains nil somewhere)
	if res == "(slice[] []*gno.land/r/greg007/gnobounty_v2.Application)" || strings.HasPrefix(res, "(nil") {
		log.Printf("Empty or nil slice detected")
		return []BountyApplication{}, nil
	}

	// Parse the result
	// Expected format: (slice[(&(struct{(ID uint64),(BountyID uint64),(Applicant address),(PRLink string),...}...)...] []*Application)

	var applications []BountyApplication

	// Extract the content between slice[ and the closing ]
	sliceStart := strings.Index(res, "slice[")
	if sliceStart == -1 {
		log.Printf("No slice found in response")
		return []BountyApplication{}, nil
	}
	log.Printf("Found slice at position %d", sliceStart)

	// The closing bracket for slice is just one position before the final )]
	// Format: (slice[...] []*Application)
	// We need to find the ] that closes the slice[
	content := res[sliceStart+6:] // skip "slice["
	log.Printf("Content after 'slice[': first 200 chars: %s", content[:min(200, len(content))])

	// Count parentheses to find where the slice content ends
	// Each struct starts with (& and ends with matching )
	parenDepth := 0
	sliceEnd := -1
	for i, ch := range content {
		if ch == '(' {
			parenDepth++
		} else if ch == ')' {
			parenDepth--
		} else if ch == ']' && parenDepth == 0 {
			// This is the closing bracket of the slice
			sliceEnd = i
			log.Printf("Found slice end at position %d with parenDepth=%d", i, parenDepth)
			break
		}
	}

	if sliceEnd == -1 {
		log.Printf("Could not find end of slice, parenDepth=%d, content length=%d", parenDepth, len(content))
		return []BountyApplication{}, nil
	}

	sliceContent := content[:sliceEnd]
	log.Printf("Slice content length: %d, first 100 chars: %s", len(sliceContent), sliceContent[:min(100, len(sliceContent))])

	// Now parse each struct within the slice
	// Each application is: (&(struct{(1 uint64),(1 uint64),("addr" .uverse.address),("url" string),...}...))

	// Split by struct{ to find individual applications
	structs := strings.Split(sliceContent, "struct{")
	for _, structStr := range structs[1:] { // Skip first empty element
		app := BountyApplication{
			BountyID: bountyId,
		}

		// Extract fields in order: ID, BountyID, Applicant, PRLink, AppliedAt, Status
		// Format: (1 uint64),(1 uint64),("addr" .uverse.address),("url" string),(ref...), (0 ...)

		// Split by ),( to get individual fields
		fields := strings.Split(structStr, "),(")
		log.Printf("Number of fields: %d", len(fields))
		if len(fields) > 0 {
			for i, f := range fields[:min(7, len(fields))] {
				log.Printf("Field %d: %s", i, f[:min(80, len(f))])
			}
		}

		if len(fields) >= 6 {
			// Field 0: ID - (1 uint64)
			idMatch := regexp.MustCompile(`\((\d+)\s+uint64`).FindStringSubmatch(fields[0])
			if len(idMatch) > 1 {
				app.ID = idMatch[1]
			}

			// Field 2: Applicant - ("g1r20afxaccdszhknt8t88skmjjngg3ck8kpycs0" .uverse.address)
			applicantMatch := regexp.MustCompile(`"([g][1][a-z0-9]{38})"`).FindStringSubmatch(fields[2])
			if len(applicantMatch) > 1 {
				app.Applicant = applicantMatch[1]
			}

			// Field 3: PRLink - ("https://github.com/..." string)
			prLinkMatch := regexp.MustCompile(`"([^"]+)"\s+string`).FindStringSubmatch(fields[3])
			if len(prLinkMatch) > 1 {
				app.PRLink = prLinkMatch[1]
			}

			// Field 5: Status - 0 gno.land/r/greg007/gnobounty_v2.ApplicationStatus
			statusMatch := regexp.MustCompile(`^(\d+)\s+.*ApplicationStatus`).FindStringSubmatch(fields[5])
			if len(statusMatch) > 1 {
				statusCode := statusMatch[1]
				switch statusCode {
				case "0":
					app.Status = "Pending"
				case "1":
					app.Status = "Approved"
				case "2":
					app.Status = "Rejected"
				default:
					app.Status = "Unknown"
				}
			}
		}

		// Only add if we got at least an ID
		if app.ID != "" {
			// Fetch validators for this application if it's pending
			if app.Status == "Pending" {
				validators, err := fetchValidatorsForApplication(client, app.ID)
				if err == nil && len(validators) > 0 {
					app.Validators = validators
				}
			}

			applications = append(applications, app)
			log.Printf("Parsed application: ID=%s, Applicant=%s, PRLink=%s, Status=%s, Validators=%v",
				app.ID, app.Applicant, app.PRLink, app.Status, app.Validators)
		}
	}

	return applications, nil
}

func parseBounty(str string) Bounty {
	b := Bounty{}

	// Basic parsing logic based on the struct structure
	// struct{(ID uint64),(Title string),(IssueURL string),(Description string),(Amount int64),(Creator address),(CreatedAt time),(IsClaimed bool),(Claimer address),(ClaimedAt time)}

	// Extract strings (Title, IssueURL, Description)
	// This is a simplification. A real parser would be better.
	stringMatches := regexp.MustCompile(`"([^"]*)"`).FindAllStringSubmatch(str, -1)
	if len(stringMatches) >= 3 {
		b.Title = stringMatches[0][1]
		b.IssueURL = stringMatches[1][1]
		b.Description = stringMatches[2][1]
	}

	// Extract Amount (int64)
	// Look for pattern like "(1000000 int64)"
	amountRegex := regexp.MustCompile(`\((\d+) int64\)`)
	amountMatch := amountRegex.FindStringSubmatch(str)
	if len(amountMatch) > 1 {
		b.Amount = amountMatch[1]
	}

	// Fallback for named field "Amount:1000000"
	if b.Amount == "" {
		amountRegexNamed := regexp.MustCompile(`Amount:(\d+)`)
		amountMatchNamed := amountRegexNamed.FindStringSubmatch(str)
		if len(amountMatchNamed) > 1 {
			b.Amount = amountMatchNamed[1]
		}
	}

	// Extract Creator (address) - usually starts with g1
	addrMatches := regexp.MustCompile(`g1[a-z0-9]{38}`).FindAllString(str, -1)
	if len(addrMatches) > 0 {
		b.Creator = addrMatches[0]
	}
	if len(addrMatches) > 1 {
		b.Claimer = addrMatches[1]
	}

	// IsClaimed
	if strings.Contains(str, "true bool") || strings.Contains(str, "IsClaimed:true") {
		b.IsClaimed = true
	}

	return b
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}

func fetchLeaderboard(client *gnoclient.Client) ([]LeaderboardEntry, error) {
	qEval := "GetLeaderboard()"
	res, _, err := client.QEval(Realm, qEval)
	if err != nil {
		return nil, fmt.Errorf("failed to get leaderboard: %w", err)
	}

	log.Printf("Raw leaderboard response: %s", res)

	// Parse the leaderboard response
	// Expected format: (slice[(&(struct{...}))...] []LeaderboardEntry)
	var leaderboard []LeaderboardEntry

	// Check if empty
	if strings.Contains(res, "slice[]") || strings.Contains(res, "(nil") {
		return []LeaderboardEntry{}, nil
	}

	// Extract slice content
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

	// Parse each struct
	structs := strings.Split(sliceContent, "struct{")
	for _, structStr := range structs[1:] {
		entry := LeaderboardEntry{}

		// Split by ),(
		fields := strings.Split(structStr, "),(")

		if len(fields) >= 5 {
			// Field 0: Address
			addrMatch := regexp.MustCompile(`"([g][1][a-z0-9]{38})"`).FindStringSubmatch(fields[0])
			if len(addrMatch) > 1 {
				entry.Address = addrMatch[1]
			}

			// Field 1: BountiesCreated
			bcMatch := regexp.MustCompile(`(\d+)\s+int`).FindStringSubmatch(fields[1])
			if len(bcMatch) > 1 {
				entry.BountiesCreated, _ = strconv.Atoi(bcMatch[1])
			}

			// Field 2: BountiesApplied
			baMatch := regexp.MustCompile(`(\d+)\s+int`).FindStringSubmatch(fields[2])
			if len(baMatch) > 1 {
				entry.BountiesApplied, _ = strconv.Atoi(baMatch[1])
			}

			// Field 3: ValidationsPerformed
			vpMatch := regexp.MustCompile(`(\d+)\s+int`).FindStringSubmatch(fields[3])
			if len(vpMatch) > 1 {
				entry.ValidationsPerformed, _ = strconv.Atoi(vpMatch[1])
			}

			// Field 4: Score
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

func fetchValidatorsForApplication(client *gnoclient.Client, applicationId string) ([]string, error) {
	// Call GetValidatorsForApplication function from the contract
	qEval := fmt.Sprintf("GetValidatorsForApplication(%s)", applicationId)
	res, _, err := client.QEval(Realm, qEval)
	if err != nil {
		// If function doesn't exist or fails, return empty list
		log.Printf("Failed to fetch validators for application %s: %v", applicationId, err)
		return []string{}, nil
	}

	log.Printf("Raw validators response for application %s: %s", applicationId, res)

	var validators []string

	// Check if empty
	if strings.Contains(res, "slice[]") || strings.Contains(res, "(nil") {
		return []string{}, nil
	}

	// Extract all addresses (g1...) from the response
	addrMatches := regexp.MustCompile(`g1[a-z0-9]{38}`).FindAllString(res, -1)
	validators = append(validators, addrMatches...)

	return validators, nil
}

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

type BountyApplication struct {
	ID         string   `json:"id"`
	BountyID   string   `json:"bountyId"`
	Applicant  string   `json:"applicant"`
	PRLink     string   `json:"prLink"`
	AppliedAt  string   `json:"appliedAt"`
	Status     string   `json:"status"`
	Validators []string `json:"validators,omitempty"`
}

func Handler(w http.ResponseWriter, r *http.Request) {
	// CORS headers
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
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

	path := strings.TrimPrefix(r.URL.Path, "/api/bounties")
	path = strings.TrimPrefix(path, "/")

	if path == "" {
		// List all bounties
		bounties, err := fetchBounties(client)
		if err != nil {
			log.Printf("Error fetching bounties: %v", err)
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		json.NewEncoder(w).Encode(bounties)
	} else {
		// Check if it's an applications request
		parts := strings.Split(path, "/")
		if len(parts) == 2 && parts[1] == "applications" {
			id := parts[0]
			apps, err := fetchBountyApplications(client, id)
			if err != nil {
				log.Printf("Error fetching applications for bounty %s: %v", id, err)
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
}

func fetchBounties(client *gnoclient.Client) ([]Bounty, error) {
	qEval := "GetBountyCount()"
	res, _, err := client.QEval(Realm, qEval)
	if err != nil {
		return nil, fmt.Errorf("failed to get count: %w", err)
	}

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

func fetchBountyApplications(client *gnoclient.Client, bountyId string) ([]BountyApplication, error) {
	qEval := fmt.Sprintf("GetApplicationsForBounty(%s)", bountyId)
	res, _, err := client.QEval(Realm, qEval)
	if err != nil {
		return nil, err
	}

	log.Printf("Raw applications response for bounty %s: %s", bountyId, res)

	if res == "(slice[] []*gno.land/r/greg007/gnobounty_v2.Application)" || strings.HasPrefix(res, "(nil") {
		return []BountyApplication{}, nil
	}

	var applications []BountyApplication

	sliceStart := strings.Index(res, "slice[")
	if sliceStart == -1 {
		return []BountyApplication{}, nil
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
		return []BountyApplication{}, nil
	}

	sliceContent := content[:sliceEnd]
	structs := strings.Split(sliceContent, "struct{")
	for _, structStr := range structs[1:] {
		app := BountyApplication{
			BountyID: bountyId,
		}

		fields := strings.Split(structStr, "),(")
		if len(fields) >= 6 {
			idMatch := regexp.MustCompile(`\((\d+)\s+uint64`).FindStringSubmatch(fields[0])
			if len(idMatch) > 1 {
				app.ID = idMatch[1]
			}

			applicantMatch := regexp.MustCompile(`"([g][1][a-z0-9]{38})"`).FindStringSubmatch(fields[2])
			if len(applicantMatch) > 1 {
				app.Applicant = applicantMatch[1]
			}

			prLinkMatch := regexp.MustCompile(`"([^"]+)"\s+string`).FindStringSubmatch(fields[3])
			if len(prLinkMatch) > 1 {
				app.PRLink = prLinkMatch[1]
			}

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

		if app.ID != "" {
			if app.Status == "Pending" {
				validators, err := fetchValidatorsForApplication(client, app.ID)
				if err == nil && len(validators) > 0 {
					app.Validators = validators
				}
			}
			applications = append(applications, app)
		}
	}

	return applications, nil
}

func parseBounty(str string) Bounty {
	b := Bounty{}

	stringMatches := regexp.MustCompile(`"([^"]*)"`).FindAllStringSubmatch(str, -1)
	if len(stringMatches) >= 3 {
		b.Title = stringMatches[0][1]
		b.IssueURL = stringMatches[1][1]
		b.Description = stringMatches[2][1]
	}

	amountRegex := regexp.MustCompile(`\((\d+) int64\)`)
	amountMatch := amountRegex.FindStringSubmatch(str)
	if len(amountMatch) > 1 {
		b.Amount = amountMatch[1]
	}

	if b.Amount == "" {
		amountRegexNamed := regexp.MustCompile(`Amount:(\d+)`)
		amountMatchNamed := amountRegexNamed.FindStringSubmatch(str)
		if len(amountMatchNamed) > 1 {
			b.Amount = amountMatchNamed[1]
		}
	}

	addrMatches := regexp.MustCompile(`g1[a-z0-9]{38}`).FindAllString(str, -1)
	if len(addrMatches) > 0 {
		b.Creator = addrMatches[0]
	}
	if len(addrMatches) > 1 {
		b.Claimer = addrMatches[1]
	}

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

func fetchValidatorsForApplication(client *gnoclient.Client, applicationId string) ([]string, error) {
	qEval := fmt.Sprintf("GetValidatorsForApplication(%s)", applicationId)
	res, _, err := client.QEval(Realm, qEval)
	if err != nil {
		log.Printf("Failed to fetch validators for application %s: %v", applicationId, err)
		return []string{}, nil
	}

	var validators []string
	if strings.Contains(res, "slice[]") || strings.Contains(res, "(nil") {
		return []string{}, nil
	}

	addrMatches := regexp.MustCompile(`g1[a-z0-9]{38}`).FindAllString(res, -1)
	validators = append(validators, addrMatches...)

	return validators, nil
}

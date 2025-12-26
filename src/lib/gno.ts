// This file will contain the Gno.land interaction logic

import { GnoJSONRPCProvider } from '@gnolang/gno-js-client';

export const GNO_RPC_URL = "https://rpc.gno.land:443";
export const CHAIN_ID = "portal-loop";
export const REALM_PATH = "gno.land/r/greg007/gnobounty_v2";

// Initialize the provider
export const provider = new GnoJSONRPCProvider(GNO_RPC_URL);

// Adena Wallet Interface
declare global {
    interface Window {
        adena: {
            AddEstablish: (name: string) => Promise<void>;
            GetAccount: () => Promise<{
                data: {
                    address: string;
                    coins: string;
                    public_key: string;
                    status: string;
                };
            }>;
            DoContract: (params: {
                messages: {
                    type: string;
                    value: {
                        caller: string;
                        send: string;
                        pkg_path: string;
                        func: string;
                        args: string[];
                    };
                }[];
                gasFee: number;
                gasWanted: number;
                memo?: string;
            }) => Promise<{
                code: number;
                log: string;
                hash: string;
            }>;
            SwitchNetwork: (chainId: string) => Promise<void>;
        };
    }
}

export interface Bounty {
    id: string;
    title: string;
    issueUrl: string;
    description: string;
    amount: string; // in ugnot
    creator: string;
    createdAt: string;
    isClaimed: boolean;
    claimer: string;
    claimedAt: string;
}

// Export for debugging
export interface BountyApplication {
    id: string;
    bountyId: string;
    applicant: string;
    prLink: string;
    appliedAt: string;
    status: string; // "Pending", "Approved", "Rejected"
    validators?: string[]; // List of validator addresses assigned to this application
}

export interface LeaderboardEntry {
    address: string;
    bountiesCreated: number;
    bountiesApplied: number;
    validationsPerformed: number;
    score: number;
}

export async function connectWallet() {
    if (!window.adena) {
        throw new Error("Adena wallet not found. Please install it.");
    }

    // Request connection
    await window.adena.AddEstablish("GnoBounty");

    // Get account info
    const account = await window.adena.GetAccount();
    return account.data;
}

// Helper to format timestamp references from Gno
// Converts "ref(hash:id)" to a readable format or returns as-is for now
function formatTimestamp(refStr: string): string {
    if (!refStr || refStr === "") return "";

    // For now, just return a placeholder since we can't decode the ref without more info
    // In a production app, you might need to query the blockchain for the actual timestamp
    if (refStr.startsWith("ref(")) {
        return "Recent"; // Placeholder - the actual timestamp is stored in the blockchain state
    }

    return refStr;
}

// Helper to parse Gno struct string
// Handles multiple formats:
// 1. (*gno.land/r/greg007/gnobounty_v2.Bounty){ID:1, IssueURL:"...", ...}
// 2. (&(struct{(1 uint64),("first_bounty" string),("test" string),...} ...))
function parseGnoStruct(str: string): any {
    const result: any = {};

    // Try to parse tuple-style format first: (value1, value2, value3, ...)
    // Format: (&(struct{(1 uint64),("first_bounty" string),("test" string),("test" string),(1000000 int64),("g1..." .uverse.address),(ref... time.Time),(false bool),( .uverse.address),(ref... time.Time)} ...))
    const tupleMatch = str.match(/struct\{([^}]+)\}/);
    if (tupleMatch) {
        const content = tupleMatch[1];

        // Extract values in order: ID, IssueURL, IssueTitle, Description, Amount, Creator, CreatedAt, IsClaimed, Claimer, ClaimedAt
        const values: string[] = [];
        let depth = 0;
        let currentValue = '';

        for (let i = 0; i < content.length; i++) {
            const char = content[i];

            if (char === '(') {
                depth++;
                if (depth === 1) {
                    currentValue = '';
                    continue;
                }
            } else if (char === ')') {
                depth--;
                if (depth === 0) {
                    values.push(currentValue.trim());
                    currentValue = '';
                    continue;
                }
            }

            if (depth > 0) {
                currentValue += char;
            }
        }

        // Parse the extracted values based on the Gno struct:
        // type Bounty struct {
        //     ID          uint64      (index 0)
        //     Title       string      (index 1)
        //     IssueURL    string      (index 2)
        //     Description string      (index 3)
        //     Amount      int64       (index 4)
        //     Creator     address     (index 5)
        //     CreatedAt   time.Time   (index 6)
        //     IsClaimed   bool        (index 7)
        //     Claimer     address     (index 8)
        //     ClaimedAt   time.Time   (index 9)
        // }
        if (values.length >= 10) {
            // ID (index 0) - "1 uint64"
            const idMatch = values[0].match(/(\d+)/);
            if (idMatch) result.ID = idMatch[1];

            // Title (index 1) - "first_bounty" string
            const titleMatch = values[1].match(/"([^"]*)"/);
            if (titleMatch) result.Title = titleMatch[1];

            // IssueURL (index 2) - "test" string
            const issueMatch = values[2].match(/"([^"]*)"/);
            if (issueMatch) result.IssueURL = issueMatch[1];

            // Description (index 3) - "test" string
            const descMatch = values[3].match(/"([^"]*)"/);
            if (descMatch) result.Description = descMatch[1];

            // Amount (index 4) - "1000000 int64"
            const amountMatch = values[4].match(/(\d+)/);
            if (amountMatch) result.Amount = amountMatch[1];

            // Creator (index 5) - "g1r20afxaccdszhknt8t88skmjjngg3ck8kpycs0" .uverse.address
            const creatorMatch = values[5].match(/"([^"]+)"|([a-z0-9]{40})/);
            if (creatorMatch) result.Creator = creatorMatch[1] || creatorMatch[2] || '';

            // CreatedAt (index 6) - ref(...) time.Time
            const createdMatch = values[6].match(/ref\(([^)]+)\)/);
            if (createdMatch) {
                // Store the raw ref, we'll format it later
                result.CreatedAt = formatTimestamp(`ref(${createdMatch[1]})`);
            }

            // IsClaimed (index 7) - "false bool"
            const claimedMatch = values[7].match(/(true|false)/);
            if (claimedMatch) result.IsClaimed = claimedMatch[1];

            // Claimer (index 8) - " .uverse.address" or "g1..." .uverse.address
            const claimerMatch = values[8].match(/"([^"]+)"|([a-z0-9]{40})/);
            if (claimerMatch) result.Claimer = claimerMatch[1] || claimerMatch[2] || '';

            // ClaimedAt (index 9) - ref(...) time.Time
            const claimedAtMatch = values[9].match(/ref\(([^)]+)\)/);
            if (claimedAtMatch) result.ClaimedAt = formatTimestamp(`ref(${claimedAtMatch[1]})`);
        }

        return result;
    }

    // Fallback to old parsing method for named fields
    const fields = {
        ID: /ID:(\d+)/,
        Title: /Title:"([^"]*)"/,
        IssueURL: /IssueURL:"([^"]*)"/,
        Description: /Description:"([^"]*)"/,
        Amount: /Amount:(\d+)/,
        Creator: /Creator:\(std\.Address\)\(g([a-z0-9]+)\)|Creator:g([a-z0-9]+)/,
        CreatedAt: /CreatedAt:\(time\.Time\)\(([^)]+)\)|CreatedAt:([0-9\-: ]+)/,
        IsClaimed: /IsClaimed:(true|false)/,
        Claimer: /Claimer:\(std\.Address\)\(g([a-z0-9]*)\)|Claimer:g?([a-z0-9]*)/,
        ClaimedAt: /ClaimedAt:\(time\.Time\)\(([^)]+)\)|ClaimedAt:([0-9\-: ]+)/
    };

    for (const [key, regex] of Object.entries(fields)) {
        const match = str.match(regex);
        if (match) {
            // Get the first non-undefined captured group
            result[key] = match[1] || match[2] || match[3] || "";
        }
    }

    return result;
}

export async function getBounties(): Promise<Bounty[]> {
    try {
        // Fetch from the Go backend
        const response = await fetch('/api/bounties');
        if (!response.ok) {
            throw new Error(`Backend responded with status: ${response.status}`);
        }
        const bounties = await response.json();
        return bounties;
    } catch (error) {
        console.error("Failed to fetch bounties from backend:", error);
        // Fallback or return empty
        return [];
    }
}

export async function createBounty(title: string, issueUrl: string, description: string, amount: string, accountAddress: string) {
    if (!window.adena) throw new Error("Adena wallet not connected");

    // Amount is in GNOT, convert to ugnot if needed, but usually sent as string "1000000ugnot"
    // The contract takes Amount as transaction value
    const sendAmount = `${amount}ugnot`;

    const tx = await window.adena.DoContract({
        messages: [
            {
                type: "/vm.m_call",
                value: {
                    caller: accountAddress,
                    send: sendAmount,
                    pkg_path: REALM_PATH,
                    func: "CreateBounty",
                    args: [title, issueUrl, description],
                },
            },
        ],
        gasFee: 1000000,
        gasWanted: 2000000,
    });

    return tx;
}

export async function applyForBounty(bountyId: string, prLink: string, accountAddress: string) {
    if (!window.adena) throw new Error("Adena wallet not connected");

    const tx = await window.adena.DoContract({
        messages: [
            {
                type: "/vm.m_call",
                value: {
                    caller: accountAddress,
                    send: "",
                    pkg_path: REALM_PATH,
                    func: "ApplyForBounty",
                    args: [bountyId, prLink],
                },
            },
        ],
        gasFee: 1000000,
        gasWanted: 2000000,
    });

    return tx;
}

// Vote on an application (approve or reject)
export async function voteOnApplication(applicationId: string, approve: boolean, accountAddress: string) {
    if (!window.adena) throw new Error("Adena wallet not connected");

    // Convert boolean to vote string that matches the smart contract
    const voteChoice = approve ? "yes" : "no";

    const tx = await window.adena.DoContract({
        messages: [
            {
                type: "/vm.m_call",
                value: {
                    caller: accountAddress,
                    send: "",
                    pkg_path: REALM_PATH,
                    func: "Vote",
                    args: [applicationId, voteChoice],
                },
            },
        ],
        gasFee: 1000000,
        gasWanted: 2000000,
    });

    return tx;
}

// Get detailed bounty information including all fields
export async function getBountyDetails(bountyId: string): Promise<Bounty | null> {
    try {
        const response = await fetch(`/api/bounties/${bountyId}`);
        if (!response.ok) {
            if (response.status === 404) return null;
            throw new Error(`Backend responded with status: ${response.status}`);
        }
        const bounty = await response.json();
        return bounty;
    } catch (error) {
        console.error(`Failed to fetch bounty ${bountyId} from backend:`, error);
        return null;
    }
}

// Get applications for a specific bounty
export async function getBountyApplications(bountyId: string): Promise<BountyApplication[]> {
    try {
        const response = await fetch(`/api/bounties/${bountyId}/applications`);
        if (!response.ok) {
            if (response.status === 404) return [];
            throw new Error(`Backend responded with status: ${response.status}`);
        }
        const applications = await response.json();
        return applications;
    } catch (error) {
        console.error(`Failed to fetch applications for bounty ${bountyId}:`, error);
        return [];
    }
}

// Render bounty as formatted text (for debugging)
export async function renderBounty(bountyId: string): Promise<string> {
    try {
        const renderStr = await provider.evaluateExpression(
            REALM_PATH,
            `Render("bounty/${bountyId}")`
        );
        console.log(`\n=== Rendered Bounty ${bountyId} ===`);
        console.log(renderStr);
        console.log("===================\n");
        return renderStr;
    } catch (error) {
        console.error(`Failed to render bounty ${bountyId}:`, error);
        return "";
    }
}

// Get leaderboard data
export async function getLeaderboard(): Promise<LeaderboardEntry[]> {
    try {
        const response = await fetch('/api/leaderboard');
        if (!response.ok) {
            throw new Error(`Backend responded with status: ${response.status}`);
        }
        const leaderboard = await response.json();
        return leaderboard;
    } catch (error) {
        console.error("Failed to fetch leaderboard from backend:", error);
        return [];
    }
}

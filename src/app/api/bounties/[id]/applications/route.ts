import { NextResponse } from 'next/server';
import { GnoJSONRPCProvider } from '@gnolang/gno-js-client';
import { REALM_PATH, GNO_RPC_URL } from '@/lib/gno';

const provider = new GnoJSONRPCProvider(GNO_RPC_URL);

interface ParsedApplication {
    ID: string;
    BountyID: string;
    Applicant: string;
    PRLink: string;
    AppliedAt: string;
    Status: string;
    Validators?: string[];
}

function formatTimestamp(refStr: string): string {
    if (!refStr || refStr === "") return "";
    if (refStr.startsWith("ref(")) {
        return "Recent";
    }
    return refStr;
}

function parseGnoStruct(str: string): ParsedApplication {
    const result: any = {};

    const tupleMatch = str.match(/struct\{([^}]+)\}/);
    if (tupleMatch) {
        const content = tupleMatch[1];
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
        // type Application struct {
        //     ID          uint64      (index 0)
        //     BountyID    uint64      (index 1)
        //     Applicant   address     (index 2)
        //     PRLink      string      (index 3)
        //     AppliedAt   time.Time   (index 4)
        //     Status      ApplicationStatus  (index 5) - 0=Pending, 1=Approved, 2=Rejected
        //     DAO         *CommonDAO  (index 6)
        //     VotingThreshold uint64  (index 7)
        //     VoteRecords []VoteRecord (index 8)
        // }
        if (values.length >= 9) {
            // ID (index 0) - "1 uint64"
            const idMatch = values[0].match(/(\d+)/);
            if (idMatch) result.ID = idMatch[1];

            // BountyID (index 1) - "1 uint64"
            const bountyIdMatch = values[1].match(/(\d+)/);
            if (bountyIdMatch) result.BountyID = bountyIdMatch[1];

            // Applicant (index 2) - "g1..." .uverse.address
            const applicantMatch = values[2].match(/"([^"]+)"|([a-z0-9]{40})/);
            if (applicantMatch) result.Applicant = applicantMatch[1] || applicantMatch[2] || '';

            // PRLink (index 3) - "https://..." string
            const prLinkMatch = values[3].match(/"([^"]*)"/);
            if (prLinkMatch) result.PRLink = prLinkMatch[1];

            // AppliedAt (index 4) - ref(...) time.Time
            const appliedMatch = values[4].match(/ref\(([^)]+)\)/);
            if (appliedMatch) {
                result.AppliedAt = formatTimestamp(`ref(${appliedMatch[1]})`);
            }

            // Status (index 5) - (0 gno.land/r/.../ApplicationStatus)
            const statusMatch = values[5].match(/(\d+)/);
            if (statusMatch) {
                const statusNum = parseInt(statusMatch[1]);
                // 0 = Pending, 1 = Approved, 2 = Rejected
                result.Status = statusNum === 1 ? "Approved" : statusNum === 2 ? "Rejected" : "Pending";
            }

            // Extract validators from VoteRecords (index 8)
            // VoteRecords format: (slice[ref(...)] []...VoteRecord)
            if (values.length > 8) {
                const voteRecordsStr = values[8];
                const validators: string[] = [];
                // For now, we'll need to get validators from a separate function or parse vote records
                // This is complex, so we'll leave it empty for now
                result.Validators = validators;
            }
        }

        return result as ParsedApplication;
    }

    // Fallback to regex parsing
    const fields = {
        ID: /ID:(\d+)/,
        BountyID: /BountyID:(\d+)/,
        Applicant: /Applicant:\(std\.Address\)\(g([a-z0-9]+)\)|Applicant:g([a-z0-9]+)/,
        PRLink: /PRLink:"([^"]*)"/,
        AppliedAt: /AppliedAt:\(time\.Time\)\(([^)]+)\)|AppliedAt:([0-9\-: ]+)/,
        Status: /Status:"([^"]*)"/,
    };

    for (const [key, regex] of Object.entries(fields)) {
        const match = str.match(regex);
        if (match) {
            result[key] = match[1] || match[2] || match[3] || "";
        }
    }

    return result as ParsedApplication;
}

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: bountyId } = await params;

        // Get all applications for this bounty using GetApplicationsForBounty
        const applicationsRaw = await provider.evaluateExpression(
            REALM_PATH,
            `GetApplicationsForBounty(${bountyId})`
        );

        // Parse the array of applications
        // Format expected: (slice[(0 *gno.land/r/greg007/gnobounty_v2.Application)(1 *gno.land/r/greg007/gnobounty_v2.Application) nil])
        const applications = [];

        // Extract the slice content by finding matching parentheses
        const sliceMatch = applicationsRaw.match(/slice\[([\s\S]*)\]\s*\[\]/);
        if (sliceMatch) {
            const sliceContent = sliceMatch[1];

            // Find all complete struct definitions
            // Look for (&(struct{...} ...Application) *...Application)
            let depth = 0;
            let currentStruct = '';
            let inStruct = false;

            for (let i = 0; i < sliceContent.length; i++) {
                const char = sliceContent[i];
                const nextChar = sliceContent[i + 1];

                // Detect start of a struct
                if (char === '(' && nextChar === '&' && sliceContent.substring(i, i + 9) === '(&(struct') {
                    inStruct = true;
                    depth = 0;
                    currentStruct = '';
                }

                if (inStruct) {
                    currentStruct += char;
                    if (char === '(') depth++;
                    if (char === ')') depth--;

                    // When we close all parentheses, we have a complete struct
                    if (depth === 0 && currentStruct.length > 0) {
                        try {
                            const parsed = parseGnoStruct(currentStruct);

                            if (parsed.ID) {
                                applications.push({
                                    id: parsed.ID,
                                    bountyId: parsed.BountyID || bountyId,
                                    applicant: parsed.Applicant || "",
                                    prLink: parsed.PRLink || "",
                                    appliedAt: parsed.AppliedAt || "",
                                    status: parsed.Status || "Pending",
                                    validators: parsed.Validators || []
                                });
                            }
                        } catch (err) {
                            console.error(`Failed to parse application:`, err);
                        }

                        inStruct = false;
                        currentStruct = '';
                    }
                }
            }
        }

        return NextResponse.json(applications);
    } catch (error) {
        console.error("Failed to fetch applications:", error);
        return NextResponse.json(
            { error: "Failed to fetch applications" },
            { status: 500 }
        );
    }
}

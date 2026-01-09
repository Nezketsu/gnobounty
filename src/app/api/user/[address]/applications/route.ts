import { NextRequest, NextResponse } from 'next/server';
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

interface ParsedBounty {
  ID: string;
  Title: string;
  Amount: string;
}

function formatTimestamp(refStr: string): string {
  if (!refStr || refStr === "") return "";
  if (refStr.startsWith("ref(")) {
    return "Recent";
  }
  return refStr;
}

function parseApplicationStruct(str: string): ParsedApplication {
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

    if (values.length >= 9) {
      const idMatch = values[0].match(/(\d+)/);
      if (idMatch) result.ID = idMatch[1];

      const bountyIdMatch = values[1].match(/(\d+)/);
      if (bountyIdMatch) result.BountyID = bountyIdMatch[1];

      const applicantMatch = values[2].match(/"([^"]+)"|([a-z0-9]{40})/);
      if (applicantMatch) result.Applicant = applicantMatch[1] || applicantMatch[2] || '';

      const prLinkMatch = values[3].match(/"([^"]*)"/);
      if (prLinkMatch) result.PRLink = prLinkMatch[1];

      const appliedMatch = values[4].match(/ref\(([^)]+)\)/);
      if (appliedMatch) {
        result.AppliedAt = formatTimestamp(`ref(${appliedMatch[1]})`);
      }

      const statusMatch = values[5].match(/(\d+)/);
      if (statusMatch) {
        const statusNum = parseInt(statusMatch[1]);
        result.Status = statusNum === 1 ? "Approved" : statusNum === 2 ? "Rejected" : "Pending";
      }

      if (values.length > 8) {
        result.Validators = [];
      }
    }

    return result as ParsedApplication;
  }

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

function parseBountyStruct(str: string): ParsedBounty {
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

    if (values.length >= 5) {
      const idMatch = values[0].match(/(\d+)/);
      if (idMatch) result.ID = idMatch[1];

      const titleMatch = values[1].match(/"([^"]*)"/);
      if (titleMatch) result.Title = titleMatch[1];

      const amountMatch = values[4].match(/(\d+)/);
      if (amountMatch) result.Amount = amountMatch[1];
    }

    return result as ParsedBounty;
  }

  return result as ParsedBounty;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  try {
    const { address: userAddress } = await params;

    // Get total bounty count
    const countResult = await provider.evaluateExpression(
      REALM_PATH,
      "GetBountyCount()"
    );

    const countMatch = countResult.match(/\((\d+)/);
    const count = countMatch ? parseInt(countMatch[1], 10) : 0;

    if (isNaN(count) || count === 0) {
      return NextResponse.json([]);
    }

    const userApplications: any[] = [];
    const bountyCache = new Map<string, ParsedBounty>();

    // Iterate through all bounties and get their applications
    for (let i = 1; i <= count; i++) {
      try {
        const applicationsRaw = await provider.evaluateExpression(
          REALM_PATH,
          `GetApplicationsForBounty(${i})`
        );

        // Parse the array of applications
        const sliceMatch = applicationsRaw.match(/slice\[([\s\S]*)\]\s*\[\]/);
        if (sliceMatch) {
          const sliceContent = sliceMatch[1];

          let depth = 0;
          let currentStruct = '';
          let inStruct = false;

          for (let j = 0; j < sliceContent.length; j++) {
            const char = sliceContent[j];
            const nextChar = sliceContent[j + 1];

            if (char === '(' && nextChar === '&' && sliceContent.substring(j, j + 9) === '(&(struct') {
              inStruct = true;
              depth = 0;
              currentStruct = '';
            }

            if (inStruct) {
              currentStruct += char;
              if (char === '(') depth++;
              if (char === ')') depth--;

              if (depth === 0 && currentStruct.length > 0) {
                try {
                  const parsed = parseApplicationStruct(currentStruct);

                  // Filter by applicant
                  if (parsed.ID && parsed.Applicant === userAddress) {
                    // Fetch bounty details if not cached
                    if (!bountyCache.has(parsed.BountyID)) {
                      try {
                        const bountyRaw = await provider.evaluateExpression(
                          REALM_PATH,
                          `GetBounty(${parsed.BountyID})`
                        );
                        const bounty = parseBountyStruct(bountyRaw);
                        if (bounty) {
                          bountyCache.set(parsed.BountyID, bounty);
                        }
                      } catch (err) {
                        console.error(`Failed to fetch bounty ${parsed.BountyID}:`, err);
                      }
                    }

                    const bounty = bountyCache.get(parsed.BountyID);
                    userApplications.push({
                      id: parsed.ID,
                      bountyId: parsed.BountyID,
                      applicant: parsed.Applicant,
                      prLink: parsed.PRLink || "",
                      appliedAt: parsed.AppliedAt || "",
                      status: parsed.Status || "Pending",
                      validators: parsed.Validators || [],
                      bountyTitle: bounty?.Title || `Bounty #${parsed.BountyID}`,
                      bountyAmount: bounty?.Amount || "0"
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
      } catch (err) {
        // Bounty might not have applications, continue
        console.error(`Error fetching applications for bounty ${i}:`, err);
      }
    }

    // Sort by application ID (newest first)
    userApplications.sort((a, b) => parseInt(b.id) - parseInt(a.id));

    return NextResponse.json(userApplications);
  } catch (error) {
    console.error('Error fetching user applications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user applications' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { GnoJSONRPCProvider } from '@gnolang/gno-js-client';
import { REALM_PATH, GNO_RPC_URL } from '@/lib/gno';

const provider = new GnoJSONRPCProvider(GNO_RPC_URL);

interface Bounty {
  id: string;
  title: string;
  issueUrl: string;
  description: string;
  amount: string;
  creator: string;
  createdAt: string;
  isClaimed: boolean;
  claimer: string;
  claimedAt: string;
}

interface ParsedBounty {
  ID: string;
  Title: string;
  IssueURL: string;
  Description: string;
  Amount: string;
  Creator: string;
  CreatedAt: string;
  IsClaimed: string;
  Claimer: string;
  ClaimedAt: string;
}

function formatTimestamp(refStr: string): string {
  if (!refStr || refStr === "") return "";
  if (refStr.startsWith("ref(")) {
    return "Recent";
  }
  return refStr;
}

function parseGnoStruct(str: string): ParsedBounty {
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

    if (values.length >= 10) {
      const idMatch = values[0].match(/(\d+)/);
      if (idMatch) result.ID = idMatch[1];

      const titleMatch = values[1].match(/"([^"]*)"/);
      if (titleMatch) result.Title = titleMatch[1];

      const issueMatch = values[2].match(/"([^"]*)"/);
      if (issueMatch) result.IssueURL = issueMatch[1];

      const descMatch = values[3].match(/"([^"]*)"/);
      if (descMatch) result.Description = descMatch[1];

      const amountMatch = values[4].match(/(\d+)/);
      if (amountMatch) result.Amount = amountMatch[1];

      const creatorMatch = values[5].match(/"([^"]+)"|([a-z0-9]{40})/);
      if (creatorMatch) result.Creator = creatorMatch[1] || creatorMatch[2] || '';

      const createdMatch = values[6].match(/ref\(([^)]+)\)/);
      if (createdMatch) {
        result.CreatedAt = formatTimestamp(`ref(${createdMatch[1]})`);
      }

      const claimedMatch = values[7].match(/(true|false)/);
      if (claimedMatch) result.IsClaimed = claimedMatch[1];

      const claimerMatch = values[8].match(/"([^"]+)"|([a-z0-9]{40})/);
      if (claimerMatch) result.Claimer = claimerMatch[1] || claimerMatch[2] || '';

      const claimedAtMatch = values[9].match(/ref\(([^)]+)\)/);
      if (claimedAtMatch) result.ClaimedAt = formatTimestamp(`ref(${claimedAtMatch[1]})`);
    }

    return result as ParsedBounty;
  }

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
      result[key] = match[1] || match[2] || match[3] || "";
    }
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

    // Fetch all bounties and filter by creator
    const bounties: Bounty[] = [];
    for (let i = 1; i <= count; i++) {
      try {
        const bountyRaw = await provider.evaluateExpression(
          REALM_PATH,
          `GetBounty(${i})`
        );
        const parsed = parseGnoStruct(bountyRaw);

        // Filter by creator address
        if (parsed.Creator === userAddress) {
          bounties.push({
            id: parsed.ID || i.toString(),
            title: parsed.Title || "",
            issueUrl: parsed.IssueURL || "",
            description: parsed.Description || "",
            amount: parsed.Amount || "0",
            creator: parsed.Creator || "",
            createdAt: parsed.CreatedAt || "",
            isClaimed: parsed.IsClaimed === "true",
            claimer: parsed.Claimer || "",
            claimedAt: parsed.ClaimedAt || ""
          });
        }
      } catch (err) {
        console.error(`Failed to fetch bounty ${i}:`, err);
      }
    }

    // Sort by ID (newest first, assuming higher ID = newer)
    bounties.sort((a, b) => parseInt(b.id) - parseInt(a.id));

    return NextResponse.json(bounties);
  } catch (error) {
    console.error('Error fetching user bounties:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user bounties' },
      { status: 500 }
    );
  }
}

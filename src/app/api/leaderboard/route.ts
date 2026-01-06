import { NextResponse } from 'next/server';
import { GnoJSONRPCProvider } from '@gnolang/gno-js-client';
import { REALM_PATH, GNO_RPC_URL } from '@/lib/gno';

const provider = new GnoJSONRPCProvider(GNO_RPC_URL);

export async function GET() {
    try {
        const leaderboardData = await provider.evaluateExpression(
            REALM_PATH,
            "GetLeaderboard()"
        );

        const entries = [];
        const lines = leaderboardData.split('\n').filter((line: string) => line.trim());

        for (const line of lines) {
            const match = line.match(/([a-z0-9]+)\s+Created:(\d+)\s+Applied:(\d+)\s+Validated:(\d+)\s+Score:(\d+)/);
            if (match) {
                entries.push({
                    address: match[1],
                    bountiesCreated: parseInt(match[2], 10),
                    bountiesApplied: parseInt(match[3], 10),
                    validationsPerformed: parseInt(match[4], 10),
                    score: parseInt(match[5], 10)
                });
            }
        }

        return NextResponse.json(entries);
    } catch (error) {
        console.error("Failed to fetch leaderboard:", error);
        return NextResponse.json(
            { error: "Failed to fetch leaderboard" },
            { status: 500 }
        );
    }
}

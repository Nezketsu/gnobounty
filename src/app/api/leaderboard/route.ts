import { NextResponse } from 'next/server';
import { GnoJSONRPCProvider } from '@gnolang/gno-js-client';
import { REALM_PATH, GNO_RPC_URL } from '@/lib/gno';

const provider = new GnoJSONRPCProvider(GNO_RPC_URL);

interface LeaderboardEntry {
    address: string;
    bountiesCreated: number;
    bountiesApplied: number;
    validationsPerformed: number;
    score: number;
}

function parseLeaderboardStruct(str: string): LeaderboardEntry | null {
    try {
        // Extract values from struct format:
        // struct{("address" .uverse.address),(2 int),(0 int),(0 int),(20 int)}
        const structMatch = str.match(/struct\{([^}]+)\}/);
        if (!structMatch) return null;

        const content = structMatch[1];
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
            // Extract address from first value: "g1..." .uverse.address
            const addressMatch = values[0].match(/"([^"]+)"/);
            const address = addressMatch ? addressMatch[1] : '';

            // Extract integers from remaining values
            const bountiesCreated = parseInt(values[1].match(/(\d+)/)?.[1] || '0');
            const bountiesApplied = parseInt(values[2].match(/(\d+)/)?.[1] || '0');
            const validationsPerformed = parseInt(values[3].match(/(\d+)/)?.[1] || '0');
            const score = parseInt(values[4].match(/(\d+)/)?.[1] || '0');

            if (!address) return null;

            return {
                address,
                bountiesCreated,
                bountiesApplied,
                validationsPerformed,
                score
            };
        }

        return null;
    } catch (error) {
        console.error('Error parsing leaderboard entry:', error);
        return null;
    }
}

export async function GET() {
    try {
        const leaderboardData = await provider.evaluateExpression(
            REALM_PATH,
            "GetLeaderboard()"
        );

        console.log('Raw leaderboard data:', leaderboardData);

        const entries: LeaderboardEntry[] = [];

        // Parse the slice of structs
        // Format: (slice[(struct{...}),(struct{...})] []LeaderboardEntry)
        const sliceMatch = leaderboardData.match(/slice\[([\s\S]*)\]\s*\[\]/);
        if (sliceMatch) {
            const sliceContent = sliceMatch[1];

            let depth = 0;
            let currentStruct = '';
            let inStruct = false;

            for (let i = 0; i < sliceContent.length; i++) {
                const char = sliceContent[i];

                // Detect start of a struct
                if (char === '(' && sliceContent.substring(i, i + 7) === '(struct') {
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
                        const parsed = parseLeaderboardStruct(currentStruct);
                        if (parsed) {
                            entries.push(parsed);
                        }

                        inStruct = false;
                        currentStruct = '';
                    }
                }
            }
        }

        console.log(`Parsed ${entries.length} leaderboard entries`);

        // Sort by score (highest first)
        entries.sort((a, b) => b.score - a.score);

        return NextResponse.json(entries);
    } catch (error) {
        console.error("Failed to fetch leaderboard:", error);
        return NextResponse.json(
            { error: "Failed to fetch leaderboard" },
            { status: 500 }
        );
    }
}

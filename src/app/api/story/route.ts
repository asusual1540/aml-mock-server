import { NextRequest, NextResponse } from 'next/server';
import {
    getStoryStatus,
    startStory,
    stopStory,
    clearStory,
    getWebhookMappingStatus,
    type StoryConfig,
} from '@/lib/story-engine';

/**
 * GET /api/story — Returns the current story status, player data, and recent logs.
 *
 * Query params:
 *   ?check=webhooks — Returns webhook mapping status instead of story status.
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const check = searchParams.get('check');

        if (check === 'webhooks') {
            const status = getWebhookMappingStatus();
            return NextResponse.json({ success: true, ...status });
        }

        const status = getStoryStatus();
        return NextResponse.json({ success: true, ...status });
    } catch (error: any) {
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}

/**
 * POST /api/story — Start a new story.
 *
 * Body: StoryConfig
 *   { name, place, intervalSeconds, players: { individual, corporate, government, npo }, badActorPercentage }
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const config: StoryConfig = {
            name: body.name || '',
            place: body.place || 'Bangladesh',
            intervalSeconds: parseInt(body.intervalSeconds) || 5,
            players: {
                individual: parseInt(body.players?.individual) || 0,
                corporate: parseInt(body.players?.corporate) || 0,
                government: parseInt(body.players?.government) || 0,
                npo: parseInt(body.players?.npo) || 0,
            },
            badActorPercentage: parseFloat(body.badActorPercentage) || 10,
        };

        console.log('[StoryAPI] Starting story:', config);
        const result = await startStory(config);

        if (!result.success) {
            return NextResponse.json(
                { success: false, error: result.error },
                { status: 400 }
            );
        }

        return NextResponse.json({
            success: true,
            message: `Story "${config.name}" started successfully`,
        });
    } catch (error: any) {
        console.error('[StoryAPI] Start error:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/story — Stop the running story.
 *
 * Query params:
 *   ?action=clear — Clears the story state entirely (no summary preservation).
 */
export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const action = searchParams.get('action');

        if (action === 'clear') {
            clearStory();
            return NextResponse.json({ success: true, message: 'Story cleared' });
        }

        const result = stopStory();
        return NextResponse.json({
            success: true,
            message: 'Story stopped',
            summary: result.summary,
        });
    } catch (error: any) {
        console.error('[StoryAPI] Stop error:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}

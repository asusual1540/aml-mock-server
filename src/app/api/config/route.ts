import { NextRequest, NextResponse } from 'next/server';
import { getSchemas, saveSchemas, resetToDefaults, AVAILABLE_FIELD_TYPES } from '@/lib/schema-manager';

export async function GET() {
    try {
        const schemas = getSchemas();
        return NextResponse.json({
            schemas,
            availableTypes: AVAILABLE_FIELD_TYPES,
        });
    } catch (error) {
        console.error('Error getting schemas:', error);
        return NextResponse.json(
            { error: 'Failed to load schemas' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        if (body.action === 'reset') {
            const schemas = resetToDefaults();
            return NextResponse.json({ success: true, schemas });
        }

        if (body.action === 'save' && body.schemas) {
            saveSchemas(body.schemas);
            return NextResponse.json({ success: true });
        }

        return NextResponse.json(
            { error: 'Invalid action' },
            { status: 400 }
        );
    } catch (error) {
        console.error('Error updating schemas:', error);
        return NextResponse.json(
            { error: 'Failed to update schemas' },
            { status: 500 }
        );
    }
}

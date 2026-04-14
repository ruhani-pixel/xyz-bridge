import { NextRequest, NextResponse } from 'next/server';
import { generateAIResponse } from '@/lib/ai/service';

export async function POST(req: NextRequest) {
  try {
    const { ownerId, contactPhone, userMessage } = await req.json();

    if (!ownerId || !contactPhone || !userMessage) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const aiReply = await generateAIResponse(ownerId, contactPhone, userMessage);

    return NextResponse.json({ reply: aiReply });

  } catch (error: any) {
    console.error('AI Generation API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

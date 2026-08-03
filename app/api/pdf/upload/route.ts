import { NextRequest, NextResponse } from 'next/server';
if (typeof global.DOMMatrix === 'undefined') {
  (global as any).DOMMatrix = class DOMMatrix {};
  (global as any).ImageData = class ImageData {};
  (global as any).Path2D = class Path2D {};
}
const pdf = require('pdf-parse');
import prisma from '@/lib/prisma';
import { extractBusinessProfile } from '@/lib/openai';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Parse PDF
    const data = await pdf(buffer);
    const text = data.text;

    // Extract profile using Gemini
    const openaiKey = req.headers.get('x-openai-key') || undefined;
    const profile = await extractBusinessProfile(text, openaiKey);

    // Save to database
    const document = await prisma.document.create({
      data: {
        fileName: file.name,
        extractedText: text.substring(0, 10000), // store up to 10000 chars
        analyzedProfile: JSON.stringify(profile)
      }
    });

    return NextResponse.json({ success: true, document, profile });

  } catch (error) {
    console.error("PDF upload error:", error);
    return NextResponse.json({ error: 'Failed to process PDF' }, { status: 500 });
  }
}

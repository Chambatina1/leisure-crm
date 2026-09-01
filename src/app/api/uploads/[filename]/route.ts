import { NextRequest, NextResponse } from 'next/server';
import { readFile, stat } from 'fs/promises';
import path from 'path';

// GET /api/uploads/[filename] - Serves uploaded images from data/uploads/
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params;

    // Security: prevent directory traversal
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return NextResponse.json({ error: 'Invalid filename' }, { status: 400 });
    }

    // Only allow image extensions
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const ext = path.extname(filename).toLowerCase();
    if (!allowedExtensions.includes(ext)) {
      return NextResponse.json({ error: 'File type not allowed' }, { status: 400 });
    }

    // Search for file in multiple locations
    const searchPaths = [
      path.join(process.cwd(), 'data', 'uploads', filename),
      path.join(process.cwd(), 'public', 'uploads', filename),
      path.join(process.cwd(), 'upload', filename),
    ];

    let filePath: string | null = null;
    for (const filePathCandidate of searchPaths) {
      try {
        await stat(filePathCandidate);
        filePath = filePathCandidate;
        break;
      } catch {
        // File not found at this location, try next
      }
    }

    if (!filePath) {
      console.warn(`[Uploads] File not found: ${filename} (searched in data/uploads, public/uploads, upload)`);
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    const fileBuffer = await readFile(filePath);

    // Set correct content type
    const contentTypes: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
    };

    const contentType = contentTypes[ext] || 'application/octet-stream';

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Content-Length': fileBuffer.length.toString(),
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('[Uploads] Error serving file:', error);
    return NextResponse.json({ error: 'Error serving file' }, { status: 500 });
  }
}

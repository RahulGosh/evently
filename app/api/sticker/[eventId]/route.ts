// app/api/sticker/[eventId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getEventById } from '@/lib/actions/event.action';
import * as sharp from 'sharp';
import { formatDateTime } from '@/lib/utils';

export async function GET(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  const eventId = params.eventId;
  
  try {
    // Fetch event using your existing action
    const event = await getEventById(eventId);
    
    if (!event) {
      return new NextResponse(JSON.stringify({ error: 'Event not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Create an SVG template for the sticker
    const svg = generateEventStickerSVG(event);
    
    // Convert SVG to PNG buffer
    const pngBuffer = await sharp(Buffer.from(svg))
      .resize(800, 800)
      .toFormat('png')
      .toBuffer();
    
    // Return PNG image
    return new NextResponse(pngBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=86400'
      }
    });
  } catch (error) {
    console.error('Error generating sticker:', error);
    return new NextResponse(JSON.stringify({ error: 'Failed to generate sticker' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

function generateEventStickerSVG(event: any) {
  // Format the date
  const formattedDate = formatDateTime 
    ? formatDateTime(event.startDateTime).dateOnly 
    : new Date(event.startDateTime).toLocaleDateString();
  
  // Limit title length
  const title = event.title.length > 50 
    ? event.title.substring(0, 47) + '...' 
    : event.title;
  
  // Generate SVG with event details and styling
  return `
    <svg width="800" height="800" xmlns="http://www.w3.org/2000/svg">
      <!-- Background with gradient -->
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#6366F1;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#8B5CF6;stop-opacity:1" />
        </linearGradient>
        <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="4" stdDeviation="10" flood-opacity="0.3"/>
        </filter>
      </defs>
      
      <!-- Main background rounded rectangle -->
      <rect width="800" height="800" rx="40" ry="40" fill="url(#grad)" filter="url(#shadow)" />
      
      <!-- White content area -->
      <rect x="50" y="50" width="700" height="700" rx="30" ry="30" fill="white" opacity="0.95" />
      
      <!-- Event title -->
      <text x="400" y="200" font-family="Arial, sans-serif" font-size="50" font-weight="bold" text-anchor="middle" fill="#333333">
        ${escapeXml(title)}
      </text>
      
      <!-- Date -->
      <text x="400" y="280" font-family="Arial, sans-serif" font-size="36" text-anchor="middle" fill="#6366F1">
        ${escapeXml(formattedDate)}
      </text>
      
      <!-- Category badge -->
      <rect x="320" y="330" width="160" height="50" rx="25" ry="25" fill="#8B5CF6" />
      <text x="400" y="365" font-family="Arial, sans-serif" font-size="24" font-weight="bold" text-anchor="middle" fill="white">
        ${escapeXml(event.category?.name || 'Event')}
      </text>
      
      <!-- Bottom tag line -->
      <text x="400" y="700" font-family="Arial, sans-serif" font-size="28" text-anchor="middle" fill="#6B7280">
        Tap to join this event!
      </text>
    </svg>
  `;
}

// Helper function to escape XML special characters
function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case "'": return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}
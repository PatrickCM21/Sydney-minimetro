import { NextRequest } from 'next/server';

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const body = await request.json();
    const { feedback, score, mode, startStation, targetStation, guessedCount, totalCount, wrongCount } = body;

    if (!feedback || typeof feedback !== 'string') {
      return Response.json({ error: 'Feedback message is required' }, { status: 400 });
    }

    const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
    if (!webhookUrl) {
      console.error('Missing DISCORD_WEBHOOK_URL environment variable');
      return Response.json({ error: 'Feedback submission is not configured on the server' }, { status: 500 });
    }

    // Format a nice rich embed or message for Discord
    const discordMessage = {
      embeds: [
        {
          title: 'New Trackle Game Feedback',
          description: feedback,
          color: mode === 'daily' ? 16753920 : 3447003, // Orange for Daily, Blue for Practice
          fields: [
            { name: 'Mode', value: mode === 'daily' ? 'Daily Challenge' : 'Practice', inline: true },
            { name: 'Route', value: `${startStation} ↔ ${targetStation}`, inline: true },
            { name: 'Score', value: `${score}%`, inline: true },
            { name: 'Guesses', value: `${guessedCount}/${totalCount} (Wrong: ${wrongCount})`, inline: true }
          ],
          timestamp: new Date().toISOString()
        }
      ]
    };

    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(discordMessage)
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error('Failed to post to Discord webhook:', errorText);
      return Response.json({ error: 'Failed to send feedback to Discord' }, { status: 502 });
    }

    return Response.json({ success: true });
  } catch (err: any) {
    console.error('Server error submitting feedback:', err);
    return Response.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

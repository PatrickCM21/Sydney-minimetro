import { NextRequest } from 'next/server';

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const body = await request.json();
    const { feedback, email, score, mode, startStation, targetStation, guessedCount, totalCount, wrongCount } = body;

    if (!feedback || typeof feedback !== 'string') {
      return Response.json({ error: 'Feedback message is required' }, { status: 400 });
    }

    const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
    if (!webhookUrl) {
      console.error('Missing DISCORD_WEBHOOK_URL environment variable');
      return Response.json({ error: 'Feedback submission is not configured on the server' }, { status: 500 });
    }

    let color = 3447003; // Default blue
    let modeName = 'Practice';

    if (mode === 'daily') {
      color = 16753920; // Orange
      modeName = 'Daily Challenge';
    } else if (mode === 'settings') {
      color = 10197915; // Grey
      modeName = 'Settings Menu / General';
    }

    const fields = [
      { name: 'Mode', value: modeName, inline: true }
    ];

    if (startStation && targetStation) {
      fields.push({ name: 'Route', value: `${startStation} ↔ ${targetStation}`, inline: true });
    }

    if (score !== undefined && score !== null) {
      fields.push({ name: 'Score', value: `${score}%`, inline: true });
    }

    if (guessedCount !== undefined && totalCount !== undefined && wrongCount !== undefined &&
        guessedCount !== null && totalCount !== null && wrongCount !== null) {
      fields.push({ name: 'Guesses', value: `${guessedCount}/${totalCount} (Wrong: ${wrongCount})`, inline: true });
    }

    if (email) {
      fields.push({ name: 'Contact Email', value: email, inline: false });
    }

    // Format a nice rich embed or message for Discord
    const discordMessage = {
      embeds: [
        {
          title: 'New Trackle Game Feedback',
          description: feedback,
          color,
          fields,
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
  } catch (err) {
    const error = err as Error;
    console.error('Server error submitting feedback:', error);
    return Response.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

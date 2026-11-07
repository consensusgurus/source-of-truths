// /remind: a daily calendar reminder for Mind Loft (owner, 2026-11-07, the
// retention ending's "Remind me"). One floating-time event at 8am in the
// reader's own time zone, repeating daily, with an alert at the start. Static:
// no lambda, no data, nothing stored.

export const dynamic = 'force-static';

const ICS = [
  'BEGIN:VCALENDAR',
  'VERSION:2.0',
  'PRODID:-//Mind Loft//Daily reminder//EN',
  'CALSCALE:GREGORIAN',
  'METHOD:PUBLISH',
  'BEGIN:VEVENT',
  'UID:mindloft-daily-reminder@mindloftdaily.com',
  'DTSTAMP:20261107T000000Z',
  'DTSTART:20261108T080000',
  'DTEND:20261108T081500',
  'RRULE:FREQ=DAILY',
  'SUMMARY:Mind Loft: today\'s puzzles are up',
  'DESCRIPTION:New daily puzzles on Mind Loft. https://mindloftdaily.com',
  'URL:https://mindloftdaily.com',
  'BEGIN:VALARM',
  'ACTION:DISPLAY',
  'DESCRIPTION:Today\'s Mind Loft puzzles are up',
  'TRIGGER:PT0M',
  'END:VALARM',
  'END:VEVENT',
  'END:VCALENDAR',
  '',
].join('\r\n');

export function GET() {
  return new Response(ICS, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'attachment; filename="mind-loft-reminder.ics"',
      'Cache-Control': 'public, max-age=86400, s-maxage=604800',
      'X-Robots-Tag': 'noindex',
    },
  });
}

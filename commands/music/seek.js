const { success, error: errEmbed } = require('../../utils/embed');
const { requirePlayer } = require('../../utils/musicHelpers');

function parseTime(str) {
  if (/^\d+$/.test(str)) return parseInt(str, 10) * 1000; // plain seconds
  const parts = str.split(':').map(Number);
  if (parts.some(isNaN)) return null;
  let seconds = 0;
  if (parts.length === 3) seconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
  else if (parts.length === 2) seconds = parts[0] * 60 + parts[1];
  else return null;
  return seconds * 1000;
}

module.exports = {
  name: 'seek',
  description: 'Seeks to a specific position in the current track.',
  usage: 'seek <seconds | mm:ss | hh:mm:ss>',
  execute: async (message, args, client) => {
    const player = await requirePlayer(message, client, { requirePlaying: true });
    if (!player) return;

    if (!player.queue.current?.info.isSeekable) {
      return message.reply({ embeds: [errEmbed('This track cannot be seeked (e.g. a livestream).')] });
    }

    const ms = parseTime(args[0] || '');
    if (ms === null || ms < 0) {
      return message.reply({ embeds: [errEmbed('Usage: `seek <seconds | mm:ss | hh:mm:ss>`')] });
    }
    if (ms > player.queue.current.info.duration) {
      return message.reply({ embeds: [errEmbed('That position is beyond the track\u2019s duration.')] });
    }

    await player.seek(ms);
    message.reply({ embeds: [success(`Seeked to \`${client.msToTime(ms)}\`.`)] });
  },
};

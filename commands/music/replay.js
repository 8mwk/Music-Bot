const { success, error: errEmbed } = require('../../utils/embed');
const { requirePlayer } = require('../../utils/musicHelpers');

module.exports = {
  name: 'replay',
  aliases: ['restart'],
  description: 'Restarts the current track from the beginning.',
  execute: async (message, args, client) => {
    const player = await requirePlayer(message, client, { requirePlaying: true });
    if (!player) return;

    if (!player.queue.current?.info.isSeekable) {
      return message.reply({ embeds: [errEmbed('This track cannot be restarted (e.g. a livestream).')] });
    }

    await player.seek(0);
    message.reply({ embeds: [success('Restarted the current track.')] });
  },
};

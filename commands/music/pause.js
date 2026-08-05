const { success, error: errEmbed } = require('../../utils/embed');
const { requirePlayer } = require('../../utils/musicHelpers');

module.exports = {
  name: 'pause',
  description: 'Pauses the current track.',
  execute: async (message, args, client) => {
    const player = await requirePlayer(message, client, { requirePlaying: true });
    if (!player) return;

    if (player.paused) {
      return message.reply({ embeds: [errEmbed('Playback is already paused.')] });
    }
    await player.pause();
    message.reply({ embeds: [success('Paused.')] });
  },
};

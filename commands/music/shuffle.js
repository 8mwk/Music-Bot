const { success, error: errEmbed } = require('../../utils/embed');
const { requirePlayer } = require('../../utils/musicHelpers');

module.exports = {
  name: 'shuffle',
  aliases: ['mix'],
  description: 'Shuffles the current queue.',
  execute: async (message, args, client) => {
    const player = await requirePlayer(message, client);
    if (!player) return;

    if (player.queue.tracks.length < 2) {
      return message.reply({ embeds: [errEmbed('Not enough tracks in the queue to shuffle.')] });
    }

    await player.queue.shuffle();
    message.reply({ embeds: [success('Queue shuffled.')] });
  },
};

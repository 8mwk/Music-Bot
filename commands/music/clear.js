const { success, error: errEmbed } = require('../../utils/embed');
const { requirePlayer } = require('../../utils/musicHelpers');

module.exports = {
  name: 'clear',
  aliases: ['cq'],
  description: 'Clears all upcoming tracks in the queue (current track keeps playing).',
  execute: async (message, args, client) => {
    const player = await requirePlayer(message, client);
    if (!player) return;

    if (!player.queue.tracks.length) {
      return message.reply({ embeds: [errEmbed('The queue is already empty.')] });
    }

    const count = player.queue.tracks.length;
    await player.queue.splice(0, count);
    message.reply({ embeds: [success(`Cleared **${count}** track(s) from the queue.`)] });
  },
};

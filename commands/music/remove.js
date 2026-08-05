const { success, error: errEmbed } = require('../../utils/embed');
const { requirePlayer } = require('../../utils/musicHelpers');

module.exports = {
  name: 'remove',
  aliases: ['rm', 'delete'],
  description: 'Removes a track from the queue by its position.',
  usage: 'remove <position>',
  execute: async (message, args, client) => {
    const player = await requirePlayer(message, client);
    if (!player) return;

    const index = parseInt(args[0], 10);
    if (isNaN(index) || index < 1 || index > player.queue.tracks.length) {
      return message.reply({
        embeds: [errEmbed(`Please provide a valid queue position between 1 and ${player.queue.tracks.length}.`)],
      });
    }

    const removed = await player.queue.splice(index - 1, 1);
    const removedTrack = Array.isArray(removed) ? removed[0] : removed;
    message.reply({ embeds: [success(`Removed **${removedTrack.info.title}** from the queue.`)] });
  },
};

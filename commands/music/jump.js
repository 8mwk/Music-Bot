const { success, error: errEmbed } = require('../../utils/embed');
const { requirePlayer } = require('../../utils/musicHelpers');

module.exports = {
  name: 'jump',
  aliases: ['jumpto', 'goto'],
  description: 'Jumps straight to a track in the queue by position, skipping the rest.',
  usage: 'jump <position>',
  execute: async (message, args, client) => {
    const player = await requirePlayer(message, client);
    if (!player) return;

    const index = parseInt(args[0], 10);
    if (isNaN(index) || index < 1 || index > player.queue.tracks.length) {
      return message.reply({
        embeds: [errEmbed(`Please provide a valid queue position between 1 and ${player.queue.tracks.length}.`)],
      });
    }

    const target = player.queue.tracks[index - 1];
    await player.skip(index);
    message.reply({ embeds: [success(`Jumped to **${target.info.title}**.`)] });
  },
};

const { success, error: errEmbed } = require('../../utils/embed');
const { requirePlayer } = require('../../utils/musicHelpers');

module.exports = {
  name: 'skip',
  aliases: ['s', 'next'],
  description: 'Skips the current track, or skip <n> tracks ahead.',
  usage: 'skip [amount]',
  execute: async (message, args, client) => {
    const player = await requirePlayer(message, client, { requirePlaying: true });
    if (!player) return;

    const amount = parseInt(args[0], 10) || 1;
    if (amount > 1 && player.queue.tracks.length < amount - 1) {
      return message.reply({
        embeds: [errEmbed(`There are only ${player.queue.tracks.length} track(s) in the queue.`)],
      });
    }

    const skipped = player.queue.current;
    await player.skip(amount);
    message.reply({ embeds: [success(`Skipped **${skipped?.info?.title || 'track'}**.`)] });
  },
};

const { success, error: errEmbed } = require('../../utils/embed');
const { requirePlayer } = require('../../utils/musicHelpers');

module.exports = {
  name: 'move',
  description: 'Moves a track from one queue position to another.',
  usage: 'move <from> <to>',
  execute: async (message, args, client) => {
    const player = await requirePlayer(message, client);
    if (!player) return;

    const from = parseInt(args[0], 10);
    const to = parseInt(args[1], 10);
    const len = player.queue.tracks.length;

    if (isNaN(from) || isNaN(to) || from < 1 || from > len || to < 1 || to > len) {
      return message.reply({ embeds: [errEmbed(`Both positions must be between 1 and ${len}.`)] });
    }

    const [track] = player.queue.tracks.splice(from - 1, 1);
    player.queue.tracks.splice(to - 1, 0, track);

    message.reply({ embeds: [success(`Moved **${track.info.title}** to position **${to}**.`)] });
  },
};

const { success, error: errEmbed } = require('../../utils/embed');
const { requirePlayer } = require('../../utils/musicHelpers');

module.exports = {
  name: 'previous',
  aliases: ['back', 'prev'],
  description: 'Plays the previous track.',
  execute: async (message, args, client) => {
    const player = await requirePlayer(message, client);
    if (!player) return;

    if (!player.queue.previous?.length) {
      return message.reply({ embeds: [errEmbed('There is no previous track.')] });
    }

    await player.queue.shiftPrevious();
    message.reply({ embeds: [success('Playing the previous track.')] });
  },
};

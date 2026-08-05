const { success } = require('../../utils/embed');
const { requirePlayer } = require('../../utils/musicHelpers');

module.exports = {
  name: 'leave',
  aliases: ['disconnect', 'dc'],
  description: 'Disconnects the bot and clears the queue.',
  execute: async (message, args, client) => {
    const player = await requirePlayer(message, client);
    if (!player) return;

    player.destroy();
    message.reply({ embeds: [success('Disconnected and cleared the queue.')] });
  },
};

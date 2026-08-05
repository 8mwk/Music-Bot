const { success, error: errEmbed } = require('../../utils/embed');
const { requirePlayer } = require('../../utils/musicHelpers');

module.exports = {
  name: 'resume',
  aliases: ['unpause'],
  description: 'Resumes the current track.',
  execute: async (message, args, client) => {
    const player = await requirePlayer(message, client);
    if (!player) return;

    if (!player.paused) {
      return message.reply({ embeds: [errEmbed('Playback is not paused.')] });
    }
    await player.resume();
    message.reply({ embeds: [success('Resumed.')] });
  },
};

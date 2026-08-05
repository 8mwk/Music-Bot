const { success } = require('../../utils/embed');
const { requirePlayer } = require('../../utils/musicHelpers');

module.exports = {
  name: 'stop',
  description: 'Stops playback and clears the entire queue (bot stays connected).',
  execute: async (message, args, client) => {
    const player = await requirePlayer(message, client);
    if (!player) return;

    player.queue.tracks.splice(0, player.queue.tracks.length);
    await player.stopPlaying(true, false);

    const ref = client.panels.get(player.guildId);
    if (ref) {
      const channel = client.channels.cache.get(ref.channelId);
      if (channel) {
        const panelMsg = await channel.messages.fetch(ref.messageId).catch(() => null);
        if (panelMsg) {
          panelMsg
            .edit({ content: '⏹️ Stopped playback and cleared the queue.', embeds: [], components: [] })
            .catch(() => {});
        }
      }
      client.panels.delete(player.guildId);
    }

    message.reply({ embeds: [success('Stopped playback and cleared the queue.')] });
  },
};

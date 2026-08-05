module.exports = {
  name: 'voiceStateUpdate',
  once: false,
  async execute(oldState, newState, client) {
    // Forwarded mainly so lavalink-client can track bot voice channel moves/disconnects.
    // lavalink-client hooks into raw gateway data via client.on('raw', ...) in index.js,
    // this listener is kept for potential custom logic (e.g. auto-leave when alone).
    const player = client.lavalink?.getPlayer(oldState.guild.id);
    if (!player || !player.voiceChannelId) return;

    const channel = oldState.guild.channels.cache.get(player.voiceChannelId);
    if (!channel) return;

    const humanMembers = channel.members.filter((m) => !m.user.bot);
    if (humanMembers.size === 0 && !player.get('twentyFourSeven')) {
      setTimeout(() => {
        const stillEmpty = channel.members.filter((m) => !m.user.bot).size === 0;
        if (stillEmpty && client.lavalink.getPlayer(oldState.guild.id)) {
          player.destroy();
        }
      }, 60000);
    }
  },
};

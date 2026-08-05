const { success } = require('../../utils/embed');
const { requireVoice } = require('../../utils/musicHelpers');

module.exports = {
  name: 'join',
  aliases: ['summon', 'connect'],
  description: 'Makes the bot join your voice channel.',
  execute: async (message, args, client) => {
    const voiceChannelId = await requireVoice(message, client);
    if (!voiceChannelId) return;

    let player = client.lavalink.getPlayer(message.guild.id);
    if (!player) {
      player = client.lavalink.createPlayer({
        guildId: message.guild.id,
        voiceChannelId,
        textChannelId: message.channel.id,
        selfDeaf: true,
        volume: client.config.defaultVolume || 100,
      });
    }
    if (!player.connected) await player.connect();

    message.reply({ embeds: [success(`Joined <#${voiceChannelId}>`)] });
  },
};

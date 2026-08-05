const { error: errEmbed } = require('./embed');

/**
 * Validates the member is in a voice channel and, if a player already
 * exists, that they're in the *same* voice channel as the bot.
 * Returns the member's voice channel id, or null (and replies) on failure.
 */
async function requireVoice(message, client) {
  const member = message.member;
  const voiceChannel = member.voice?.channel;

  if (!voiceChannel) {
    await message.reply({ embeds: [errEmbed('You need to join a voice channel first.')] });
    return null;
  }

  const permissions = voiceChannel.permissionsFor(message.guild.members.me);
  if (!permissions.has('Connect') || !permissions.has('Speak')) {
    await message.reply({
      embeds: [errEmbed("I need `Connect` and `Speak` permissions in your voice channel.")],
    });
    return null;
  }

  const existingPlayer = client.lavalink.getPlayer(message.guild.id);
  if (existingPlayer && existingPlayer.voiceChannelId !== voiceChannel.id) {
    await message.reply({
      embeds: [errEmbed('I\u2019m already playing in another voice channel here.')],
    });
    return null;
  }

  return voiceChannel.id;
}

/**
 * Fetches the active player for a guild, or replies with an error if none.
 */
async function requirePlayer(message, client, { requirePlaying = false } = {}) {
  const player = client.lavalink.getPlayer(message.guild.id);
  if (!player) {
    await message.reply({ embeds: [errEmbed('Nothing is playing right now.')] });
    return null;
  }
  if (requirePlaying && !player.playing && !player.paused) {
    await message.reply({ embeds: [errEmbed('Nothing is playing right now.')] });
    return null;
  }

  const memberChannel = message.member.voice?.channel?.id;
  if (!memberChannel || memberChannel !== player.voiceChannelId) {
    await message.reply({
      embeds: [errEmbed('You need to be in the same voice channel as me to do that.')],
    });
    return null;
  }

  return player;
}

module.exports = { requireVoice, requirePlayer };

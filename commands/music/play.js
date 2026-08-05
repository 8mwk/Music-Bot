const { baseEmbed, error: errEmbed } = require('../../utils/embed');
const { requireVoice } = require('../../utils/musicHelpers');

// Matches any http(s) URL — used to tell "paste a link" apart from "search by name".
const URL_REGEX = /^https?:\/\/\S+$/i;

// Recognize the platform a link belongs to purely for the embed label — the
// actual resolving (including turning a Spotify link into playable audio) is
// done Lavalink-side by the LavaSrc plugin on the node.
function detectPlatform(query) {
  if (/open\.spotify\.com/i.test(query)) return { name: 'Spotify', emoji: '🟢' };
  if (/(youtube\.com|youtu\.be)/i.test(query)) return { name: 'YouTube', emoji: '🔴' };
  if (/soundcloud\.com/i.test(query)) return { name: 'SoundCloud', emoji: '🟠' };
  if (/music\.apple\.com/i.test(query)) return { name: 'Apple Music', emoji: '⚪' };
  if (/deezer\.com/i.test(query)) return { name: 'Deezer', emoji: '🟣' };
  return null;
}

module.exports = {
  name: 'play',
  aliases: ['p'],
  description: 'Search and play a song or playlist from YouTube, Spotify, SoundCloud, Apple Music, Deezer, or a direct URL.',
  usage: 'play <song name, or a YouTube/Spotify link>',
  execute: async (message, args, client) => {
    if (!args.length) {
      return message.reply({ embeds: [errEmbed(`Usage: \`${client.config.prefix}play <song or URL>\``)] });
    }

    const voiceChannelId = await requireVoice(message, client);
    if (!voiceChannelId) return;

    const query = args.join(' ');
    const isUrl = URL_REGEX.test(query);
    const platform = isUrl ? detectPlatform(query) : null;

    let player = client.lavalink.getPlayer(message.guild.id);
    if (!player) {
      player = client.lavalink.createPlayer({
        guildId: message.guild.id,
        voiceChannelId,
        textChannelId: message.channel.id,
        selfDeaf: true,
        selfMute: false,
        volume: client.config.defaultVolume || 100,
      });
    }
    if (!player.connected) await player.connect();

    const loadingMsg = platform
      ? await message.reply({ embeds: [baseEmbed().setDescription(`${platform.emoji} Loading ${platform.name} link…`)] }).catch(() => null)
      : null;

    let searchResult;
    try {
      // For a pasted link, don't force a search prefix — let Lavalink (and the
      // LavaSrc plugin, for Spotify/Apple Music/Deezer) resolve the URL directly.
      // For plain text, fall back to a YouTube search like before.
      searchResult = isUrl
        ? await player.search({ query }, message.author)
        : await player.search({ query, source: 'ytsearch' }, message.author);
    } catch (err) {
      console.error('[play] search failed:', err);
      const embeds = [errEmbed('Something went wrong resolving that. The Lavalink node may be down — try again in a moment.')];
      return loadingMsg ? loadingMsg.edit({ embeds }) : message.reply({ embeds });
    }

    if (!searchResult || searchResult.loadType === 'error') {
      const embeds = [errEmbed('That link or search couldn\u2019t be loaded (the source may be region-locked, private, or unsupported by the current node).')];
      return loadingMsg ? loadingMsg.edit({ embeds }) : message.reply({ embeds });
    }

    if (searchResult.loadType === 'empty' || !searchResult.tracks?.length) {
      const embeds = [errEmbed('No results found for that query.')];
      return loadingMsg ? loadingMsg.edit({ embeds }) : message.reply({ embeds });
    }

    const label = platform ? `${platform.emoji} ${platform.name}` : null;

    if (searchResult.loadType === 'playlist') {
      player.queue.add(searchResult.tracks);
      const embeds = [
        baseEmbed().setDescription(
          `📃 Queued ${label ? `${label} playlist` : 'playlist'} **${searchResult.playlist?.name || 'Unknown playlist'}** — ${searchResult.tracks.length} tracks.`
        ),
      ];
      await (loadingMsg ? loadingMsg.edit({ embeds }) : message.reply({ embeds }));
    } else {
      const track = searchResult.tracks[0];
      player.queue.add(track);
      const embeds = [
        baseEmbed().setDescription(
          `➕ Queued ${label ? `${label} track ` : ''}**[${track.info.title}](${track.info.uri})**`
        ),
      ];
      await (loadingMsg ? loadingMsg.edit({ embeds }) : message.reply({ embeds }));
    }

    if (!player.playing && !player.paused) await player.play();
  },
};

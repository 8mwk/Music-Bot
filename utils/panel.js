const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} = require('discord.js');

// Matches the reference "Now Playing" panel design: dark flush embed,
// minimal text (title / duration / requested by), thumbnail top-right,
// and a 3x3 grid of plain grey buttons laid out exactly like the
// reference — Prev/Pause/Skip, Stop/Loop/Shuffle, Queue/Vol-/Vol+.
// Every button carries an emoji *and* a label so each one stretches
// wide and the row fills out edge to edge (Discord sizes buttons to
// their content; there's no explicit "full width" property, so a
// label is what makes a button wide).
const PANEL_COLOR = '#1E1F22';

function formatDuration(ms) {
  if (!ms || ms <= 0) return '0s';
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function buildPanelEmbed(player, track) {
  const requesterId = track.requester?.id || track.requester;
  const durationText = track.info.isStream ? 'LIVE' : formatDuration(track.info.duration);

  return new EmbedBuilder()
    .setColor(PANEL_COLOR)
    .setTitle('Now Playing')
    .setDescription(
      [
        `▶️ **${track.info.author || 'Unknown'}** - [${track.info.title}](${track.info.uri})`,
        '',
        `Duration: ${durationText}`,
        `Requested by (${requesterId ? `<@${requesterId}>` : 'Unknown'}!)`,
      ].join('\n')
    )
    .setThumbnail(track.info.artworkUrl || null);
}

function buildPanelButtons(player) {
  const paused = player.paused;

  // 3x3 grid matching the reference panel layout exactly:
  //   Prev   | Pause | Skip
  //   Stop   | Loop  | Shuffle
  //   Queue  | Vol-  | Vol+
  // Every button has both an emoji and a label so each one is wide —
  // Discord sizes buttons to their content, so a label is what stretches
  // a button out to fill more of the row.

  // Row 1: transport controls.
  const row1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('panel:previous').setEmoji('⏮️').setLabel('Prev').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('panel:pauseresume')
      .setEmoji(paused ? '▶️' : '⏸️')
      .setLabel(paused ? 'Resume' : 'Pause')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('panel:skip').setEmoji('⏭️').setLabel('Skip').setStyle(ButtonStyle.Secondary)
  );

  // Row 2: stop + playback modifiers.
  const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('panel:stop').setEmoji('⏹️').setLabel('Stop').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('panel:loop').setEmoji('♾️').setLabel('Loop').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('panel:shuffle').setEmoji('🔀').setLabel('Shuffle').setStyle(ButtonStyle.Secondary)
  );

  // Row 3: queue + volume.
  const row3 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('panel:queuepeek').setEmoji('📋').setLabel('Queue').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('panel:volumedown').setEmoji('🔉').setLabel('Vol -').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('panel:volumeup').setEmoji('🔊').setLabel('Vol +').setStyle(ButtonStyle.Secondary)
  );

  return [row1, row2, row3];
}

function buildPanel(player, track) {
  return {
    embeds: [buildPanelEmbed(player, track)],
    components: buildPanelButtons(player),
  };
}

/**
 * Deletes the previous panel message for a guild (if any) and sends a fresh one,
 * storing the new message reference on client.panels. Called on every trackStart
 * so each new song gets a clean panel instead of a stale edited one.
 */
async function refreshPanel(client, player, track) {
  const channel = client.channels.cache.get(player.textChannelId);
  if (!channel) return;

  const old = client.panels.get(player.guildId);
  if (old) {
    channel.messages.delete(old.messageId).catch(() => {});
    client.panels.delete(player.guildId);
  }

  const sent = await channel.send(buildPanel(player, track)).catch(() => null);
  if (sent) {
    client.panels.set(player.guildId, { messageId: sent.id, channelId: channel.id });
  }
}

/** Edits the existing panel in place, without resending (used outside interaction context). */
async function editPanel(client, player, track) {
  const ref = client.panels.get(player.guildId);
  if (!ref) return false;

  const channel = client.channels.cache.get(ref.channelId);
  if (!channel) return false;

  const msg = await channel.messages.fetch(ref.messageId).catch(() => null);
  if (!msg) {
    client.panels.delete(player.guildId);
    return false;
  }

  await msg.edit(buildPanel(player, track)).catch(() => {});
  return true;
}

module.exports = { buildPanel, refreshPanel, editPanel };

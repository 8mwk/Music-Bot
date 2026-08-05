const { MessageFlags } = require('discord.js');
const { buildPanel } = require('../utils/panel');
const { baseEmbed } = require('../utils/embed');

const EPHEMERAL = { flags: MessageFlags.Ephemeral };

// 10008 = Unknown Message, 10062 = Unknown interaction. Both mean the message/token
// is already gone (e.g. a trackStart or another handler replaced/removed it first) —
// not a real failure, just a race we lost. Safe to swallow.
function isBenignRaceError(err) {
  return err?.code === 10008 || err?.code === 10062;
}

module.exports = {
  name: 'interactionCreate',
  once: false,
  async execute(interaction, client) {
    if (!interaction.isButton()) return;
    if (!interaction.customId.startsWith('panel:')) return;
    if (!interaction.guild) return;

    // Defer FIRST, before any other work — Discord only gives a 3-second
    // window to acknowledge. Doing validation (player lookup, voice channel
    // check) before this was leaving just enough room for slow ticks/host
    // latency to blow the window and throw "Unknown interaction" (10062).
    // Every check below now happens *after* the ack, using followUp instead
    // of reply since the interaction is already deferred.
    try {
      await interaction.deferUpdate();
    } catch (err) {
      if (!isBenignRaceError(err)) {
        console.error('[panel-interaction] deferUpdate failed:', err.message);
      }
      return; // token already expired/invalid — nothing else we can do
    }

    const action = interaction.customId.split(':')[1];
    const player = client.lavalink.getPlayer(interaction.guild.id);

    if (!player) {
      await interaction.followUp({ content: '❌ Nothing is playing right now.', ...EPHEMERAL }).catch(() => {});
      return;
    }

    const memberChannel = interaction.member?.voice?.channel?.id;
    if (!memberChannel || memberChannel !== player.voiceChannelId) {
      await interaction
        .followUp({ content: '❌ You need to be in the same voice channel as me to use these controls.', ...EPHEMERAL })
        .catch(() => {});
      return;
    }

    try {
      switch (action) {
        case 'previous':
          if (!player.queue.previous?.length) {
            await interaction.followUp({ content: '❌ There is no previous track.', ...EPHEMERAL }).catch(() => {});
            return;
          }
          await player.queue.shiftPrevious();
          break;

        case 'pauseresume':
          if (player.paused) await player.resume();
          else await player.pause();
          break;

        case 'skip':
          if (!player.queue.tracks.length && !player.playing) {
            await interaction.followUp({ content: '❌ Nothing to skip.', ...EPHEMERAL }).catch(() => {});
            return;
          }
          await player.skip();
          break;

        case 'volumedown': {
          const MIN_VOLUME = 1;
          const step = 10;
          const next = Math.max(MIN_VOLUME, player.volume - step);
          await player.setVolume(next, true);
          break;
        }

        case 'volumeup': {
          const maxVolume = client.config.maxVolume || 100;
          const step = 10;
          const next = Math.min(maxVolume, player.volume + step);
          await player.setVolume(next, true);
          break;
        }

        case 'queuepeek': {
          const tracks = player.queue.tracks;
          if (!tracks.length) {
            await interaction
              .followUp({ content: '📋 The queue is empty — nothing lined up next.', ...EPHEMERAL })
              .catch(() => {});
            return;
          }

          const perPage = 10;
          const list = tracks
            .slice(0, perPage)
            .map((t, i) => `**${i + 1}.** [${t.info.title}](${t.info.uri}) — \`${client.msToTime(t.info.duration)}\``)
            .join('\n');

          const embed = baseEmbed()
            .setTitle('📋 Up Next')
            .setDescription(list)
            .setFooter({
              text:
                tracks.length > perPage
                  ? `+${tracks.length - perPage} more track(s) — use the queue command to see all`
                  : `${tracks.length} track(s) queued`,
            });

          await interaction.followUp({ embeds: [embed], ...EPHEMERAL }).catch(() => {});
          return;
        }

        case 'stop': {
          const ref = client.panels.get(player.guildId);
          if (ref) client.panels.delete(player.guildId);

          player.queue.tracks.splice(0, player.queue.tracks.length);
          await player.stopPlaying(true, false);

          await interaction
            .editReply({ content: '⏹️ Stopped playback and cleared the queue.', embeds: [], components: [] })
            .catch((err) => {
              if (!isBenignRaceError(err)) console.error('[panel-interaction] stop edit failed:', err);
            });
          return;
        }

        case 'loop': {
          const order = ['off', 'track', 'queue'];
          const next = order[(order.indexOf(player.repeatMode) + 1) % order.length];
          await player.setRepeatMode(next);
          break;
        }

        case 'shuffle':
          if (player.queue.tracks.length < 2) {
            await interaction.followUp({ content: '❌ Not enough tracks to shuffle.', ...EPHEMERAL }).catch(() => {});
            return;
          }
          await player.queue.shuffle();
          break;

        case 'autoplay': {
          const current = player.get('autoplay') || false;
          player.set('autoplay', !current);
          break;
        }

        default:
          await interaction.followUp({ content: '❌ Unknown action.', ...EPHEMERAL }).catch(() => {});
          return;
      }

      if (player.queue.current) {
        await interaction.editReply(buildPanel(player, player.queue.current)).catch((err) => {
          if (!isBenignRaceError(err)) console.error('[panel-interaction] edit failed:', err);
        });
      }
    } catch (err) {
      console.error('[panel-interaction]', err);
      await interaction.followUp({ content: '❌ Something went wrong with that control.', ...EPHEMERAL }).catch(() => {});
    }
  },
};

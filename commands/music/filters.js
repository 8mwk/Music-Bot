const { success, error: errEmbed, baseEmbed } = require('../../utils/embed');
const { requirePlayer } = require('../../utils/musicHelpers');

const PRESETS = ['bassboost', 'nightcore', 'vaporwave', '8d', 'karaoke', 'tremolo', 'vibrato', 'distortion', 'lowpass'];

module.exports = {
  name: 'filters',
  aliases: ['filter', 'fx'],
  description: 'Applies an audio filter preset. Use `reset` to clear all filters.',
  usage: `filters <${PRESETS.join('|')}|reset|list>`,
  execute: async (message, args, client) => {
    const player = await requirePlayer(message, client);
    if (!player) return;

    const choice = (args[0] || '').toLowerCase();

    if (!choice || choice === 'list') {
      return message.reply({
        embeds: [baseEmbed().setDescription(`🎛️ Available filters: \`${PRESETS.join('`, `')}\`, \`reset\``)],
      });
    }

    const fm = player.filterManager;

    try {
      if (choice === 'reset' || choice === 'clear' || choice === 'off') {
        await fm.resetFilters();
        return message.reply({ embeds: [success('All filters cleared.')] });
      }

      if (!PRESETS.includes(choice)) {
        return message.reply({ embeds: [errEmbed(`Unknown filter. Use \`${client.config.prefix}filters list\`.`)] });
      }

      switch (choice) {
        case 'bassboost':
          await fm.toggleEqualizer('bassboost');
          break;
        case 'nightcore':
          await fm.toggleNightcore();
          break;
        case 'vaporwave':
          await fm.toggleVaporwave();
          break;
        case '8d':
          await fm.toggleRotation();
          break;
        case 'karaoke':
          await fm.toggleKaraoke();
          break;
        case 'tremolo':
          await fm.toggleTremolo();
          break;
        case 'vibrato':
          await fm.toggleVibrato();
          break;
        case 'distortion':
          await fm.toggleDistortion();
          break;
        case 'lowpass':
          await fm.toggleLowPass();
          break;
      }

      message.reply({ embeds: [success(`Toggled the **${choice}** filter.`)] });
    } catch (err) {
      console.error('[filters]', err);
      message.reply({
        embeds: [
          errEmbed(
            'Could not apply that filter — this depends on `lavalink-client`\u2019s FilterManager API matching the installed version. Check `lavalink-client` docs for the exact method names if this persists.'
          ),
        ],
      });
    }
  },
};

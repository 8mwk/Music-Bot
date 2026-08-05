require('dotenv').config();
const { Client, GatewayIntentBits, Partials, Collection } = require('discord.js');
const { LavalinkManager } = require('lavalink-client');
const fs = require('fs');
const path = require('path');

const config = require('./config.json');
const loadCommands = require('./utils/loadCommands');
const store = require('./utils/store');
const { isOwner } = require('./utils/permissions');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMembers,
  ],
  partials: [Partials.Channel],
  allowedMentions: { repliedUser: false, parse: ['users'] },
});

client.commands = new Collection();
client.aliases = new Collection();
client.config = config;
client.panels = new Collection(); // guildId -> { messageId, channelId } for the active now-playing panel

// ---------------- Lavalink ----------------
// Node(s) can come from config.json (default) or be overridden with the
// LAVALINK_NODES env var so this bot can point at ANY Lavalink server —
// self-hosted, a different public node, or several for failover — without
// touching tracked config. Format: a JSON array of node objects, e.g.
//   LAVALINK_NODES=[{"id":"main","host":"localhost","port":2333,"authorization":"pass","secure":false}]
function resolveLavalinkNodes() {
  const raw = process.env.LAVALINK_NODES;
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      const valid = Array.isArray(parsed) && parsed.length > 0 && parsed.every((n) => n && n.host && n.port && n.authorization);
      if (valid) return parsed;
      console.warn('[lavalink] LAVALINK_NODES is set but is not a valid non-empty array of {host, port, authorization} — falling back to config.json.');
    } catch (err) {
      console.warn(`[lavalink] LAVALINK_NODES is not valid JSON (${err.message}) — falling back to config.json.`);
    }
  }
  return config.lavalink.nodes;
}

client.lavalink = new LavalinkManager({
  nodes: resolveLavalinkNodes(),
  sendToShard: (guildId, payload) => {
    const guild = client.guilds.cache.get(guildId);
    if (guild) guild.shard.send(payload);
  },
  client: {
    id: config.clientId,
    username: 'MusicBot',
  },
  autoSkip: true,
  playerOptions: {
    defaultSearchPlatform: 'ytsearch',
    volumeDecrementer: 1,
    maxErrorsPerTime: { threshold: 10000, maxAmount: 3 },
    minAutoPlayMs: 10000,
    onDisconnect: { autoReconnect: true, destroyPlayer: false },
    onEmptyQueue: { destroyAfterMs: 30000, autoPlayFunction: null },
  },
  queueOptions: { maxPreviousTracks: 25 },
});

client.on('raw', (d) => client.lavalink.sendRawData(d));

client.lavalink.nodeManager
  .on('connect', (node) => console.log(`[lavalink] Node "${node.id}" connected.`))
  .on('disconnect', (node, reason) =>
    console.warn(`[lavalink] Node "${node.id}" disconnected:`, reason)
  )
  .on('error', (node, error) => console.error(`[lavalink] Node "${node.id}" error:`, error));

// ---------------- Lavalink player events (now playing, queue end, etc.) ----------------
const { baseEmbed } = require('./utils/embed');
const { refreshPanel } = require('./utils/panel');

client.lavalink.on('trackStart', async (player, track) => {
  // Whenever a new track starts (including auto-advancing to the next queued song),
  // delete the old panel message and send a brand new one.
  try {
    await refreshPanel(client, player, track);
  } catch (err) {
    console.error('[trackStart] panel refresh failed:', err);
  }
});

client.lavalink.on('queueEnd', async (player, lastTrack) => {
  try {
    const channel = client.channels.cache.get(player.textChannelId);

    // Self-contained autoplay: search for a related track from the same artist.
    if (player.get('autoplay') && lastTrack?.info?.author) {
      try {
        const result = await player.search(
          { query: `${lastTrack.info.author} ${lastTrack.info.title}`, source: 'ytsearch' },
          lastTrack.requester
        );
        const nextTrack = result?.tracks?.find((t) => t.info.uri !== lastTrack.info.uri);
        if (nextTrack) {
          player.queue.add(nextTrack);
          await player.play();
          if (channel) {
            channel
              .send({ embeds: [baseEmbed().setDescription(`🔁 Autoplay: queued **${nextTrack.info.title}**`)] })
              .catch(() => {});
          }
          return;
        }
      } catch (err) {
        console.error('[autoplay] search failed:', err);
      }
    }

    if (channel) {
      channel
        .send({ embeds: [baseEmbed().setDescription('📭 Queue ended. Add more tracks or I\u2019ll leave soon.')] })
        .catch(() => {});
    }

    // No more tracks — clean up the panel too.
    const oldPanel = client.panels.get(player.guildId);
    if (oldPanel && channel) {
      channel.messages.delete(oldPanel.messageId).catch(() => {});
      client.panels.delete(player.guildId);
    }

    if (!player.get('twentyFourSeven')) {
      setTimeout(() => {
        const p = client.lavalink.getPlayer(player.guildId);
        if (p && !p.playing && !p.queue.tracks.length) p.destroy();
      }, 30000);
    }
  } catch (err) {
    console.error('[queueEnd] handler failed:', err);
  }
});

client.lavalink.on('playerDestroy', (player) => {
  try {
    // Bot left / stopped entirely — remove any leftover panel message.
    const oldPanel = client.panels.get(player.guildId);
    if (oldPanel) {
      const channel = client.channels.cache.get(oldPanel.channelId);
      if (channel) channel.messages.delete(oldPanel.messageId).catch(() => {});
      client.panels.delete(player.guildId);
    }
  } catch (err) {
    console.error('[playerDestroy] handler failed:', err);
  }
});

function msToTime(ms) {
  if (!ms || ms <= 0) return '0:00';
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const pad = (n) => n.toString().padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}
client.msToTime = msToTime;

// ---------------- Load commands & events ----------------
loadCommands(client);

const eventsPath = path.join(__dirname, 'events');
for (const file of fs.readdirSync(eventsPath).filter((f) => f.endsWith('.js'))) {
  const event = require(path.join(eventsPath, file));
  const wrapped = (...args) =>
    Promise.resolve(event.execute(...args, client)).catch((err) =>
      console.error(`[event:${event.name}]`, err)
    );
  if (event.once) {
    client.once(event.name, wrapped);
  } else {
    client.on(event.name, wrapped);
  }
}

// ---------------- Message / command handling ----------------
client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.guild) return;

  const prefix = config.prefix;
  const noPrefixUsers = store.getNoPrefixUsers();
  const hasNoPrefix = noPrefixUsers.includes(message.author.id) || isOwner(message.author.id);

  let usedPrefix = null;
  let content = null;

  if (message.content.startsWith(prefix)) {
    usedPrefix = prefix;
    content = message.content.slice(prefix.length);
  } else if (hasNoPrefix) {
    // No-prefix users can trigger commands without any prefix at all
    content = message.content;
  } else {
    return;
  }

  const args = content.trim().split(/\s+/);
  const cmdName = args.shift()?.toLowerCase();
  if (!cmdName) return;

  const command =
    client.commands.get(cmdName) || client.commands.get(client.aliases.get(cmdName));
  if (!command) return;

  if (command.ownerOnly && !isOwner(message.author.id)) {
    return message.reply({ content: '❌ This command is restricted to bot owners.' });
  }

  try {
    await command.execute(message, args, client);
  } catch (err) {
    console.error(`[command:${command.name}]`, err);
    message.reply('❌ Something went wrong running that command.').catch(() => {});
  }
});

// ---------------- Safety nets ----------------
// discord.js's Client extends EventEmitter — if something ever emits 'error' on it
// with no listener attached, Node throws and kills the whole process by default.
// Logging instead keeps one bad request from taking the bot down.
client.on('error', (err) => console.error('[client error]', err));
client.on('shardError', (err) => console.error('[shard error]', err));
process.on('unhandledRejection', (err) => console.error('[unhandled rejection]', err));

client.login(process.env.DISCORD_TOKEN);

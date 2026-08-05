const os = require('os');
const { baseEmbed } = require('../../utils/embed');
const pkg = require('../../package.json');

// ---------------- formatting helpers ----------------

function formatBytes(bytes) {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${units[i]}`;
}

function formatUptime(seconds) {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const parts = [];
  if (d) parts.push(`${d}d`);
  if (h) parts.push(`${h}h`);
  if (m) parts.push(`${m}m`);
  parts.push(`${s}s`);
  return parts.join(' ');
}

function bar(percent, length = 18) {
  const filled = Math.max(0, Math.min(length, Math.round((percent / 100) * length)));
  return '█'.repeat(filled) + '░'.repeat(length - filled);
}

// Builds an aligned ASCII box (neofetch-style) from [label, value] rows.
function buildPanel(title, rows) {
  const labelWidth = Math.max(...rows.map(([l]) => l.length));
  const valueWidth = Math.max(...rows.map(([, v]) => v.length), title.length);
  const innerWidth = labelWidth + valueWidth + 3; // " : "

  const top = `┌${'─'.repeat(innerWidth + 2)}┐`;
  const bottom = `└${'─'.repeat(innerWidth + 2)}┘`;
  const divider = `├${'─'.repeat(innerWidth + 2)}┤`;

  const titlePad = innerWidth + 2 - title.length;
  const titleLeft = Math.floor(titlePad / 2);
  const titleRight = titlePad - titleLeft;
  const titleLine = `│${' '.repeat(titleLeft)}${title}${' '.repeat(titleRight)}│`;

  const lines = rows.map(
    ([label, value]) => `│ ${label.padEnd(labelWidth)} : ${value.padEnd(valueWidth)} │`
  );

  return [top, titleLine, divider, ...lines, bottom].join('\n');
}

module.exports = {
  name: 'bs',
  aliases: ['botspecs', 'specs', 'hardware'],
  description: "Shows the bot's full hardware specs (CPU, RAM, OS, etc.) in an ASCII panel.",
  execute: async (message, args, client) => {
    const cpus = os.cpus();
    const rawModel = (cpus[0]?.model || 'Unknown CPU').replace(/\s+/g, ' ').trim();
    const cpuModel = rawModel.length > 36 ? `${rawModel.slice(0, 33)}...` : rawModel;
    const cpuSpeed = cpus[0]?.speed ? `${(cpus[0].speed / 1000).toFixed(2)} GHz` : 'Unknown';
    const cores = cpus.length;

    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const memPercent = totalMem ? (usedMem / totalMem) * 100 : 0;

    const procMem = process.memoryUsage();
    const loadAvg = os
      .loadavg()
      .map((n) => n.toFixed(2))
      .join(', ');

    const rows = [
      ['OS', `${os.platform()} ${os.release()}`],
      ['Arch', os.arch()],
      ['CPU', cpuModel],
      ['Clock', cpuSpeed],
      ['Cores', `${cores} threads`],
      ['Load Avg', loadAvg || '0.00, 0.00, 0.00'],
      ['System RAM', `${formatBytes(usedMem)} / ${formatBytes(totalMem)}`],
      ['RAM Usage', `${bar(memPercent)} ${memPercent.toFixed(1)}%`],
      ['Bot RAM (RSS)', formatBytes(procMem.rss)],
      ['Bot Heap', `${formatBytes(procMem.heapUsed)} / ${formatBytes(procMem.heapTotal)}`],
      ['Node.js', process.version],
      ['discord.js', pkg.dependencies['discord.js'] || 'Unknown'],
      ['lavalink-client', pkg.dependencies['lavalink-client'] || 'Unknown'],
      ['Guilds', `${client.guilds.cache.size}`],
      ['WS Ping', `${client.ws.ping}ms`],
      ['Uptime', formatUptime(process.uptime())],
    ];

    const panel = buildPanel(`${client.user.username} — HARDWARE`, rows);

    const embed = baseEmbed()
      .setTitle('🖥️ Bot Specifications')
      .setDescription('```\n' + panel + '\n```')
      .setFooter({ text: `Use ${client.config.prefix}ping for live latency.` });

    message.reply({ embeds: [embed] });
  },
};

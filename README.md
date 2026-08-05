# SIMPLE OPEN SOURCED MUSIC BOT CODE

A feature-packed, **public** Discord music bot: no-prefix system, dynamic owner system,
a live "Now Playing" control panel, a hardware-specs command, and volume up to **10000%**.
No database — everything is stored in flat JSON files under `/data`.
This bot has no invite command/link anywhere — it's meant to run in your own server(s) only.

## Features

- Search & queue from YouTube, Spotify links, SoundCloud, Apple Music, Deezer, or direct URLs
- **Full playlist support** — paste a YouTube or Spotify playlist/album link and every
  track gets queued in one go (resolved via the node's LavaSrc plugin)
- Queue management: shuffle, remove, clear, move, jump, previous, replay, seek
- Loop modes: off / track / queue
- Volume **1–10000** (see note below)
- Audio filters: bassboost, nightcore, vaporwave, 8D, karaoke, tremolo, vibrato, distortion, lowpass
- Autoplay (queues a related track when the queue ends)
- 24/7 mode (stays connected with an empty queue)
- **Now-playing panel** — minimal dark panel (title, track link, duration, requester, thumbnail)
  with a 3x3 grid of wide, equally-sized all-grey icon+label buttons:
  `Prev / Pause / Skip`, `Stop / Loop / Shuffle`, `Queue / Vol- / Vol+`;
  when one track ends and the next starts, the old panel is deleted and a fresh one is sent
- **No-prefix system** — approved users (and owners) can run commands with zero prefix
- **Owner system** — 2 permanent owners set in `config.json`, plus any dynamically added owners (`owner add @user`)
- `!bi` — shows every command, grouped by category, plus the current owner(s)
- `!bs` — shows the bot's live hardware specs (OS, CPU, RAM, Node.js, uptime, etc.) in an ASCII panel
- `!ping` — websocket + Lavalink node latency
- `eval` — owner-only JS evaluation for quick debugging
- Fast command handling — owner/no-prefix lookups are cached in memory at startup instead of
  hitting disk on every message (see "Performance" below)

## Requirements

1. **Node.js 18+**
2. **A running Lavalink server** (v4 — this client also works with NodeLink v3). This bot is the
   "client" — it does not play audio itself; Lavalink handles the actual audio streaming.
   - `config.json` ships pre-configured with three free public nodes (`nyxbot.app` x2,
     `jirayu.net`) listed as failover — if one goes down the client automatically tries the
     next. All of them run the [LavaSrc](https://github.com/topi314/LavaSrc) plugin, which is
     what makes Spotify/Apple Music/Deezer links resolvable, not just YouTube.
   - Free/public nodes can still go down, get rate-limited, or swap passwords without notice
     at any time — that's expected for shared community infrastructure, not a bug in this
     bot. If every configured node is unreachable, swap in a fresh one from the live list at
     lavalink-list.darrennathanael.com.
   - For anything you run long-term, self-host instead:
     https://github.com/lavalink-devs/Lavalink (needs Java 17+), with the LavaSrc plugin
     added to `application.yml` and your own Spotify API `clientId`/`clientSecret` from
     https://developer.spotify.com/dashboard. This is the only way to get guaranteed uptime
     and avoid other people's traffic affecting your bot.
   - You can also point the bot at any node(s) via the `LAVALINK_NODES` env var without
     touching `config.json` at all (see `.env`).

## Setup

```bash
git clone https://github.com/8mwk/Music-Bot.git
cd Music-Bot
npm install
```

Open `.env` and set your bot token:

```
DISCORD_TOKEN=your-bot-token-here
```

Edit `config.json`:
- `clientId` — your bot's application/client ID
- `ownerIds` — **two** permanent owner Discord user IDs, e.g. `["123...", "456..."]`
- `prefix` — command prefix (default `!`)
- `maxVolume` / `defaultVolume` — volume ceiling and startup volume
- `lavalink.nodes` — your Lavalink node's host/port/password (skip this if you're using
  `LAVALINK_NODES` in `.env` instead)

Then run:

```bash
npm start
```

## How to Manually Change the Bot's Activity

The bot's Discord activity/status (the "Playing ..." / "Listening to ..." text under its name)
is set once, right when it logs in, inside **`events/ready.js`**:

```js
client.user.setPresence({
  activities: [{ name: `${client.config.prefix}bi | your music`, type: 2 }],
  status: 'online',
});
```

To change it:

1. Open `events/ready.js`.
2. Edit the `name` field to whatever text you want shown (e.g. `"music for you"`,
   `"!bi | 50 servers"`, etc.). You can reference `client.config.prefix` or any other
   live value (like `client.guilds.cache.size`) inside the template string.
3. Edit the `type` field to pick the activity **verb** shown before the text. Discord only
   supports these numeric types:

   | `type` | Shows as              |
   |--------|------------------------|
   | `0`    | Playing **...**        |
   | `1`    | Streaming **...** *(requires a `url` field pointing to a Twitch/YouTube URL)* |
   | `2`    | Listening to **...**  |
   | `3`    | Watching **...**       |
   | `5`    | Competing in **...**   |

   (`4` — Custom Status — is reserved for user accounts and can't be set by bots.)

4. Optionally change `status` to one of: `'online'`, `'idle'`, `'dnd'` (do not disturb), or
   `'invisible'`.
5. Save the file and **restart the bot** (`npm start`, or restart your process manager —
   PM2, Docker, etc.) for the change to take effect. There's no live-reload; the presence
   is only sent once on login.

Example — make it show **"Watching 12 servers"**:

```js
client.user.setPresence({
  activities: [{ name: `${client.guilds.cache.size} servers`, type: 3 }],
  status: 'online',
});
```

Example — make it show **"Streaming your favorite music"** (streaming requires a URL):

```js
client.user.setPresence({
  activities: [{ name: 'your favorite music', type: 1, url: 'https://twitch.tv/example' }],
  status: 'online',
});
```

> If you'd rather rotate through several activities automatically instead of a single
> fixed one, you can wrap the `setPresence` call in a `setInterval` inside `ready.js` that
> cycles through an array of `{ name, type }` objects — just remember each tick still needs
> `client.user.setPresence(...)` called again to actually update it.

## No-Prefix & Owner System

- Default prefix is `!` (change in `config.json`).
- `ownerIds` in `config.json` holds your **2 permanent owners** — always allowed to use every
  owner-only command and always exempt from needing a prefix.
- Owners can add further dynamic owners at runtime:
  ```
  !owner add @user
  !owner remove @user
  !owner list
  ```
  (The 2 permanent owners from `config.json` can't be removed via command — edit the file instead.)
- To let a regular (non-owner) user use no-prefix too, an owner runs:
  ```
  !noprefix add @user
  !noprefix remove @user
  !noprefix list
  ```

All of this is stored in `/data/noprefix.json` and `/data/owners.json` — plain JSON files,
no database required. Back these up if you redeploy.

## Performance

`messageCreate` fires for every message the bot can see, so the owner/no-prefix lookup on that
hot path is loaded into memory once at startup (`utils/store.js`) instead of reading the JSON
files from disk on every single message. Writes (`owner add`, `noprefix add`, etc.) update the
in-memory cache immediately and save to disk in the background, so commands react instantly.

Button presses on the Now Playing panel also acknowledge Discord **immediately**
(`deferUpdate()` is the very first thing the handler does, before any lookups), so controls
stay responsive even under load or on a slower host.

## Volume up to 10000

The `volume` command (and the panel's Vol+/Vol- buttons) accept up to `maxVolume` in
`config.json` (default **10000**). Important: standard Lavalink server builds cap the
`volume` op at **1000** by default. To actually allow higher values, your Lavalink node's
`application.yml` needs the filters volume option enabled and no additional clamp:

```yaml
lavalink:
  server:
    filters:
      volume: true
```

If you're using a public/shared Lavalink node (like the default nodes above), it's likely
hard-capped by the node owner and values above 1000 may just clamp — that's a server-side
limit, not something this bot can bypass. If you self-host Lavalink, you have full control
over this.

## Command overview

Run `!bi` (or with no prefix if you're an owner) in Discord to see every command live,
grouped by category, along with the current owner(s). Run `!bs` to see the bot's live
hardware specs.

## Notes

- No database is used anywhere — all persistence is flat JSON in `/data`.
- No invite command or invite link exists anywhere in this bot — it's private by design.
- Lavalink filter method names in `commands/music/filters.js` target `lavalink-client`'s
  `FilterManager`. If you upgrade `lavalink-client` and method names change, check that file first.
- Only the Serenetia node is configured by default. If you need failover across multiple
  nodes, add more entries to `lavalink.nodes` in `config.json` or via `LAVALINK_NODES`.


# CLAUDE.md

This guide helps Claude (and other AI assistants) understand the structure and conventions of this Discord bot codebase.

## Project Overview

This is a Discord bot built for bomb.sh (originally forked from Astro's Houston bot) that runs as a Cloudflare Worker. It integrates Discord and GitHub to provide commands for managing pull requests and issues.

**Key Features:**
- `/ptal` command - Create "Please Take a Look" requests for GitHub PRs with embedded status, reviews, and deployment links
- `/issue` command - Issue management functionality
- GitHub webhook integration for automated updates
- Durable Objects for stateful operations
- Real-time PR status tracking (pending, reviewed, approved, merged, closed)

## Tech Stack

- **Runtime**: Cloudflare Workers (serverless edge computing)
- **Language**: TypeScript (with Node.js 22.14.0)
- **Package Manager**: pnpm 10.7.0
- **Router**: itty-router v4
- **Discord**: discord.js v14, discord-api-types, discord-interactions
- **GitHub**: @octokit/rest v20, @octokit/webhooks v13
- **Build Tool**: @bomb.sh/tools (custom build tooling)

## Project Structure

```
discord-bot/
├── src/
│   ├── index.ts                 # Main entry point, router setup, interaction handling
│   ├── types.ts                 # TypeScript interfaces (Command, Env)
│   ├── register.ts              # Command registration script
│   ├── discordClient.ts         # Discord interaction client wrapper
│   ├── durableObject.ts         # Cloudflare Durable Object implementation
│   ├── commands/
│   │   ├── index.ts            # Command registry/exports
│   │   ├── ptal.ts             # /ptal command implementation
│   │   └── issue.ts            # /issue command implementation
│   ├── webhooks/
│   │   └── github.ts           # GitHub webhook handler
│   └── utils/
│       ├── discordUtils.ts     # Discord utility functions
│       ├── helpers.ts          # General helper functions
│       └── embeds.ts           # Discord embed builders
├── wrangler.toml                # Cloudflare Workers configuration
├── tsconfig.json                # TypeScript configuration
├── package.json                 # Dependencies and scripts
└── .dev.vars.example            # Environment variables template
```

## Key Files

### `src/index.ts`
Main application entry point. Sets up itty-router with the following routes:
- `GET /` - Health check endpoint
- `POST /` - Discord interactions endpoint (handles commands, autocomplete, buttons)
- `ALL /webhooks/github` - GitHub webhook events

Exports the Cloudflare Worker's `fetch` handler and the `DiscordBotDurableObject`.

### `src/types.ts`
Core TypeScript interfaces:
- `Command` - Interface for Discord slash commands (data, execute, initialize, autocomplete, button)
- `Env` - Environment variables interface (Discord tokens, GitHub token, Guild ID)

### `src/commands/ptal.ts`
The most complex command. Implements `/ptal` for pull request reviews:
- Fetches PR data from GitHub API
- Displays PR status, reviews, changeset info
- Supports deployment and additional links
- Includes refresh button for updating status
- Color-codes embeds based on PR state

### `src/discordClient.ts`
Wrapper around Discord interactions providing helper methods for:
- Deferred replies
- Message updates
- Interaction responses

### Command Structure
All commands follow this pattern:
```typescript
interface Command {
  data: SlashCommandBuilder
  initialize?(env: Env): boolean | Promise<boolean>
  execute(client: InteractionClient): Response
  autocomplete?(client: InteractionClient): Response
  button?(client: InteractionClient): Response
}
```

## Environment Variables

Required environment variables (see `.dev.vars.example`):

```
DISCORD_TOKEN          # Bot token from Discord Developer Portal
DISCORD_CLIENT_ID      # Application ID
DISCORD_PUBLIC_KEY     # Public key for signature verification
GITHUB_APP_ID          # GitHub App ID (if using GitHub App)
GITHUB_CLIENT_ID       # GitHub OAuth client ID
GITHUB_CLIENT_SECRET   # GitHub OAuth client secret
GITHUB_WEBHOOK_SECRET  # Secret for verifying GitHub webhooks
GITHUB_TOKEN           # GitHub personal access token (for API calls)
GUILD_ID               # Discord server ID (optional, for guild commands)
```

## Development Workflow

### Local Development Setup

1. **Clone and install**:
   ```bash
   git clone <repo-url>
   pnpm install
   ```

2. **Configure environment**:
   - Copy `.dev.vars.example` to `.dev.vars`
   - Fill in Discord and GitHub credentials

3. **Register commands** (required after command changes):
   ```bash
   pnpm register
   ```

4. **Start local server**:
   ```bash
   pnpm dev
   ```

5. **Expose locally** (required for Discord interactions):
   - Use ngrok, cloudflare tunnel, or similar
   - Set the public URL as "INTERACTIONS ENDPOINT URL" in Discord Developer Portal

### Available Scripts

- `pnpm start` / `pnpm dev` - Start Wrangler dev server
- `pnpm build` - Build the project using @bomb.sh/tools
- `pnpm format` - Format code
- `pnpm lint` - Lint code
- `pnpm register` - Register Discord slash commands

## Guidelines for Claude

### When Adding New Commands

1. Create a new file in `src/commands/` (e.g., `newcommand.ts`)
2. Follow the `Command` interface pattern from `src/types.ts`
3. Use `SlashCommandBuilder` from `@discordjs/builders` for command definition
4. Add the command to `src/commands/index.ts` exports
5. Run `pnpm register` to register with Discord
6. Handle errors gracefully and provide user feedback

### Code Style Conventions

- Use TypeScript with strict typing
- Prefer async/await over promises
- Use `biome` for linting (configured via @bomb.sh/tools)
- Follow existing patterns for Discord interactions
- Include error handling for API calls (GitHub, Discord)
- Use `InteractionClient` wrapper instead of raw API calls

### Common Patterns

**Getting command options**:
```typescript
const value = getStringOption(client.interaction.data, 'option_name')
```

**Deferred replies** (for long operations):
```typescript
return client.deferReply({}, async () => {
  // Perform long operation
  await rest.patch(Routes.webhookMessage(...), { body: reply })
  return true
})
```

**Error handling**:
```typescript
try {
  // GitHub API call
} catch (error) {
  if (error instanceof RequestError && error.status != 404) {
    console.error(error)
  }
  await ReplyOrEditReply(interaction, { content: 'Error message' }, env)
  return null
}
```

**Creating embeds**:
```typescript
const embed = getDefaultEmbed()
embed.setTitle('Title')
embed.addFields({ name: 'Field', value: 'Value' })
embed.setColor(0x3498db)
```

### Testing Changes

1. **Local testing**: Use `pnpm dev` and expose via tunnel
2. **Command testing**: Use Discord client to invoke commands
3. **GitHub webhooks**: Use GitHub's webhook delivery UI to redeliver events
4. **Deployment**: Deploy via GitHub Actions (`.github/workflows/deploy.yml`)

### Important Notes

- **Cloudflare Workers limitations**: No filesystem access, limited execution time (30s on free plan)
- **Durable Objects**: Used for stateful operations (see `src/durableObject.ts`)
- **Discord interactions**: Must respond within 3 seconds or use deferred replies
- **GitHub API**: Uses Octokit for API calls, requires GITHUB_TOKEN
- **Button interactions**: Custom IDs use format `{command}-{action}` (e.g., `ptal-refresh`)

### Security Considerations

- All Discord interactions are verified using `verifyDiscordRequest()`
- GitHub webhooks are verified using `GITHUB_WEBHOOK_SECRET`
- Secrets are stored in Cloudflare Workers secrets (not in code)
- No sensitive data should be logged

## Deployment

The bot deploys to Cloudflare Workers via GitHub Actions:
- Workflow: `.github/workflows/deploy.yml`
- Domain: `discord-bot.bomb.sh`
- Account ID: `6eababa1621550fb2dbc673005c5ac89` (in `wrangler.toml`)

## Common Tasks

### Adding a new slash command
1. Create `src/commands/mycommand.ts`
2. Implement the `Command` interface
3. Export from `src/commands/index.ts`
4. Run `pnpm register`

### Adding a button to a command
1. Add button to components in command's execute method
2. Set `custom_id` as `{command}-{action}`
3. Implement `button()` method in the command

### Adding GitHub webhook handling
- Edit `src/webhooks/github.ts`
- Use `@octokit/webhooks` for type-safe event handling

### Debugging
- Check Cloudflare Workers logs via Wrangler dashboard
- Use `console.log()` / `console.error()` (appears in Wrangler logs)
- Test locally with `pnpm dev` before deploying

## Resources

- [Discord Developer Portal](https://discord.com/developers/applications)
- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Discord.js Guide](https://discordjs.guide/)
- [Octokit REST API](https://octokit.github.io/rest.js/)
- [itty-router Docs](https://itty-router.dev/)

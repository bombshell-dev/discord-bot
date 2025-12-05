import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v10';
import { Webhooks } from '@octokit/webhooks';
import { Octokit } from '@octokit/rest';
import type { Env } from '../types.ts';
import type { PTALMessageMapping } from '../durableObject.ts';

/**
 * Update a Discord PTAL message with fresh PR data
 */
async function updatePTALMessage(
    mapping: PTALMessageMapping,
    env: Env
): Promise<void> {
    try {
        const rest = new REST({ version: '10' }).setToken(env.DISCORD_TOKEN);

        // Dynamically import the PTAL command to reuse embed generation logic
        const { generateEmbedForPR } = await import('../commands/ptal.ts');

        const updatedEmbed = await generateEmbedForPR(
            mapping.githubUrl,
            env,
            mapping.deploymentUrl,
            mapping.otherUrls,
            mapping.emoji
        );

        if (!updatedEmbed) {
            console.error('Failed to generate updated embed');
            return;
        }

        // Update the Discord message
        await rest.patch(Routes.channelMessage(mapping.channelId, mapping.messageId), {
            body: {
                content: updatedEmbed.content,
                embeds: updatedEmbed.embeds,
                components: updatedEmbed.components,
            },
        });

        console.log(`Successfully updated PTAL message ${mapping.messageId}`);
    } catch (error) {
        console.error('Failed to update PTAL message:', error);
        throw error;
    }
}

/**
 * Handle pull request events from GitHub webhooks
 */
async function handlePullRequestChange(
    owner: string,
    repo: string,
    prNumber: number,
    env: Env
): Promise<void> {
    try {
        // Get Durable Object instance
        const durableObjectId = env.DISCORD_BOT_DURABLE_OBJECT.idFromName('ptal-storage');
        const durableObject = env.DISCORD_BOT_DURABLE_OBJECT.get(durableObjectId);

        // Get all PTAL messages for this PR
        const mappings = await durableObject.getPTALs(owner, repo, prNumber);

        if (mappings.length === 0) {
            console.log(`No PTAL messages found for ${owner}/${repo}#${prNumber}`);
            return;
        }

        // Update all PTAL messages for this PR
        for (const mapping of mappings) {
            try {
                await updatePTALMessage(mapping, env);
            } catch (error) {
                console.error(`Failed to update message ${mapping.messageId}:`, error);
                // Continue with other messages even if one fails
            }
        }
    } catch (error) {
        console.error('Error handling pull request change:', error);
    }
}

/**
 * Main webhook handler for GitHub events
 */
export default async function github(
    request: Request,
    env: Env,
    ctx: ExecutionContext
): Promise<Response> {
    try {
        const signature = request.headers.get('x-hub-signature-256');
        if (!signature) {
            return Response.json({ error: 'Missing signature' }, { status: 401 });
        }

        const body = await request.text();

        // Verify webhook signature
        const webhooks = new Webhooks({
            secret: env.GITHUB_WEBHOOK_SECRET,
        });

        if (!(await webhooks.verify(body, signature))) {
            return Response.json({ error: 'Invalid signature' }, { status: 401 });
        }

        // Parse webhook event
        const event = request.headers.get('x-github-event');
        const payload = JSON.parse(body);

        console.log(`Received GitHub webhook: ${event}`);

        // Handle pull request events
        if (event === 'pull_request' || event === 'pull_request_review') {
            const owner = payload.repository.owner.login;
            const repo = payload.repository.name;
            const prNumber = payload.pull_request.number;

            // Queue the update to avoid blocking the webhook response
            ctx.waitUntil(handlePullRequestChange(owner, repo, prNumber, env));

            return Response.json({ success: true, message: 'Webhook received' });
        }

        return Response.json({ success: true, message: 'Event ignored' });
    } catch (error) {
        console.error('Webhook handler error:', error);
        return Response.json({ error: 'Internal server error' }, { status: 500 });
    }
}

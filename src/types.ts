import type { SlashCommandBuilder } from "@discordjs/builders"
import type { APIApplicationCommandAutocompleteInteraction, APIApplicationCommandInteractionData, APIMessageComponentInteractionData, InteractionType } from "discord-api-types/v10"
import type { InteractionClient } from "./discordClient.ts"

export interface Command {
    data: Omit<SlashCommandBuilder, "addSubcommand" | "addSubcommandGroup">,
    initialize?(env?: Env): boolean | Promise<boolean>,
    execute(client: InteractionClient<InteractionType.ApplicationCommand, APIApplicationCommandInteractionData>): Response,
    autocomplete?(client: InteractionClient<InteractionType.ApplicationCommandAutocomplete, APIApplicationCommandAutocompleteInteraction>): Response;
    button?(client: InteractionClient<InteractionType.MessageComponent, APIMessageComponentInteractionData>): Response;
}

export interface Env {
    DISCORD_TOKEN: string;
    DISCORD_PUBLIC_KEY: string;
    DISCORD_CLIENT_ID: string;
    GITHUB_TOKEN?: string;
    GUILD_ID?: string;
}

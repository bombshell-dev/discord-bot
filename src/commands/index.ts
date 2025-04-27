import type { Command } from '../types.ts';
import { default as IssueCommand } from './issue.ts';
import { default as PTALCommand } from './ptal.ts';

export const commands: Record<string, Command> = {
	issue: IssueCommand,
	ptal: PTALCommand,
};

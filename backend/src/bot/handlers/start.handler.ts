import type { BotContext } from '../middlewares/auth.middleware.js';
import { showMenu } from '../menu/menu.js';

export async function startHandler(ctx: BotContext): Promise<void> {
  const user = ctx.dbUser;
  if (!user) {
    await ctx.reply('Error: User not found');
    return;
  }

  // Show main menu
  await showMenu(ctx, 'main');
}

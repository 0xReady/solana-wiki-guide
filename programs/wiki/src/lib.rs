use anchor_lang::prelude::*;

declare_id!("Crbep497SUcRA8sDcMmCmrpu8kF1t2q1UrBhB3StFf2S");

#[program]
pub mod wiki {
    use super::*;

    pub fn create_user(ctx: Context<CreateUser>, name: String) -> Result<()> {
        let user = &mut ctx.accounts.user;
        user.name = name;
        user.authority = ctx.accounts.authority.key();
        Ok(())
    }

    pub fn upsert_article(ctx: Context<UpsertArticle>, title: String, body: String) -> Result<()> {
        let article = &mut ctx.accounts.article;
        article.title = title;
        article.body = body;
        article.last_edited_user_key = ctx.accounts.user.key();
        Ok(())
    }
}

#[account]
#[derive(Default)]
pub struct User {
    name: String,
    authority: Pubkey,
}

#[account]
#[derive(Default)]
pub struct Article {
    title: String,
    body: String,
    last_edited_user_key: Pubkey,
}

#[derive(Accounts)]
pub struct CreateUser<'info> {
    #[account(init, payer = authority, space = 8 + 1024 + 32)]
    pub user: Account<'info, User>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>
}

#[derive(Accounts)]
pub struct UpsertArticle<'info> {
    #[account(init_if_needed, payer = authority, space = 8 + 1024 + 2048 + 32)]
    pub article: Account<'info, Article>,
    #[account(has_one = authority)]
    pub user: Account<'info, User>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>
}

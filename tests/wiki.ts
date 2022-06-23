import * as anchor from '@project-serum/anchor';
import { Program } from '@project-serum/anchor';
import { expect } from 'chai';
import { Wiki } from '../target/types/wiki';

describe('wiki', () => {
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.Wiki as Program<Wiki>;

  let userKeypair: anchor.web3.Keypair;
  let articleKeypair: anchor.web3.Keypair;
  const selfWallet = (program.provider as anchor.AnchorProvider).wallet;

  it('Create user', async () => {
    userKeypair = anchor.web3.Keypair.generate();
    const userName = 'sam';
    await program.methods
      .createUser(userName)
      .accounts({
        user: userKeypair.publicKey,
        authority: selfWallet.publicKey,
      })
      .signers([userKeypair])
      .rpc();

    const user = await program.account.user.fetch(userKeypair.publicKey);
    expect(user.authority.equals(selfWallet.publicKey));
    expect(user.name === userName);
  });

  it('Create Article', async () => {
    articleKeypair = anchor.web3.Keypair.generate();
    const title = 'History of Solana';
    const body = 'Was created by Anatoly Yakovenko';
    await program.methods
      .upsertArticle(title, body)
      .accounts({
        article: articleKeypair.publicKey,
        user: userKeypair.publicKey,
        authority: selfWallet.publicKey,
      })
      .signers([articleKeypair])
      .rpc();

    const article = await program.account.article.fetch(
      articleKeypair.publicKey
    );
    expect(article.title === title);
    expect(article.body === body);
    expect(article.lastEditedUserKey.equals(selfWallet.publicKey));
  });

  it('Edit Article', async () => {
    const title = 'History of Solano';
    const body = 'Anatoooolly Yakoveenkooo';
    await program.methods
      .upsertArticle(title, body)
      .accounts({
        article: articleKeypair.publicKey,
        user: userKeypair.publicKey,
        authority: selfWallet.publicKey,
      })
      .signers([articleKeypair])
      .rpc();

    const article = await program.account.article.fetch(
      articleKeypair.publicKey
    );
    expect(article.title === title);
    expect(article.body === body);
    expect(article.lastEditedUserKey.equals(selfWallet.publicKey));
  });

  // it('Delete Article', async () => {
  //   await program.methods
  //     .deleteArticle()
  //     .accounts({
  //       article: articleKeypair.publicKey,
  //       user: userKeypair.publicKey,
  //       authority: selfWallet.publicKey,
  //     })
  //     .signers([])
  //     .rpc();

  //   const article = await program.account.article.fetchNullable(
  //     articleKeypair.publicKey
  //   );
  //   expect(article === null);
  // });
});

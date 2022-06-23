import { useEffect, useMemo, useState } from 'react';
import * as anchor from '@project-serum/anchor';
import wikiIdl from './idl/wiki.json';
import {
  ConnectionProvider,
  useAnchorWallet,
  useConnection,
  useWallet,
  WalletProvider,
} from '@solana/wallet-adapter-react';
import {
  WalletModalProvider,
  WalletMultiButton,
} from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';
import 'bootstrap/dist/css/bootstrap.min.css';
require('./App.css');
require('@solana/wallet-adapter-react-ui/styles.css');

const endpoint = 'http://127.0.0.1:8899';
const programId = new anchor.web3.PublicKey(wikiIdl.metadata.address);

function App() {
  const wallets = [new PhantomWalletAdapter()];
  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets}>
        <WalletModalProvider>
          <InnerApp />
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}

function InnerApp() {
  const { connection } = useConnection();
  const { publicKey, sendTransaction, connected } = useWallet();
  const wallet = useAnchorWallet();
  const [users, setUsers] = useState<any[]>([]);
  const [articles, setArticles] = useState<any[]>([]);
  const [userName, setUserName] = useState('');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [posting, setPosting] = useState(false);
  const [signingIn, setSigningIn] = useState(false);
  const selfUser = users.find(
    (user) => !!publicKey && user.account.authority.equals(publicKey)
  );
  const loggedIn = !!selfUser;

  const program = useMemo(() => {
    if (!wallet) return null;
    const provider = new anchor.AnchorProvider(connection, wallet, {});
    const program = new anchor.Program<any>(
      wikiIdl as any,
      programId,
      provider
    );
    return program;
  }, [wallet, publicKey]);

  useEffect(() => {
    const loadData = async () => {
      if (!program) return;
      setUsers(await program.account.user.all());
      setArticles(await program.account.article.all());
    };

    // poll the chain every second for updated data
    // NOT reccomended in a production environment
    const interval = setInterval(loadData, 1000);
    return () => {
      clearInterval(interval);
    };
  }, [program]);

  const createUser = async () => {
    if (!program || !publicKey) return;
    const userKeypair = anchor.web3.Keypair.generate();
    const tx = await program.methods
      .createUser(userName)
      .accounts({
        user: userKeypair.publicKey,
        authority: publicKey,
      })
      .transaction();
    setSigningIn(true);
    await sendTransaction(tx, connection, {
      signers: [userKeypair],
    });
    setSigningIn(false);
    setUserName('');
  };

  const createArticle = async () => {
    if (!program || !publicKey) return;
    setPosting(true);
    const articleKeypair = anchor.web3.Keypair.generate();
    const tx = await program.methods
      .upsertArticle(title, body)
      .accounts({
        user: selfUser.publicKey,
        article: articleKeypair.publicKey,
        authority: publicKey,
      })
      .transaction();
    await sendTransaction(tx, connection, {
      signers: [articleKeypair],
    });
    setPosting(false);
    setTitle('');
    setBody('');
  };

  return (
    <div className='app'>
      <div className='content'>
        <div className='head'>
          <h1>Solana Wiki</h1>
          <div className='head-buttons'>
            <WalletMultiButton />
            {connected && !loggedIn && (
              <>
                <input
                  className='input head-input'
                  placeholder='Your Name'
                  value={userName}
                  onChange={(e) => {
                    setUserName(e.target.value);
                  }}
                />
                <button
                  disabled={!userName || signingIn}
                  onClick={createUser}
                  className='button'
                >
                  Sign In
                </button>
              </>
            )}
            {loggedIn && (
              <h4 className='welcome'>Welcome, {selfUser.account.name}</h4>
            )}
          </div>
        </div>
        {loggedIn && (
          <div className='article'>
            <input
              className='input'
              placeholder='Title'
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
              }}
            />
            <textarea
              className='input input-area'
              placeholder='Body'
              value={body}
              onChange={(e) => {
                setBody(e.target.value);
              }}
            />
            <button
              disabled={!title || !body || posting}
              className='button'
              onClick={createArticle}
            >
              {posting ? 'Posting...' : 'Post'}
            </button>
          </div>
        )}
        {articles
          .sort((a, b) => (a.account.title < b.account.title ? -1 : 1))
          .map((article) => {
            const editor = users.find(
              (user) =>
                user.publicKey.toString() ===
                article.account.lastEditedUserKey.toString()
            )!;
            return (
              <div className='article'>
                <h3>{article.account.title}</h3>
                <p>{article.account.body}</p>
                <p className='edited'>Edited by {editor.account.name}</p>
              </div>
            );
          })}
      </div>
    </div>
  );
}

export default App;

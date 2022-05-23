import './App.css';
import { useState } from 'react';
import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js';
import {
  Program, AnchorProvider, web3
} from '@project-serum/anchor';
import idl from './idl.json';

import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';
import { useWallet, WalletProvider, ConnectionProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider, WalletMultiButton } from '@solana/wallet-adapter-react-ui';
require('@solana/wallet-adapter-react-ui/styles.css');

const wallets = [
  /* view list of available wallets at https://github.com/solana-labs/wallet-adapter#wallets */
  new PhantomWalletAdapter()
]

const network = clusterApiUrl('devnet');

const { SystemProgram, Keypair } = web3;
/* create an account  */
const blogAccount = Keypair.generate();
const opts = {
  preflightCommitment: "processed"
}
const programID = new PublicKey(idl.metadata.address);

function App() {
  const [latestPost, setLatestPost] = useState('');
  const [authority, setAuthority] = useState('');
  const [input, setInput] = useState('');
  const wallet = useWallet();

  async function getProvider() {
    /* create the provider and return it to the caller */
    /* network set to local network for now */
    const connection = new Connection(network, opts.preflightCommitment);

    const provider = new AnchorProvider(
      connection, wallet, opts.preflightCommitment,
    );
    return provider;
  }

  async function initialize() {
    const provider = await getProvider()
    /* create the program interface combining the idl, program ID, and provider */
    const program = new Program(idl, programID, provider);
    try {
      /* interact with the program via rpc */
      await program.methods.initialize()
        .accounts({
          blogAccount: blogAccount.publicKey,
          authority: provider.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([blogAccount])
        .rpc();

      const account = await program.account.blogAccount.fetch(blogAccount.publicKey);
      console.log('authority: ', account.authority.toBase58());
      setAuthority(account.authority.toBase58());
    } catch (err) {
      console.log("Transaction error: ", err);
    }
  }

  async function makePost() {
    const provider = await getProvider();
    const program = new Program(idl, programID, provider);
    await program.methods.makePost(Buffer.from(input))
      .accounts({
        blogAccount: blogAccount.publicKey,
        authority: provider.wallet.publicKey,
      })
      .rpc();

    const account = await program.account.blogAccount.fetch(blogAccount.publicKey);
    console.log('account: ', account.latestPost.toString());
    setLatestPost(account.latestPost.toString());
    setInput('');
  }

  if (!wallet.connected) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '100px' }}>
        <WalletMultiButton />
      </div>
    )
  } else {
    return (
      <div className="App">
        <div>
          {
            !authority && (<button onClick={initialize}>Initialize</button>)
          }

          {
            authority ? (
              <div>
                <h2>Current post: {latestPost}</h2>
                <input
                  placeholder="Make latest post"
                  onChange={e => setInput(e.target.value)}
                  value={input}
                />
                <button onClick={makePost}>Make Post</button>
              </div>
            ) : (
              <h3>Please Inialize.</h3>
            )
          }
        </div>
      </div>
    );
  }
}

const AppWithProvider = () => (
  <ConnectionProvider endpoint={network}>
    <WalletProvider wallets={wallets} autoConnect>
      <WalletModalProvider>
        <App />
      </WalletModalProvider>
    </WalletProvider>
  </ConnectionProvider>
)

export default AppWithProvider; 
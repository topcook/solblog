const assert = require('assert');
const anchor = require("@project-serum/anchor");
const { SystemProgram } = anchor.web3;

describe("solblog", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.Solblog;

  it("Is initializes the account", async () => {
    const blogAccount = anchor.web3.Keypair.generate();

    console.log("blogAccount1:  ", blogAccount.publicKey.toBase58())
    await program.methods.initialize()
    .accounts({
      blogAccount: blogAccount.publicKey,
      authority: provider.wallet.publicKey,
      systemProgram: SystemProgram.programId,
    })
    .signers([blogAccount])
    .rpc();

    const account = await program.account.blogAccount.fetch(blogAccount.publicKey);
    _blogAccount = blogAccount;
  });

  it('Updates a previously created blog', async () => {
    const blogAccount = _blogAccount;
    await program.methods.makePost(Buffer.from('Some new data'))
    .accounts({
      blogAccount: blogAccount.publicKey,
      authority: provider.wallet.publicKey,
    })
    .rpc();

    const account = await program.account.blogAccount.fetch(blogAccount.publicKey);
    console.log("Update data: ", account.latestPost.toString());
    assert.ok(account.latestPost.toString() === Buffer.from('Some new data').toString())
  });
});


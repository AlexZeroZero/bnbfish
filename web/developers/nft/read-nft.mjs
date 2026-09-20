// Node.js 20+; install: npm install ethers@6
// Run: node read-nft.mjs 18
// Read-only: no wallet, private key or transaction is required.
import { JsonRpcProvider, Contract } from 'ethers';
const tokenId = process.argv[2] || '18';
if (!/^[1-9][0-9]{0,6}$/.test(tokenId) || BigInt(tokenId)>2000000n) throw Error('Invalid token ID');
const rpc = new JsonRpcProvider('https://bsc-rpc.publicnode.com', undefined, { batchMaxCount: 1 });
try {
  if ((await rpc.getNetwork()).chainId !== 56n) throw Error('Wrong chain');
  const nft = new Contract('0x60011EaC38503af422d0B9AFeC214a18aD99c11f', [
    'function tokenURI(uint256) view returns (string)',
    'function ownerOf(uint256) view returns (address)'
  ], rpc);
  const blockTag = await rpc.getBlockNumber();
  const uri = await nft.tokenURI(tokenId, { blockTag });
  const prefix = 'data:application/json;base64,';
  if (!uri.startsWith(prefix)) throw Error('Unexpected metadata format');
  const metadata = JSON.parse(Buffer.from(uri.slice(prefix.length), 'base64').toString('utf8'));
  console.log(JSON.stringify({chainId:56, tokenId, blockNumber:blockTag,
    owner:await nft.ownerOf(tokenId,{blockTag}), metadata}, null, 2));
} catch (error) {
  console.error(error.shortMessage || error.message);
  process.exitCode = 1;
} finally { rpc.destroy(); }

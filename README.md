# 🏞️ MetaLand Deeds: Secure NFT Ownership for Metaverse Land

Welcome to MetaLand Deeds, a Web3 project that revolutionizes digital land ownership in metaverse platforms! In today's metaverses, land parcels are often tied to centralized platforms, risking loss if the platform fails or changes policies. This project solves that real-world problem by using blockchain-based NFT deeds on the Stacks network, enabling secure, decentralized, and tradable ownership of virtual land. Creators and users can mint NFTs representing land parcels, trade them peer-to-peer, rent them out, and even participate in governance—ensuring interoperability across metaverses and true ownership permanence.

Built with Clarity smart contracts on Stacks, this system leverages Bitcoin's security for immutable deeds while allowing seamless integration with various metaverse ecosystems.

## ✨ Features

🌐 Mint customizable NFT deeds for digital land parcels with metadata (e.g., coordinates, size, attributes)  
🔄 Secure peer-to-peer trading with built-in escrow for fraud prevention  
🏠 Rental mechanisms to generate passive income from unused land  
🗳️ DAO governance for community decisions on land standards and upgrades  
📈 Staking for land owners to earn rewards and boost deed value  
🔒 Oracle integration for verifying off-chain metaverse data (e.g., land usage)  
🚫 Anti-fraud checks to prevent duplicate or invalid land claims  
📊 Marketplace for listing, bidding, and auctioning deeds  
🔑 Multi-signature approvals for high-value transactions  
🌟 Interoperability hooks for bridging deeds to other blockchains

## 🛠 How It Works

This project consists of 8 interconnected Clarity smart contracts, each handling a specific aspect of the system for modularity and security. Deploy them on the Stacks testnet or mainnet, and interact via the Stacks wallet or custom dApp frontend.

### Core Contracts Overview

1. **NFT-Deed.clar**: The base NFT contract for minting and managing land deeds as non-fungible tokens. Uses SIP-009 standard for compatibility.  
   - Functions: `mint-deed` (creates a new NFT with land metadata), `transfer-deed` (transfers ownership).  

2. **Land-Registry.clar**: Registers unique land parcels to prevent duplicates, storing details like metaverse ID, coordinates, and hash.  
   - Functions: `register-land` (adds a new parcel), `verify-land` (checks if land is already claimed).  

3. **Marketplace.clar**: Handles listing, buying, and selling of NFT deeds with royalty support for original minters.  
   - Functions: `list-deed` (posts a deed for sale), `buy-deed` (executes purchase with STX or token payment).  

4. **Escrow.clar**: Secure escrow for trades, holding funds/NFTs until both parties confirm.  
   - Functions: `create-escrow` (initiates a trade), `release-escrow` (completes on approval).  

5. **Rental.clar**: Enables temporary renting of land deeds, with time-bound access rights.  
   - Functions: `rent-deed` (sets up a rental agreement), `claim-rent` (transfers rental fees to owner).  

6. **Governance.clar**: DAO contract for voting on protocol changes, using staked tokens for weighted votes.  
   - Functions: `propose-vote` (submits a proposal), `vote-on-proposal` (casts a vote).  

7. **Staking.clar**: Allows owners to stake their deeds or utility tokens for rewards (e.g., governance tokens).  
   - Functions: `stake-deed` (locks a deed for rewards), `unstake-deed` (withdraws with accrued benefits).  

8. **Oracle.clar**: Fetches and verifies external data (e.g., metaverse land status) via trusted oracles.  
   - Functions: `submit-oracle-data` (updates data), `query-oracle` (retrieves verified info).  

### For Land Owners/Creators

- Connect your Stacks wallet and generate a unique hash for your metaverse land parcel (e.g., via SHA-256 of coordinates + attributes).  
- Call `register-land` in Land-Registry.clar to claim it.  
- Mint your NFT deed using `mint-deed` in NFT-Deed.clar, providing metadata like title, description, and visuals.  
- List it on the marketplace or stake it for rewards.  

Boom! Your digital land is now a secure, tradable NFT asset.

### For Buyers/Renters

- Browse listings via `get-listed-deeds` in Marketplace.clar.  
- Initiate a purchase with `buy-deed` or rent with `rent-deed`.  
- Use `verify-ownership` in NFT-Deed.clar to confirm deed authenticity anytime.  

### For Verifiers/Community

- Query deed details with `get-deed-metadata` in NFT-Deed.clar.  
- Participate in governance by staking and voting to evolve the protocol.  

That's it! Secure, decentralized metaverse land ownership at your fingertips. Deploy the contracts, build a frontend, and start trading virtual real estate today!
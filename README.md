# Flappy Haunt 🎃

A Halloween-themed Flappy Bird clone built with [Dojo Engine](https://book.dojoengine.org/) on Starknet.

**Migrated from**: [flapi repository](https://github.com/Talent-Index/flapi) (Vanilla JS + Dojo Toolkit AMD)  
**Migration docs**: See [MIGRATION-WINDSURF.md](./MIGRATION-WINDSURF.md)

---

## Game Features

### Gameplay
- **Jack o' Lantern Player**: Glowing pumpkin with triangular eyes and jagged grin
- **Glowing Toxic Tombstones**: Lime green obstacles with animated acid drips
- **Lives System**: Start with 1 life, collect pulsing hearts every 7 obstacles
- **Lava Floor**: Touch it and burn to a char with flames and smoke
- **Progressive Difficulty**: Pipe gaps shrink over time
- **Physics**: Gravity 650, Jump -320 (identical to original game)

### Visual Effects
- Dark purple night sky with twinkling stars
- Moon with dripping green toxic goo
- Purple fog layers
- Glowing red lava floor with bubbling hot pools
- Burning death animation with charring effect

### Audio (Web Audio API)
- Flap sound (whoosh)
- Death sound (dramatic descending tone)
- Burn sound (fire crackling)
- Heart collect (triumphant bells)

### Controls
- **Space / Up Arrow** - Flap
- **Click / Tap** - Flap
- **P** - Pause
- **R** - Restart

### Blockchain Features
- **High Score Submission**: Save verified scores to Starknet
- **Leaderboard**: Track best scores per wallet address
- **Stats**: Games played counter
- **Cartridge Controller**: Seamless wallet integration

---

## Quick Start

### Prerequisites

```bash
# Install Dojo toolchain
curl -L https://install.dojoengine.org | bash
dojoup

# Install pnpm (if not installed)
curl -fsSL https://get.pnpm.io/install.sh | sh -

# Verify installation
node --version  # Should be v20+ or v22+
pnpm --version  # Should be 10+
sozo --version  # Should be 1.8.0+
```

### 1. Deploy Contracts (Optional - for blockchain features)

```bash
cd contracts
scarb run dev
```

This starts:
- **Katana** (local Starknet node) on `http://localhost:5050`
- **Torii** (indexer) on `http://localhost:8080`
- Auto-deploys all contracts including Flappy Haunt actions

**Note**: You can play the game without this step - it will run in offline mode.

### 2. Run Client

In a new terminal:

```bash
cd client
pnpm install  # First time only
pnpm run dev
```

Game opens at: **https://localhost:3000**

> ⚠️ **HTTPS required** for Cartridge Controller wallet integration

---

## How to Play

### Starting the Game

1. Open https://localhost:3000 in your browser
2. Click **"Play"** button or press **Space**
3. Control the Jack o' Lantern pumpkin to avoid tombstones
4. Collect hearts to gain extra lives
5. Avoid the lava floor at the bottom

### Submitting High Scores (Blockchain Mode)

1. Click **"Connect Wallet"** in the HUD
2. Connect via Cartridge Controller (Argent, Braavos, or Cartridge Wallet)
3. Play and achieve a score >= 5
4. On game over, click **"Submit Score 🏆"**
5. Your score is written to Starknet!

### Offline Mode

If you don't start Katana (contracts not deployed):
- Game works perfectly without blockchain
- Scores saved to localStorage only
- "Submit Score" button won't appear

---

## Project Structure

```
dojo-intro/
├── client/               # Frontend (Vite + Vanilla JS)
│   ├── index.html       # Main HTML (game UI)
│   ├── flappyHaunt.js   # Game engine (510 lines)
│   ├── player.js        # Player class
│   ├── config.js        # Game constants
│   ├── style.css        # Halloween styling
│   ├── controller.js    # Cartridge Controller setup
│   └── package.json     # Dependencies
├── contracts/           # Cairo smart contracts
│   ├── src/
│   │   ├── models_flappy.cairo        # Game data models
│   │   └── systems/flappy_actions.cairo  # Score submission
│   ├── Scarb.toml       # Contract config
│   └── dojo_dev.toml    # Dojo world config
├── MIGRATION-WINDSURF.md  # Complete migration documentation
└── README.md            # This file
```

---

## Smart Contract Interface

### Models

```cairo
// High score for each game session
#[dojo::model]
pub struct HighScore {
    #[key]
    pub player: ContractAddress,
    pub score: u32,
    pub timestamp: u64,
}

// Leaderboard entry per player
#[dojo::model]
pub struct LeaderboardEntry {
    #[key]
    pub player: ContractAddress,
    pub best_score: u32,
    pub games_played: u32,
}
```

### Actions

```cairo
#[starknet::interface]
pub trait IFlappyActions<T> {
    fn submit_score(ref self: T, score: u32);
}
```

**Behavior**:
- Records current game score with timestamp
- Updates best score if current score is higher
- Increments games_played counter

---

## Development

### Build Contracts

```bash
cd contracts
scarb build
```

### Run Tests (Future Enhancement)

```bash
cd contracts
scarb test
```

### Format Code

```bash
cd client
pnpm run format
```

### Production Build

```bash
cd client
pnpm run build
```

Outputs to `client/dist/` - deploy to any static host (Netlify, Vercel, Cloudflare Pages).

---

## Architecture

### Hybrid Approach

**Client-Side (JavaScript)**:
- 60 FPS game loop (physics, rendering, audio)
- Canvas 2D for procedural graphics
- Web Audio API for sound effects
- localStorage for offline scores

**On-Chain (Cairo/Dojo)**:
- High score verification
- Global leaderboard
- Player statistics
- Persistent across wallets

This ensures real-time gameplay while leveraging blockchain for verifiable achievements.

---

## Troubleshooting

### "Module not found" errors
```bash
cd client
pnpm install
```

### Contracts won't compile
```bash
cd contracts
scarb clean
scarb build
```

### Wallet won't connect
- Ensure client running on HTTPS (`https://localhost:3000`)
- Ensure Katana running (`scarb run dev` in contracts/)
- Try Chrome browser (best Cartridge Controller support)

### Game won't start
- Check browser console for errors
- Hard refresh (Cmd+Shift+R / Ctrl+Shift+R)
- Clear browser cache

---

## Deployment

### Testnet (Starknet Sepolia)

1. Update `contracts/dojo_dev.toml` with Sepolia RPC
2. Get Sepolia ETH from faucet
3. Deploy: `sozo migrate --network sepolia`
4. Update `client/controller.js` with deployed addresses
5. Deploy client to Netlify/Vercel

### Mainnet (Future)

- Same process as testnet
- Update RPC to Starknet mainnet
- Ensure thorough security audit first

---

## Contributing

This project is a migration showcase. For improvements:

1. Fork the repository
2. Create feature branch
3. Make changes (preserve gameplay feel!)
4. Test thoroughly
5. Submit PR

---

## Credits

**Original Game**: Flappy Haunt (flapi repository)  
**Migrated by**: AI-assisted migration to Dojo Engine  
**Framework**: [Dojo Engine](https://dojoengine.org/) v1.7.2  
**Wallet**: [Cartridge Controller](https://docs.cartridge.gg/)  

---

## License

MIT

---

## Resources

- **Dojo Book**: https://book.dojoengine.org/
- **Cartridge Docs**: https://docs.cartridge.gg/
- **Starknet**: https://starknet.io/
- **Migration Guide**: [MIGRATION-WINDSURF.md](./MIGRATION-WINDSURF.md)

---

**Happy Haunting! 🎃👻**

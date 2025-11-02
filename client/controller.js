/**
 * Setups controller options for Flappy Haunt:
 * https://docs.cartridge.gg/controller/getting-started
 */
import manifest from '../contracts/manifest_dev.json' assert { type: 'json' };

const actionsContract = manifest.contracts.find((contract) => contract.tag === 'fh-actions');

const controllerOpts = {
  chains: [{ rpcUrl: 'http://localhost:5050' }],
  // "KATANA"
  defaultChainId: '0x4b4154414e41',
  policies: actionsContract ? {
    contracts: {
      [actionsContract.address]: {
        name: 'Flappy Haunt Actions',
        description: 'Submit high scores to the blockchain',
        methods: [
          {
            name: 'Submit Score',
            entrypoint: 'submit_score',
            description: 'Submit your high score',
          },
        ],
      },
    },
  } : {},
};

export default controllerOpts;

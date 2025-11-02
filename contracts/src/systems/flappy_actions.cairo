use starknet::ContractAddress;

#[starknet::interface]
pub trait IFlappyActions<T> {
    fn submit_score(ref self: T, score: u32);
}

#[dojo::contract]
pub mod flappy_actions {
    use super::IFlappyActions;
    use crate::models_flappy::{HighScore, LeaderboardEntry};
    use dojo::model::ModelStorage;

    #[abi(embed_v0)]
    impl FlappyActionsImpl of IFlappyActions<ContractState> {
        fn submit_score(ref self: ContractState, score: u32) {
            let mut world = self.world_default();
            let player = starknet::get_caller_address();
            let timestamp = starknet::get_block_timestamp();

            // Save this game's score
            let high_score = HighScore {
                player,
                score,
                timestamp,
            };
            world.write_model(@high_score);

            // Update leaderboard entry
            let mut leaderboard: LeaderboardEntry = world.read_model(player);
            
            // Update best score if this is higher
            if score > leaderboard.best_score {
                leaderboard.best_score = score;
            }
            
            leaderboard.games_played += 1;
            world.write_model(@leaderboard);
        }
    }

    #[generate_trait]
    impl InternalImpl of InternalTrait {
        fn world_default(self: @ContractState) -> dojo::world::WorldStorage {
            self.world(@"fh")
        }
    }
}

use starknet::ContractAddress;

// High score model
#[derive(Copy, Drop, Serde)]
#[dojo::model]
pub struct HighScore {
    #[key]
    pub player: ContractAddress,
    pub score: u32,
    pub timestamp: u64,
}

// Global leaderboard entry
#[derive(Copy, Drop, Serde)]
#[dojo::model]
pub struct LeaderboardEntry {
    #[key]
    pub player: ContractAddress,
    pub best_score: u32,
    pub games_played: u32,
}

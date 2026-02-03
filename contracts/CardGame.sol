// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract CardGame {
    struct Card {
        uint attack;
    }
    
    struct Player {
        uint[] deck;
        uint team; // 1 or 2
        bool hasJoined;
    }

    // Config
    mapping(uint => Card) public cards;
    uint public constant MAX_HP = 100;
    uint256 public constant ENTRY_FEE = 0.0067 ether; 
    
    // State
    uint public gameId; 
    mapping(uint => address) public redPlayer;
    mapping(uint => address) public bluePlayer;
    mapping(uint => mapping(address => Player)) public players; 

    mapping(uint => uint) public teamHP;   
    mapping(uint => uint) public teamCards; 

    // Betting
    mapping(uint => uint256) public gamePrizePool;      
    
    uint public currentTeamTurn; 
    bool public gameActive;
    uint public winnerTeam;

    event GameStarted(uint gameId);
    event PlayerJoined(uint gameId, address player, uint team);
    event CardPlayed(address player, uint team, uint cardId, uint damage);
    event GameEnded(uint winningTeam, uint256 totalPrize);
    event PayoutSent(address player, uint256 amount);
    event GameCompleted(
        uint256 gameId,
        address winner,
        uint256 totalPool,
        uint256 fee,
        uint256 payout,
        uint256 timestamp
    );

    address public PLATFORM_TREASURY;

    constructor(address _treasury) {
        PLATFORM_TREASURY = _treasury;
        cards[0] = Card(5);
        cards[1] = Card(8);
        cards[2] = Card(3);
        cards[3] = Card(12);
        cards[4] = Card(6);
        gameId = 1; 
    }

    function joinGame() public payable {
        require(!gameActive, "Game already started! No late joiners.");
        require(msg.value == ENTRY_FEE, "Entry Fee is 0.0067 QUAI");
        require(!players[gameId][msg.sender].hasJoined, "Already joined this game");
        require(winnerTeam == 0, "Game finished. Reset to play.");

        uint team;
        if (redPlayer[gameId] == address(0)) {
            team = 1;
            redPlayer[gameId] = msg.sender;
        } else if (bluePlayer[gameId] == address(0)) {
            team = 2;
            bluePlayer[gameId] = msg.sender;
        } else {
            revert("Game is full - only 2 players allowed");
        }

        players[gameId][msg.sender] = Player({
            deck: new uint[](0), // Empty deck initially
            team: team,
            hasJoined: true
        });

        // Add to Pot
        gamePrizePool[gameId] += msg.value;

        emit PlayerJoined(gameId, msg.sender, team);
    }

    // Start the game - requires exactly 2 players
    function startGame() public {
        require(!gameActive, "Game already active");
        require(redPlayer[gameId] != address(0) && bluePlayer[gameId] != address(0), "Need exactly 2 players to start");
        
        // Deal 5 cards to each player
        _dealCards(redPlayer[gameId], 5);
        _dealCards(bluePlayer[gameId], 5);

        teamHP[gameId * 2 + 1] = MAX_HP; // Red team HP
        teamHP[gameId * 2 + 2] = MAX_HP; // Blue team HP
        teamCards[gameId * 2 + 1] = 5;
        teamCards[gameId * 2 + 2] = 5;
        currentTeamTurn = 1; 
        gameActive = true;
        winnerTeam = 0;

        emit GameStarted(gameId);
    }

    function _dealCards(address player, uint count) internal {
        uint[] memory newDeck = new uint[](count);
        uint256 seed = uint256(keccak256(abi.encodePacked(block.timestamp, player, block.number, gameId)));
        for (uint i = 0; i < count; i++) {
            newDeck[i] = uint256(keccak256(abi.encodePacked(seed, i))) % 5;
        }
        players[gameId][player].deck = newDeck;
    }

    function resetGame() public {
        gameId++; 
        
        // Clear players
        redPlayer[gameId - 1] = address(0);
        bluePlayer[gameId - 1] = address(0);
        
        gameActive = false;
        teamHP[gameId * 2 - 1] = 0;
        teamHP[gameId * 2] = 0;
        teamCards[gameId * 2 - 1] = 0;
        teamCards[gameId * 2] = 0;
        winnerTeam = 0;
        currentTeamTurn = 1;
    }

    function getMyDeck() public view returns (uint[] memory) {
        return players[gameId][msg.sender].deck;
    }
        require(gameActive, "Game not active");
        Player storage p = players[gameId][msg.sender];
        require(p.hasJoined, "Not joined");
        require(p.team == currentTeamTurn, "Not your team's turn");
        require(index < p.deck.length, "Invalid card index");

        uint cardId = p.deck[index];
        uint damage = cards[cardId].attack;

        uint opponentTeam = (p.team == 1) ? 2 : 1;
        if (teamHP[opponentTeam] <= damage) {
            teamHP[opponentTeam] = 0;
            finishGame(p.team, msg.sender);
            return;
        } else {
            teamHP[opponentTeam] -= damage;
        }

        emit CardPlayed(msg.sender, p.team, cardId, damage);

        p.deck[index] = p.deck[p.deck.length - 1];
        p.deck.pop();
        teamCards[p.team]--; 

        if (teamCards[opponentTeam] == 0) {
            if (teamCards[p.team] > 0) {
                finishGame(p.team, msg.sender);
                return;
            } else {
                if (teamHP[p.team] >= teamHP[opponentTeam]) {
                    finishGame(p.team, msg.sender); 
                } else {
                    finishGame(opponentTeam, msg.sender); 
                }
                return;
            }
        }

        currentTeamTurn = opponentTeam;
    }
    
    function finishGame(uint winner, address winnerAddress) internal {
        gameActive = false;
        winnerTeam = winner;
        
        uint256 totalPool = gamePrizePool[gameId];
        if (totalPool > 0 && winnerAddress != address(0)) {
            uint256 fee = (totalPool * 3) / 100;
            uint256 payout = totalPool - fee;
            payable(winnerAddress).transfer(payout);
            emit PayoutSent(winnerAddress, payout);
            payable(PLATFORM_TREASURY).transfer(fee);
            emit PayoutSent(PLATFORM_TREASURY, fee);
        }

        emit GameEnded(winner, totalPool);
        emit GameCompleted(gameId, winnerAddress, totalPool, (totalPool * 3) / 100, totalPool - ((totalPool * 3) / 100), block.timestamp);
    }

    function getMyDeck() public view returns (uint[] memory) {
        return players[gameId][msg.sender].deck;
    }

    function getGameState() public view returns (
        bool active,
        uint turn,
        uint winner,
        uint hp1,
        uint hp2,
        uint count1,
        uint count2,
        uint cards1,
        uint cards2,
        uint currentGameId,
        uint256 prizePool 
    ) {
        uint c1 = redPlayer[gameId] != address(0) ? 1 : 0;
        uint c2 = bluePlayer[gameId] != address(0) ? 1 : 0;
        return (
            gameActive,
            currentTeamTurn,
            winnerTeam,
            teamHP[1],
            teamHP[2],
            c1,
            c2,
            teamCards[1],
            teamCards[2],
            gameId,
            gamePrizePool[gameId]
        );
    }
}

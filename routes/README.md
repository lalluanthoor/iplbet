# APIs

## Admin APIs

### Enable Transfers
- **HTTP Method**: POST
- **Endpoint**: ``` /apis/admin/enable-transfer ```
- **Authorization**: Admin
- **Return Value**:
  > **success**: "Transfers enabled."
### Disable Transfers
- **HTTP Method**: POST
- **Endpoint**: ``` /apis/admin/disable-transfer ```
- **Authorization**: Admin
- **Return Value**:
  > **success**: "Transfers disabled."
### Is Transfer Allowed
- **HTTP Method**: GET
- **Endpoint**: ``` /apis/transfer-allowed ```
- **Authorization**: Active User
- **Return Value**:
  > **success**: true

## User APIs

### List of all users
- **HTTP Method**: GET
- **Endpoint**: ``` /apis/user/all ```
- **Authorization**: Admin
- **Return Value**:
  > **success**: [ { id, name, email, photoURL, admin, suspended, activateCode, balance } ... ]
### List of active users
- **HTTP Method**: GET
- **Endpoint**: ``` /apis/user/active ```
- **Authorization**: Admin
- **Return Value**:
  > **success**: [ { id, name, email, photoURL, admin, suspended, activateCode, balance } ... ]
### Get balance of last ':days' days on per day basis
- **HTTP Method**: GET
- **Endpoint**: ``` /apis/user/balance/:days ```
- **Authorization**: User
- **Parameters**:
  > **:days** - *Number of days*
- **Return Value**:
  > **success**: { x: [array of dates], y: [array of moneyInHand] }
### Activate User
- **HTTP Method**: GET
- **Endpoint**: ``` /apis/user/activate/:user/:code ```
- **Authorization**: None
- **Parameters**:
  > **:user** - *userId* <br>
  > **:code** - *activationCode*
- **Return Value**:
  > **success**: "User Activated"
### Activate User
- **HTTP Method**: POST
- **Endpoint**: ``` /apis/user/activate ```
- **Authorization**: Admin
- **Parameters**:
  > { userId }
- **Return Value**:
  > **success**: "User Activated"
### Deactivate User
- **HTTP Method**: POST
- **Endpoint**: ``` /apis/user/deactivate ```
- **Authorization**: Admin
- **Parameters**:
  > { userId }
- **Return Value**:
  > **success**: "User Deactivated"
### Leaderboard [Top 3 players]
- **HTTP Method**: GET
- **Endpoint**: ``` /apis/user/leaderboard ```
- **Authorization**: None
- **Return Value**:
  > **success**: [ { name: ... }, ... ]

## Team APIs

### List of all teams
- **HTTP Method**: GET
- **Endpoint**: ``` /apis/team/all ```
- **Authorization**: None
- **Return Value**:
  > **success**: [ { id, name, positionLastYear, titles, shortName, captain } ... ]
### List of teams involved in a match
- **HTTP Method**: GET
- **Endpoint**: ``` /apis/team/match/:matchId ```
- **Authorization**: None
- **Parameters**:
  > **:matchId** - *id of the match*
- **Return Value**:
  > **success**: [ { id, name } ... ]

## Player APIs

### List of all players
- **HTTP Method**: GET
- **Endpoint**: ``` /apis/player/all ```
- **Authorization**: None
- **Return Value**:
  > **success**: [ { id, name, team } ... ]
### List of players in a team
- **HTTP Method**: GET
- **Endpoint**: ``` /apis/player/team/:team ```
- **Authorization**: None
- **Parameters**:
  > **:team** - *short name of the team (in caps)*
- **Return Value**:
  > **success**: [ { id, name, team } ... ]
### List of players in a match
- **HTTP Method**: GET
- **Endpoint**: ``` /apis/player/match/:matchId ```
- **Authorization**: None
- **Parameters**:
  > **:matchId** - *id of the match*
- **Return Value**:
  > **success**: [ { id, name, team } ... ]

## Match APIs

### List of all matches
- **HTTP Method**: GET
- **Endpoint**: ``` /apis/match/all ```
- **Authorization**: None
- **Return Value**:
  > **success**: [ { id, home: { name, shortName }, away: { name, shortName }, fixture, result: { won, by } } ... ]
### List of undeclared matches
- **HTTP Method**: GET
- **Endpoint**: ``` /apis/match/undeclared ```
- **Authorization**: None
- **Return Value**:
  > **success**: [ { id, home: { name, shortName }, away: { name, shortName }, fixture, result: { won, by } } ... ]

## Pot APIs

### List of all pots
- **HTTP Method**: GET
- **Endpoint**: ``` /apis/pot/all ```
- **Authorization**: None
- **Return Value**:
  > **success**: [ { id, displayName, openTime, closeTime, isTeamLevel, multiplierHome, multiplierAway, result, match } ... ]
### List of open pots (open for betting)
- **HTTP Method**: GET
- **Endpoint**: ``` /apis/pot/open ```
- **Authorization**: None
- **Return Value**:
  > **success**: [ { id, displayName, openTime, closeTime, isTeamLevel, multiplierHome, multiplierAway, result, match } ... ]
### List of closed pots
- **HTTP Method**: GET
- **Endpoint**: ``` /apis/pot/closed ```
- **Authorization**: None
- **Return Value**:
  > **success**: [ { id, displayName, openTime, closeTime, isTeamLevel, multiplierHome, multiplierAway, result, match } ... ]
### List of all long-term pots
- **HTTP Method**: GET
- **Endpoint**: ``` /apis/pot/long-term ```
- **Authorization**: None
- **Return Value**:
  > **success**: [ { id, displayName, openTime, closeTime, isTeamLevel, multiplierHome, multiplierAway, result, match } ... ]
### List of all pots for a match
- **HTTP Method**: GET
- **Endpoint**: ``` /apis/pot/match/:matchId ```
- **Authorization**: None
- **Parameters**:
  > **:matchId** - *id of the match*
- **Return Value**:
  > **success**: [ { id, displayName, openTime, closeTime, isTeamLevel, multiplierHome, multiplierAway, result, match } ... ]
### List of all static pots for a match
- **HTTP Method**: GET
- **Endpoint**: ``` /apis/pot/static/:matchId ```
- **Authorization**: Admin
- **Parameters**:
  > **:matchId** - *id of the match*
- **Return Value**:
  > **success**: { active: [ displayName ], inactive: [ displayName ] }
### List of all open pots with total amount on both teams of the match
- **HTTP Method**: GET
- **Endpoint**: ``` /apis/pot/open/teams ```
- **Authorization**: Admin
- **Return Value**:
  > **success**: { potId, potName, home, homeShort, away, awayShort, matchId, teams: { 'teamShortName': 'totalAmount' } }
### List of all open pots with total amount on all players of the match
- **HTTP Method**: GET
- **Endpoint**: ``` /apis/pot/open/players ```
- **Authorization**: Admin
- **Return Value**:
  > **success**: { potId, potName, home, homeShort, away, awayShort, matchId, players: { 'playerName': 'totalAmount' } }
### Add new pot
- **HTTP Method**: POST
- **Endpoint**: ``` /apis/pot/add/short-term ```
- **Authorization**: Admin
- **Parameters**:
  > { match, openTime, closeTime, pots: { potId: { home, away }, ... }, static: [] }
- **Return Value**:
  > **success**: New [ &lt;potCount&gt; ] Pot/s added successfully
### Update pot winner
- **HTTP Method**: POST
- **Endpoint**: ``` /apis/pot/update-winner ```
- **Authorization**: Admin
- **Parameters**:
  > { potId: [ result, ... ], ... }
- **Return Value**:
  > **success**: Pot results updated successfully.
### Update long-term pot
- **HTTP Method**: POST
- **Endpoint**: ``` /apis/pot/update/long-term ```
- **Authorization**: Admin
- **Parameters**:
  > { potId: { openTime, closeTime, multiplier }, ... }
- **Return Value**:
  > **success**: Long-Term Pots updated successfully


## Bet APIs

### List of all bets
- **HTTP Method**: GET
- **Endpoint**: ``` /apis/bet/all ```
- **Authorization**: Admin
- **Return Value**:
  > **success**: [ { username, potName, betOn, betIcon, betAmount, betDate, result, balance }, ... ]
### List of all bets for a pot
- **HTTP Method**: GET
- **Endpoint**: ``` /apis/bet/pot/:potId ```
- **Authorization**: Admin
- **Parameters**:
  > **:potId** - *id of the pot*
- **Return Value**:
  > **success**: [ { username, potName, betOn, betIcon, betAmount, betDate, result, balance }, ... ]
### List of all bets placed by session user
- **HTTP Method**: GET
- **Endpoint**: ``` /apis/bet/user ```
- **Authorization**: User
- **Return Value**:
  > **success**: [ { potName, betOn, betIcon, betAmount, betDate, result }, ... ]
### Place a new bets on pots (for a match)
- **HTTP Method**: POST
- **Endpoint**: ``` /apis/bet/place/:matchId ```
- **Authorization**: Active User
- **Parameters**:
  > **:matchId** - *id of the match*
  > { potId: { betOn, betAmount }, ... }
- **Return Value**:
  > **success**: New [ &lt;betCount&gt; ] Bet/s placed successfully
### Place a new bets on long-term pots
- **HTTP Method**: POST
- **Endpoint**: ``` /apis/bet/place ```
- **Authorization**: Active User
- **Parameters**:
  > { potId: { betOn, betAmount }, ... }
- **Return Value**:
  > **success**: New [ &lt;betCount&gt; ] Bet/s placed successfully [Timed out pots, if any]

## Transaction Related APIs

### Update all players' balance by an amount (BONUS)
- **HTTP Method**: POST
- **Endpoint**: ``` /apis/balance/update/all ```
- **Authorization**: Admin
- **Parameters**:
  > { amount }
- **Return Value**:
  > **success**: "BONUS [ &lt;amount&gt; ] given to all active users."
### Update single player's balance by an amount
- **HTTP Method**: POST
- **Endpoint**: ``` /apis/balance/update/user ```
- **Authorization**: Admin
- **Parameters**:
  > { user, amount }
- **Return Value**:
  > **success**: "BONUS [ &lt;amount&gt; ] given to user [ &lt;user&quot;s name&gt; ]."
### Transfer funds
- **HTTP Method**: POST
- **Endpoint**: ``` /apis/balance/transfer ```
- **Authorization**: Active User
- **Parameters**:
  > { to, amount }
- **Return Value**:
  > **success**: "TRANSFER [ &lt;amount&gt; ] to user [ &lt;user&quot;s name&gt; ] successful."


## IPL 2018 APIs

### Group Standings of the teams
- **HTTP Method**: GET
- **Endpoint**: ``` /ipl/standings ```
- **Authorization**: None
### List of players in descending order of Most Runs Scored
- **HTTP Method**: GET
- **Endpoint**: ``` /ipl/most-runs ```
- **Authorization**: None
### List of players in descending order of Most Sixes
- **HTTP Method**: GET
- **Endpoint**: ``` /ipl/most-sixes ```
- **Authorization**: None
### List of players in descending order of Highest Scores
- **HTTP Method**: GET
- **Endpoint**: ``` /ipl/highest-scores ```
- **Authorization**: None
### List of players for Best Batting Strike Rate
- **HTTP Method**: GET
- **Endpoint**: ``` /ipl/best-batting-strike-rate ```
- **Authorization**: None
### List of players in descending order of Wickets taken
- **HTTP Method**: GET
- **Endpoint**: ``` /ipl/most-wickets ```
- **Authorization**: None
### List of players for Best Bowling Innings
- **HTTP Method**: GET
- **Endpoint**: ``` /ipl/best-bowling-innings ```
- **Authorization**: None
### List of players for Best Bowling Average
- **HTTP Method**: GET
- **Endpoint**: ``` /ipl/best-bowling-average ```
- **Authorization**: None
### List of players for Best Bowling Economy
- **HTTP Method**: GET
- **Endpoint**: ``` /ipl/best-bowling-economy ```
- **Authorization**: None
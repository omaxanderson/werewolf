import React from 'react';
import ReactDOM from 'react-dom';
import {
  Modal,
} from '@omaxwellanderson/react-components';
import { IAllTimeResults, PlayerGameStat } from './Interfaces';
import style from './Leaderboard.scss';
import characters, { Team } from './Characters';
import moment = require('moment');
require('@omaxwellanderson/react-components/dist/main.css');

class Leaderboard extends React.Component<{}, {
  stats: IAllTimeResults,
  details: {
    name: string;
    games: PlayerGameStat[];
    wins: number;
  };
}> {
  constructor(props) {
    super(props);
    this.state = {
      stats: null,
      details: null,
    };
  }

  componentDidMount() {
    // fetch that shit
    fetch('/api/leaderboard')
      .then(res => res.json())
      .then(json => {
        console.log('json', json);
        this.setState({
          stats: json,
        });
      })
  }

  getLeaders = () => {
    const { stats: statsAsObject } = this.state;
    if (statsAsObject) {
      // put them into an array for easier sorting
      const stats = Object.entries(statsAsObject.playerStats)
        .reduce((acc, [name, games]) => {
          const wins =
            acc.push({
              name,
              wins: games.filter(g => g.win).length,
              games,
            });
          return acc;
        }, []);
      const topThree = stats.sort((a, b) => {
        return b.wins - a.wins;
      });
      return topThree;
    }
  };

  render() {
    const leaders = this.getLeaders();
    const { details } = this.state;
    console.log(leaders);
    console.log(
      'heyooo',
      leaders && leaders[0].games.filter(g => g.character.team === Team.VILLAGER),
      leaders && leaders[0].games.filter(g => [Team.WEREWOLF, Team.WEREWOLF_ALLY].includes(g.character.team))
  );
    return (
      <>
        <Modal
          isOpen={Boolean(details)}
          header={`Stats: ${details?.name}`}
          footerActions={[
            {
              type: 'secondary',
              label: 'Close',
              onClick: () => this.setState({ details: null }),
            }
          ]}
        >
          <div className={style.Leaderboard__Details}>
          { details && (
            <>
              <div>
                Overall Wins:
                {' '}
                {details.wins}
              </div>
              <div>
                Number of games on team Werewolf:
                {' '}
                {details.games.filter(g =>
                  [Team.WEREWOLF_ALLY, Team.WEREWOLF]
                    .includes(g.character.team)).length
                }
              </div>
              <div>
                Number of games on team Villager:
                {' '}
                {details.games.filter(g =>
                  [Team.VILLAGER]
                    .includes(g.character.team)).length
                }
              </div>
              <div>Game details</div>
              {details.games
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map(game => (
                <>
                  <hr />
                  <div>
                    {moment(game.date).format('MMM Do, YYYY | h:mma')}
                  </div>
                  <div>Started as: {game.startingCharacter.name}</div>
                  <div>Ended as: {game.character.name}</div>
                  <div
                    style={{ color: game.win ? 'green' : 'red'}}
                  >
                    {game.win ? 'Win' : 'Loss'}
                  </div>
                </>
              ))}
              {characters.map(character => !character.key.endsWith('_2') ?
                <>
                  <h5>{character.name}</h5>
                  <div>{details.games.filter(g => g.character.name === character.name).length} games ended as</div>
                  <div>{details.games.filter(g => g.character.name === character.name && g.win).length} games won as</div>
                  <div>{details.games.filter(g => g.startingCharacter.name === character.name).length} games started as</div>
                </>
                : null
              )}
            </>
          )}
          </div>
        </Modal>
        <h3 className={style['Leaderboard--header']}>Leaderboard</h3>
        <div className={style.container}>
          <table>
            <thead>
            <tr>
              <th>Name</th>
              <th>Wins</th>
              <th>Games</th>
              <th>Win Rate</th>
              <th>Werewolf Record</th>
              <th>Villager Record</th>
              <th>Vote Accuracy</th>
              {/* characters.map(c => <th>{c.name}</th>) */}
            </tr>
            </thead>
            <tbody>
            {leaders?.map(l => {
              const gamesAsWerewolf = l.games.filter(g =>
                [Team.WEREWOLF_ALLY, Team.WEREWOLF].includes(g.character.team)).length;
              const gamesAsVillager = l.games.filter(g => [Team.VILLAGER].includes(g.character.team)).length;
              const totalGames = l.games.length;
              const villagerWins = l.games.filter(g => [Team.VILLAGER].includes(g.character.team) && g.win).length;
              const villagerLosses = l.games.filter(g => [Team.VILLAGER].includes(g.character.team) && !g.win).length;
              const werewolfWins = l.games.filter(g =>
                [Team.WEREWOLF_ALLY, Team.WEREWOLF].includes(g.character.team) && g.win).length;
              const werewolfLosses = l.games.filter(g =>
                [Team.WEREWOLF_ALLY, Team.WEREWOLF].includes(g.character.team) && !g.win).length;
              const votedForWerewolf = l.games
                .filter(g => g.character.team === Team.VILLAGER && g.votedForWerewolf).length;
              return (
                <tr
                  key={l.name}
                  onClick={() => this.setState({ details: l })}
                >
                  <td>{l.name}</td>
                  <td>{l.wins}</td>
                  <td>{totalGames}</td>
                  <td>{(l.wins / totalGames * 100).toFixed(0)}%</td>
                  <td>
                    {werewolfWins}
                    -
                    {werewolfLosses}
                  </td>
                  <td>
                    {villagerWins}
                    -
                    {villagerLosses}
                  </td>
                  <td>
                    {(votedForWerewolf / gamesAsVillager * 100).toFixed(0)}%
                    {' '}
                    ({votedForWerewolf}
                    {' / '}
                    {gamesAsVillager})
                  </td>
                  {/* characters.map(c => <td>{l.games.filter(g => g.character.name === c.name).length}</td>) */}
                </tr>
              )
            })}
            </tbody>
          </table>
        </div>
      </>
    );
  }
}

ReactDOM.render(
  <Leaderboard />,
  document.getElementById('root'),
);

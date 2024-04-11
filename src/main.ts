import './style.css';
import Game from './Game/Game';
import { Leaderboard } from './Leaderboard/Leaderboard';
import pjson from '../package.json';

Game.init();
new Leaderboard(
    document.querySelector('.scoreboard--container')!,
    document.querySelector('.scoreboard--toggle')!
);

document.querySelector<HTMLDivElement>('.version')!.textContent = pjson.version;

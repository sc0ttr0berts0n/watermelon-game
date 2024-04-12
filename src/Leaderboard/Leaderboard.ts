import { createClient } from '@sanity/client';
import pjson from '../../package.json';
import LocalStorageController from '../Utils/LocalStorageController';

interface HighScoreData {
    name: string;
    score: number;
    version?: string;
    current?: boolean;
}

export class Leaderboard {
    private _domElement: HTMLDivElement | null = null;
    private _scores: {
        overall: HighScoreData[];
        weekly: HighScoreData[];
    } = { overall: [], weekly: [] };
    private _currentScore: undefined | number;
    private _gameover = false;
    private _fetchSucceeded = false;

    constructor(domElement: HTMLDivElement, toggleElement: HTMLDivElement) {
        if (domElement) {
            this._domElement = domElement;
            this.fetchScores().then((data) => {
                if (!data) {
                    return console.error(`No Data returned from fetch`);
                }
                this._fetchSucceeded = true;
                this._scores = data;
                this.populateScores(data);
                toggleElement.classList.remove('hidden');
            });
            // retrieve name from storage
            const name = LocalStorageController.get('leaderboard-name');

            if (name) {
                const input =
                    this._domElement.querySelector<HTMLInputElement>(
                        '.input input'
                    )!;
                input.value = name;
            }
            // close on click
            this._domElement
                .querySelector('.close button')
                ?.addEventListener('click', () => {
                    this._domElement?.classList.add('hidden');
                });

            // submit score on click
            this._domElement
                .querySelector('.input button')
                ?.addEventListener('click', (e) => {
                    e.preventDefault();
                    if (this._currentScore === undefined) return;
                    this.submitScore(this._currentScore);
                });

            // show leaderboard on click
            toggleElement.addEventListener('click', () => {
                this.show(this._currentScore ?? 0);
            });

            // record final score when it occurs
            document.addEventListener('finalScore', (e: CustomEventInit) => {
                this._gameover = true;
                this.show(e.detail);
                this._currentScore = e.detail;
                // const fakeScore = Math.floor(Math.random() * 10000);
                // this._currentScore = fakeScore;
                // this.show(fakeScore);
                this.show(e.detail);
            });
        } else {
            throw new Error('Leaderboard dom element not found');
        }
    }

    show(current: number) {
        if (!this._scores) return;
        if (!this._fetchSucceeded) return;

        // show leaderboard
        this._domElement?.classList.remove('hidden');

        if (!this._gameover) return;

        // test to show high score input
        const weeklyHigh = this._scores.weekly?.some((el) => {
            return current > el.score;
        });
        const overallHigh = this._scores.overall?.some((el) => {
            return current > el.score;
        });

        if (true || weeklyHigh || overallHigh) {
            const input = this._domElement?.querySelector('.input')!;
            const highscore = input?.querySelector('.highscore')!;
            highscore.textContent = current.toString();
            input.classList.remove('hidden');
        }
    }

    async submitScore(score: number) {
        const input: HTMLInputElement | null | undefined =
            this._domElement?.querySelector('.input input');

        if (input == null) {
            return console.error('name needed to submit score');
        }

        const name = input.value;

        LocalStorageController.set('leaderboard-name', name);

        // hide the input
        this._domElement?.querySelector('.input form')?.classList.add('hidden');

        // visually update the board
        if (!this._scores?.weekly || !this._scores.overall) return;
        this._scores.weekly = [
            ...this._scores?.weekly,
            { name, score, current: true },
        ]
            .sort((a, b) => b.score - a.score)
            .slice(0, 10);
        this._scores.overall = [
            ...this._scores?.overall,
            { name, score, current: true },
        ]
            .sort((a, b) => b.score - a.score)
            .slice(0, 10);

        const body = {
            name,
            score,
            version: pjson.version,
        };

        await fetch('/.netlify/functions/submitscore', {
            method: 'POST',
            body: JSON.stringify(body),
        });

        this.populateScores(this._scores);
    }

    populateScores(data: typeof this._scores) {
        if (!data) return;

        const overall = this._domElement?.querySelector(
            '.scoreboard--board__overall .scoreboard--entries'
        );
        const weekly = this._domElement?.querySelector(
            '.scoreboard--board__weekly .scoreboard--entries'
        );

        if (!overall || !weekly) {
            return console.error('overall or weekly html element not found');
        }

        const _buildHTML = (
            data: { name: string; score: number; current?: boolean }[]
        ) => {
            // default empty state guard
            if (!data) return [''];

            return data.map((el, index) => {
                const entry = document.createElement('div');
                const label = document.createElement('div');
                const value = document.createElement('div');

                entry.classList.add('scoreboard--entry');
                label.classList.add('scoreboard--label');
                value.classList.add('scoreboard--value');

                if (el.current) {
                    entry.classList.add('current');
                }

                label.textContent = `${index + 1}:${index < 9 ? ' ' : ''}${
                    el.name
                }`;
                value.textContent = el.score.toString();
                entry.replaceChildren(label, value);

                return entry;
            });
        };

        while (overall.firstChild) {
            overall.removeChild(overall.firstChild);
        }
        while (weekly.firstChild) {
            weekly.removeChild(weekly.firstChild);
        }

        overall.append(..._buildHTML(data?.overall));
        weekly.append(..._buildHTML(data?.weekly));
    }

    async fetchScores() {
        // Get the current date
        const currentDate = new Date();

        // // Calculate the number of days since last Monday
        // const daysSinceLastMonday = (currentDate.getDay() + 6) % 7;

        // // Set the date to previous Monday at midnight
        // const previousMonday = new Date(currentDate);
        // previousMonday.setDate(currentDate.getDate() - daysSinceLastMonday);
        // previousMonday.setHours(0, 0, 0, 0);

        // TEMP Today at midnight
        // Set the time to midnight
        currentDate.setHours(0, 0, 0, 0);

        // Get the components of the previous Monday's date
        const year = currentDate.getFullYear();
        const month = String(currentDate.getMonth() + 1).padStart(2, '0'); // Month is zero-based, so add 1
        const day = String(currentDate.getDate()).padStart(2, '0');

        // Construct the formatted date string
        const formattedDate = `${year}-${month}-${day}`;

        // game version
        const version = pjson.version;
        const fuzzyVersion = `${version.replace(/\.\d+$/, '')}*`;

        const client = createClient({
            projectId: '2czydvnj',
            dataset: 'production',
            useCdn: false, // set to `false` to bypass the edge cache
            apiVersion: 'v2022-03-07', // use current date (YYYY-MM-DD) to target the latest API version
        });

        try {
            const res = await client.fetch(
                `
                {
                    "overall": * [_type=="highscore" && version match "${fuzzyVersion}"] | order(score desc, _updatedAt asc)[0...10] {
                        name,
                        score,
                            version,
                        _updatedAt
                    },
                    "weekly": * [_type=="highscore" && version match "${fuzzyVersion}" && dateTime(_updatedAt) >= dateTime('${formattedDate}T00:00:00Z')] | order(score desc, _updatedAt asc)[0...10] {
                        name,
                        score,
                        _updatedAt
                    }
                }
                `
            );
            return res;
        } catch (error) {
            console.error(error);
            return null;
        }
    }
}

/**
 * GROQ
 * {
  "overall": * [_type=="highscore" && version=="1.5.0"][0...10] | order(score desc) {
    name,
    score,
    _updatedAt
  },
  "weekly": * [_type=="highscore" && version=="1.5.0" && dateTime(_updatedAt) >= dateTime('2024-04-11T00:00:00Z')][0...10] | order(score desc) {
    name,
    score,
    _updatedAt
  }
}
 */

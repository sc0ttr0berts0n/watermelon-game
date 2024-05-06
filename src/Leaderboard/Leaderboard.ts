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
        daily: HighScoreData[];
        weekly: HighScoreData[];
        monthly: HighScoreData[];
    } = { overall: [], daily: [], weekly: [], monthly: [] };
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

        const overall = this._domElement?.querySelector<HTMLDivElement>(
            '.scoreboard--board__overall .scoreboard--entries'
        );
        const recent = this._domElement?.querySelector<HTMLDivElement>(
            '.scoreboard--board__recent .scoreboard--entries'
        );

        if (!overall || !recent) {
            return console.error('overall or recent html element not found');
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
        while (recent.firstChild) {
            recent.removeChild(recent.firstChild);
        }

        // choose a recent duration
        const duration = [data.daily, data.weekly, data.monthly]
            .map((el, i) => {
                const labels = ['Daily', 'Weekly', 'Monthly'];
                return {
                    label: labels[i],
                    content: el,
                };
            })
            .find((data) => {
                return data.content.length === 5;
            }) ?? { label: 'monthly', content: data.monthly };

        overall.append(..._buildHTML(data?.overall));
        recent.append(..._buildHTML(duration.content));

        const recentHeader = document.querySelector<HTMLDivElement>(
            '.scoreboard--board__recent .scoreboard--header'
        );

        if (!recentHeader) {
            return console.error('Recent Header not found!');
        }

        recentHeader.textContent = `${duration.label} Top 10`;
    }

    async fetchScores() {
        // Function to get the date at midnight
        function getDateAtMidnight(date: Date) {
            const midnightDate = new Date(date);
            midnightDate.setHours(0, 0, 0, 0);
            return midnightDate;
        }

        // Get the current date
        const currentDate = new Date();

        // Today at midnight
        const todayAtMidnight = getDateAtMidnight(currentDate);

        // Sunday at midnight
        const dayOfWeek = currentDate.getDay();
        const daysUntilSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
        const sundayAtMidnight = getDateAtMidnight(
            new Date(
                currentDate.getTime() + daysUntilSunday * 24 * 60 * 60 * 1000
            )
        );

        // First of the month at midnight
        const firstOfMonth = new Date(
            currentDate.getFullYear(),
            currentDate.getMonth(),
            1
        );
        const firstOfMonthAtMidnight = getDateAtMidnight(firstOfMonth);

        // Format the dates
        function formatDate(date: Date) {
            const iso = date.toISOString(); // Formats date as "YYYY-MM-DDTHH:MM:SS.sssZ"
            const [secondPrecision] = iso.split('.');
            return secondPrecision + 'Z';
        }

        // Formatted dates
        const formattedTodayAtMidnight = formatDate(todayAtMidnight);
        const formattedSundayAtMidnight = formatDate(sundayAtMidnight);
        const formattedFirstOfMonthAtMidnight = formatDate(
            firstOfMonthAtMidnight
        );

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
                    "monthly": * [_type=="highscore" && version match "${fuzzyVersion}" && dateTime(_updatedAt) >= dateTime('${formattedFirstOfMonthAtMidnight}')] | order(score desc, _updatedAt asc)[0...10] {
                        name,
                        score,
                        _updatedAt
                    },
                    "weekly": * [_type=="highscore" && version match "${fuzzyVersion}" && dateTime(_updatedAt) >= dateTime('${formattedSundayAtMidnight}')] | order(score desc, _updatedAt asc)[0...10] {
                        name,
                        score,
                        _updatedAt
                    },
                    "daily": * [_type=="highscore" && version match "${fuzzyVersion}" && dateTime(_updatedAt) >= dateTime('${formattedTodayAtMidnight}')] | order(score desc, _updatedAt asc)[0...10] {
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
{
    "overall": * [_type=="highscore" && version match "1.6.2"] | order(score desc, _updatedAt asc)[0...10] {
        name,
        score,
            version,
        _updatedAt
    },
    "monthly": * [_type=="highscore" && version match "1.6.2" && dateTime(_updatedAt) >= dateTime('2024-05-01T04:00:00Z')] | order(score desc, _updatedAt asc)[0...10] {
        name,
        score,
        _updatedAt
    },
    "weekly": * [_type=="highscore" && version match "1.6.2" && dateTime(_updatedAt) >= dateTime('2024-05-05T04:00:00Z')] | order(score desc, _updatedAt asc)[0...10] {
        name,
        score,
        _updatedAt
    },
    "daily": * [_type=="highscore" && version match "1.6.2" && dateTime(_updatedAt) >= dateTime('2024-05-05T04:00:00Z')] | order(score desc, _updatedAt asc)[0...10] {
        name,
        score,
        _updatedAt
    }
}
 */

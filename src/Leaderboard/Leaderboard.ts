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
    private _scoreSubmitted = false;
    private _activeTab: 'daily' | 'weekly' | 'monthly' = 'weekly';

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
            // tab click handlers
            this._domElement
                .querySelectorAll<HTMLButtonElement>('.scoreboard--tabs button')
                .forEach((btn) => {
                    btn.addEventListener('click', () => {
                        const tab = btn.dataset.tab as typeof this._activeTab;
                        this._activeTab = tab;
                        this.renderRecentColumn();
                    });
                });

            // close on click — auto-submit as 'private' if high score not yet submitted
            this._domElement
                .querySelector('.close button')
                ?.addEventListener('click', () => {
                    if (this._currentScore !== undefined && !this._scoreSubmitted) {
                        this.submitScore(this._currentScore);
                    }
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
                this._currentScore = e.detail;
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

        if (weeklyHigh || overallHigh) {
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

        if (this._scoreSubmitted) return;
        this._scoreSubmitted = true;

        const name = input.value.trim() || 'private';

        LocalStorageController.set('leaderboard-name', name);

        // hide the input
        this._domElement?.querySelector('.input form')?.classList.add('hidden');

        // visually update all time period boards
        const entry = { name, score, current: true };
        for (const key of ['daily', 'weekly', 'monthly', 'overall'] as const) {
            this._scores[key] = [...this._scores[key], entry]
                .sort((a, b) => b.score - a.score)
                .slice(0, 10);
        }

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

    private _buildHTML(
        data: { name: string; score: number; current?: boolean }[]
    ) {
        if (!data || data.length === 0) return document.createElement('div');

        const wrapper = document.createElement('div');
        wrapper.classList.add('scoreboard--columns');

        const mid = Math.ceil(data.length / 2);
        const leftCol = document.createElement('div');
        const rightCol = document.createElement('div');
        leftCol.classList.add('scoreboard--col');
        rightCol.classList.add('scoreboard--col');

        data.forEach((el, index) => {
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

            if (index < mid) {
                leftCol.append(entry);
            } else {
                rightCol.append(entry);
            }
        });

        wrapper.append(leftCol, rightCol);
        return wrapper;
    }

    renderRecentColumn() {
        const recent = this._domElement?.querySelector<HTMLDivElement>(
            '.scoreboard--board__recent .scoreboard--entries'
        );
        if (!recent) return;

        while (recent.firstChild) {
            recent.removeChild(recent.firstChild);
        }

        const scores = this._scores[this._activeTab];
        if (scores.length === 0) {
            const empty = document.createElement('div');
            empty.classList.add('scoreboard--empty');
            empty.textContent = 'No scores yet';
            recent.append(empty);
        } else {
            recent.append(this._buildHTML(scores));
        }

        // update active tab styling
        this._domElement
            ?.querySelectorAll<HTMLButtonElement>('.scoreboard--tabs button')
            .forEach((btn) => {
                btn.classList.toggle(
                    'active',
                    btn.dataset.tab === this._activeTab
                );
            });
    }

    populateScores(data: typeof this._scores) {
        if (!data) return;

        // choose the smallest timespan with enough scores as default tab
        const full = 5;
        const defaultTab = (
            [
                { key: 'daily' as const, content: data.daily },
                { key: 'weekly' as const, content: data.weekly },
                { key: 'monthly' as const, content: data.monthly },
            ].find((d) => d.content.length >= full)
        )?.key ?? 'monthly';

        this._activeTab = defaultTab;

        // render overall (right column)
        const overall = this._domElement?.querySelector<HTMLDivElement>(
            '.scoreboard--board__overall .scoreboard--entries'
        );
        if (!overall) return;

        while (overall.firstChild) {
            overall.removeChild(overall.firstChild);
        }
        overall.append(this._buildHTML(data.overall));

        // render recent (left column)
        this.renderRecentColumn();
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

        // Most recent Sunday at midnight (start of current week)
        const dayOfWeek = currentDate.getDay();
        const sundayAtMidnight = getDateAtMidnight(
            new Date(
                currentDate.getTime() - dayOfWeek * 24 * 60 * 60 * 1000
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
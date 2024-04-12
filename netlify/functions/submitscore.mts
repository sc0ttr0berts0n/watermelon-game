import type { Context } from '@netlify/functions';
import { createClient } from '@sanity/client';

const client = createClient({
    projectId: '2czydvnj',
    dataset: 'production',
    useCdn: false, // set to `false` to bypass the edge cache
    apiVersion: 'v2024-04-11', // use current date (YYYY-MM-DD) to target the latest API version
    token: process.env.SANITY_SECRET_TOKEN, // Only if you want to update content with the client
});

export default async (req: Request, context: Context) => {
    try {
        // inbound data
        const { name, score, version } = await req.json();

        console.log('INBOUND DATA:');
        console.log({
            name,
            score,
            version,
        });

        const safeVersion = version.replace(/\./g, '_');
        const sanitizedName = name.replace(/[^a-z0-9-_]/gi, '_');
        const trimmedName = sanitizedName.replace(/^[_-]+|[_-]+$/g, '');

        // Ensure the ID is not empty
        if (trimmedName === '') {
            return 'safe_id';
        }

        // User exists, so we create the doc to be inserted
        const doc = {
            _id: `highscore-${safeVersion}-${trimmedName}-${score}`,
            _type: 'highscore',
            name,
            score,
            version,
        };

        // place it
        const query = await client.createOrReplace(doc);

        if (query) {
            console.log('\nQUERY SUCCESSFUL:');
            console.log(query);
        } else {
            throw new Error(query);
        }

        const response = {
            doc,
            query,
        };

        console.log('\nResponse Object:');
        console.log(response);

        // return metadata
        return new Response(JSON.stringify(response));
    } catch (error) {
        // Handle errors
        console.error('Error:', error);
        const errorMessage =
            error instanceof Error ? error.message : 'An error occurred';

        // Return error response
        return new Response(JSON.stringify({ error: errorMessage }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
};

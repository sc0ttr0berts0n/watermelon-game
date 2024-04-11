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
        const safeName = name.replace(/\s/g, '');

        // User exists, so we create the doc to be inserted
        const doc = {
            _id: `highscore-${safeVersion}-${safeName}-${score}`,
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
            console.error(query);
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
        return new Response(JSON.stringify({ error }));
    }
};

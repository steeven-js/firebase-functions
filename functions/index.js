import * as v2 from 'firebase-functions/v2';

export const helloWorld = v2.https.onRequest((request, response) => {
    // Extract the parameter from the URL path
    const name = request.path.split('/').pop();

    // Define the items object
    const items = {
        lamp: 'This is a lamp',
        table: 'This is a table',
    };

    // Fetch the corresponding message or return a default message
    const message = items[name || ''] || 'Item not found';

    // Send the response as HTML
    response.send(`<h1>${message}</h1>`);
});
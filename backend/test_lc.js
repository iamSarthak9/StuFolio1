const https = require('https');

const query = JSON.stringify({
    query: `
        query getUserProfile($username: String!) {
            matchedUser(username: $username) {
                userCalendar {
                    submissionCalendar
                }
            }
        }
    `,
    variables: { username: "nakul9565" }
});

const options = {
    hostname: 'leetcode.com',
    port: 443,
    path: '/graphql',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': query.length,
        'User-Agent': 'Mozilla/5.0'
    }
};

const req = https.request(options, res => {
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => {
        console.log("Raw Response Body:");
        console.log(body);
        try {
            const data = JSON.parse(body);
            const calStr = data.data.matchedUser.userCalendar.submissionCalendar;
            console.log("Calendar String length:", calStr.length);

            const cal = JSON.parse(calStr);
            const dates = Object.keys(cal).map(ts => {
                const date = new Date(parseInt(ts) * 1000);
                return date.toISOString().split('T')[0];
            }).sort();

            console.log('Last 5 dates in calendar:');
            console.log(dates.slice(-5));
        } catch (e) {
            console.error("Parse Error:", e.message);
        }
    });
});

req.on('error', e => console.error(e));
req.write(query);
req.end();

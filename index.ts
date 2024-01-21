import * as dotenv from "dotenv";
import shuffle from "just-shuffle";

function getCredentials() {
    const envConfig = dotenv.config();
    if (envConfig.error) throw envConfig.error;
    if (!envConfig.parsed) throw new Error("No env config parsed");

    const email = envConfig.parsed.FLATASTIC_EMAIL;
    const password = envConfig.parsed.FLATASTIC_PASSWORD;

    if (!email) throw new Error("No username found");
    if (!password) throw new Error("No password found");

    return { email, password };
}

async function login(credentials: { email: string, password: string }) {
    const loginResponse = await fetch("https://api.flatastic-app.com/index.php/api/auth/login", {
        method: "POST",
        body: JSON.stringify(credentials),
        headers: {
            "Content-Type": "application/json"
        }
    });

    if (!loginResponse.ok)
        throw new Error("Failed to login: " + await loginResponse.text());

    const apiKey = (await loginResponse.json())["X-API-KEY"];
    if (!apiKey) throw new Error("No API key found");
    return apiKey;
}

async function getChores(apiKey: string) {
    const choresResponse = await fetch("https://api.flatastic-app.com/index.php/api/chores", {
        headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey
        }
    });

    if (!choresResponse.ok)
        throw new Error("Failed to fetch chores: " + await choresResponse.text());

    return choresResponse.json();
}


async function updateChores(chores: any[], apiKey: string) {
    for (const chore of chores) {
        let userOrder: number[] = Array.from(chore.users);
        let firstUser = userOrder.shift()!;
        let newOrder = [firstUser, ...shuffle(userOrder)];
        console.log("Updating: " + chore.title);
        console.log("Old order: " + chore.users.join(", "));
        console.log("New order: " + newOrder.join(", "));
        const body = JSON.stringify({
            id: chore.id,
            users: newOrder,
            title: chore.title
        });
        const response = await fetch(`https://api.flatastic-app.com/index.php/api/chores/update`, {
            method: "POST",
            body,
            headers: {
                "Content-Type": "application/json",
                "x-api-key": apiKey,
            }
        });
        if (!response.ok) {
            throw new Error(`Failed to update '${chore.title}:' ` + await response.text());
        }
    }
}

async function main() {
    const credentials = getCredentials();
    const apiKey = await login(credentials);
    const chores = await getChores(apiKey);
    await updateChores(chores, apiKey);
}

main().catch(e => console.error(e));

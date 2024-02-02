import shuffle from "just-shuffle";
import prompts from "prompts";

async function getCredentials() {
    const input = await prompts([
        {
            type: "text",
            name: "email",
            message: "Email",
            validate: (email: string) => email.length > 0 && email.includes("@") ? true : "Please enter an email address"
        }, {
            type: "password",
            name: "password",
            message: "Password",
            validate: (password: string) => password.length > 0 ? true : "Please enter a password"
        }
    ], {
        onCancel: () => {
            console.log("Okay, bye!");
            process.exit(0);
        }
    });
    return input as { email: string, password: string };
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

async function getWg(apiKey: string) {
    const choresResponse = await fetch("https://api.flatastic-app.com/index.php/api/wg", {
        headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey
        }
    });

    if (!choresResponse.ok)
        throw new Error("Failed to fetch flatmates: " + await choresResponse.text());

    return choresResponse.json();
}

async function askChoresToUpdate(chores: any[]) {
    const padLength = Math.max(...chores.map(chore => chore.title.length)) + 5;
    const { choresToUpdate } = await prompts({
        type: "multiselect",
        name: "choresToUpdate",
        message: "Which chores do you want to update?",
        choices: chores.map(chore => ({ title: `${chore.title.padEnd(padLength)} ${chore.users.length} users`, value: chore }))
    });
    return choresToUpdate;
}

function getFlatmatesWithoutChores(chores: any[], flatmates: any[]): any[] {
    return flatmates.filter(flatmate => chores.every(chore => !chore.users.includes(parseInt(flatmate.id))));
}

async function askUnassignedUsersToMixIn(unassignedUsers: any[]) {
    const { usersToMixIn } = await prompts({
        type: "multiselect",
        name: "usersToMixIn",
        message: "The following users currently have no chores. Which ones do you want to mix in?",
        choices: unassignedUsers.map(u => ({ title: u.firstName + (u.lastName || ""), value: u }))
    });
    return usersToMixIn;
}

async function updateChores(chores: any[], unassignedUsersToMixIn: any[], apiKey: string) {
    for (const chore of chores) {
        let userOrder: number[] = Array.from(chore.users);
        let firstUser = userOrder.shift()!;
        userOrder.push(...unassignedUsersToMixIn.map(u => u.id));
        let newOrder = [firstUser, ...shuffle(userOrder)];
        console.log("Updating: " + chore.title);
        // console.log("Old order: " + chore.users.join(", "));
        // console.log("New order: " + newOrder.join(", "));
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
        console.log(`Updated '${chore.title}' successfully`);
    }
}

async function main() {
    console.log("This little terminal program will shuffle the chore order in the flatastic app (flatastic-app.com). The current assignee of each chore will be kept, only the order of all other assignees will be shuffled. Enter e-mail and password and the program will do the rest.");
    const credentials = await getCredentials();
    const apiKey = await login(credentials);
    const chores = await getChores(apiKey);
    const wg = await getWg(apiKey);

    const choresToUpdate = await askChoresToUpdate(chores);
    const unassignedUsers = getFlatmatesWithoutChores(choresToUpdate, wg.flatmates);
    const unassignedUsersToMixIn = await askUnassignedUsersToMixIn(unassignedUsers);
    await updateChores(choresToUpdate, unassignedUsersToMixIn, apiKey);
}

main().catch(e => console.error(e));

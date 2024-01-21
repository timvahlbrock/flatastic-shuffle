# Flatastic Shuffle

> :warning: Note that this project is cobbled together and based on an undocumented API. It might contain bugs and break at any time.

This little terminal program will shuffle the chore order in the flatastic app (<flatastic-app.com>). The current assignee of each chore will be kept, only the order of all other assignees will be shuffled.

## Usage

Run the program for your platform, enter e-mail and password and the program will do the rest.

## Build

Install with dependencies with `npm install`. Then you can:

- Run from source with `npm start`, or
- Compile to js with `npm run build` and run with `node dist/flatastic-shuffle.umd.js` or
- Compile the executable with `npm run package` and run the executable in `dist/flatastic-shuffle-<platform>`.

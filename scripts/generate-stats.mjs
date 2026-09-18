import fs from "node:fs";
import { execFileSync } from "node:child_process";

const USER = "anshnpy";

const toISODate = d => d.toISOString();

const now = new Date();
const from = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

const query = `
query($login:String!,$from:DateTime!,$to:DateTime!) {
  user(login:$login) {
    contributionsCollection(from:$from,to:$to) {
      contributionCalendar {
        totalContributions
        weeks {
          contributionDays {
            date
            contributionCount
          }
        }
      }
    }
  }
}`;

let raw;

try {
  raw = execFileSync(
    "gh",
    [
      "api",
      "graphql",
      "-f", `query=${query}`,
      "-f", `login=${USER}`,
      "-f", `from=${toISODate(from)}`,
      "-f", `to=${toISODate(now)}`
    ],
    {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"]
    }
  );
} catch (error) {
  throw new Error(
    `GitHub GraphQL request failed:\n${error.stderr || error.message}`
  );
}

const body = JSON.parse(raw);

if (body.errors?.length) {
  throw new Error(
    body.errors.map(error => error.message).join("; ")
  );
}

const calendar =
  body.data.user.contributionsCollection.contributionCalendar;

const days = calendar.weeks
  .flatMap(week => week.contributionDays)
  .sort((a, b) => a.date.localeCompare(b.date));

const total = calendar.totalContributions;

const countByDate = new Map(
  days.map(day => [day.date, day.contributionCount])
);

const shift = (date, amount) => {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + amount);
  return d.toISOString().slice(0, 10);
};

const today = new Date().toISOString().slice(0, 10);
const yesterday = shift(today, -1);

let currentStreak = 0;
let cursor = countByDate.get(today) > 0 ? today : yesterday;

while ((countByDate.get(cursor) ?? 0) > 0) {
  currentStreak++;
  cursor = shift(cursor, -1);
}

let longestStreak = 0;
let running = 0;
let previousDate = null;

for (const day of days) {
  if (day.contributionCount > 0) {
    if (
      previousDate &&
      shift(previousDate, 1) === day.date
    ) {
      running++;
    } else {
      running = 1;
    }

    longestStreak = Math.max(longestStreak, running);
    previousDate = day.date;
  } else {
    running = 0;
    previousDate = null;
  }
}

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg"
     width="495"
     height="195"
     viewBox="0 0 495 195"
     role="img"
     aria-label="anshnpy GitHub contribution statistics">

  <defs>
    <style>
      @keyframes fadein {
        from { opacity: 0; }
        to { opacity: 1; }
      }

      .fade {
        animation: fadein .5s ease forwards;
      }

      text {
        font-family: Segoe UI, Ubuntu, sans-serif;
      }
    </style>
  </defs>

  <rect width="495" height="195" rx="6" fill="#0D1117"/>

  <line x1="165" y1="28" x2="165" y2="170"
        stroke="#1F2937" opacity=".35"/>

  <line x1="330" y1="28" x2="330" y2="170"
        stroke="#1F2937" opacity=".35"/>

  <g text-anchor="middle" class="fade">
    <text x="82.5" y="80"
          fill="#F5F7FA"
          font-size="28"
          font-weight="700">${total}</text>

    <text x="82.5" y="116"
          fill="#E5E7EB"
          font-size="14">Total Contributions</text>

    <text x="82.5" y="146"
          fill="#94A3B8"
          font-size="12">Last 12 months</text>
  </g>

  <g text-anchor="middle" class="fade">
    <circle cx="247.5" cy="71"
            r="40"
            fill="none"
            stroke="#00B7FF"
            stroke-width="5"/>

    <text x="247.5" y="80"
          fill="#F5F7FA"
          font-size="28"
          font-weight="700">${currentStreak}</text>

    <text x="247.5" y="140"
          fill="#00B7FF"
          font-size="14"
          font-weight="700">Current Streak</text>

    <text x="247.5" y="166"
          fill="#94A3B8"
          font-size="12">GitHub contribution days</text>
  </g>

  <g text-anchor="middle" class="fade">
    <text x="412.5" y="80"
          fill="#F5F7FA"
          font-size="28"
          font-weight="700">${longestStreak}</text>

    <text x="412.5" y="116"
          fill="#E5E7EB"
          font-size="14">Longest Streak</text>

    <text x="412.5" y="146"
          fill="#94A3B8"
          font-size="12">GitHub contribution days</text>
  </g>

</svg>
`;

fs.mkdirSync("profile", { recursive: true });
fs.writeFileSync("profile/streak.svg", svg, "utf8");

console.log(
  `Generated stats: total=${total}, current=${currentStreak}, longest=${longestStreak}`
);

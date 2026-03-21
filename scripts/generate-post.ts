#!/usr/bin/env npx tsx

/**
 * Post Copy Generator for WorkChores
 * Run: npx tsx scripts/generate-post.ts [reddit|linkedin|both]
 * Generates ready-to-post copy for Reddit and LinkedIn
 */

const platform = process.argv[2] || "both";

const hooks = [
  "I got tired of paying $50/seat for a CRM my team refused to use.",
  "We were tracking $2M in deals on a Google Sheet. It broke.",
  "I built the CRM I wish existed when I started my business.",
  "My sales team spent more time updating Salesforce than actually selling.",
  "Stop using spreadsheets to track your pipeline. Here's what I switched to.",
  "Small teams don't need Salesforce. They need this.",
  "I set up a CRM in 60 seconds. No, seriously.",
];

const bodies = {
  reddit: [
    `Been lurking in this sub for a while and wanted to share something I've been working on.

Like a lot of you, I tried every CRM out there — HubSpot, Pipedrive, Monday, even built stuff in Notion. They all had the same problem: too much setup, too many features I didn't need, and my team just went back to spreadsheets.

So I built WorkChores. It's a CRM that:
- Sets up in 60 seconds (pick your industry, done)
- Has a live demo you can try without signing up
- Actually feels simple — click any field to edit, auto-saves
- Built for small teams, not enterprises

There's a free plan. No credit card needed. You can literally try it right now at workchores.com without creating an account.

Would love feedback from this community. What features matter most to you in a CRM?`,

    `Honest question: why are CRMs so complicated?

I run a small sales team. We tried HubSpot (overwhelming), Salesforce (way too much), and Pipedrive (decent but pricey per seat).

We ended up building our own and just launched it publicly: WorkChores.

The pitch is simple: pick your industry, get a CRM configured for your workflow in under a minute. Editable pipeline, contact tracking, tasks, activity logs — that's it. No 47 integrations you'll never use.

Free tier. No per-seat pricing on the basic plan. Live demo at workchores.com.

Curious what others here are using and what pain points you have with it.`,
  ],
  linkedin: [
    `The CRM industry has a problem.

They build for enterprises. Then slap "small business" on a stripped-down version and charge you $25/seat.

Small teams don't need:
❌ 200 integrations
❌ 3-week onboarding
❌ Certification courses to use basic features

They need:
✅ A pipeline that makes sense
✅ Contact tracking that works
✅ Something the team will actually use

That's why we built WorkChores.

Pick your industry. Get a fully configured CRM in 60 seconds. Click any field to edit. Auto-saves.

No training required.

Try the live demo (no signup): workchores.com

#CRM #Sales #SmallBusiness #StartupTools #SalesOps`,

    `I spent years watching sales reps update CRMs instead of selling.

The tool meant to help them close deals... was the thing slowing them down.

So we built something different.

WorkChores is a CRM that:
→ Sets up in under 60 seconds
→ Customizes to your industry automatically
→ Lets you click any field to edit (no "edit mode")
→ Auto-saves everything

No 30-day onboarding. No implementation consultant. No per-seat pricing games.

Just open it and start tracking deals.

Try it free: workchores.com

#SalesTools #CRM #B2BSales #Startup`,
  ],
};

function randomPick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateReddit(): string {
  const hook = randomPick(hooks);
  const body = randomPick(bodies.reddit);
  return `📋 REDDIT POST
${"=".repeat(50)}

Title: ${hook}

---

${body}

${"=".repeat(50)}`;
}

function generateLinkedIn(): string {
  const post = randomPick(bodies.linkedin);
  return `📋 LINKEDIN POST
${"=".repeat(50)}

${post}

${"=".repeat(50)}`;
}

console.log("\n🚀 WorkChores Post Copy Generator\n");

if (platform === "reddit" || platform === "both") {
  console.log(generateReddit());
  console.log("\n");
}

if (platform === "linkedin" || platform === "both") {
  console.log(generateLinkedIn());
  console.log("\n");
}

console.log("💡 Run again for different variations: npx tsx scripts/generate-post.ts [reddit|linkedin|both]\n");

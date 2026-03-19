export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  category: "follow-up" | "intro" | "proposal" | "thank-you" | "check-in";
}

export const defaultTemplates: EmailTemplate[] = [
  {
    id: "t1",
    name: "Initial Follow-Up",
    category: "follow-up",
    subject: "Great connecting, {{firstName}}!",
    body: `Hi {{firstName}},

It was great connecting with you. I wanted to follow up on our conversation about how we can help {{company}}.

I'd love to schedule a quick call to discuss next steps. Would you have 15 minutes this week?

Best regards`,
  },
  {
    id: "t2",
    name: "Introduction",
    category: "intro",
    subject: "Introduction from {{senderName}}",
    body: `Hi {{firstName}},

My name is {{senderName}} and I came across {{company}}. I think there could be a great fit between what we do and what you're working on.

Would you be open to a brief call this week to explore?

Best,
{{senderName}}`,
  },
  {
    id: "t3",
    name: "Proposal Follow-Up",
    category: "proposal",
    subject: "Following up on our proposal",
    body: `Hi {{firstName}},

I wanted to check in regarding the proposal we sent over. I know things can get busy, so I wanted to make sure you had everything you need to move forward.

Happy to jump on a call if you have any questions or would like to discuss adjustments.

Looking forward to hearing from you!`,
  },
  {
    id: "t4",
    name: "Thank You",
    category: "thank-you",
    subject: "Thank you, {{firstName}}!",
    body: `Hi {{firstName}},

Thank you so much for your time today. I really enjoyed our conversation and learning more about {{company}}.

As discussed, I'll follow up with the next steps by end of week. In the meantime, don't hesitate to reach out if you have any questions.

Best regards`,
  },
  {
    id: "t5",
    name: "Check-In",
    category: "check-in",
    subject: "Checking in",
    body: `Hi {{firstName}},

It's been a little while since we last connected. I wanted to check in and see how things are going at {{company}}.

If there's anything I can help with or if you'd like to reconnect, I'm just an email away.

Hope all is well!`,
  },
];

export function fillTemplate(template: EmailTemplate, variables: Record<string, string>): { subject: string; body: string } {
  let subject = template.subject;
  let body = template.body;

  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, "g");
    subject = subject.replace(regex, value);
    body = body.replace(regex, value);
  });

  return { subject, body };
}

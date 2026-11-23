// "Ask Bo": a small rule-based guide. Answers come only from the portfolio's own data.

const fab = document.getElementById('chat-fab');
const box = document.getElementById('chat');
const body = document.getElementById('chat-body');
const form = document.getElementById('chat-form') as HTMLFormElement | null;
const input = document.getElementById('chat-in') as HTMLInputElement | null;
const dataEl = document.getElementById('game-data');

if (fab && box && body && form && input && dataEl) {
  const { answers, email } = JSON.parse(dataEl.textContent || '{}') as { answers: Record<string, string>; email: string };
  let greeted = false;

  const add = (text: string, who: 'bot' | 'me') => {
    const m = document.createElement('div');
    m.className = `msg ${who}`;
    m.textContent = text;
    body.appendChild(m);
    body.scrollTop = body.scrollHeight;
  };
  const botSay = (text: string) => {
    const typing = document.createElement('div');
    typing.className = 'msg bot';
    typing.textContent = '…';
    body.appendChild(typing);
    body.scrollTop = body.scrollHeight;
    window.setTimeout(() => { typing.textContent = text; body.scrollTop = body.scrollHeight; }, 420);
  };

  const rules: [RegExp, string][] = [
    [/(who|about|bose|yourself|intro)/i, 'Who is Bose?'],
    [/(work|job|juspay|experience|company|career|payment|enach)/i, 'Experience'],
    [/(skill|tech|stack|language|java|rust|rails|react|database|sql)/i, 'Skills'],
    [/(project|built|app|vinathaal|easemilker|milk|tea|cattle|rider)/i, 'Projects'],
    [/(college|educat|degree|study|ksriet|award|achiev)/i, 'Education'],
    [/(venture|business|azhizen|startup|entrepreneur)/i, 'Ventures'],
    [/(contact|email|hire|reach|mail|talk|phone)/i, 'Contact'],
  ];

  function answer(q: string) {
    if (/(resume|cv)/i.test(q)) return `A resume link isn't published on this site yet. Email Bose at ${email} and he can send one.`;
    for (const [re, key] of rules) if (re.test(q)) return answers[key];
    return "I can tell you about Bose's experience, skills, projects, education, ventures, or how to contact him. Try one of the chips below.";
  }

  function ask(q: string) {
    add(q, 'me');
    botSay(answers[q] ?? answer(q));
  }

  function open(v: boolean) {
    box.hidden = !v;
    fab.setAttribute('aria-expanded', String(v));
    if (v && !greeted) {
      greeted = true;
      botSay("Hi, I'm Bo! Ask me anything about Bose, or tap a chip below.");
    }
    if (v) input.focus({ preventScroll: true });
  }

  fab.addEventListener('click', () => open(box.hidden));
  document.getElementById('chat-x')?.addEventListener('click', () => open(false));
  document.querySelectorAll<HTMLButtonElement>('#chat-chips button').forEach((b) =>
    b.addEventListener('click', () => ask(b.dataset.q!))
  );
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const q = input.value.trim();
    if (!q) return;
    input.value = '';
    ask(q);
  });
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && !box.hidden) open(false); });
}

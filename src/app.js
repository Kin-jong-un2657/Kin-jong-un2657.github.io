const root = document.documentElement;
const themeButton = document.querySelector('[data-theme-toggle]');
const preference = window.matchMedia('(prefers-color-scheme: dark)');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

function savedTheme() {
  try { return localStorage.getItem('hk-theme'); } catch { return null; }
}
function applyTheme(theme) {
  root.dataset.theme = theme;
  root.style.colorScheme = theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#0B1424' : '#F5F8FC');
  if (themeButton) {
    const next = theme === 'dark' ? 'light' : 'dark';
    themeButton.setAttribute('aria-label', `Switch to ${next} mode`);
    themeButton.querySelector('[data-theme-label]').textContent = `${next[0].toUpperCase()}${next.slice(1)} mode`;
  }
}
applyTheme(root.dataset.theme || (preference.matches ? 'dark' : 'light'));
themeButton?.addEventListener('click', () => {
  const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
  try { localStorage.setItem('hk-theme', next); } catch { /* Theme still works when storage is unavailable. */ }
  const update = () => applyTheme(next);
  if (document.startViewTransition && !reducedMotion.matches) document.startViewTransition(update);
  else update();
});
preference.addEventListener('change', event => {
  if (!savedTheme()) applyTheme(event.matches ? 'dark' : 'light');
});

const filters = document.querySelector('[data-filters]');
if (filters) {
  const buttons = [...filters.querySelectorAll('[data-tech]')];
  const cards = [...document.querySelectorAll('[data-project-tags]')];
  const status = document.querySelector('[data-filter-status]');
  const empty = document.querySelector('[data-filter-empty]');
  filters.hidden = false;
  function filterFromUrl() {
    const value = new URL(location.href).searchParams.get('tech') || 'all';
    const selected = buttons.some(button => button.dataset.tech === value) ? value : 'all';
    let count = 0;
    for (const card of cards) {
      const visible = selected === 'all' || JSON.parse(card.dataset.projectTags).includes(selected);
      card.hidden = !visible;
      if (visible) count += 1;
    }
    for (const button of buttons) button.setAttribute('aria-pressed', String(button.dataset.tech === selected));
    status.textContent = `${count} ${count === 1 ? 'case study' : 'case studies'}${selected === 'all' ? '' : ` using ${selected}`}`;
    empty.hidden = count !== 0;
  }
  for (const button of buttons) button.addEventListener('click', () => {
    const url = new URL(location.href);
    if (button.dataset.tech === 'all') url.searchParams.delete('tech');
    else url.searchParams.set('tech', button.dataset.tech);
    history.pushState({}, '', url);
    filterFromUrl();
  });
  window.addEventListener('popstate', filterFromUrl);
  document.querySelector('[data-clear-filter]')?.addEventListener('click', () => buttons[0].click());
  filterFromUrl();
}

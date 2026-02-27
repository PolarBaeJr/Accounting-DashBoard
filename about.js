'use strict';

/* Merge user config with safe defaults so every render function receives clean values. */
function getConfig() {
  const defaults = {
    name: 'Developer',
    title: '',
    bio: '',
    avatarUrl: '',
    email: '',
    phone: '',
    github: '',
    linkedin: '',
    skills: [],
    projects: [],
    experience: [],
  };

  // Guard: DEVELOPER_CONFIG may be undefined if the script failed to load
  const raw = (typeof DEVELOPER_CONFIG !== 'undefined') ? DEVELOPER_CONFIG : {};

  return {
    name:       (typeof raw.name      === 'string' && raw.name.trim())      ? raw.name.trim()      : defaults.name,
    title:      (typeof raw.title     === 'string' && raw.title.trim())     ? raw.title.trim()     : defaults.title,
    bio:        (typeof raw.bio       === 'string' && raw.bio.trim())       ? raw.bio.trim()       : defaults.bio,
    avatarUrl:  (typeof raw.avatarUrl === 'string' && raw.avatarUrl.trim()) ? raw.avatarUrl.trim() : defaults.avatarUrl,
    email:      (typeof raw.email     === 'string' && raw.email.trim())     ? raw.email.trim()     : defaults.email,
    phone:      (typeof raw.phone     === 'string' && raw.phone.trim())     ? raw.phone.trim()     : defaults.phone,
    github:     (typeof raw.github    === 'string' && raw.github.trim())    ? raw.github.trim()    : defaults.github,
    linkedin:   (typeof raw.linkedin  === 'string' && raw.linkedin.trim())  ? raw.linkedin.trim()  : defaults.linkedin,
    // Coerce array fields — if not an array, replace with [] to prevent .forEach errors
    skills:     Array.isArray(raw.skills)     ? raw.skills     : defaults.skills,
    projects:   Array.isArray(raw.projects)   ? raw.projects   : defaults.projects,
    experience: Array.isArray(raw.experience) ? raw.experience : defaults.experience,
  };
}

function renderAvatar(cfg) {
  const el = document.getElementById('about-avatar');
  if (!el) return;

  if (cfg.avatarUrl) {
    const img = document.createElement('img');
    img.src   = cfg.avatarUrl;
    img.alt   = cfg.name;
    img.className = 'about-avatar-img';
    // On broken URL, fall back to initials instead of showing a broken-image icon
    img.onerror = () => {
      el.innerHTML = '';
      el.textContent = getInitials(cfg.name);
    };
    el.appendChild(img);
  } else {
    el.textContent = getInitials(cfg.name);
  }
}

function getInitials(name) {
  if (!name) return '?';
  return name.trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

function renderProfileInfo(cfg) {
  const nameEl  = document.getElementById('about-name');
  const titleEl = document.getElementById('about-title');
  const bioEl   = document.getElementById('about-bio');

  if (nameEl) {
    nameEl.textContent    = cfg.name;
    nameEl.style.display  = cfg.name ? '' : 'none';
  }
  if (titleEl) {
    titleEl.textContent   = cfg.title;
    titleEl.style.display = cfg.title ? '' : 'none';
  }
  if (bioEl) {
    bioEl.textContent     = cfg.bio;
    bioEl.style.display   = cfg.bio ? '' : 'none';
  }
}

function renderContact(cfg) {
  const el = document.getElementById('about-contact');
  if (!el) return;

  const links = [];

  if (cfg.email) {
    links.push(`<a href="mailto:${cfg.email}" class="about-contact-link">
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <rect x="1" y="3" width="14" height="10" rx="2" stroke="currentColor" stroke-width="1.5"/>
        <path d="M1 5.5 L8 10 L15 5.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>${cfg.email}</a>`);
  }

  if (cfg.phone) {
    links.push(`<a href="tel:${cfg.phone}" class="about-contact-link">
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="M2 2h3.5l1.5 3.5L5.5 7a9.5 9.5 0 0 0 3.5 3.5l1.5-1.5L14 10.5V14A1.5 1.5 0 0 1 12.5 15.5C5.5 15 .5 10 1 3A1.5 1.5 0 0 1 2 2Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>${cfg.phone}</a>`);
  }

  if (cfg.github) {
    links.push(`<a href="${cfg.github}" class="about-contact-link" target="_blank" rel="noopener noreferrer">
      <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
        <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z"/>
      </svg>GitHub</a>`);
  }

  if (cfg.linkedin) {
    links.push(`<a href="${cfg.linkedin}" class="about-contact-link" target="_blank" rel="noopener noreferrer">
      <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
        <path d="M0 1.146C0 .513.526 0 1.175 0h13.65C15.474 0 16 .513 16 1.146v13.708c0 .633-.526 1.146-1.175 1.146H1.175C.526 16 0 15.487 0 14.854V1.146zm4.943 12.248V6.169H2.542v7.225h2.401zm-1.2-8.212c.837 0 1.358-.554 1.358-1.248-.015-.709-.52-1.248-1.342-1.248-.822 0-1.359.54-1.359 1.248 0 .694.521 1.248 1.327 1.248h.016zm4.908 8.212V9.359c0-.216.016-.432.08-.586.173-.431.568-.878 1.232-.878.869 0 1.216.662 1.216 1.634v3.865h2.401V9.25c0-2.22-1.184-3.252-2.764-3.252-1.274 0-1.845.7-2.165 1.193v.025h-.016a5.54 5.54 0 0 1 .016-.025V6.169h-2.4c.03.678 0 7.225 0 7.225h2.4z"/>
      </svg>LinkedIn</a>`);
  }

  if (links.length === 0) {
    el.style.display = 'none';
  } else {
    el.innerHTML = links.join('');
  }
}

function renderSkills(cfg) {
  const panel = document.getElementById('about-skills-panel');
  const body  = document.getElementById('about-skills-body');
  if (!panel || !body) return;

  // Filter out any non-string or empty entries
  const valid = cfg.skills.filter(s => typeof s === 'string' && s.trim());
  if (valid.length === 0) return; // panel stays display:none

  panel.style.display = '';
  body.innerHTML = `<ul class="about-skills-list">${
    valid.map(s => `<li class="about-skill-tag">${s.trim()}</li>`).join('')
  }</ul>`;
}

function renderProjects(cfg) {
  const panel = document.getElementById('about-projects-panel');
  const body  = document.getElementById('about-projects-body');
  if (!panel || !body) return;

  // Filter out invalid entries
  const valid = cfg.projects.filter(p => p && typeof p === 'object' && p.name && String(p.name).trim());
  if (valid.length === 0) return;

  panel.style.display = '';
  body.innerHTML = valid.map(p => {
    const name    = String(p.name).trim();
    const desc    = p.description ? String(p.description).trim() : '';
    const url     = p.url && String(p.url).trim();
    const nameHtml = url
      ? `<a href="${url}" target="_blank" rel="noopener noreferrer">${name}</a>`
      : name;
    return `
      <div class="about-project-item">
        <h4 class="about-project-name">${nameHtml}</h4>
        ${desc ? `<p class="about-project-desc">${desc}</p>` : ''}
      </div>`;
  }).join('');
}

function renderExperience(cfg) {
  const panel = document.getElementById('about-experience-panel');
  const body  = document.getElementById('about-experience-body');
  if (!panel || !body) return;

  const valid = cfg.experience.filter(e =>
    e && typeof e === 'object' && e.role && e.company &&
    String(e.role).trim() && String(e.company).trim()
  );
  if (valid.length === 0) return;

  panel.style.display = '';
  body.innerHTML = valid.map(e => {
    const role   = String(e.role).trim();
    const company = String(e.company).trim();
    const period  = e.period      ? String(e.period).trim()      : '';
    const desc    = e.description ? String(e.description).trim() : '';
    return `
      <div class="about-exp-item">
        <div class="about-exp-header">
          <span class="about-exp-role">${role}</span>
          <span class="about-exp-company">${company}</span>
        </div>
        ${period ? `<p class="about-exp-period">${period}</p>` : ''}
        ${desc   ? `<p class="about-exp-desc">${desc}</p>`     : ''}
      </div>`;
  }).join('');
}

document.addEventListener('DOMContentLoaded', () => {
  const cfg = getConfig();
  renderAvatar(cfg);
  renderProfileInfo(cfg);
  renderContact(cfg);
  renderSkills(cfg);
  renderProjects(cfg);
  renderExperience(cfg);
});

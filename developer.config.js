'use strict';

/**
 * Developer configuration for the About page.
 * Edit the values below to personalise the page.
 * Leave any field as an empty string '' to hide it.
 * Leave skills / projects / experience as empty arrays [] to hide those sections.
 */
const DEVELOPER_CONFIG = {

  // ── Profile ────────────────────────────────────────────────
  /** Display name shown in the profile card. */
  name: 'Your Name',

  /** Short job title shown beneath the name. */
  title: 'Software Developer',

  /** One- to three-sentence bio. */
  bio: '',

  /** URL to a profile photo. Leave empty to show initials avatar instead. */
  avatarUrl: '',

  // ── Contact ────────────────────────────────────────────────
  /** Rendered as a mailto: link. Leave empty to hide. */
  email: '',

  /** Rendered as a tel: link. Leave empty to hide. */
  phone: '',

  /** Full GitHub profile URL e.g. 'https://github.com/yourhandle'. Leave empty to hide. */
  github: '',

  /** Full LinkedIn profile URL e.g. 'https://linkedin.com/in/yourhandle'. Leave empty to hide. */
  linkedin: '',

  // ── Skills ─────────────────────────────────────────────────
  /**
   * Array of skill strings. The entire Skills section is hidden when empty.
   * Example: ['JavaScript', 'HTML & CSS', 'SQL', 'Node.js']
   */
  skills: [],

  // ── Projects ───────────────────────────────────────────────
  /**
   * Array of project objects. The entire Projects section is hidden when empty.
   * Each: { name, description, url }  — url is optional.
   * Example:
   * [
   *   { name: 'ABC Logistics App', description: 'Inventory management SPA.', url: '' },
   *   { name: 'Portfolio Site',    description: 'Personal website.',          url: 'https://example.com' },
   * ]
   */
  projects: [],

  // ── Experience ─────────────────────────────────────────────
  /**
   * Array of experience objects. The entire Experience section is hidden when empty.
   * Each: { role, company, period, description }  — period and description are optional.
   * Example:
   * [
   *   { role: 'Junior Developer', company: 'Acme Corp', period: '2023 – Present', description: 'Built web apps.' },
   * ]
   */
  experience: [],

};

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
  name: 'Matthew Cheng',

  /** Short job title shown beneath the name. */
  title: 'Software Developer',

  /** One- to three-sentence bio. */
  bio: 'I am a passionate software developer with experience in building scalable web applications. I enjoy working with JavaScript and exploring new technologies. In my free time, I contribute to open-source projects and write technical blogs.  ',

  /** URL to a profile photo. Leave empty to show initials avatar instead. */
  avatarUrl: '',

  // ── Contact ────────────────────────────────────────────────
  /** Rendered as a mailto: link. Leave empty to hide. */
  email: 'wkc10@sfu.ca',

  /** Rendered as a tel: link. Leave empty to hide. */
  phone: '123456789',

  /** Full GitHub profile URL e.g. 'https://github.com/yourhandle'. Leave empty to hide. */
  github: 'https://github.com/polarbaejr',

  /** Full LinkedIn profile URL e.g. 'https://linkedin.com/in/yourhandle'. Leave empty to hide. */
  linkedin: 'https://www.linkedin.com/in/matthew-cheng-79b38229/',

  // ── Skills ─────────────────────────────────────────────────
  /**
   * Array of skill strings. The entire Skills section is hidden when empty.
   * Example: ['JavaScript', 'HTML & CSS', 'SQL', 'Node.js']
   */
  skills: ["JavaScript", "HTML & CSS", "SQL", "Node.js", "React", "Git", "Agile Methodologies", "Problem Solving", "Communication", "Teamwork"],

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
  projects: [
    { name: 'Accounting Dashboard', description: 'A web application for managing and visualizing financial data, built with React and Node.js.', url: 'https://github.com/polarbaejr/Accounting_Dashboard' },
    { name: 'Taq-Event-Bot', description: ' A discord bot that manages announcements, applications, and events for the Taq-Event Discord server, built with Node.js and Discord.js.', url: 'https://github.com/polarbaejr/Taq-Event-Bot'}

  ],

  // ── Experience ─────────────────────────────────────────────
  /**
   * Array of experience objects. The entire Experience section is hidden when empty.
   * Each: { role, company, period, description }  — period and description are optional.
   * Example:
   * [
   *   { role: 'Junior Developer', company: 'Acme Corp', period: '2023 – Present', description: 'Built web apps.' },
   * ]
   */
  experience: [ 
    { role: 'Software Developer', company: 'ABC Logistics', period: '2023 – Present', description: 'Developed and maintained web applications using JavaScript, React, and Node.js.' },
    { role: 'Junior Developer Intern', company: 'XYZ Technologies', period: 'Summer 2022', description: 'Assisted in building and testing web applications for internal clients.' }],
  
};

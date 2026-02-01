#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const WORKSPACE = process.env.WORKSPACE_PATH || '/Users/nodefynode04/clawd';
const OUTPUT_DIR = path.join(__dirname, '../public/data');

const CONFIG_FILES = ['AGENTS.md', 'SOUL.md', 'USER.md', 'MEMORY.md', 'TOOLS.md', 'HEARTBEAT.md', 'IDENTITY.md'];
const SKIP_DIRS = ['.git', 'node_modules', '.next', 'security', 'secrets', 'backups', '.vercel'];

function getDirectorySize(dir) {
  let size = 0;
  try {
    const items = fs.readdirSync(dir, { withFileTypes: true });
    for (const item of items) {
      if (item.name === 'node_modules' || item.name === '.git') continue;
      const fullPath = path.join(dir, item.name);
      if (item.isFile()) {
        size += fs.statSync(fullPath).size;
      } else if (item.isDirectory()) {
        size += getDirectorySize(fullPath);
      }
    }
  } catch {
    // ignore errors
  }
  return size;
}

function generateProjects() {
  const items = fs.readdirSync(WORKSPACE, { withFileTypes: true });
  const projects = [];

  for (const item of items) {
    if (item.name.startsWith('.') && item.name !== '.git') continue;
    if (SKIP_DIRS.includes(item.name)) continue;

    const fullPath = path.join(WORKSPACE, item.name);
    const stats = fs.statSync(fullPath);

    if (item.isDirectory()) {
      const hasReadme = fs.existsSync(path.join(fullPath, 'README.md')) || 
                        fs.existsSync(path.join(fullPath, 'PLAN.md'));
      const hasPackage = fs.existsSync(path.join(fullPath, 'package.json'));

      projects.push({
        name: item.name,
        path: fullPath,
        type: 'project',
        hasReadme: hasReadme || hasPackage,
        lastModified: stats.mtime.toISOString(),
        size: getDirectorySize(fullPath),
      });
    } else if (item.isFile() && CONFIG_FILES.includes(item.name)) {
      projects.push({
        name: item.name,
        path: fullPath,
        type: 'config',
        hasReadme: false,
        lastModified: stats.mtime.toISOString(),
        size: stats.size,
      });
    }
  }

  // Sort by last modified
  projects.sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime());

  return projects;
}

async function generateSessions() {
  try {
    const res = await fetch('http://localhost:18789/api/sessions?limit=50&messageLimit=0');
    if (res.ok) {
      const data = await res.json();
      return data.sessions || [];
    }
  } catch (e) {
    console.log('Could not fetch sessions from Moltbot:', e.message);
  }
  return [];
}

async function main() {
  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const projects = generateProjects();
  const sessions = await generateSessions();

  const data = {
    projects,
    sessions,
    generatedAt: new Date().toISOString(),
    workspace: WORKSPACE,
  };

  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'workspace.json'),
    JSON.stringify(data, null, 2)
  );

  console.log(`Generated workspace.json with ${projects.length} projects and ${sessions.length} sessions`);
}

main();

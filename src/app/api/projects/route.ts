import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

interface Project {
  name: string;
  path: string;
  type: 'project' | 'config' | 'memory';
  hasReadme: boolean;
  lastModified: string;
  size: number;
}

const WORKSPACE = process.env.WORKSPACE_PATH || '/Users/nodefynode04/clawd';

const CONFIG_FILES = ['AGENTS.md', 'SOUL.md', 'USER.md', 'MEMORY.md', 'TOOLS.md', 'HEARTBEAT.md', 'IDENTITY.md'];
const SKIP_DIRS = ['.git', 'node_modules', '.next', 'security', 'secrets', 'backups'];

export async function GET() {
  try {
    const items = fs.readdirSync(WORKSPACE, { withFileTypes: true });
    const projects: Project[] = [];

    for (const item of items) {
      if (item.name.startsWith('.') && item.name !== '.git') continue;
      if (SKIP_DIRS.includes(item.name)) continue;

      const fullPath = path.join(WORKSPACE, item.name);
      const stats = fs.statSync(fullPath);

      if (item.isDirectory()) {
        // Check if it has a README or package.json
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

    return NextResponse.json({ projects, workspace: WORKSPACE });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

function getDirectorySize(dir: string): number {
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

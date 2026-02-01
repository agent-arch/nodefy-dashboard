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

// Try static data first (for Vercel), then live data (for local)
export async function GET() {
  // Check for static data file first
  const staticPath = path.join(process.cwd(), 'public/data/workspace.json');
  
  if (fs.existsSync(staticPath)) {
    try {
      const data = JSON.parse(fs.readFileSync(staticPath, 'utf-8'));
      return NextResponse.json({ 
        projects: data.projects, 
        workspace: data.workspace,
        generatedAt: data.generatedAt,
        source: 'static'
      });
    } catch (e) {
      console.error('Error reading static data:', e);
    }
  }

  // Fall back to live filesystem scan (local development)
  const WORKSPACE = process.env.WORKSPACE_PATH || '/Users/nodefynode04/clawd';
  const CONFIG_FILES = ['AGENTS.md', 'SOUL.md', 'USER.md', 'MEMORY.md', 'TOOLS.md', 'HEARTBEAT.md', 'IDENTITY.md'];
  const SKIP_DIRS = ['.git', 'node_modules', '.next', 'security', 'secrets', 'backups'];

  try {
    const items = fs.readdirSync(WORKSPACE, { withFileTypes: true });
    const projects: Project[] = [];

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

    projects.sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime());

    return NextResponse.json({ projects, workspace: WORKSPACE, source: 'live' });
  } catch (error) {
    return NextResponse.json({ error: String(error), projects: [] }, { status: 500 });
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

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Project {
  name: string;
  path: string;
  type: 'project' | 'config' | 'memory';
  hasReadme: boolean;
  lastModified: string;
  size: number;
}

interface Session {
  key: string;
  kind: string;
  channel: string;
  displayName?: string;
  model?: string;
  totalTokens?: number;
  updatedAt: number;
  sessionId: string;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function formatDate(date: string): string {
  return new Date(date).toLocaleString('nl-NL', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function timeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function Dashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'projects' | 'config'>('all');
  const router = useRouter();

  async function handleLogout() {
    await fetch('/api/auth', { method: 'DELETE' });
    router.push('/login');
    router.refresh();
  }

  useEffect(() => {
    async function fetchData() {
      try {
        const [projectsRes, sessionsRes] = await Promise.all([
          fetch('/api/projects'),
          fetch('/api/sessions'),
        ]);
        
        const projectsData = await projectsRes.json();
        const sessionsData = await sessionsRes.json();
        
        setProjects(projectsData.projects || []);
        setSessions(sessionsData.sessions || []);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
    // Refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const filteredProjects = projects.filter(p => {
    if (filter === 'all') return true;
    if (filter === 'projects') return p.type === 'project';
    if (filter === 'config') return p.type === 'config';
    return true;
  });

  const projectCount = projects.filter(p => p.type === 'project').length;
  const configCount = projects.filter(p => p.type === 'config').length;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-xl">
                N
              </div>
              <div>
                <h1 className="text-xl font-semibold">Nodefy Dashboard</h1>
                <p className="text-sm text-zinc-500">AI Agent Workspace</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                <span className="text-zinc-400">Live</span>
              </div>
              <button
                onClick={handleLogout}
                className="px-3 py-1.5 text-sm text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
              >
                Uitloggen
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800">
            <div className="text-3xl font-bold text-blue-400">{projectCount}</div>
            <div className="text-sm text-zinc-500">Projects</div>
          </div>
          <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800">
            <div className="text-3xl font-bold text-purple-400">{sessions.length}</div>
            <div className="text-sm text-zinc-500">Active Sessions</div>
          </div>
          <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800">
            <div className="text-3xl font-bold text-green-400">{configCount}</div>
            <div className="text-sm text-zinc-500">Config Files</div>
          </div>
          <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800">
            <div className="text-3xl font-bold text-orange-400">
              {formatBytes(projects.reduce((acc, p) => acc + p.size, 0))}
            </div>
            <div className="text-sm text-zinc-500">Total Size</div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Projects */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Projects & Files</h2>
              <div className="flex gap-2">
                {(['all', 'projects', 'config'] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                      filter === f
                        ? 'bg-blue-600 text-white'
                        : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                    }`}
                  >
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredProjects.map((project) => (
                  <div
                    key={project.path}
                    className="bg-zinc-900 rounded-xl p-4 border border-zinc-800 hover:border-zinc-700 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg ${
                            project.type === 'project'
                              ? 'bg-blue-600/20 text-blue-400'
                              : 'bg-purple-600/20 text-purple-400'
                          }`}
                        >
                          {project.type === 'project' ? '📁' : '📄'}
                        </div>
                        <div>
                          <h3 className="font-medium">{project.name}</h3>
                          <p className="text-sm text-zinc-500">
                            {formatDate(project.lastModified)} · {formatBytes(project.size)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {project.hasReadme && (
                          <span className="px-2 py-1 bg-green-600/20 text-green-400 text-xs rounded-full">
                            README
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sessions */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Active Sessions</h2>
            <div className="space-y-2">
              {sessions.length === 0 ? (
                <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800 text-center text-zinc-500">
                  No active sessions
                </div>
              ) : (
                sessions.map((session) => (
                  <div
                    key={session.key}
                    className="bg-zinc-900 rounded-xl p-4 border border-zinc-800"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${
                          session.channel === 'telegram'
                            ? 'bg-blue-600/20 text-blue-400'
                            : session.channel === 'slack'
                            ? 'bg-purple-600/20 text-purple-400'
                            : 'bg-zinc-700 text-zinc-400'
                        }`}
                      >
                        {session.channel === 'telegram' ? '✈️' : 
                         session.channel === 'slack' ? '💬' : '🤖'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium truncate text-sm">
                          {session.displayName || session.key.split(':').slice(-1)[0]}
                        </h3>
                        <p className="text-xs text-zinc-500">{timeAgo(session.updatedAt)}</p>
                      </div>
                    </div>
                    {session.totalTokens && (
                      <div className="text-xs text-zinc-500">
                        {(session.totalTokens / 1000).toFixed(1)}k tokens
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800 mt-12">
        <div className="max-w-7xl mx-auto px-4 py-6 text-center text-sm text-zinc-500">
          Nodefy AI Agent Dashboard · Built with Next.js
        </div>
      </footer>
    </div>
  );
}

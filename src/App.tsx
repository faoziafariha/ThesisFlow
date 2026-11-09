import { useEffect, useState, type FormEvent } from 'react';
import {
  GraduationCap,
  LayoutDashboard,
  FolderKanban,
  CalendarDays,
  Users,
  ArrowUpRight,
  ArrowRight,
  Plus,
  Search,
  Bell,
  LogOut,
  FileText,
  CheckCircle2,
  Clock3,
  ChevronRight,
  Download,
  MessageSquare,
  ShieldCheck,
  Activity,
  Menu,
  X,
  BookOpen,
} from 'lucide-react';
type User = { id: number; name: string; email: string; role: string; approved: boolean };
type Project = {
  id: number;
  title: string;
  abstract: string;
  area: string;
  student: string;
  supervisor: string;
  status: string;
  progress: number;
};
type Workspace = {
  user: User;
  projects: Project[];
  supervisors: User[];
  reviews: {
    id: number;
    project_id: number;
    author: string;
    comment: string;
    decision: string;
    created_at: string;
  }[];
  submissions: {
    id: number;
    project_id: number;
    title: string;
    filename: string;
    created_at: string;
  }[];
  deadlines: { id: number; title: string; due_date: string; description: string }[];
  notifications: { id: number; message: string; created_at: string }[];
  users: User[];
  audit: { id: number; name: string; action: string; created_at: string }[];
};
async function api(path: string, method = 'GET', body?: unknown) {
  const r = await fetch('/api' + path, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data.error || 'Request failed');
  return data;
}
const date = (s: string) =>
  new Date(s.slice(0, 10) + 'T12:00:00').toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
const badge = (s: string) => `badge ${s.toLowerCase().replaceAll(' ', '-')}`;
export default function App() {
  const [data, setData] = useState<Workspace | null>(null),
    [ready, setReady] = useState(false),
    [demo, setDemo] = useState(false),
    [view, setView] = useState('Overview'),
    [query, setQuery] = useState(''),
    [filter, setFilter] = useState('All statuses'),
    [selected, setSelected] = useState<Project | null>(null),
    [modal, setModal] = useState(''),
    [error, setError] = useState(''),
    [notice, setNotice] = useState(''),
    [busy, setBusy] = useState(false),
    [mobile, setMobile] = useState(false);
  async function load() {
    const d = await api('/workspace');
    setData(d);
    setSelected((p) => (p ? d.projects.find((x: Project) => x.id === p.id) || null : null));
  }
  useEffect(() => {
    Promise.all([api('/config').then((c) => setDemo(c.demo)), load().catch(() => {})]).finally(() =>
      setReady(true),
    );
  }, []);
  useEffect(() => {
    if (notice) {
      const t = setTimeout(() => setNotice(''), 5000);
      return () => clearTimeout(t);
    }
  }, [notice]);
  useEffect(() => {
    if (!modal) return;
    const previous = document.activeElement as HTMLElement | null;
    const dialog = document.querySelector<HTMLElement>('[role="dialog"]');
    if (!dialog) return;
    const focusable = () =>
      Array.from(
        dialog.querySelectorAll<HTMLElement>(
          'button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href]',
        ),
      );
    (dialog.querySelector<HTMLElement>('input, select, textarea') || focusable()[0])?.focus();
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !busy) {
        setModal('');
        setError('');
      }
      if (event.key !== 'Tab') return;
      const items = focusable();
      const first = items[0],
        last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    dialog.addEventListener('keydown', handleKey);
    return () => {
      dialog.removeEventListener('keydown', handleKey);
      previous?.focus();
    };
  }, [modal, busy]);
  async function act(action: () => Promise<unknown>, success: string) {
    setBusy(true);
    setError('');
    try {
      await action();
      await load();
      setModal('');
      setNotice(success);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function login(role: string) {
    setBusy(true);
    setError('');
    try {
      await api('/auth/demo', 'POST', { role });
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const form = (e: FormEvent<HTMLFormElement>) => Object.fromEntries(new FormData(e.currentTarget));
  if (!ready)
    return (
      <div className="loading">
        <GraduationCap size={40} />
        <p>Opening your workspace…</p>
      </div>
    );
  if (!data)
    return (
      <div className="login-shell">
        <div className="login-story">
          <div className="brand">
            <GraduationCap />
            <span>
              thesis<span className="brand-light">flow</span>
              <small>ACADEMIC WORKSPACE</small>
            </span>
          </div>
          <div>
            <span className="eyebrow">FROM FIRST IDEA TO FINAL DEFENSE</span>
            <h1>
              Great research.
              <br />A clearer path.
            </h1>
            <p>
              One shared workspace for the people, ideas, and milestones behind your next discovery.
            </p>
            <div className="story-tags">
              <span>
                <CheckCircle2 size={16} /> Proposals & reviews
              </span>
              <span>
                <CheckCircle2 size={16} /> Progress & submissions
              </span>
            </div>
          </div>
          <p className="story-footer">Inspired by the CUET Thesis & Project Portal · CSE</p>
        </div>
        <main className="login-panel">
          <div className="login-card">
            <span className="eyebrow">WELCOME TO THESISFLOW</span>
            <h2>Your research starts here.</h2>
            <p className="muted">Sign in to your academic workspace.</p>
            {error && (
              <div role="alert" className="error">
                {error}
              </div>
            )}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const f = form(e);
                void act(() => api('/auth/login', 'POST', f), 'Welcome back');
              }}
            >
              <label>
                Email address
                <input
                  name="email"
                  type="email"
                  required
                  placeholder="you@university.edu"
                  autoComplete="username"
                />
              </label>
              <label>
                Password
                <input
                  name="password"
                  type="password"
                  required
                  autoComplete="current-password"
                  placeholder="Enter your password"
                />
              </label>
              <button className="primary full" disabled={busy}>
                Sign in <ArrowRight size={17} />
              </button>
            </form>
            {demo && (
              <>
                <div className="divider">EXPLORE THE LIVE DEMO</div>
                <div className="demo-roles">
                  {['student', 'supervisor', 'admin'].map((r, i) => (
                    <button key={r} disabled={busy} onClick={() => void login(r)}>
                      {i === 0 ? <GraduationCap /> : i === 1 ? <BookOpen /> : <ShieldCheck />}
                      <span>{r[0].toUpperCase() + r.slice(1)}</span>
                      <ArrowUpRight size={16} />
                    </button>
                  ))}
                </div>
                <p className="fine">
                  Demo accounts share sample data. Use fictional information only.
                </p>
              </>
            )}
            <div className="login-meta">
              <span>Role-based access</span>
              <span>Persistent workspace</span>
            </div>
          </div>
        </main>
      </div>
    );
  const { user, projects, deadlines } = data;
  const active = projects.filter((p) => p.status !== 'Completed');
  const avg = projects.length
    ? Math.round(projects.reduce((n, p) => n + p.progress, 0) / projects.length)
    : 0;
  const list = projects.filter(
    (p) =>
      (filter === 'All statuses' || p.status === filter) &&
      `${p.title} ${p.area} ${p.student} ${p.supervisor}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  const nav = [
    'Overview',
    'Projects',
    'Deadlines',
    'Supervisors',
    ...(user.role === 'admin' ? ['Administration'] : []),
  ];
  const icons = [LayoutDashboard, FolderKanban, CalendarDays, Users, ShieldCheck];
  const navigate = (v: string) => {
    setView(v);
    setSelected(null);
    setMobile(false);
    setQuery('');
    setFilter('All statuses');
    setError('');
  };
  const projectCards = (ps: Project[]) => (
    <div className="project-grid">
      {ps.map((p, i) => (
        <button
          className="project-card"
          key={p.id}
          onClick={() => {
            setSelected(p);
            setError('');
          }}
        >
          <div className="card-top">
            <span className={'project-icon tone-' + (i % 3)}>
              <FolderKanban size={22} />
            </span>
            <span className={badge(p.status)}>{p.status}</span>
          </div>
          <span className="category">{p.area}</span>
          <h3>{p.title}</h3>
          <p className="card-abstract">{p.abstract}</p>
          <div className="project-person">
            <span className="avatar small">
              {p.supervisor
                .split(' ')
                .filter((x) => x !== 'Dr.')
                .map((x) => x[0])
                .slice(0, 2)
                .join('')}
            </span>
            <span>
              {user.role === 'student' ? p.supervisor : p.student}
              <small>{user.role === 'student' ? 'Supervisor' : 'Student researcher'}</small>
            </span>
          </div>
          <div className="progress-label">
            <span>Project progress</span>
            <strong>{p.progress}%</strong>
          </div>
          <div className="progress-track">
            <div style={{ width: p.progress + '%' }} />
          </div>
          <div className="card-foot">
            <span>PRJ-{String(p.id).padStart(3, '0')}</span>
            <span>
              View project <ArrowUpRight size={14} />
            </span>
          </div>
        </button>
      ))}
    </div>
  );
  return (
    <div className="app">
      <aside className={mobile ? 'sidebar open' : 'sidebar'}>
        <a
          className="brand"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            navigate('Overview');
          }}
        >
          <GraduationCap />
          <span>
            thesis<span className="brand-light">flow</span>
            <small>ACADEMIC WORKSPACE</small>
          </span>
        </a>
        <div className="workspace-label">
          WORKSPACE <span>2026–27</span>
        </div>
        <nav>
          {nav.map((v, i) => {
            const Icon = icons[i];
            return (
              <button
                key={v}
                onClick={() => navigate(v)}
                className={view === v ? 'nav-item active' : 'nav-item'}
              >
                <Icon size={19} />
                {v}
                {v === 'Projects' && <span>{projects.length}</span>}
              </button>
            );
          })}
        </nav>
        <div className="sidebar-note">
          <div className="note-icon">
            <BookOpen size={21} />
          </div>
          <h4>Make every milestone count.</h4>
          <p>
            A little progress today.
            <br />A big discovery tomorrow.
          </p>
          <button onClick={() => navigate('Deadlines')}>
            View academic calendar <ArrowUpRight size={15} />
          </button>
        </div>
        <div className="account">
          <span className="avatar">
            {user.name
              .split(' ')
              .map((x) => x[0])
              .slice(0, 2)
              .join('')}
          </span>
          <div>
            <strong>{user.name}</strong>
            <small>{user.role} workspace</small>
          </div>
          <button
            aria-label="Sign out"
            title="Sign out"
            onClick={async () => {
              try {
                await api('/auth/logout', 'POST');
                setData(null);
                setView('Overview');
                setSelected(null);
              } catch (e) {
                setError((e as Error).message);
              }
            }}
          >
            <LogOut size={18} />
          </button>
        </div>
      </aside>
      {mobile && (
        <button className="scrim" aria-label="Close menu" onClick={() => setMobile(false)} />
      )}
      <div className="main-wrap">
        <header className="topbar">
          <button
            className="mobile-menu icon-button"
            aria-label="Open menu"
            onClick={() => setMobile(!mobile)}
          >
            <Menu />
          </button>
          <div className="breadcrumbs">
            Workspace <ChevronRight size={14} />
            <strong>{view}</strong>
          </div>
          <div className="top-actions">
            {demo && (
              <span className="demo-indicator">
                <i /> Live demo
              </span>
            )}
            <span className="today">{date(new Date().toISOString())}</span>
            <button
              className="icon-button notification-button"
              aria-label="View notifications"
              onClick={() => setModal('notifications')}
            >
              <Bell size={19} />
              {data.notifications.length > 0 && <i />}
            </button>
          </div>
        </header>
        <main className="content">
          {notice && (
            <div className="toast" role="status">
              <CheckCircle2 size={18} />
              {notice}
            </div>
          )}
          {error && !modal && (
            <div className="error" role="alert">
              {error}
            </div>
          )}
          {selected ? (
            <>
              <button className="back-link" onClick={() => setSelected(null)}>
                ← Back to {view.toLowerCase()}
              </button>
              <div className="page-heading">
                <div>
                  <span className="eyebrow">
                    PROJECT / PRJ-{String(selected.id).padStart(3, '0')}
                  </span>
                  <h1>{selected.title}</h1>
                  <p>
                    {selected.area} · {selected.student}
                  </p>
                </div>
                <span className={badge(selected.status)}>{selected.status}</span>
              </div>
              <div className="detail-layout">
                <div>
                  <section className="panel">
                    <h2>Research overview</h2>
                    <p className="abstract">{selected.abstract}</p>
                    <div className="detail-meta">
                      <span>
                        SUPERVISOR<strong>{selected.supervisor}</strong>
                      </span>
                      <span>
                        PROGRESS<strong>{selected.progress}% complete</strong>
                      </span>
                    </div>
                    <div className="progress-track">
                      <div style={{ width: selected.progress + '%' }} />
                    </div>
                    {user.role === 'student' &&
                      ['Approved', 'In progress'].includes(selected.status) && (
                        <form
                          className="inline-form"
                          onSubmit={(e) => {
                            e.preventDefault();
                            const f = form(e);
                            void act(
                              () =>
                                api(`/projects/${selected.id}/progress`, 'PATCH', {
                                  progress: Number(f.progress),
                                }),
                              'Progress updated',
                            );
                          }}
                        >
                          <label>
                            Update progress (%)
                            <input
                              name="progress"
                              type="number"
                              min="0"
                              max="100"
                              required
                              defaultValue={selected.progress}
                              key={selected.progress}
                            />
                          </label>
                          <button className="secondary" disabled={busy}>
                            Save progress
                          </button>
                        </form>
                      )}
                  </section>
                  <section className="panel">
                    <div className="section-heading">
                      <h2>Submission history</h2>
                      {user.role === 'student' && (
                        <button className="secondary" onClick={() => setModal('upload')}>
                          <Plus size={16} /> Submit PDF
                        </button>
                      )}
                    </div>
                    <p className="muted">Each upload is saved as a new version.</p>
                    {data.submissions
                      .filter((s) => s.project_id === selected.id)
                      .map((s, i) => (
                        <div className="submission" key={s.id}>
                          <span className="file-icon">
                            <FileText />
                          </span>
                          <div>
                            <strong>{s.title}</strong>
                            <small>
                              {s.filename} · {date(s.created_at)} · Version{' '}
                              {data.submissions.filter((x) => x.project_id === selected.id).length -
                                i}
                            </small>
                          </div>
                          <a
                            className="icon-button"
                            href={`/api/submissions/${s.id}/download`}
                            aria-label={'Download ' + s.title}
                          >
                            <Download size={19} />
                          </a>
                        </div>
                      ))}
                    {!data.submissions.some((s) => s.project_id === selected.id) && (
                      <div className="empty compact">
                        <FileText />
                        <p>No documents submitted yet.</p>
                      </div>
                    )}
                  </section>
                </div>
                <div>
                  <section className="panel">
                    <h2>Supervisor feedback</h2>
                    {data.reviews
                      .filter((r) => r.project_id === selected.id)
                      .map((r) => (
                        <article className="review" key={r.id}>
                          <div>
                            <span className={badge(r.decision)}>{r.decision}</span>
                            <small>{date(r.created_at)}</small>
                          </div>
                          <p>{r.comment}</p>
                          <strong>{r.author}</strong>
                        </article>
                      ))}
                    {!data.reviews.some((r) => r.project_id === selected.id) && (
                      <p className="muted">Feedback will appear here after review.</p>
                    )}
                    {user.role === 'supervisor' && (
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          void act(
                            () => api(`/projects/${selected.id}/reviews`, 'POST', form(e)),
                            'Review sent to student',
                          );
                        }}
                      >
                        <label>
                          Review decision
                          <select name="decision">
                            <option>Approved</option>
                            <option>Changes requested</option>
                            <option>In progress</option>
                            <option>Completed</option>
                          </select>
                        </label>
                        <label>
                          Feedback
                          <textarea
                            name="comment"
                            minLength={5}
                            maxLength={3000}
                            required
                            placeholder="Share actionable feedback…"
                          />
                        </label>
                        <button className="primary" disabled={busy}>
                          <MessageSquare size={16} /> Send review
                        </button>
                      </form>
                    )}
                  </section>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="page-heading">
                <div>
                  <span className="eyebrow">
                    {view === 'Overview' ? 'YOUR RESEARCH, IN FOCUS' : 'ACADEMIC WORKSPACE'}
                  </span>
                  <h1>
                    {view === 'Overview'
                      ? `Welcome back, ${user.name.replace('Dr. ', '').split(' ')[0]}`
                      : view}
                    <span className="heading-dot">{view === 'Overview' ? '.' : ''}</span>
                  </h1>
                  <p>
                    {view === 'Overview'
                      ? "Here's where your research journey stands today."
                      : view === 'Projects'
                        ? 'From an early idea to a finished piece of research.'
                        : view === 'Deadlines'
                          ? 'A clear view of what’s ahead.'
                          : view === 'Supervisors'
                            ? 'Connect your research with the right expertise.'
                            : 'Manage access and keep your academic cycle on track.'}
                  </p>
                </div>
                {user.role === 'student' && ['Overview', 'Projects'].includes(view) && (
                  <button className="primary" onClick={() => setModal('proposal')}>
                    <Plus size={18} /> New proposal
                  </button>
                )}
                {view === 'Deadlines' && user.role === 'admin' && (
                  <button className="primary" onClick={() => setModal('deadline')}>
                    <Plus size={18} /> Add deadline
                  </button>
                )}
              </div>
              {view === 'Overview' && (
                <>
                  <div className="stats-grid">
                    {[
                      {
                        label: 'Total projects',
                        value: projects.length,
                        sub: 'Across your workspace',
                        icon: FolderKanban,
                      },
                      {
                        label: 'Active research',
                        value: active.length,
                        sub: 'Ideas moving forward',
                        icon: Activity,
                      },
                      {
                        label: 'Average progress',
                        value: avg + '%',
                        sub: 'One milestone at a time',
                        icon: CheckCircle2,
                      },
                      {
                        label: 'Upcoming deadlines',
                        value: deadlines.filter(
                          (d) => d.due_date >= new Date().toISOString().slice(0, 10),
                        ).length,
                        sub: 'Stay a step ahead',
                        icon: Clock3,
                      },
                    ].map((s, i) => (
                      <section className="stat-card" key={s.label}>
                        <div>
                          <span>{s.label}</span>
                          <s.icon size={20} />
                        </div>
                        <strong>{s.value}</strong>
                        <small>
                          <i className={'stat-dot dot-' + i} />
                          {s.sub}
                        </small>
                      </section>
                    ))}
                  </div>
                  <div className="dashboard-columns">
                    <div>
                      <div className="section-heading">
                        <h2>
                          Your projects <span className="count">{projects.length}</span>
                        </h2>
                        <button className="text-button" onClick={() => navigate('Projects')}>
                          View all projects <ArrowRight size={15} />
                        </button>
                      </div>
                      {projectCards(projects.slice(0, 2))}
                      {projects.length === 0 && (
                        <div className="empty">
                          <FolderKanban />
                          <p>Your next discovery begins with a proposal.</p>
                        </div>
                      )}
                      <section className="research-banner">
                        <span className="banner-art">
                          <GraduationCap size={62} />
                        </span>
                        <div>
                          <span className="eyebrow">SMALL STEPS. MEANINGFUL RESEARCH.</span>
                          <h3>Your next milestone is within reach.</h3>
                          <p>Keep your submissions up to date and your supervisor in the loop.</p>
                          <button onClick={() => navigate('Projects')}>
                            Continue your research <ArrowRight size={16} />
                          </button>
                        </div>
                      </section>
                    </div>
                    <aside>
                      <section className="panel deadlines-panel">
                        <div className="section-heading">
                          <h2>On the horizon</h2>
                          <CalendarDays size={19} />
                        </div>
                        {deadlines.slice(0, 3).map((d) => (
                          <div className="deadline-item" key={d.id}>
                            <div className="date-tile">
                              <strong>{new Date(d.due_date + 'T12:00:00').getDate()}</strong>
                              <span>
                                {new Date(d.due_date + 'T12:00:00').toLocaleDateString('en', {
                                  month: 'short',
                                })}
                              </span>
                            </div>
                            <div>
                              <h4>{d.title}</h4>
                              <small>{date(d.due_date)}</small>
                            </div>
                          </div>
                        ))}
                        <button className="calendar-link" onClick={() => navigate('Deadlines')}>
                          View full calendar <ArrowRight size={15} />
                        </button>
                      </section>
                      <section className="panel activity-panel">
                        <h2>Recent feedback</h2>
                        {data.reviews.slice(0, 2).map((r) => (
                          <div className="feedback-preview" key={r.id}>
                            <span className="activity-line">
                              <MessageSquare size={15} />
                            </span>
                            <div>
                              <strong>{r.author}</strong>
                              <p>{r.comment}</p>
                              <button
                                className="text-button"
                                onClick={() =>
                                  setSelected(projects.find((p) => p.id === r.project_id) || null)
                                }
                              >
                                Open project <ArrowUpRight size={13} />
                              </button>
                            </div>
                          </div>
                        ))}
                        {!data.reviews.length && (
                          <p className="muted">New feedback will appear here.</p>
                        )}
                      </section>
                    </aside>
                  </div>
                </>
              )}
              {view === 'Projects' && (
                <>
                  <div className="filter-bar">
                    <div className="search">
                      <Search size={18} />
                      <input
                        aria-label="Search projects"
                        placeholder="Search projects, people, or research areas…"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                      />
                    </div>
                    <select
                      aria-label="Filter by status"
                      value={filter}
                      onChange={(e) => setFilter(e.target.value)}
                    >
                      {[
                        'All statuses',
                        'Proposed',
                        'Approved',
                        'Changes requested',
                        'In progress',
                        'Completed',
                      ].map((x) => (
                        <option key={x}>{x}</option>
                      ))}
                    </select>
                  </div>
                  {projectCards(list)}
                  {!list.length && (
                    <div className="empty">
                      <Search />
                      <h3>No matching projects</h3>
                      <p>Try another search or create a proposal.</p>
                    </div>
                  )}
                </>
              )}
              {view === 'Deadlines' && (
                <div className="deadline-grid">
                  {deadlines.map((d) => (
                    <section className="panel deadline-full" key={d.id}>
                      <CalendarDays size={26} />
                      <span className="category">{date(d.due_date)}</span>
                      <h2>{d.title}</h2>
                      <p>{d.description}</p>
                      <span className="badge approved">Academic milestone</span>
                    </section>
                  ))}
                </div>
              )}
              {view === 'Supervisors' && (
                <div className="supervisor-grid">
                  {data.supervisors.map((s) => (
                    <section className="panel supervisor-card" key={s.id}>
                      <span className="avatar large">
                        {s.name
                          .replace('Dr. ', '')
                          .split(' ')
                          .map((x) => x[0])
                          .join('')}
                      </span>
                      <h2>{s.name}</h2>
                      <span className="badge approved">Approved supervisor</span>
                      <p>{s.email}</p>
                      <p className="muted">
                        {projects.filter((p) => p.supervisor === s.name).length} projects in your
                        workspace
                      </p>
                      {user.role === 'student' && (
                        <button className="secondary" onClick={() => setModal('proposal')}>
                          Start a proposal <ArrowUpRight size={15} />
                        </button>
                      )}
                    </section>
                  ))}
                </div>
              )}
              {view === 'Administration' && (
                <>
                  <section className="panel">
                    <h2>Account approvals</h2>
                    <div className="table-scroll">
                      <table>
                        <thead>
                          <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th>Access</th>
                            <th>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.users.map((u) => (
                            <tr key={u.id}>
                              <td>{u.name}</td>
                              <td>{u.email}</td>
                              <td>{u.role}</td>
                              <td>
                                <span className={badge(u.approved ? 'Approved' : 'Proposed')}>
                                  {u.approved ? 'Approved' : 'Pending'}
                                </span>
                              </td>
                              <td>
                                {!u.approved && (
                                  <button
                                    className="secondary"
                                    disabled={busy}
                                    onClick={() =>
                                      void act(
                                        () => api(`/users/${u.id}/approve`, 'PATCH'),
                                        'Account approved',
                                      )
                                    }
                                  >
                                    Approve account
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </section>
                  <section className="panel">
                    <h2>Audit trail</h2>
                    {data.audit.map((a) => (
                      <div className="audit-row" key={a.id}>
                        <ShieldCheck size={17} />
                        <strong>{a.name}</strong>
                        <span>{a.action}</span>
                        <small>{date(a.created_at)}</small>
                      </div>
                    ))}
                    {!data.audit.length && (
                      <p className="muted">Workspace actions will be recorded here.</p>
                    )}
                  </section>
                </>
              )}
            </>
          )}
          <footer className="footer">
            <span>
              ThesisFlow <span> / </span> A little structure. A lot of possibility.
            </span>
            <span>CUET · Computer Science & Engineering</span>
          </footer>
        </main>
      </div>
      {modal && (
        <div
          className="modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget && !busy) {
              setModal('');
              setError('');
            }
          }}
        >
          <section className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
            <div className="section-heading">
              <h2 id="modal-title">
                {modal === 'proposal'
                  ? 'Start a new proposal'
                  : modal === 'upload'
                    ? 'Submit a document'
                    : modal === 'deadline'
                      ? 'Add academic deadline'
                      : 'Notifications'}
              </h2>
              <button
                className="icon-button"
                aria-label="Close dialog"
                onClick={() => {
                  setModal('');
                  setError('');
                }}
                disabled={busy}
              >
                <X />
              </button>
            </div>
            {error && (
              <div className="error" role="alert">
                {error}
              </div>
            )}
            {modal === 'proposal' && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const f = form(e);
                  void act(
                    () =>
                      api('/projects', 'POST', { ...f, supervisor_id: Number(f.supervisor_id) }),
                    'Proposal submitted for review',
                  );
                }}
              >
                <p className="muted">
                  Give your research a clear starting point. Your supervisor will review it next.
                </p>
                <label>
                  Project title
                  <input
                    name="title"
                    required
                    minLength={8}
                    maxLength={160}
                    placeholder="What would you like to explore?"
                  />
                </label>
                <div className="form-grid">
                  <label>
                    Research area
                    <input
                      name="area"
                      required
                      minLength={2}
                      maxLength={80}
                      placeholder="e.g. Machine Learning"
                    />
                  </label>
                  <label>
                    Supervisor
                    <select name="supervisor_id" required>
                      {data.supervisors.map((s) => (
                        <option value={s.id} key={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <label>
                  Proposal abstract
                  <textarea
                    name="abstract"
                    required
                    minLength={30}
                    maxLength={5000}
                    placeholder="Describe the problem, your approach, and expected outcomes (at least 30 characters)."
                  />
                </label>
                <button className="primary full" disabled={busy}>
                  {busy ? 'Submitting…' : 'Submit proposal'}
                  <ArrowRight size={17} />
                </button>
              </form>
            )}
            {modal === 'upload' && selected && (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const f = new FormData(e.currentTarget);
                  const file = f.get('file') as File;
                  if (file.size > 2097152) {
                    setError('Choose a PDF up to 2 MB');
                    return;
                  }
                  setBusy(true);
                  try {
                    const content = await new Promise<string>((resolve, reject) => {
                      const reader = new FileReader();
                      reader.onload = () => resolve(String(reader.result).split(',')[1]);
                      reader.onerror = () => reject(new Error('Unable to read file'));
                      reader.readAsDataURL(file);
                    });
                    await act(
                      () =>
                        api(`/projects/${selected.id}/submissions`, 'POST', {
                          title: f.get('title'),
                          filename: file.name,
                          content,
                        }),
                      'Document submitted',
                    );
                  } catch (e) {
                    setError((e as Error).message);
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                <p className="muted">PDF only, up to 2 MB. Previous versions stay available.</p>
                <label>
                  Submission title
                  <input
                    name="title"
                    required
                    minLength={3}
                    maxLength={120}
                    placeholder="e.g. Literature review — revision 2"
                  />
                </label>
                <label>
                  Document
                  <input name="file" type="file" accept="application/pdf,.pdf" required />
                </label>
                <button className="primary full" disabled={busy}>
                  {busy ? 'Uploading…' : 'Upload document'}
                </button>
              </form>
            )}
            {modal === 'deadline' && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void act(() => api('/deadlines', 'POST', form(e)), 'Deadline added');
                }}
              >
                <label>
                  Title
                  <input name="title" required minLength={3} maxLength={120} />
                </label>
                <label>
                  Due date
                  <input name="due_date" type="date" required />
                </label>
                <label>
                  Description
                  <textarea name="description" required minLength={3} maxLength={1000} />
                </label>
                <button className="primary full" disabled={busy}>
                  Save deadline
                </button>
              </form>
            )}
            {modal === 'notifications' && (
              <div>
                {data.notifications.map((n) => (
                  <article className="notification" key={n.id}>
                    <Bell size={17} />
                    <div>
                      <p>{n.message}</p>
                      <small>{date(n.created_at)}</small>
                    </div>
                  </article>
                ))}
                {!data.notifications.length && (
                  <div className="empty compact">
                    <Bell />
                    <p>You're all caught up.</p>
                  </div>
                )}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

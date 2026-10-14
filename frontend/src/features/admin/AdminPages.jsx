import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Ban,
  RotateCcw,
  FileWarning,
} from 'lucide-react';
import { apiRequest } from '../../lib/api-client.js';
import { extractList, formatPrice, formatDateTime, formatBytes } from '../../lib/formatters.js';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { CodeBadge } from '../../components/CodeBadge.jsx';
import { LoadingState, EmptyState, ErrorState } from '../../components/FeedbackStates.jsx';
import { useToast } from '../../components/ToastContext.jsx';
import { usePageTitle } from '../../lib/usePageTitle.js';

function AdminSubNav() {
  const navItems = [
    { to: '/admin', label: 'Overview & Audit', end: true },
    { to: '/admin/listings', label: 'Listings Queue' },
    { to: '/admin/resources', label: 'PYQ / Resource Queue' },
    { to: '/admin/users', label: 'Student Directory' },
    { to: '/admin/reports', label: 'Policy Reports' },
  ];

  return (
    <div
      className="ce-row"
      style={{
        gap: '0.4rem',
        flexWrap: 'wrap',
        padding: '0.5rem',
        background: 'var(--ce-bg-elevated)',
        borderRadius: 'var(--ce-radius-md)',
        border: '1px solid var(--ce-border)',
      }}
    >
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) => `ce-nav-link ${isActive ? 'active' : ''}`}
        >
          {item.label}
        </NavLink>
      ))}
    </div>
  );
}

export function AdminDashboardPage() {
  usePageTitle(
    'Admin Governance',
    'CampusExchange moderation overview, activity telemetry, and security audit log.'
  );
  const { data: dashRes, isLoading, error, refetch } = useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn: () => apiRequest('/admin/dashboard'),
  });

  const { data: auditRes } = useQuery({
    queryKey: ['admin', 'audit-events'],
    queryFn: () => apiRequest('/admin/audit-events', { params: { limit: 15 } }),
  });

  const stats = dashRes?.data?.stats || dashRes?.data?.metrics || {};
  const auditEvents = extractList(auditRes);

  return (
    <div className="ce-stack-lg">
      <div>
        <div className="ce-row" style={{ gap: '0.5rem' }}>
          <ShieldCheck size={18} color="var(--ce-accent)" />
          <CodeBadge>CAMPUS GOVERNANCE CONSOLE</CodeBadge>
        </div>
        <h1 className="ce-title-section" style={{ marginTop: '0.35rem' }}>
          Moderation & Operational Telemetry
        </h1>
      </div>

      <AdminSubNav />

      {isLoading ? (
        <LoadingState rows={4} />
      ) : error ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : (
        <>
          <div className="ce-grid-4">
            <div className="ce-kpi-card">
              <span className="ce-muted" style={{ fontSize: '0.8rem' }}>
                PENDING LISTINGS
              </span>
              <div className="ce-kpi-value">{stats.pendingListings ?? 0}</div>
              <span className="ce-muted" style={{ fontSize: '0.78rem' }}>
                Active listings: {stats.activeListings ?? 0}
              </span>
            </div>

            <div className="ce-kpi-card">
              <span className="ce-muted" style={{ fontSize: '0.8rem' }}>
                PENDING PYQ / RESOURCES
              </span>
              <div className="ce-kpi-value">{stats.pendingResources ?? 0}</div>
              <span className="ce-muted" style={{ fontSize: '0.78rem' }}>
                Approved resources: {stats.activeResources ?? stats.approvedResources ?? 0}
              </span>
            </div>

            <div className="ce-kpi-card">
              <span className="ce-muted" style={{ fontSize: '0.8rem' }}>
                OPEN POLICY REPORTS
              </span>
              <div className="ce-kpi-value">{stats.unresolvedReports ?? stats.openReports ?? 0}</div>
              <span className="ce-muted" style={{ fontSize: '0.78rem' }}>
                Completed handovers: {stats.completedTransactions ?? 0}
              </span>
            </div>

            <div className="ce-kpi-card">
              <span className="ce-muted" style={{ fontSize: '0.8rem' }}>
                VERIFIED STUDENTS
              </span>
              <div className="ce-kpi-value">{stats.activeUsers ?? stats.activeStudents ?? 0}</div>
              <span className="ce-muted" style={{ fontSize: '0.78rem' }}>
                Blocked accounts: {stats.blockedUsers ?? 0}
              </span>
            </div>
          </div>

          <div className="ce-card ce-stack">
            <h2 className="ce-card-title">Immutable Governance Audit Trail</h2>
            {auditEvents.length === 0 ? (
              <p className="ce-muted">No audit events recorded yet.</p>
            ) : (
              <div className="ce-table-wrap">
                <table className="ce-table">
                  <thead>
                    <tr>
                      <th>Action</th>
                      <th>Actor</th>
                      <th>Target</th>
                      <th>Reason / Details</th>
                      <th>Timestamp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditEvents.map((ev, idx) => (
                      <tr key={ev.eventCode || ev.id || idx}>
                        <td>
                          <strong>{ev.action || ev.actionType}</strong>
                        </td>
                        <td>{ev.actorCode ? `${ev.actorRole || 'admin'} (${ev.actorCode})` : ev.actorRole || 'admin'}</td>
                        <td>
                          <CodeBadge>
                            {ev.targetType}:{ev.targetCode || ev.targetId}
                          </CodeBadge>
                        </td>
                        <td className="ce-muted">
                          {ev.reason || ev.metadata?.reason || ev.metadata?.note || '—'}
                        </td>
                        <td className="ce-muted">{formatDateTime(ev.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export function AdminListingsPage() {
  usePageTitle(
    'Listing Moderation',
    'Review, approve, or reject student marketplace listings.'
  );
  const { showToast } = useToast();
  const [status, setStatus] = useState('pending');
  const [reasonNote, setReasonNote] = useState('');

  const { data: res, isLoading, error, refetch } = useQuery({
    queryKey: ['admin', 'listings', status],
    queryFn: () =>
      apiRequest('/admin/listings', {
        params: { status: status || 'all', limit: 30 },
      }),
  });

  const items = extractList(res);

  const handleModerate = async (listingCode, decision) => {
    try {
      await apiRequest(`/admin/listings/${listingCode}/${decision}`, {
        method: 'POST',
        body:
          decision === 'approve'
            ? {}
            : {
                reason:
                  reasonNote.trim() ||
                  'Listing requires clearer academic/condition details.',
              },
      });
      showToast({
        tone: decision === 'approve' ? 'success' : 'warning',
        title: `Listing ${decision === 'approve' ? 'approved' : 'rejected'}`,
      });
      refetch();
    } catch (err) {
      showToast({ tone: 'danger', title: 'Moderation failed', description: err.message });
    }
  };

  return (
    <div className="ce-stack-lg">
      <div className="ce-row-between" style={{ flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <CodeBadge>MARKETPLACE MODERATION</CodeBadge>
          <h1 className="ce-title-section" style={{ marginTop: '0.35rem' }}>
            Student Listing Queue
          </h1>
        </div>

        <div className="ce-row" style={{ gap: '0.6rem', flexWrap: 'wrap' }}>
          <input
            type="text"
            className="ce-input"
            style={{ width: '260px' }}
            placeholder="Optional rejection reason..."
            value={reasonNote}
            onChange={(e) => setReasonNote(e.target.value)}
            aria-label="Rejection reason"
          />
          <select
            aria-label="Filter Listing Moderation Status"
            className="ce-select"
            style={{ width: 'auto' }}
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="pending">Pending Review</option>
            <option value="active">Active</option>
            <option value="rejected">Rejected</option>
            <option value="all">All Statuses</option>
          </select>
        </div>
      </div>

      <AdminSubNav />

      {isLoading ? (
        <LoadingState rows={3} />
      ) : error ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : items.length === 0 ? (
        <EmptyState title="No listings in this moderation state" />
      ) : (
        <div className="ce-table-wrap">
          <table className="ce-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Listing</th>
                <th>Seller</th>
                <th>Price</th>
                <th>Status</th>
                <th>Decision</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const st = String(item.status || '').toLowerCase();
                return (
                  <tr key={item.listingCode}>
                    <td>
                      <CodeBadge>{item.listingCode}</CodeBadge>
                    </td>
                    <td>
                      <strong>{item.title}</strong>
                      <div className="ce-muted" style={{ fontSize: '0.78rem' }}>
                        {item.branch} {item.semester ? `· Sem ${item.semester}` : ''}
                      </div>
                    </td>
                    <td>{item.seller?.fullName || 'Student'}</td>
                    <td style={{ fontFamily: 'var(--ce-font-mono)' }}>{formatPrice(item)}</td>
                    <td>
                      <StatusBadge status={item.status} />
                    </td>
                    <td>
                      {st === 'pending' ? (
                        <div className="ce-row" style={{ gap: '0.4rem' }}>
                          <button
                            type="button"
                            className="ce-btn ce-btn-primary ce-btn-sm"
                            onClick={() => handleModerate(item.listingCode, 'approve')}
                          >
                            <CheckCircle2 size={14} />
                            <span>Approve</span>
                          </button>
                          <button
                            type="button"
                            className="ce-btn ce-btn-danger ce-btn-sm"
                            onClick={() => handleModerate(item.listingCode, 'reject')}
                          >
                            <XCircle size={14} />
                            <span>Reject</span>
                          </button>
                        </div>
                      ) : (
                        <span className="ce-muted" style={{ fontSize: '0.8rem' }}>
                          Reviewed
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export function AdminResourcesPage() {
  usePageTitle(
    'Resource Moderation',
    'Review, verify, and moderate student PYQ and study material uploads.'
  );
  const { showToast } = useToast();
  const [status, setStatus] = useState('pending');
  const [reasonNote, setReasonNote] = useState('');

  const { data: res, isLoading, error, refetch } = useQuery({
    queryKey: ['admin', 'resources', status],
    queryFn: () =>
      apiRequest('/admin/resources', {
        params: { status: status || 'all', limit: 30 },
      }),
  });

  const items = extractList(res);

  const handleDecision = async (resourceCode, action) => {
    try {
      await apiRequest(`/admin/resources/${resourceCode}/${action}`, {
        method: 'POST',
        body:
          action === 'approve'
            ? {}
            : {
                reason:
                  reasonNote.trim() ||
                  'Removed or rejected by academic moderator.',
              },
      });
      showToast({
        tone: action === 'approve' ? 'success' : 'warning',
        title: `Resource ${action}d`,
      });
      refetch();
    } catch (err) {
      showToast({ tone: 'danger', title: 'Action failed', description: err.message });
    }
  };

  return (
    <div className="ce-stack-lg">
      <div className="ce-row-between" style={{ flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <CodeBadge>LIBRARY MODERATION</CodeBadge>
          <h1 className="ce-title-section" style={{ marginTop: '0.35rem' }}>
            PYQ & Academic Resource Queue
          </h1>
        </div>

        <div className="ce-row" style={{ gap: '0.6rem', flexWrap: 'wrap' }}>
          <input
            type="text"
            className="ce-input"
            style={{ width: '260px' }}
            placeholder="Optional rejection/takedown reason..."
            value={reasonNote}
            onChange={(e) => setReasonNote(e.target.value)}
            aria-label="Resource moderation reason"
          />
          <select
            aria-label="Filter Resource Moderation Status"
            className="ce-select"
            style={{ width: 'auto' }}
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="pending">Pending Review</option>
            <option value="active">Active / Approved</option>
            <option value="rejected">Rejected</option>
            <option value="removed">Removed</option>
            <option value="all">All Statuses</option>
          </select>
        </div>
      </div>

      <AdminSubNav />

      {isLoading ? (
        <LoadingState rows={3} />
      ) : error ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : items.length === 0 ? (
        <EmptyState title="No academic resources in this moderation state" />
      ) : (
        <div className="ce-table-wrap">
          <table className="ce-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Document</th>
                <th>Branch</th>
                <th>Size</th>
                <th>Status</th>
                <th>Decision</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const st = String(item.status || '').toLowerCase();
                return (
                  <tr key={item.resourceCode}>
                    <td>
                      <CodeBadge>{item.resourceCode}</CodeBadge>
                    </td>
                    <td>
                      <strong>{item.title}</strong>
                      <div className="ce-muted" style={{ fontSize: '0.78rem' }}>
                        {item.subject} · {item.resourceType} ({item.examYear})
                      </div>
                    </td>
                    <td>
                      <CodeBadge>{item.branch}</CodeBadge>
                    </td>
                    <td>{formatBytes(item.fileInfo?.byteSize)}</td>
                    <td>
                      <StatusBadge status={st} />
                    </td>
                    <td>
                      <div className="ce-row" style={{ gap: '0.4rem' }}>
                        {st === 'pending' && (
                          <button
                            type="button"
                            className="ce-btn ce-btn-primary ce-btn-sm"
                            onClick={() => handleDecision(item.resourceCode, 'approve')}
                          >
                            Approve
                          </button>
                        )}
                        {st === 'pending' && (
                          <button
                            type="button"
                            className="ce-btn ce-btn-danger ce-btn-sm"
                            onClick={() => handleDecision(item.resourceCode, 'reject')}
                          >
                            Reject
                          </button>
                        )}
                        {st === 'active' && (
                          <button
                            type="button"
                            className="ce-btn ce-btn-danger ce-btn-sm"
                            onClick={() => handleDecision(item.resourceCode, 'takedown')}
                          >
                            <FileWarning size={14} />
                            <span>Takedown</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export function AdminUsersPage() {
  usePageTitle(
    'Student Directory',
    'Manage student accounts, academic department assignments, and security standings.'
  );
  const { showToast } = useToast();
  const [accountStatus, setAccountStatus] = useState('');
  const [reasonNote, setReasonNote] = useState('');

  const { data: res, isLoading, error, refetch } = useQuery({
    queryKey: ['admin', 'users', accountStatus],
    queryFn: () =>
      apiRequest('/admin/users', {
        params: { accountStatus: accountStatus || undefined, limit: 30 },
      }),
  });

  const users = extractList(res);

  const handleUserStatus = async (userCode, action) => {
    try {
      await apiRequest(`/admin/users/${userCode}/${action}`, {
        method: 'POST',
        body: {
          reason:
            reasonNote.trim() ||
            (action === 'block'
              ? 'Account suspended for campus marketplace policy violation.'
              : 'Account access restored after review.'),
        },
      });
      showToast({
        tone: action === 'block' ? 'warning' : 'success',
        title: `User ${action === 'block' ? 'blocked' : 'restored'}`,
      });
      refetch();
    } catch (err) {
      showToast({ tone: 'danger', title: 'Action failed', description: err.message });
    }
  };

  return (
    <div className="ce-stack-lg">
      <div className="ce-row-between" style={{ flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <CodeBadge>ACCOUNT GOVERNANCE</CodeBadge>
          <h1 className="ce-title-section" style={{ marginTop: '0.35rem' }}>
            Campus Student Directory
          </h1>
        </div>

        <div className="ce-row" style={{ gap: '0.6rem', flexWrap: 'wrap' }}>
          <input
            type="text"
            className="ce-input"
            style={{ width: '260px' }}
            placeholder="Optional block/restore reason..."
            value={reasonNote}
            onChange={(e) => setReasonNote(e.target.value)}
            aria-label="Account governance reason"
          />
          <select
            aria-label="Filter Account Status"
            className="ce-select"
            style={{ width: 'auto' }}
            value={accountStatus}
            onChange={(e) => setAccountStatus(e.target.value)}
          >
            <option value="">All Accounts</option>
            <option value="active">Active</option>
            <option value="blocked">Blocked</option>
          </select>
        </div>
      </div>

      <AdminSubNav />

      {isLoading ? (
        <LoadingState rows={3} />
      ) : error ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : users.length === 0 ? (
        <EmptyState title="No matching user accounts found" />
      ) : (
        <div className="ce-table-wrap">
          <table className="ce-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Student</th>
                <th>Branch</th>
                <th>Role</th>
                <th>Status</th>
                <th>Governance</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const isBlocked = String(u.accountStatus || '').toLowerCase() === 'blocked';
                const isAdminRole = String(u.role || '').toLowerCase() === 'admin';
                return (
                  <tr key={u.userCode}>
                    <td>
                      <CodeBadge>{u.userCode}</CodeBadge>
                    </td>
                    <td>
                      <strong>{u.fullName}</strong>
                      <div className="ce-muted" style={{ fontSize: '0.78rem' }}>
                        {u.collegeEmail || u.email}
                      </div>
                    </td>
                    <td>
                      {u.branch || 'CSE'} · Year {u.academicYear || '1'}
                    </td>
                    <td>
                      <CodeBadge>{u.role}</CodeBadge>
                    </td>
                    <td>
                      <StatusBadge status={u.accountStatus} />
                    </td>
                    <td>
                      {!isAdminRole && (
                        <div className="ce-row" style={{ gap: '0.4rem' }}>
                          {!isBlocked ? (
                            <button
                              type="button"
                              className="ce-btn ce-btn-danger ce-btn-sm"
                              onClick={() => handleUserStatus(u.userCode, 'block')}
                            >
                              <Ban size={13} />
                              <span>Block</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="ce-btn ce-btn-primary ce-btn-sm"
                              onClick={() => handleUserStatus(u.userCode, 'restore')}
                            >
                              <RotateCcw size={13} />
                              <span>Restore</span>
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export function AdminReportsPage() {
  usePageTitle(
    'Policy Reports',
    'Investigate student reports, item flaggings, and policy violations.'
  );
  const { showToast } = useToast();
  const [status, setStatus] = useState('');
  const [resolutionNote, setResolutionNote] = useState('');

  const { data: res, isLoading, error, refetch } = useQuery({
    queryKey: ['admin', 'reports', status],
    queryFn: () =>
      apiRequest('/admin/reports', {
        params: { status: status || undefined, limit: 30 },
      }),
  });

  const reports = extractList(res);

  const handleReportAction = async (reportCode, action) => {
    try {
      const body =
        action === 'assign'
          ? {}
          : {
              note:
                resolutionNote.trim() ||
                (action === 'resolve'
                  ? 'Reviewed evidence and enforced campus moderation policy.'
                  : 'Dismissed after inspection; no policy violation found.'),
            };
      await apiRequest(`/admin/reports/${reportCode}/${action}`, {
        method: 'POST',
        body,
      });
      showToast({
        tone: 'success',
        title: `Report ${action}d`,
      });
      refetch();
    } catch (err) {
      showToast({ tone: 'danger', title: 'Action failed', description: err.message });
    }
  };

  return (
    <div className="ce-stack-lg">
      <div className="ce-row-between" style={{ flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <CodeBadge>INCIDENT RESPONSE</CodeBadge>
          <h1 className="ce-title-section" style={{ marginTop: '0.35rem' }}>
            Campus Policy Reports
          </h1>
        </div>

        <div className="ce-row" style={{ gap: '0.6rem', flexWrap: 'wrap' }}>
          <input
            type="text"
            className="ce-input"
            style={{ width: '260px' }}
            placeholder="Optional resolution note..."
            value={resolutionNote}
            onChange={(e) => setResolutionNote(e.target.value)}
            aria-label="Report resolution note"
          />
          <select
            aria-label="Filter Report Status"
            className="ce-select"
            style={{ width: 'auto' }}
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">All Reports</option>
            <option value="open">Open</option>
            <option value="in_review">In Review</option>
            <option value="resolved">Resolved</option>
            <option value="dismissed">Dismissed</option>
          </select>
        </div>
      </div>

      <AdminSubNav />

      {isLoading ? (
        <LoadingState rows={3} />
      ) : error ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : reports.length === 0 ? (
        <EmptyState title="No policy reports in this filter" />
      ) : (
        <div className="ce-table-wrap">
          <table className="ce-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Target</th>
                <th>Reason & Details</th>
                <th>Reporter</th>
                <th>Status</th>
                <th>Resolution</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((rep) => {
                const st = String(rep.status || '').toLowerCase();
                return (
                  <tr key={rep.reportCode}>
                    <td>
                      <CodeBadge>{rep.reportCode}</CodeBadge>
                    </td>
                    <td>
                      <CodeBadge>
                        {rep.targetType}:{rep.targetCode}
                      </CodeBadge>
                    </td>
                    <td>
                      <strong>{rep.reason || rep.reasonCode}</strong>
                      <div className="ce-muted" style={{ fontSize: '0.8rem' }}>
                        {rep.details || rep.description}
                      </div>
                    </td>
                    <td>{rep.reporter?.fullName || 'Student'}</td>
                    <td>
                      <StatusBadge status={st} />
                    </td>
                    <td>
                      {['open', 'in_review'].includes(st) && (
                        <div className="ce-row" style={{ gap: '0.4rem' }}>
                          {st === 'open' && (
                            <button
                              type="button"
                              className="ce-btn ce-btn-secondary ce-btn-sm"
                              onClick={() => handleReportAction(rep.reportCode, 'assign')}
                            >
                              Assign
                            </button>
                          )}
                          <button
                            type="button"
                            className="ce-btn ce-btn-primary ce-btn-sm"
                            onClick={() => handleReportAction(rep.reportCode, 'resolve')}
                          >
                            Resolve
                          </button>
                          <button
                            type="button"
                            className="ce-btn ce-btn-ghost ce-btn-sm"
                            onClick={() => handleReportAction(rep.reportCode, 'dismiss')}
                          >
                            Dismiss
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Star, ShieldCheck, Save, Eye } from 'lucide-react';
import { apiRequest } from '../../lib/api-client.js';
import { BRANCHES, ACADEMIC_YEARS } from '../../lib/constants.js';
import { extractList, formatDate } from '../../lib/formatters.js';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { CodeBadge } from '../../components/CodeBadge.jsx';
import { ListRowSkeleton } from '../../components/FeedbackStates.jsx';
import { useToast } from '../../components/ToastContext.jsx';
import { useAuth } from '../auth/AuthContext.jsx';
import { usePageTitle } from '../../lib/usePageTitle.js';

export function ProfilePage() {
  usePageTitle(
    'Student Profile',
    'Manage your academic identity, department, and peer trust ratings.'
  );
  const { user, setUser } = useAuth();
  const { showToast } = useToast();

  const [form, setForm] = useState({
    fullName: user?.fullName || '',
    branch: user?.branch || 'CSE',
    academicYear: String(user?.academicYear || '2'),
    bio: user?.bio || '',
  });
  const [saving, setSaving] = useState(false);

  const { data: reviewsRes, isLoading: loadingReviews } = useQuery({
    queryKey: ['user', user?.userCode, 'reviews'],
    queryFn: () => apiRequest(`/users/${user?.userCode}/reviews`),
    enabled: Boolean(user?.userCode),
  });

  const { data: reportsRes, isLoading: loadingReports } = useQuery({
    queryKey: ['reports', 'mine'],
    queryFn: () => apiRequest('/reports/mine'),
  });

  const reviews = extractList(reviewsRes);
  const myReports = extractList(reportsRes);

  const updateField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await apiRequest('/users/me', {
        method: 'PATCH',
        body: {
          fullName: form.fullName.trim(),
          branch: form.branch,
          academicYear: String(form.academicYear),
          bio: form.bio.trim(),
        },
      });
      if (res?.data?.user) {
        setUser(res.data.user);
      }
      showToast({
        tone: 'success',
        title: 'Academic profile updated',
      });
    } catch (err) {
      showToast({
        tone: 'danger',
        title: 'Failed to update profile',
        description: err.message,
      });
    } finally {
      setSaving(false);
    }
  };

  const avgRating = user?.ratingAverage ?? user?.averageRating ?? 0;

  return (
    <div className="ce-stack-lg ce-animate-enter">
      <div>
        <CodeBadge>VERIFIED ACADEMIC IDENTITY</CodeBadge>
        <h1 className="ce-title-section" style={{ marginTop: '0.35rem' }}>
          Student Profile & Trust Ledger
        </h1>
      </div>

      <div className="ce-grid-2" style={{ alignItems: 'start' }}>
        <form onSubmit={handleSave} className="ce-card ce-stack">
          <div className="ce-row-between">
            <div className="ce-row" style={{ gap: '0.45rem' }}>
              <ShieldCheck size={18} color="var(--ce-success)" />
              <CodeBadge>{user?.userCode}</CodeBadge>
            </div>
            <StatusBadge status={user?.accountStatus} />
          </div>

          <div className="ce-field">
            <label className="ce-label" htmlFor="prof-email">
              Institutional Email (Verified Read-Only · Private)
            </label>
            <input
              id="prof-email"
              type="email"
              className="ce-input"
              value={user?.collegeEmail || user?.email || ''}
              disabled
            />
          </div>

          <div className="ce-field">
            <label className="ce-label" htmlFor="prof-name">
              Full Name
            </label>
            <input
              id="prof-name"
              type="text"
              className="ce-input"
              value={form.fullName}
              onChange={(e) => updateField('fullName', e.target.value)}
              required
            />
          </div>

          <div className="ce-grid-2">
            <div className="ce-field">
              <label className="ce-label" htmlFor="prof-dept">
                Branch
              </label>
              <select
                id="prof-dept"
                className="ce-select"
                value={form.branch}
                onChange={(e) => updateField('branch', e.target.value)}
              >
                {BRANCHES.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div className="ce-field">
              <label className="ce-label" htmlFor="prof-year">
                Academic Year
              </label>
              <select
                id="prof-year"
                className="ce-select"
                value={form.academicYear}
                onChange={(e) => updateField('academicYear', e.target.value)}
              >
                {ACADEMIC_YEARS.map((yr) => (
                  <option key={yr} value={yr}>
                    Year {yr}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="ce-field">
            <label className="ce-label" htmlFor="prof-bio">
              Campus Bio & Handover Availability
            </label>
            <textarea
              id="prof-bio"
              className="ce-textarea"
              placeholder="e.g. Available near Central Library between 1 PM and 2 PM on weekdays."
              value={form.bio}
              onChange={(e) => updateField('bio', e.target.value)}
            />
          </div>

          <button type="submit" className="ce-btn ce-btn-primary" disabled={saving}>
            <Save size={15} />
            <span>{saving ? 'Saving...' : 'Save Profile Changes'}</span>
          </button>
        </form>

        <div className="ce-stack">
          <div className="ce-card ce-stack" style={{ background: 'var(--ce-bg-elevated)' }}>
            <div className="ce-row-between">
              <div className="ce-row" style={{ gap: '0.45rem' }}>
                <Eye size={16} color="var(--ce-accent)" />
                <h2 className="ce-card-title">Safe Public Profile Preview</h2>
              </div>
              <CodeBadge>{user?.userCode}</CodeBadge>
            </div>
            <p className="ce-muted" style={{ fontSize: '0.82rem', margin: 0 }}>
              How fellow students see your seller card on listings. Your institutional email and
              private session details are never exposed publicly.
            </p>
            <div
              className="ce-card ce-stack"
              style={{ gap: '0.5rem', padding: '1rem', background: 'var(--ce-bg-surface)' }}
            >
              <div className="ce-row-between">
                <div className="ce-row" style={{ gap: '0.4rem' }}>
                  <ShieldCheck size={16} color="var(--ce-success)" />
                  <strong>{form.fullName || user?.fullName || 'Verified Student'}</strong>
                </div>
                <span className="ce-badge ce-badge-success">Verified Peer</span>
              </div>
              <div className="ce-muted" style={{ fontSize: '0.85rem' }}>
                {form.branch} · Year {form.academicYear} ·{' '}
                {user?.completedTransactionsCount || 0} completed handovers
              </div>
              {form.bio && (
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.88rem' }}>{form.bio}</p>
              )}
            </div>
          </div>

          <div className="ce-card ce-stack">
            <div className="ce-row-between">
              <h2 className="ce-card-title">Verified Peer Reviews ({reviews.length})</h2>
              <div className="ce-row" style={{ gap: '0.25rem', fontWeight: 700 }}>
                <Star size={16} color="var(--ce-warning)" />
                <span>
                  {avgRating > 0 ? `${Number(avgRating).toFixed(1)} / 5` : 'No reviews yet'}
                </span>
              </div>
            </div>

            {loadingReviews ? (
              <ListRowSkeleton count={2} />
            ) : reviews.length === 0 ? (
              <p className="ce-muted" style={{ fontSize: '0.88rem', margin: 0 }}>
                Reviews appear here once buyers complete campus handovers with you.
              </p>
            ) : (
              <div className="ce-stack" style={{ gap: '0.6rem' }}>
                {reviews.map((rev, idx) => (
                  <div
                    key={rev.reviewCode || idx}
                    style={{
                      padding: '0.75rem',
                      borderRadius: 'var(--ce-radius-md)',
                      background: 'var(--ce-bg-primary)',
                      border: '1px solid var(--ce-border)',
                    }}
                  >
                    <div className="ce-row-between">
                      <strong>
                        {rev.author?.fullName || rev.reviewer?.fullName || 'Verified Buyer'}
                      </strong>
                      <span className="ce-badge ce-badge-warning ce-row" style={{ gap: '0.25rem' }}>
                        <span>{rev.rating} / 5</span>
                        <Star size={12} fill="currentColor" />
                      </span>
                    </div>
                    <p style={{ margin: '0.35rem 0 0', fontSize: '0.88rem' }}>{rev.comment}</p>
                    <div className="ce-muted" style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>
                      {formatDate(rev.createdAt)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="ce-card ce-stack">
            <h2 className="ce-card-title">My Submitted Policy Reports ({myReports.length})</h2>
            {loadingReports ? (
              <ListRowSkeleton count={2} />
            ) : myReports.length === 0 ? (
              <p className="ce-muted" style={{ fontSize: '0.88rem', margin: 0 }}>
                You have not filed any moderation reports.
              </p>
            ) : (
              <div className="ce-stack" style={{ gap: '0.5rem' }}>
                {myReports.map((rep) => (
                  <div
                    key={rep.reportCode}
                    className="ce-row-between"
                    style={{
                      padding: '0.65rem',
                      borderRadius: 'var(--ce-radius-md)',
                      border: '1px solid var(--ce-border)',
                      fontSize: '0.84rem',
                    }}
                  >
                    <div>
                      <CodeBadge>{rep.reportCode}</CodeBadge>{' '}
                      <span>
                        {rep.targetType} ({rep.targetCode}) — {rep.reason || rep.reasonCode}
                      </span>
                    </div>
                    <StatusBadge status={rep.status} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

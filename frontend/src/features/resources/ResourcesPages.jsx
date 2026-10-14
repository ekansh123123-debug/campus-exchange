import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Download, Upload, BookOpen, Flag, FileText } from 'lucide-react';
import { apiRequest, getAccessToken } from '../../lib/api-client.js';
import {
  BRANCHES,
  ACADEMIC_YEARS,
  SEMESTERS,
  RESOURCE_TYPES,
} from '../../lib/constants.js';
import { extractList, extractMeta, formatBytes, formatDate } from '../../lib/formatters.js';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { CodeBadge } from '../../components/CodeBadge.jsx';
import { LoadingState, EmptyState, ErrorState } from '../../components/FeedbackStates.jsx';
import { ReportModal } from '../../components/ReportModal.jsx';
import { useToast } from '../../components/ToastContext.jsx';
import { useAuth } from '../auth/AuthContext.jsx';
import { usePageTitle } from '../../lib/usePageTitle.js';

export function ResourcesPage() {
  usePageTitle(
    'PYQ & Study Resource Library',
    'Access verified Previous Year Question Papers (PYQs), lecture notes, lab manuals, and syllabi.'
  );
  const { isAuthenticated, isVerifiedStudent } = useAuth();
  const { showToast } = useToast();

  const [q, setQ] = useState('');
  const [branch, setBranch] = useState('');
  const [academicYear, setAcademicYear] = useState('');
  const [semester, setSemester] = useState('');
  const [subject, setSubject] = useState('');
  const [resourceType, setResourceType] = useState('');
  const [examYear, setExamYear] = useState('');
  const [page, setPage] = useState(1);
  const [showMine, setShowMine] = useState(false);
  const [reportTarget, setReportTarget] = useState(null);

  const {
    data: res,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: [
      'resources',
      { showMine, q, branch, academicYear, semester, subject, resourceType, examYear, page },
    ],
    queryFn: () =>
      apiRequest(showMine ? '/resources/mine' : '/resources', {
        params: showMine
          ? { page, limit: 24 }
          : {
              q: q.trim() || undefined,
              branch: branch || undefined,
              academicYear: academicYear || undefined,
              semester: semester || undefined,
              subject: subject.trim() || undefined,
              resourceType: resourceType || undefined,
              examYear: examYear.trim() || undefined,
              page,
              limit: 24,
            },
      }),
    retry: false,
  });

  const items = extractList(res);
  const pagination = extractMeta(res);

  const handleDownload = async (resource) => {
    try {
      const token = getAccessToken();
      const headers = {};
      if (token) headers.Authorization = `Bearer ${token}`;

      const response = await fetch(`/api/v1/resources/${resource.resourceCode}/download`, {
        method: 'GET',
        credentials: 'include',
        headers,
      });

      if (!response.ok) {
        throw new Error('Sign in with a verified college student account to download this PDF.');
      }

      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const json = await response.json();
        if (json?.data?.downloadUrl) {
          window.open(json.data.downloadUrl, '_blank', 'noopener,noreferrer');
        }
      } else {
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = `${resource.resourceCode}-${resource.title.replace(/\s+/g, '_')}.pdf`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(blobUrl);
      }

      showToast({
        tone: 'success',
        title: 'Download started',
        description: resource.title,
      });
      refetch();
    } catch (err) {
      showToast({
        tone: 'danger',
        title: 'Download unavailable',
        description: err.message,
      });
    }
  };

  return (
    <div className="ce-stack-lg">
      <div className="ce-row-between" style={{ flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <CodeBadge>ACADEMIC RESOURCE & PYQ ARCHIVE</CodeBadge>
          <h1 className="ce-title-section" style={{ fontSize: '1.85rem', marginTop: '0.35rem' }}>
            Verified Past Question Papers, Notes & Lab Manuals
          </h1>
          <p className="ce-muted" style={{ margin: '0.2rem 0 0', fontSize: '0.92rem' }}>
            Every PDF upload is magic-byte verified and reviewed by campus moderators before
            publication.
          </p>
        </div>

        <div className="ce-row" style={{ gap: '0.6rem' }}>
          {isAuthenticated && (
            <button
              type="button"
              className={`ce-btn ${showMine ? 'ce-btn-primary' : 'ce-btn-secondary'}`}
              onClick={() => {
                setShowMine((v) => !v);
                setPage(1);
              }}
            >
              {showMine ? 'Viewing My Uploads' : 'My Uploads'}
            </button>
          )}
          {isVerifiedStudent && (
            <Link to="/resources/upload" className="ce-btn ce-btn-primary">
              <Upload size={16} />
              <span>Upload PYQ / Notes</span>
            </Link>
          )}
        </div>
      </div>

      {!showMine && (
        <div className="ce-card ce-stack">
          <div className="ce-row" style={{ flexWrap: 'wrap', gap: '0.75rem' }}>
            <input
              type="search"
              aria-label="Search resources keyword"
              className="ce-input"
              style={{ flex: '1 1 240px' }}
              placeholder="Search title, topic, or question paper..."
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
              }}
            />

            <input
              type="text"
              aria-label="Filter Resource Subject"
              className="ce-input"
              style={{ width: '175px' }}
              placeholder="Subject (e.g. DBMS)"
              value={subject}
              onChange={(e) => {
                setSubject(e.target.value);
                setPage(1);
              }}
            />

            <select
              aria-label="Filter Resource Branch"
              className="ce-select"
              style={{ width: 'auto' }}
              value={branch}
              onChange={(e) => {
                setBranch(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Branches</option>
              {BRANCHES.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>

            <select
              aria-label="Filter Resource Academic Year"
              className="ce-select"
              style={{ width: 'auto' }}
              value={academicYear}
              onChange={(e) => {
                setAcademicYear(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Years</option>
              {ACADEMIC_YEARS.map((yr) => (
                <option key={yr} value={yr}>
                  Year {yr}
                </option>
              ))}
            </select>

            <select
              aria-label="Filter Resource Semester"
              className="ce-select"
              style={{ width: 'auto' }}
              value={semester}
              onChange={(e) => {
                setSemester(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Semesters</option>
              {SEMESTERS.map((s) => (
                <option key={s} value={s}>
                  Semester {s}
                </option>
              ))}
            </select>
          </div>

          <div className="ce-row-between" style={{ flexWrap: 'wrap', gap: '0.6rem' }}>
            <div className="ce-row" style={{ flexWrap: 'wrap', gap: '0.6rem' }}>
              <select
                aria-label="Filter Resource Type"
                className="ce-select"
                style={{ width: 'auto', fontSize: '0.84rem', padding: '0.35rem 0.65rem' }}
                value={resourceType}
                onChange={(e) => {
                  setResourceType(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">All Document Types</option>
                {RESOURCE_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>

              <input
                type="text"
                aria-label="Filter Exam Year"
                className="ce-input"
                style={{ width: '130px', fontSize: '0.84rem', padding: '0.35rem 0.65rem' }}
                placeholder="Exam Year (2025)"
                value={examYear}
                onChange={(e) => {
                  setExamYear(e.target.value);
                  setPage(1);
                }}
              />
            </div>

            <button
              type="button"
              className="ce-btn ce-btn-ghost ce-btn-sm"
              onClick={() => {
                setQ('');
                setBranch('');
                setAcademicYear('');
                setSemester('');
                setSubject('');
                setResourceType('');
                setExamYear('');
                setPage(1);
              }}
            >
              Reset Filters
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <LoadingState label="Searching academic resource repository..." rows={6} />
      ) : error && (error.status === 401 || error.status === 403) ? (
        <EmptyState
          title="Verified Campus Access Required"
          description="Sign in with your verified institutional college email to search and download PYQs, lecture notes, and lab manuals."
          action={
            <div className="ce-row" style={{ justifyContent: 'center', gap: '0.75rem' }}>
              <Link to="/login" className="ce-btn ce-btn-primary">
                Sign In
              </Link>
              <Link to="/register" className="ce-btn ce-btn-secondary">
                Register College Email
              </Link>
            </div>
          }
        />
      ) : error ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : items.length === 0 ? (
        <EmptyState
          title={
            showMine
              ? 'You have not uploaded any study resources yet'
              : 'No matching academic files found'
          }
          description="Contribute past question papers or clean lecture notes to help your department."
          action={
            isVerifiedStudent && (
              <Link to="/resources/upload" className="ce-btn ce-btn-primary">
                <Upload size={16} />
                <span>Upload PYQ / Notes</span>
              </Link>
            )
          }
        />
      ) : (
        <>
          <div className="ce-grid-cards">
            {items.map((item) => {
              const st = String(item.status || item.moderationStatus || '').toLowerCase();
              const byteSize = item.fileInfo?.byteSize ?? item.file?.sizeBytes ?? 0;
              return (
                <div
                  key={item.resourceCode}
                  className="ce-card ce-stack"
                  style={{ justifyContent: 'space-between' }}
                >
                  <div className="ce-stack" style={{ gap: '0.55rem' }}>
                    <div className="ce-row-between">
                      <div className="ce-row" style={{ gap: '0.35rem', flexWrap: 'wrap' }}>
                        <CodeBadge>{item.branch || item.department}</CodeBadge>
                        {item.semester && <CodeBadge>Sem {item.semester}</CodeBadge>}
                        {item.isDemoSeed && <span className="ce-badge ce-badge-demo">DEMO</span>}
                      </div>
                      {showMine ? (
                        <StatusBadge status={st} />
                      ) : (
                        <span className="ce-badge ce-badge-info">
                          {String(item.resourceType || '').toUpperCase()}
                        </span>
                      )}
                    </div>

                    <h3 className="ce-card-title">{item.title}</h3>

                    <div style={{ fontSize: '0.85rem', color: 'var(--ce-text-secondary)' }}>
                      <strong>{item.subject || item.subjectName}</strong> · Year{' '}
                      {item.academicYear || '2'} {item.examYear ? `(${item.examYear})` : ''}
                    </div>

                    {item.description && (
                      <p className="ce-muted" style={{ fontSize: '0.84rem', margin: 0 }}>
                        {item.description}
                      </p>
                    )}

                    {showMine && item.moderation?.rejectionReason && (
                      <div className="ce-alert ce-alert-warning" style={{ fontSize: '0.8rem' }}>
                        Moderator feedback: {item.moderation.rejectionReason}
                      </div>
                    )}
                  </div>

                  <div
                    className="ce-stack"
                    style={{
                      gap: '0.55rem',
                      marginTop: '0.75rem',
                      paddingTop: '0.75rem',
                      borderTop: '1px solid var(--ce-border)',
                    }}
                  >
                    <div
                      className="ce-row-between"
                      style={{ fontSize: '0.78rem', color: 'var(--ce-text-muted)' }}
                    >
                      <span className="ce-row" style={{ gap: '0.25rem' }}>
                        <FileText size={13} />
                        {formatBytes(byteSize)}
                      </span>
                      <span>{item.downloadCount || 0} downloads</span>
                    </div>

                    <div className="ce-row-between">
                      <span className="ce-muted" style={{ fontSize: '0.76rem' }}>
                        By {item.uploader?.fullName || 'Student'} · {formatDate(item.createdAt)}
                      </span>

                      <div className="ce-row" style={{ gap: '0.35rem' }}>
                        {isAuthenticated && (
                          <button
                            type="button"
                            className="ce-btn ce-btn-ghost ce-btn-sm"
                            onClick={() => setReportTarget(item)}
                            title="Report file"
                          >
                            <Flag size={13} />
                          </button>
                        )}
                        {['active', 'approved'].includes(st) && (
                          <button
                            type="button"
                            className="ce-btn ce-btn-primary ce-btn-sm"
                            onClick={() => handleDownload(item)}
                          >
                            <Download size={14} />
                            <span>Download</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {pagination.totalPages > 1 && (
            <div
              className="ce-row"
              style={{ justifyContent: 'center', marginTop: '1rem', gap: '0.75rem' }}
            >
              <button
                type="button"
                className="ce-btn ce-btn-secondary ce-btn-sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </button>
              <span className="ce-muted" style={{ fontSize: '0.88rem' }}>
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                type="button"
                className="ce-btn ce-btn-secondary ce-btn-sm"
                disabled={page >= pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {reportTarget && (
        <ReportModal
          targetType="resource"
          targetCode={reportTarget.resourceCode}
          targetTitle={reportTarget.title}
          onClose={() => setReportTarget(null)}
        />
      )}
    </div>
  );
}

export function UploadResourcePage() {
  usePageTitle(
    'Upload Academic Resource',
    'Contribute verified question papers, lecture notes, or lab manuals to the campus archive.'
  );
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [form, setForm] = useState({
    title: '',
    description: '',
    resourceType: 'pyq',
    branch: user?.branch || 'CSE',
    academicYear: user?.academicYear || '2',
    semester: '4',
    subject: '',
    examYear: '2025',
    copyrightAttested: true,
  });
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const updateField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please attach a valid PDF file (up to 20 MB).');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('title', form.title.trim());
      formData.append('description', form.description.trim());
      formData.append('resourceType', form.resourceType);
      formData.append('branch', form.branch);
      formData.append('academicYear', String(form.academicYear));
      formData.append('semester', String(form.semester));
      formData.append('subject', form.subject.trim());
      formData.append('examYear', form.examYear.trim());
      formData.append('copyrightAttested', String(form.copyrightAttested));
      formData.append('file', file);

      const res = await apiRequest('/resources', {
        method: 'POST',
        body: formData,
      });

      showToast({
        tone: 'success',
        title: 'Academic resource uploaded for moderation',
        description: `Code: ${res?.data?.resource?.resourceCode || 'CER'}`,
      });
      navigate('/resources');
    } catch (err) {
      setError(err.message || 'Resource upload failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto' }} className="ce-stack-lg">
      <div>
        <CodeBadge>CONTRIBUTOR UPLOAD</CodeBadge>
        <h1 className="ce-title-section" style={{ marginTop: '0.35rem' }}>
          Upload PYQ, Lecture Notes, or Lab Manual
        </h1>
        <p className="ce-muted" style={{ margin: '0.2rem 0 0', fontSize: '0.9rem' }}>
          Files are verified for authentic PDF binary headers (%PDF-) and enter the moderation
          queue before appearing publicly.
        </p>
      </div>

      {error && <div className="ce-alert ce-alert-danger">{error}</div>}

      <form onSubmit={handleSubmit} className="ce-card ce-stack">
        <div className="ce-field">
          <label className="ce-label" htmlFor="res-title">
            Document Title
          </label>
          <input
            id="res-title"
            type="text"
            className="ce-input"
            placeholder="e.g. CS302 Database Systems Mid-Sem PYQ 2025"
            value={form.title}
            onChange={(e) => updateField('title', e.target.value)}
            required
          />
        </div>

        <div className="ce-grid-3">
          <div className="ce-field">
            <label className="ce-label" htmlFor="res-type">
              Resource Type
            </label>
            <select
              id="res-type"
              className="ce-select"
              value={form.resourceType}
              onChange={(e) => updateField('resourceType', e.target.value)}
            >
              {RESOURCE_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div className="ce-field">
            <label className="ce-label" htmlFor="res-year">
              Academic Year
            </label>
            <select
              id="res-year"
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

          <div className="ce-field">
            <label className="ce-label" htmlFor="res-session">
              Exam Year
            </label>
            <input
              id="res-session"
              type="text"
              className="ce-input"
              placeholder="2025"
              value={form.examYear}
              onChange={(e) => updateField('examYear', e.target.value)}
              required
            />
          </div>
        </div>

        <div className="ce-grid-3">
          <div className="ce-field">
            <label className="ce-label" htmlFor="res-dept">
              Branch
            </label>
            <select
              id="res-dept"
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
            <label className="ce-label" htmlFor="res-sem">
              Semester
            </label>
            <select
              id="res-sem"
              className="ce-select"
              value={form.semester}
              onChange={(e) => updateField('semester', e.target.value)}
            >
              {SEMESTERS.map((s) => (
                <option key={s} value={s}>
                  Semester {s}
                </option>
              ))}
            </select>
          </div>

          <div className="ce-field">
            <label className="ce-label" htmlFor="res-subject">
              Subject Name
            </label>
            <input
              id="res-subject"
              type="text"
              className="ce-input"
              placeholder="Database Management Systems"
              value={form.subject}
              onChange={(e) => updateField('subject', e.target.value)}
              required
            />
          </div>
        </div>

        <div className="ce-field">
          <label className="ce-label" htmlFor="res-desc">
            Summary & Syllabus Coverage
          </label>
          <textarea
            id="res-desc"
            className="ce-textarea"
            placeholder="Includes Part A & Part B questions on normalization, indexing, transactions..."
            value={form.description}
            onChange={(e) => updateField('description', e.target.value)}
          />
        </div>

        <div className="ce-field">
          <label className="ce-label" htmlFor="res-file">
            Document File (PDF only, max 20 MB)
          </label>
          <input
            id="res-file"
            type="file"
            accept=".pdf,application/pdf"
            className="ce-input"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            required
          />
        </div>

        <label className="ce-row" style={{ gap: '0.5rem', fontSize: '0.88rem', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={form.copyrightAttested}
            onChange={(e) => updateField('copyrightAttested', e.target.checked)}
            required
          />
          <span>
            I attest that this study material complies with campus academic integrity & copyright
            rules.
          </span>
        </label>

        <div className="ce-row" style={{ justifyContent: 'flex-end', gap: '0.75rem' }}>
          <Link to="/resources" className="ce-btn ce-btn-secondary">
            Cancel
          </Link>
          <button type="submit" className="ce-btn ce-btn-primary" disabled={submitting}>
            <BookOpen size={15} />
            <span>{submitting ? 'Uploading...' : 'Submit to Moderation Queue'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ShieldCheck,
  BookOpen,
  ShoppingBag,
  ArrowRight,
  KeyRound,
  MailCheck,
  CheckCircle2,
  Zap,
} from 'lucide-react';
import { useAuth } from './AuthContext.jsx';
import { apiRequest } from '../../lib/api-client.js';
import { BRANCHES, ACADEMIC_YEARS } from '../../lib/constants.js';
import { extractList, formatPrice, formatCondition } from '../../lib/formatters.js';
import { CodeBadge } from '../../components/CodeBadge.jsx';
import { StatusBadge } from '../../components/StatusBadge.jsx';
import { ListingCardSkeleton, ResourceCardSkeleton } from '../../components/FeedbackStates.jsx';
import { useToast } from '../../components/ToastContext.jsx';
import { usePageTitle } from '../../lib/usePageTitle.js';

export function LandingPage() {
  usePageTitle(
    'Home',
    'Pass down textbooks, lab gear, and verified PYQs within your campus gates.'
  );
  const { isAuthenticated } = useAuth();

  const { data: listingsData, isLoading: loadingListings } = useQuery({
    queryKey: ['listings', 'landing-preview'],
    queryFn: () => apiRequest('/listings', { params: { limit: 3, sort: 'newest' } }),
    retry: false,
  });

  const { data: resourcesData, isLoading: loadingResources } = useQuery({
    queryKey: ['resources', 'landing-preview'],
    queryFn: () => apiRequest('/resources', { params: { limit: 3 } }),
    retry: false,
  });

  const recentListings = extractList(listingsData);
  const recentResources = extractList(resourcesData);

  return (
    <div className="ce-stack-lg">
      <section className="ce-hero">
        <div className="ce-row" style={{ marginBottom: '1rem', gap: '0.6rem' }}>
          <span className="ce-badge ce-badge-info">VERIFIED COLLEGE NETWORK</span>
          <CodeBadge>B.TECH / ENGINEERING</CodeBadge>
        </div>

        <h1 className="ce-title-hero">
          Pass down textbooks, lab gear, and verified PYQs within your campus gates.
        </h1>

        <p className="ce-subtitle" style={{ marginTop: '1rem', marginBottom: '1.75rem' }}>
          CampusExchange replaces chaotic student message groups with an institutional-email verified
          marketplace and moderated academic resource library. Every handover is tracked on campus.
        </p>

        <div className="ce-row" style={{ flexWrap: 'wrap', gap: '0.75rem' }}>
          {isAuthenticated ? (
            <Link to="/app" className="ce-btn ce-btn-primary ce-btn-lg">
              <span>Go to Student Hub</span>
              <ArrowRight size={18} />
            </Link>
          ) : (
            <Link to="/register" className="ce-btn ce-btn-primary ce-btn-lg">
              <span>Join with College Email</span>
              <ArrowRight size={18} />
            </Link>
          )}
          <Link to="/marketplace" className="ce-btn ce-btn-secondary ce-btn-lg">
            Browse Marketplace
          </Link>
          <Link to="/resources" className="ce-btn ce-btn-secondary ce-btn-lg">
            Explore PYQ Library
          </Link>
        </div>

        <div className="ce-grid-3" style={{ marginTop: '2.5rem' }}>
          <div className="ce-card">
            <div className="ce-row" style={{ marginBottom: '0.5rem', color: 'var(--ce-accent)' }}>
              <ShieldCheck size={20} />
              <strong style={{ fontFamily: 'var(--ce-font-serif)' }}>Institutional Verification</strong>
            </div>
            <p className="ce-muted" style={{ fontSize: '0.88rem', margin: 0 }}>
              Only students with verified college domains can list items, reserve gear, or chat with peers.
            </p>
          </div>

          <div className="ce-card">
            <div className="ce-row" style={{ marginBottom: '0.5rem', color: 'var(--ce-success)' }}>
              <ShoppingBag size={20} />
              <strong style={{ fontFamily: 'var(--ce-font-serif)' }}>Concurrency-Safe Reservations</strong>
            </div>
            <p className="ce-muted" style={{ fontSize: '0.88rem', margin: 0 }}>
              Single-active-reservation concurrency locks prevent double-selling during campus handovers.
            </p>
          </div>

          <div className="ce-card">
            <div className="ce-row" style={{ marginBottom: '0.5rem', color: 'var(--ce-info)' }}>
              <BookOpen size={20} />
              <strong style={{ fontFamily: 'var(--ce-font-serif)' }}>Moderated PYQ Archive</strong>
            </div>
            <p className="ce-muted" style={{ fontSize: '0.88rem', margin: 0 }}>
              Searchable by branch, academic year, semester, and subject with magic-byte validated PDFs.
            </p>
          </div>
        </div>
      </section>

      <section className="ce-stack">
        <div className="ce-row-between">
          <div>
            <h2 className="ce-title-section">Recent Campus Listings</h2>
            <p className="ce-muted" style={{ fontSize: '0.9rem', margin: 0 }}>
              Textbooks, drafters, calculators, and electronics from upper-semester students.
            </p>
          </div>
          <Link to="/marketplace" className="ce-btn ce-btn-secondary ce-btn-sm">
            View All Listings
          </Link>
        </div>

        {loadingListings ? (
          <div className="ce-grid-cards">
            {Array.from({ length: 3 }).map((_, idx) => (
              <ListingCardSkeleton key={idx} />
            ))}
          </div>
        ) : recentListings.length > 0 ? (
          <div className="ce-grid-cards">
            {recentListings.map((item) => (
              <Link
                key={item.listingCode}
                to={`/listings/${item.listingCode}`}
                className="ce-card ce-card-interactive ce-stack"
                style={{ justifyContent: 'space-between' }}
              >
                <div className="ce-stack" style={{ gap: '0.6rem' }}>
                  <div className="ce-row-between">
                    <CodeBadge>{item.branch || item.department}</CodeBadge>
                    <StatusBadge status={item.status} />
                  </div>
                  <h3 className="ce-card-title">{item.title}</h3>
                  <p className="ce-muted" style={{ fontSize: '0.86rem', margin: 0 }}>
                    {item.subject || 'Campus Item'} {item.semester ? `· Sem ${item.semester}` : ''}
                  </p>
                </div>
                <div
                  className="ce-row-between"
                  style={{
                    marginTop: '0.75rem',
                    paddingTop: '0.75rem',
                    borderTop: '1px solid var(--ce-border)',
                  }}
                >
                  <span className="ce-price-tag" style={{ fontSize: '1.1rem' }}>
                    {formatPrice(item)}
                  </span>
                  <span className="ce-badge ce-badge-neutral">{formatCondition(item.condition)}</span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="ce-card ce-muted" style={{ textAlign: 'center', padding: '2rem' }}>
            No campus listings available yet. Sign in with your college email to add the first item!
          </div>
        )}
      </section>

      <section className="ce-stack">
        <div className="ce-row-between">
          <div>
            <h2 className="ce-title-section">Approved PYQ & Study Library</h2>
            <p className="ce-muted" style={{ fontSize: '0.9rem', margin: 0 }}>
              Verified mid-sem, end-sem, and lab manuals organized by subject and branch.
            </p>
          </div>
          <Link to="/resources" className="ce-btn ce-btn-secondary ce-btn-sm">
            Open Library
          </Link>
        </div>

        {loadingResources ? (
          <div className="ce-grid-cards">
            {Array.from({ length: 3 }).map((_, idx) => (
              <ResourceCardSkeleton key={idx} />
            ))}
          </div>
        ) : recentResources.length > 0 ? (
          <div className="ce-grid-cards">
            {recentResources.map((res) => (
              <div key={res.resourceCode} className="ce-card ce-stack" style={{ justifyContent: 'space-between' }}>
                <div className="ce-stack" style={{ gap: '0.5rem' }}>
                  <div className="ce-row-between">
                    <CodeBadge>{res.branch || res.courseCode}</CodeBadge>
                    <span className="ce-badge ce-badge-neutral">{res.resourceType}</span>
                  </div>
                  <h3 className="ce-card-title">{res.title}</h3>
                  <p className="ce-muted" style={{ fontSize: '0.84rem', margin: 0 }}>
                    {res.subject || res.subjectName} · Year {res.academicYear || '2'}
                  </p>
                </div>
                <div className="ce-row-between" style={{ marginTop: '0.75rem' }}>
                  <span className="ce-muted" style={{ fontSize: '0.8rem' }}>
                    {res.downloadCount || 0} downloads
                  </span>
                  <Link to="/resources" className="ce-btn ce-btn-ghost ce-btn-sm">
                    Inspect in Library
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="ce-card ce-muted" style={{ textAlign: 'center', padding: '2rem' }}>
            No academic resources uploaded yet. Sign in with your college email to contribute question papers or lecture notes.
          </div>
        )}
      </section>
    </div>
  );
}

export function LoginPage() {
  usePageTitle(
    'Sign In',
    'Sign in to your CampusExchange verified student account.'
  );
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [collegeEmail, setCollegeEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const data = await login({ collegeEmail: collegeEmail.trim(), password });
      const user = data?.user;
      showToast({
        tone: 'success',
        title: `Welcome back, ${user?.fullName || 'Student'}`,
      });
      if (user && !user.isEmailVerified && !user.verifiedStudent) {
        navigate(`/verify-email?email=${encodeURIComponent(user.collegeEmail || collegeEmail)}`);
      } else if (String(user?.role || '').toLowerCase() === 'admin') {
        navigate('/admin');
      } else {
        navigate('/app');
      }
    } catch (err) {
      setError(err.message || 'Invalid credentials');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '460px', margin: '2rem auto' }}>
      <div className="ce-card ce-stack">
        <div>
          <CodeBadge>CAMPUS AUTHENTICATION</CodeBadge>
          <h1 className="ce-title-section" style={{ marginTop: '0.5rem' }}>
            Sign in to CampusExchange
          </h1>
          <p className="ce-muted" style={{ fontSize: '0.9rem', margin: '0.25rem 0 0' }}>
            Use your institutional college email address (e.g., <code>@nitk.edu.in</code>).
          </p>
        </div>

        {error && <div className="ce-alert ce-alert-danger">{error}</div>}

        <form onSubmit={handleSubmit} className="ce-stack">
          <div className="ce-field">
            <label className="ce-label" htmlFor="login-email">
              College Email
            </label>
            <input
              id="login-email"
              type="email"
              className="ce-input"
              placeholder="you@college.edu"
              value={collegeEmail}
              onChange={(e) => setCollegeEmail(e.target.value)}
              required
            />
          </div>

          <div className="ce-field">
            <div className="ce-row-between">
              <label className="ce-label" htmlFor="login-password">
                Password
              </label>
              <Link to="/forgot-password" style={{ fontSize: '0.8rem', color: 'var(--ce-accent)' }}>
                Forgot password?
              </Link>
            </div>
            <input
              id="login-password"
              type="password"
              className="ce-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="ce-btn ce-btn-primary" disabled={submitting}>
            {submitting ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div
          style={{
            borderTop: '1px solid var(--ce-border)',
            paddingTop: '1rem',
            fontSize: '0.88rem',
            textAlign: 'center',
          }}
        >
          New to CampusExchange?{' '}
          <Link to="/register" style={{ color: 'var(--ce-accent)', fontWeight: 600 }}>
            Register with College Email
          </Link>
        </div>
      </div>
    </div>
  );
}

export function RegisterPage() {
  usePageTitle(
    'Register',
    'Create your verified student account using your college email.'
  );
  const { register } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    fullName: '',
    collegeEmail: '',
    password: '',
    branch: 'CSE',
    academicYear: '2',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const updateField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await register(form);
      showToast({
        tone: 'success',
        title: 'Verification OTP sent',
        description: `Please check ${form.collegeEmail} for your 6-digit verification code.`,
      });
      navigate(`/verify-email?email=${encodeURIComponent(form.collegeEmail.trim().toLowerCase())}`);
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '540px', margin: '1.5rem auto' }}>
      <div className="ce-card ce-stack">
        <div>
          <CodeBadge>INSTITUTIONAL VERIFICATION</CodeBadge>
          <h1 className="ce-title-section" style={{ marginTop: '0.5rem' }}>
            Create Verified Student Account
          </h1>
          <p className="ce-muted" style={{ fontSize: '0.9rem', margin: '0.25rem 0 0' }}>
            Only approved college domains (e.g., <code>@nitk.edu.in</code>, <code>@campus.edu.in</code>) are permitted.
          </p>
        </div>

        {error && <div className="ce-alert ce-alert-danger">{error}</div>}

        <form onSubmit={handleSubmit} className="ce-stack">
          <div className="ce-field">
            <label className="ce-label" htmlFor="reg-fullname">
              Full Name
            </label>
            <input
              id="reg-fullname"
              type="text"
              className="ce-input"
              placeholder="Full Name"
              value={form.fullName}
              onChange={(e) => updateField('fullName', e.target.value)}
              required
            />
          </div>

          <div className="ce-field">
            <label className="ce-label" htmlFor="reg-email">
              Institutional College Email
            </label>
            <input
              id="reg-email"
              type="email"
              className="ce-input"
              placeholder="you@college.edu"
              value={form.collegeEmail}
              onChange={(e) => updateField('collegeEmail', e.target.value)}
              required
            />
          </div>

          <div className="ce-field">
            <label className="ce-label" htmlFor="reg-password">
              Password (minimum 8 characters)
            </label>
            <input
              id="reg-password"
              type="password"
              className="ce-input"
              placeholder="At least 8 characters"
              value={form.password}
              onChange={(e) => updateField('password', e.target.value)}
              required
            />
          </div>

          <div className="ce-grid-2">
            <div className="ce-field">
              <label className="ce-label" htmlFor="reg-branch">
                Branch / Department
              </label>
              <select
                id="reg-branch"
                className="ce-select"
                value={form.branch}
                onChange={(e) => updateField('branch', e.target.value)}
              >
                {BRANCHES.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>

            <div className="ce-field">
              <label className="ce-label" htmlFor="reg-year">
                Academic Year
              </label>
              <select
                id="reg-year"
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

          <button type="submit" className="ce-btn ce-btn-primary" disabled={submitting}>
            {submitting ? 'Registering...' : 'Register & Send Verification OTP'}
          </button>
        </form>

        <div
          style={{
            borderTop: '1px solid var(--ce-border)',
            paddingTop: '1rem',
            fontSize: '0.88rem',
            textAlign: 'center',
          }}
        >
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--ce-accent)', fontWeight: 600 }}>
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}

export function VerifyEmailPage() {
  usePageTitle(
    'Verify Email',
    'Verify your campus email address with your 6-digit OTP.'
  );
  const [searchParams] = useSearchParams();
  const { user, verifyEmail } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [collegeEmail, setCollegeEmail] = useState(
    searchParams.get('email') || user?.collegeEmail || user?.email || ''
  );
  const [otp, setOtp] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [fetchingOtp, setFetchingOtp] = useState(false);
  const [error, setError] = useState(null);

  const handleFetchDevOtp = async (showSuccessToast = true) => {
    const targetEmail = collegeEmail.trim();
    if (!targetEmail) {
      if (showSuccessToast) {
        setError('Please enter your institutional email to fetch the OTP.');
      }
      return;
    }
    setFetchingOtp(true);
    setError(null);
    try {
      const res = await apiRequest('/auth/dev-mail-preview', {
        params: { email: targetEmail },
      });
      const code = res?.data?.preview?.code;
      if (code) {
        setOtp(code);
        if (showSuccessToast) {
          showToast({
            tone: 'success',
            title: 'OTP Auto-filled',
            description: `Retrieved active verification code: ${code}`,
          });
        }
      } else if (showSuccessToast) {
        showToast({
          tone: 'warning',
          title: 'No active OTP in outbox',
          description: 'Try clicking "Resend OTP" first to generate a fresh code.',
        });
      }
    } catch (err) {
      if (showSuccessToast) {
        setError(err.message || 'Could not retrieve verification code.');
      }
    } finally {
      setFetchingOtp(false);
    }
  };

  useEffect(() => {
    if (collegeEmail.trim()) {
      handleFetchDevOtp(false);
    }
  }, []);

  const handleVerify = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await verifyEmail({ collegeEmail: collegeEmail.trim(), otp: otp.trim() });
      showToast({
        tone: 'success',
        title: 'Institutional email verified!',
        description: 'You can now sign in and access all CampusExchange features.',
      });
      navigate('/login');
    } catch (err) {
      setError(err.message || 'OTP verification failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (!collegeEmail.trim()) return;
    setResending(true);
    setError(null);
    try {
      await apiRequest('/auth/resend-verification', {
        method: 'POST',
        body: { collegeEmail: collegeEmail.trim() },
      });
      showToast({
        tone: 'info',
        title: 'Fresh OTP dispatched',
        description: `Sent to ${collegeEmail}`,
      });
      setTimeout(() => handleFetchDevOtp(false), 500);
    } catch (err) {
      setError(err.message || 'Could not resend OTP');
    } finally {
      setResending(false);
    }
  };

  return (
    <div style={{ maxWidth: '460px', margin: '2rem auto' }}>
      <div className="ce-card ce-stack">
        <div className="ce-row" style={{ gap: '0.5rem', color: 'var(--ce-accent)' }}>
          <MailCheck size={20} />
          <CodeBadge>6-DIGIT OTP VERIFICATION</CodeBadge>
        </div>

        <h1 className="ce-title-section">Verify Your Campus Email</h1>
        <p className="ce-muted" style={{ fontSize: '0.9rem', margin: 0 }}>
          Enter the 6-digit verification code sent to your institutional inbox.
        </p>

        <div
          className="ce-card"
          style={{
            background: 'var(--ce-surface-soft)',
            padding: '0.85rem 1rem',
            border: '1px dashed var(--ce-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.75rem',
            flexWrap: 'wrap',
          }}
        >
          <div>
            <strong style={{ fontSize: '0.86rem', color: 'var(--ce-ink)' }}>Render Free Tier Demo Mode</strong>
            <p className="ce-muted" style={{ margin: '0.2rem 0 0', fontSize: '0.78rem' }}>
              Free hosting blocks SMTP emails. Click to fetch the server-generated OTP directly.
            </p>
          </div>
          <button
            type="button"
            className="ce-btn ce-btn-secondary ce-btn-sm"
            onClick={() => handleFetchDevOtp(true)}
            disabled={fetchingOtp}
            style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', whiteSpace: 'nowrap' }}
          >
            <Zap size={14} />
            <span>{fetchingOtp ? 'Fetching...' : 'Autofill Dev OTP'}</span>
          </button>
        </div>

        {error && <div className="ce-alert ce-alert-danger">{error}</div>}

        <form onSubmit={handleVerify} className="ce-stack">
          <div className="ce-field">
            <label className="ce-label" htmlFor="verify-email">
              Institutional Email
            </label>
            <input
              id="verify-email"
              type="email"
              className="ce-input"
              placeholder="you@college.edu"
              value={collegeEmail}
              onChange={(e) => setCollegeEmail(e.target.value)}
              required
            />
          </div>

          <div className="ce-field">
            <div className="ce-row-between">
              <label className="ce-label" htmlFor="verify-otp">
                6-Digit OTP Code
              </label>
              <button
                type="button"
                className="ce-btn ce-btn-ghost ce-btn-sm"
                style={{ fontSize: '0.8rem', padding: '0.15rem 0.5rem', color: 'var(--ce-accent)' }}
                onClick={() => handleFetchDevOtp(true)}
                disabled={fetchingOtp}
              >
                {fetchingOtp ? 'Fetching...' : '⚡ Autofill OTP'}
              </button>
            </div>
            <input
              id="verify-otp"
              type="text"
              maxLength={6}
              className="ce-input"
              style={{ fontFamily: 'var(--ce-font-mono)', fontSize: '1.15rem', letterSpacing: '0.2em' }}
              placeholder="6-digit code"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="ce-btn ce-btn-primary" disabled={submitting}>
            {submitting ? 'Verifying...' : 'Complete Verification'}
          </button>
        </form>

        <div className="ce-row-between" style={{ paddingTop: '0.5rem' }}>
          <button
            type="button"
            className="ce-btn ce-btn-ghost ce-btn-sm"
            onClick={handleResend}
            disabled={resending}
          >
            {resending ? 'Sending...' : 'Resend OTP'}
          </button>
          <button
            type="button"
            className="ce-btn ce-btn-ghost ce-btn-sm"
            onClick={() => handleFetchDevOtp(true)}
            disabled={fetchingOtp}
            style={{ color: 'var(--ce-accent)' }}
          >
            {fetchingOtp ? 'Checking...' : 'Autofill Dev OTP'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function ForgotPasswordPage() {
  usePageTitle(
    'Forgot Password',
    'Request a password recovery code for your campus email.'
  );
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [collegeEmail, setCollegeEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await apiRequest('/auth/forgot-password', {
        method: 'POST',
        body: { collegeEmail: collegeEmail.trim() },
      });
      showToast({
        tone: 'info',
        title: 'Reset code dispatched',
        description: 'If your campus email is registered, you will receive a password recovery code.',
      });
      navigate(`/reset-password?email=${encodeURIComponent(collegeEmail.trim())}`);
    } catch (err) {
      setError(err.message || 'Request failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '460px', margin: '2rem auto' }}>
      <div className="ce-card ce-stack">
        <div className="ce-row" style={{ gap: '0.5rem' }}>
          <KeyRound size={18} color="var(--ce-accent)" />
          <CodeBadge>ACCOUNT RECOVERY</CodeBadge>
        </div>
        <h1 className="ce-title-section">Reset Your Password</h1>
        <p className="ce-muted" style={{ fontSize: '0.9rem', margin: 0 }}>
          Enter your institutional email address to receive a password recovery code.
        </p>

        {error && <div className="ce-alert ce-alert-danger">{error}</div>}

        <form onSubmit={handleSubmit} className="ce-stack">
          <div className="ce-field">
            <label className="ce-label" htmlFor="forgot-email">
              College Email
            </label>
            <input
              id="forgot-email"
              type="email"
              className="ce-input"
              placeholder="you@college.edu"
              value={collegeEmail}
              onChange={(e) => setCollegeEmail(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="ce-btn ce-btn-primary" disabled={submitting}>
            {submitting ? 'Sending...' : 'Send Recovery Code'}
          </button>
        </form>
      </div>
    </div>
  );
}

export function ResetPasswordPage() {
  usePageTitle(
    'Reset Password',
    'Enter your recovery code and choose a new password.'
  );
  const [searchParams] = useSearchParams();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [collegeEmail, setCollegeEmail] = useState(searchParams.get('email') || '');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await apiRequest('/auth/reset-password', {
        method: 'POST',
        body: {
          collegeEmail: collegeEmail.trim(),
          token: token.trim(),
          newPassword,
        },
      });
      showToast({
        tone: 'success',
        title: 'Password updated',
        description: 'All prior sessions have been revoked. Please sign in with your new password.',
      });
      navigate('/login');
    } catch (err) {
      setError(err.message || 'Password reset failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFetchDevToken = async () => {
    if (!collegeEmail.trim()) return;
    try {
      const res = await apiRequest('/auth/dev-mail-preview', {
        params: { email: collegeEmail.trim() },
      });
      const code = res?.data?.preview?.code;
      if (code) {
        setToken(code);
      }
    } catch {
      // Ignore in production
    }
  };

  return (
    <div style={{ maxWidth: '460px', margin: '2rem auto' }}>
      <div className="ce-card ce-stack">
        <div className="ce-row" style={{ gap: '0.5rem' }}>
          <CheckCircle2 size={18} color="var(--ce-success)" />
          <CodeBadge>NEW CREDENTIALS</CodeBadge>
        </div>
        <h1 className="ce-title-section">Choose New Password</h1>

        {error && <div className="ce-alert ce-alert-danger">{error}</div>}

        <form onSubmit={handleSubmit} className="ce-stack">
          <div className="ce-field">
            <label className="ce-label" htmlFor="reset-email">
              College Email
            </label>
            <input
              id="reset-email"
              type="email"
              className="ce-input"
              placeholder="you@college.edu"
              value={collegeEmail}
              onChange={(e) => setCollegeEmail(e.target.value)}
              required
            />
          </div>

          <div className="ce-field">
            <div className="ce-row-between">
              <label className="ce-label" htmlFor="reset-token">
                Recovery Code / Token
              </label>
              <button
                type="button"
                className="ce-btn ce-btn-ghost ce-btn-sm"
                onClick={handleFetchDevToken}
              >
                Autofill Dev Code
              </button>
            </div>
            <input
              id="reset-token"
              type="text"
              className="ce-input"
              placeholder="Recovery code"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              required
            />
          </div>

          <div className="ce-field">
            <label className="ce-label" htmlFor="reset-password">
              New Password
            </label>
            <input
              id="reset-password"
              type="password"
              className="ce-input"
              placeholder="At least 8 characters"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="ce-btn ce-btn-primary" disabled={submitting}>
            {submitting ? 'Updating...' : 'Reset Password'}
          </button>
        </form>
      </div>
    </div>
  );
}

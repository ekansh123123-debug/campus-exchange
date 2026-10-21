import { Link } from 'react-router-dom';
import { Compass, ShoppingBag, BookOpen, Home, ArrowLeft } from 'lucide-react';
import { usePageTitle } from '../../lib/usePageTitle.js';
import { CodeBadge } from '../../components/CodeBadge.jsx';
import { useAuth } from '../auth/AuthContext.jsx';

export function NotFoundPage() {
  usePageTitle(
    'Page Not Found (404)',
    'The requested campus listing, academic resource, or page could not be located.'
  );
  const { isAuthenticated } = useAuth();

  return (
    <div
      className="ce-stack-lg"
      style={{
        maxWidth: '680px',
        margin: '3rem auto',
        textAlign: 'center',
        alignItems: 'center',
      }}
    >
      <div className="ce-row" style={{ gap: '0.6rem', justifyContent: 'center' }}>
        <span className="ce-badge ce-badge-danger">HTTP 404</span>
      </div>

      <div
        style={{
          width: '72px',
          height: '72px',
          borderRadius: '50%',
          background: 'var(--ce-surface-muted)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--ce-primary)',
          margin: '0.5rem auto',
        }}
      >
        <Compass size={36} />
      </div>

      <h1 className="ce-title-section" style={{ fontSize: '2.1rem', margin: 0 }}>
        Lost in the Academic Archives?
      </h1>

      <p className="ce-subtitle" style={{ margin: '0 auto', fontSize: '1rem' }}>
        The page, student listing, or study resource you are searching for does not exist, has been
        completed, or was moved to a new campus URL.
      </p>

      <div
        className="ce-row"
        style={{
          flexWrap: 'wrap',
          gap: '0.75rem',
          justifyContent: 'center',
          marginTop: '1.25rem',
        }}
      >
        <Link to="/marketplace" className="ce-btn ce-btn-primary ce-btn-md">
          <ShoppingBag size={16} />
          <span>Browse Marketplace</span>
        </Link>

        <Link to="/resources" className="ce-btn ce-btn-secondary ce-btn-md">
          <BookOpen size={16} />
          <span>Explore PYQ Library</span>
        </Link>

        <Link to={isAuthenticated ? '/app' : '/'} className="ce-btn ce-btn-ghost ce-btn-md">
          {isAuthenticated ? <Home size={16} /> : <ArrowLeft size={16} />}
          <span>{isAuthenticated ? 'Student Hub' : 'Back to Home'}</span>
        </Link>
      </div>

      <div
        className="ce-card"
        style={{
          marginTop: '2rem',
          width: '100%',
          textAlign: 'left',
          fontSize: '0.88rem',
          background: 'var(--ce-surface-soft)',
        }}
      >
        <strong style={{ display: 'block', marginBottom: '0.4rem', color: 'var(--ce-ink)' }}>
          Need assistance or reported a missing resource?
        </strong>
        <p className="ce-muted" style={{ margin: 0 }}>
          Reach out to campus student coordinators at{' '}
          <a
            href="mailto:support@campusexchange.edu"
            style={{ color: 'var(--ce-primary)', fontWeight: 600, textDecoration: 'underline' }}
          >
            support@campusexchange.edu
          </a>{' '}
          or call the campus desk at{' '}
          <a
            href="tel:+918242474000"
            style={{ color: 'var(--ce-primary)', fontWeight: 600, textDecoration: 'underline' }}
          >
            +91 824 247 4000
          </a>
          .
        </p>
      </div>
    </div>
  );
}

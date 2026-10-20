import { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  BookOpen,
  ShoppingBag,
  Bell,
  MessageSquare,
  Heart,
  Package,
  ArrowLeftRight,
  ShieldCheck,
  User as UserIcon,
  LogOut,
  PlusCircle,
  Upload,
  LayoutDashboard,
  Menu,
  X,
  Phone,
  Mail,
  Shield,
  HelpCircle,
} from 'lucide-react';
import { useAuth } from '../features/auth/AuthContext.jsx';
import { apiRequest } from '../lib/api-client.js';
import { TopLoadingBar } from './TopLoadingBar.jsx';

export function AppShell() {
  const { user, isAuthenticated, isVerifiedStudent, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [prevPathname, setPrevPathname] = useState(location.pathname);

  // Close mobile drawer on route transition without cascading effect renders
  if (prevPathname !== location.pathname) {
    setPrevPathname(location.pathname);
    setMobileMenuOpen(false);
  }

  const { data: unreadData } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => apiRequest('/notifications/unread-count'),
    enabled: isAuthenticated,
    refetchInterval: 20_000,
  });

  const unreadCount = unreadData?.data?.unreadCount || 0;
  const userEmail = user?.collegeEmail || user?.email || '';
  const currentYear = new Date().getFullYear();

  const handleLogout = async () => {
    setMobileMenuOpen(false);
    await logout();
    navigate('/login');
  };

  return (
    <div className="ce-shell">
      <TopLoadingBar />
      <header className="ce-navbar">
        <div className="ce-container ce-navbar-inner">
          <div className="ce-row" style={{ gap: '1.25rem' }}>
            {/* Clickable Brand Logo */}
            <Link to={isAuthenticated ? '/app' : '/'} className="ce-brand" aria-label="CampusExchange Home">
              <span>CampusExchange</span>
              <span className="ce-brand-badge ce-row" style={{ gap: '0.35rem', alignItems: 'center' }}>
                <span className="ce-pulse-beacon" aria-hidden="true" style={{ width: 6, height: 6 }} />
                VERIFIED CAMPUS
              </span>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="ce-nav-links ce-desktop-only" aria-label="Main Navigation">
              <NavLink
                to="/marketplace"
                className={({ isActive }) => `ce-nav-link ${isActive ? 'active' : ''}`}
              >
                <span className="ce-row" style={{ gap: '0.35rem' }}>
                  <ShoppingBag size={15} />
                  Marketplace
                </span>
              </NavLink>

              <NavLink
                to="/resources"
                className={({ isActive }) => `ce-nav-link ${isActive ? 'active' : ''}`}
              >
                <span className="ce-row" style={{ gap: '0.35rem' }}>
                  <BookOpen size={15} />
                  PYQ & Library
                </span>
              </NavLink>

              {isAuthenticated && (
                <>
                  <NavLink
                    to="/app"
                    end
                    className={({ isActive }) => `ce-nav-link ${isActive ? 'active' : ''}`}
                  >
                    <span className="ce-row" style={{ gap: '0.35rem' }}>
                      <LayoutDashboard size={15} />
                      Hub
                    </span>
                  </NavLink>

                  <NavLink
                    to="/my-listings"
                    className={({ isActive }) => `ce-nav-link ${isActive ? 'active' : ''}`}
                  >
                    <span className="ce-row" style={{ gap: '0.35rem' }}>
                      <Package size={15} />
                      My Listings
                    </span>
                  </NavLink>

                  <NavLink
                    to="/transactions"
                    className={({ isActive }) => `ce-nav-link ${isActive ? 'active' : ''}`}
                  >
                    <span className="ce-row" style={{ gap: '0.35rem' }}>
                      <ArrowLeftRight size={15} />
                      Handovers
                    </span>
                  </NavLink>

                  <NavLink
                    to="/messages"
                    className={({ isActive }) => `ce-nav-link ${isActive ? 'active' : ''}`}
                  >
                    <span className="ce-row" style={{ gap: '0.35rem' }}>
                      <MessageSquare size={15} />
                      Chat
                    </span>
                  </NavLink>

                  <NavLink
                    to="/wishlist"
                    className={({ isActive }) => `ce-nav-link ${isActive ? 'active' : ''}`}
                  >
                    <span className="ce-row" style={{ gap: '0.35rem' }}>
                      <Heart size={15} />
                      Saved
                    </span>
                  </NavLink>
                </>
              )}

              {isAdmin && (
                <NavLink
                  to="/admin"
                  className={({ isActive }) => `ce-nav-link ${isActive ? 'active' : ''}`}
                >
                  <span className="ce-row" style={{ gap: '0.35rem', color: 'var(--ce-accent)' }}>
                    <ShieldCheck size={15} />
                    Admin
                  </span>
                </NavLink>
              )}
            </nav>
          </div>

          {/* Desktop Right Side Controls */}
          <div className="ce-row ce-desktop-only" style={{ gap: '0.55rem' }}>
            {isAuthenticated ? (
              <>
                {isVerifiedStudent && (
                  <>
                    <Link to="/listings/new" className="ce-btn ce-btn-primary ce-btn-sm">
                      <PlusCircle size={15} />
                      <span>Sell / Share Item</span>
                    </Link>
                    <Link to="/resources/upload" className="ce-btn ce-btn-secondary ce-btn-sm">
                      <Upload size={15} />
                      <span>Upload PYQ</span>
                    </Link>
                  </>
                )}

                <Link
                  to="/notifications"
                  className="ce-btn ce-btn-ghost ce-btn-sm"
                  aria-label="Notifications"
                  style={{ position: 'relative' }}
                >
                  <Bell size={17} />
                  {unreadCount > 0 && (
                    <span
                      className="ce-badge ce-badge-info"
                      style={{
                        padding: '0.05rem 0.38rem',
                        fontSize: '0.68rem',
                        marginLeft: '0.15rem',
                      }}
                    >
                      {unreadCount}
                    </span>
                  )}
                </Link>

                <Link to="/profile" className="ce-btn ce-btn-ghost ce-btn-sm" title={user?.fullName}>
                  <UserIcon size={16} />
                  <span style={{ maxWidth: '110px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {user?.fullName?.split(' ')[0] || 'Profile'}
                  </span>
                </Link>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="ce-btn ce-btn-ghost ce-btn-sm"
                  title="Sign out"
                  aria-label="Sign out"
                >
                  <LogOut size={16} />
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="ce-btn ce-btn-ghost ce-btn-sm">
                  Sign In
                </Link>
                <Link to="/register" className="ce-btn ce-btn-primary ce-btn-sm">
                  Verify Campus ID
                </Link>
              </>
            )}
          </div>

          {/* Mobile Hamburger Toggle Button */}
          <button
            type="button"
            className="ce-mobile-toggle"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* Responsive Mobile Drawer Menu */}
        {mobileMenuOpen && (
          <div className="ce-mobile-drawer ce-animate-enter" role="dialog" aria-modal="true" aria-label="Mobile Navigation">
            {isAuthenticated ? (
              <div className="ce-mobile-user-card">
                <div className="ce-row" style={{ gap: '0.65rem' }}>
                  <div className="ce-mobile-avatar">
                    <UserIcon size={18} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--ce-ink)' }}>{user?.fullName}</div>
                    <div className="ce-muted" style={{ fontSize: '0.8rem' }}>
                      {userEmail} {user?.branch ? `· ${user.branch}` : ''}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="ce-row" style={{ gap: '0.5rem', marginBottom: '1rem', width: '100%' }}>
                <Link
                  to="/login"
                  className="ce-btn ce-btn-secondary"
                  style={{ flex: 1, justifyContent: 'center' }}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="ce-btn ce-btn-primary"
                  style={{ flex: 1, justifyContent: 'center' }}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Verify Campus ID
                </Link>
              </div>
            )}

            {isVerifiedStudent && (
              <div className="ce-row" style={{ gap: '0.5rem', marginBottom: '0.75rem', width: '100%' }}>
                <Link
                  to="/listings/new"
                  className="ce-btn ce-btn-primary ce-btn-sm"
                  style={{ flex: 1, justifyContent: 'center' }}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <PlusCircle size={15} />
                  <span>Sell Item</span>
                </Link>
                <Link
                  to="/resources/upload"
                  className="ce-btn ce-btn-secondary ce-btn-sm"
                  style={{ flex: 1, justifyContent: 'center' }}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Upload size={15} />
                  <span>Upload PYQ</span>
                </Link>
              </div>
            )}

            <nav className="ce-mobile-nav" aria-label="Mobile Navigation Links">
              <NavLink
                to="/marketplace"
                className={({ isActive }) => `ce-mobile-link ${isActive ? 'active' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <ShoppingBag size={18} />
                <span>Marketplace</span>
              </NavLink>

              <NavLink
                to="/resources"
                className={({ isActive }) => `ce-mobile-link ${isActive ? 'active' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <BookOpen size={18} />
                <span>PYQ & Study Library</span>
              </NavLink>

              {isAuthenticated && (
                <>
                  <NavLink
                    to="/app"
                    end
                    className={({ isActive }) => `ce-mobile-link ${isActive ? 'active' : ''}`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <LayoutDashboard size={18} />
                    <span>Student Hub</span>
                  </NavLink>

                  <NavLink
                    to="/my-listings"
                    className={({ isActive }) => `ce-mobile-link ${isActive ? 'active' : ''}`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Package size={18} />
                    <span>My Listings</span>
                  </NavLink>

                  <NavLink
                    to="/transactions"
                    className={({ isActive }) => `ce-mobile-link ${isActive ? 'active' : ''}`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <ArrowLeftRight size={18} />
                    <span>Campus Handovers</span>
                  </NavLink>

                  <NavLink
                    to="/messages"
                    className={({ isActive }) => `ce-mobile-link ${isActive ? 'active' : ''}`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <MessageSquare size={18} />
                    <span>Conversations</span>
                  </NavLink>

                  <NavLink
                    to="/wishlist"
                    className={({ isActive }) => `ce-mobile-link ${isActive ? 'active' : ''}`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Heart size={18} />
                    <span>Saved Items</span>
                  </NavLink>

                  <NavLink
                    to="/notifications"
                    className={({ isActive }) => `ce-mobile-link ${isActive ? 'active' : ''}`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Bell size={18} />
                    <span>Notifications</span>
                    {unreadCount > 0 && (
                      <span className="ce-badge ce-badge-info" style={{ marginLeft: 'auto' }}>
                        {unreadCount}
                      </span>
                    )}
                  </NavLink>

                  <NavLink
                    to="/profile"
                    className={({ isActive }) => `ce-mobile-link ${isActive ? 'active' : ''}`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <UserIcon size={18} />
                    <span>My Profile</span>
                  </NavLink>
                </>
              )}

              {isAdmin && (
                <NavLink
                  to="/admin"
                  className={({ isActive }) => `ce-mobile-link ${isActive ? 'active' : ''}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <ShieldCheck size={18} color="var(--ce-accent)" />
                  <span>Admin Governance</span>
                </NavLink>
              )}
            </nav>

            <div className="ce-mobile-contacts-section">
              <div className="ce-muted" style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                Campus Assistance
              </div>
              <div className="ce-row" style={{ gap: '1rem', flexWrap: 'wrap' }}>
                <a href="tel:+918242474000" className="ce-contact-link">
                  <Phone size={14} />
                  <span>+91 824 247 4000</span>
                </a>
                <a href="mailto:support@campusexchange.edu" className="ce-contact-link">
                  <Mail size={14} />
                  <span>support@campusexchange.edu</span>
                </a>
              </div>
            </div>

            {isAuthenticated && (
              <button
                type="button"
                onClick={handleLogout}
                className="ce-btn ce-btn-danger ce-btn-sm"
                style={{ width: '100%', justifyContent: 'center', marginTop: '1rem' }}
              >
                <LogOut size={16} />
                <span>Sign Out</span>
              </button>
            )}
          </div>
        )}
      </header>

      {/* Unverified Email Warning Banner */}
      {isAuthenticated && !isVerifiedStudent && (
        <div
          style={{
            background: 'var(--ce-warning-bg)',
            borderBottom: '1px solid var(--ce-border)',
            padding: '0.65rem 0',
          }}
        >
          <div className="ce-container ce-row-between" style={{ fontSize: '0.86rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <span style={{ color: 'var(--ce-warning)', fontWeight: 500 }}>
              Your institutional email ({userEmail}) is pending verification. Verify with OTP to list items, reserve books, or upload resources.
            </span>
            <Link
              to={`/verify-email?email=${encodeURIComponent(userEmail)}`}
              className="ce-btn ce-btn-primary ce-btn-sm"
            >
              Verify Email Now
            </Link>
          </div>
        </div>
      )}

      {/* Main Page Body */}
      <main className="ce-main">
        <div className="ce-container">
          <Outlet />
        </div>
      </main>

      {/* Responsive Footer with Clickable Logo, Contacts, Links & Dynamic Year */}
      <footer className="ce-footer">
        <div className="ce-container ce-stack" style={{ gap: '1.75rem' }}>
          <div className="ce-row-between" style={{ flexWrap: 'wrap', gap: '1.5rem', alignItems: 'flex-start' }}>
            <div style={{ maxWidth: '420px' }}>
              <Link to={isAuthenticated ? '/app' : '/'} className="ce-brand" style={{ marginBottom: '0.5rem' }}>
                <span>CampusExchange</span>
                <span className="ce-brand-badge">VERIFIED CAMPUS</span>
              </Link>
              <p className="ce-muted" style={{ margin: '0.5rem 0 1rem', fontSize: '0.88rem', lineHeight: 1.5 }}>
                Peer-to-peer engineering student marketplace & moderated academic library. Every handover is tracked on campus with concurrency-safe single-active reservations.
              </p>
              {/* Clickable Helpline & Support Contacts */}
              <div className="ce-row" style={{ gap: '1.25rem', flexWrap: 'wrap', fontSize: '0.88rem' }}>
                <a href="tel:+918242474000" className="ce-contact-link" title="Call Campus Desk">
                  <Phone size={14} color="var(--ce-primary)" />
                  <span>+91 824 247 4000</span>
                </a>
                <a href="mailto:support@campusexchange.edu" className="ce-contact-link" title="Email Student Support">
                  <Mail size={14} color="var(--ce-primary)" />
                  <span>support@campusexchange.edu</span>
                </a>
              </div>
            </div>

            <div className="ce-row" style={{ gap: '3rem', flexWrap: 'wrap' }}>
              <div className="ce-stack" style={{ gap: '0.45rem', fontSize: '0.88rem' }}>
                <strong style={{ color: 'var(--ce-ink)' }}>Marketplace</strong>
                <Link to="/marketplace" className="ce-footer-link">Textbooks & Calculators</Link>
                <Link to="/marketplace?category=drawing-instruments" className="ce-footer-link">Drafting & Lab Kits</Link>
                {isVerifiedStudent && <Link to="/listings/new" className="ce-footer-link">Sell / Share Item</Link>}
              </div>

              <div className="ce-stack" style={{ gap: '0.45rem', fontSize: '0.88rem' }}>
                <strong style={{ color: 'var(--ce-ink)' }}>Academics</strong>
                <Link to="/resources" className="ce-footer-link">PYQ Library</Link>
                <Link to="/resources?type=notes" className="ce-footer-link">Lecture Notes</Link>
                {isVerifiedStudent && <Link to="/resources/upload" className="ce-footer-link">Upload Exam Paper</Link>}
              </div>

              <div className="ce-stack" style={{ gap: '0.45rem', fontSize: '0.88rem' }}>
                <strong style={{ color: 'var(--ce-ink)' }}>Student Space</strong>
                <Link to="/app" className="ce-footer-link">Student Hub</Link>
                <Link to="/transactions" className="ce-footer-link">Campus Handovers</Link>
                <Link to="/wishlist" className="ce-footer-link">Saved Wishlist</Link>
              </div>
            </div>
          </div>

          <div
            className="ce-row-between"
            style={{
              paddingTop: '1.25rem',
              borderTop: '1px solid var(--ce-hairline)',
              fontSize: '0.82rem',
              color: 'var(--ce-muted)',
              flexWrap: 'wrap',
              gap: '0.75rem',
            }}
          >
            <div>
              &copy; {currentYear} CampusExchange. Verified engineering institutional network.
            </div>
            <div className="ce-row" style={{ gap: '1rem', flexWrap: 'wrap' }}>
              <span>Central Library & SAC Handovers</span>
              <span>&bull;</span>
              <span>Single-Active Concurrency Protection</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

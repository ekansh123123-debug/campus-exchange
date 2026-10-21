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
  const [quickPostOpen, setQuickPostOpen] = useState(false);
  const [prevPathname, setPrevPathname] = useState(location.pathname);

  // Close mobile drawer & action sheet on route transition without cascading effect renders
  if (prevPathname !== location.pathname) {
    setPrevPathname(location.pathname);
    setMobileMenuOpen(false);
    setQuickPostOpen(false);
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

  const isListingDetailPage =
    location.pathname.startsWith('/listings/') && location.pathname !== '/listings/new';
  const isMessagesThreadPage =
    location.pathname.startsWith('/messages/') && location.pathname !== '/messages';
  const hideMobileBottomNav = isListingDetailPage || isMessagesThreadPage;

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
          <div className="ce-row" style={{ gap: 'clamp(0.4rem, 1.2vw, 1.1rem)', minWidth: 0, flex: '1 1 auto', overflow: 'hidden' }}>
            {/* Clickable Brand Logo */}
            <Link to={isAuthenticated ? '/app' : '/'} className="ce-brand" aria-label="CampusExchange Home">
              <span>CampusExchange</span>
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
                  PYQ Library
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
          <div className="ce-row ce-desktop-only" style={{ gap: '0.45rem', flexShrink: 0, zIndex: 2 }}>
            {isAuthenticated ? (
              <>
                {isVerifiedStudent && (
                  <>
                    <Link to="/listings/new" className="ce-btn ce-btn-primary ce-btn-sm">
                      <PlusCircle size={15} />
                      <span>Sell</span>
                    </Link>
                    <Link to="/resources/upload" className="ce-btn ce-btn-secondary ce-btn-sm">
                      <Upload size={15} />
                      <span>Upload</span>
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
                  <span style={{ maxWidth: '75px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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
                  Register
                </Link>
              </>
            )}
          </div>

          {/* Mobile Header Quick Actions */}
          <div className="ce-row ce-mobile-only" style={{ gap: '0.4rem', flexShrink: 0 }}>
            {isAuthenticated && (
              <Link
                to="/notifications"
                className="ce-btn ce-btn-ghost ce-btn-sm"
                aria-label="Mobile notifications"
                style={{ position: 'relative', padding: '0.4rem', minWidth: '38px', minHeight: '38px' }}
              >
                <Bell size={19} />
                {unreadCount > 0 && (
                  <span
                    className="ce-badge ce-badge-info"
                    style={{
                      position: 'absolute',
                      top: '2px',
                      right: '2px',
                      padding: '1px 5px',
                      fontSize: '0.65rem',
                      lineHeight: 1,
                    }}
                  >
                    {unreadCount}
                  </span>
                )}
              </Link>
            )}

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
        </div>

        {/* Responsive Mobile Drawer Backdrop Overlay */}
        {mobileMenuOpen && (
          <div
            className="ce-mobile-drawer-backdrop"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* Responsive Mobile Drawer Slide-over Menu */}
        {mobileMenuOpen && (
          <aside
            className="ce-mobile-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Mobile Navigation"
          >
            <div className="ce-row-between" style={{ marginBottom: '1.15rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--ce-hairline)' }}>
              <Link to={isAuthenticated ? '/app' : '/'} className="ce-brand" onClick={() => setMobileMenuOpen(false)}>
                <span>CampusExchange</span>
              </Link>
              <button
                type="button"
                className="ce-btn ce-btn-ghost ce-btn-sm"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Dismiss menu"
                style={{ padding: '0.4rem', minWidth: '36px', minHeight: '36px' }}
              >
                <X size={20} />
              </button>
            </div>

            {isAuthenticated ? (
              <div className="ce-mobile-user-card">
                <div className="ce-row" style={{ gap: '0.65rem' }}>
                  <div className="ce-mobile-avatar">
                    <UserIcon size={20} />
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontWeight: 600, color: 'var(--ce-ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {user?.fullName}
                    </div>
                    <div className="ce-muted" style={{ fontSize: '0.78rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {userEmail} {user?.branch ? `· ${user.branch}` : ''}
                    </div>
                    <div className="ce-row" style={{ gap: '0.35rem', marginTop: '0.3rem' }}>
                      <span className={`ce-badge ${isVerifiedStudent ? 'ce-badge-success' : 'ce-badge-warning'}`} style={{ fontSize: '0.72rem', padding: '1px 7px' }}>
                        {isVerifiedStudent ? 'Verified Student' : 'Email Pending'}
                      </span>
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
              <div className="ce-row" style={{ gap: '0.5rem', marginBottom: '1rem', width: '100%' }}>
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

            <div className="ce-muted" style={{ fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', margin: '0.5rem 0 0.35rem' }}>
              Campus Hub & Academics
            </div>
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

                  <div className="ce-muted" style={{ fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', margin: '0.75rem 0 0.35rem' }}>
                    My Student Activity
                  </div>

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

            {isAuthenticated && (
              <button
                type="button"
                onClick={handleLogout}
                className="ce-btn ce-btn-danger ce-btn-sm"
                style={{ width: '100%', justifyContent: 'center', marginTop: '1.25rem' }}
              >
                <LogOut size={16} />
                <span>Sign Out</span>
              </button>
            )}
          </aside>
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

      {/* Footer */}
      <footer className="ce-footer">
        <div className="ce-container ce-stack" style={{ gap: '1.5rem' }}>
          <div className="ce-row-between" style={{ flexWrap: 'wrap', gap: '1.5rem', alignItems: 'flex-start' }}>
            <div style={{ maxWidth: '380px', minWidth: 0 }}>
              <Link to={isAuthenticated ? '/app' : '/'} className="ce-brand" style={{ marginBottom: '0.4rem' }}>
                <span>CampusExchange</span>
              </Link>
              <p className="ce-muted" style={{ margin: '0.4rem 0 0', fontSize: '0.88rem', lineHeight: 1.5 }}>
                Peer-to-peer student marketplace and academic library for college campuses.
              </p>
            </div>

            <div className="ce-row" style={{ gap: 'clamp(1.5rem, 4vw, 3.5rem)', flexWrap: 'wrap' }}>
              <div className="ce-stack" style={{ gap: '0.4rem', fontSize: '0.88rem' }}>
                <strong style={{ color: 'var(--ce-ink)' }}>Marketplace</strong>
                <Link to="/marketplace" className="ce-footer-link">Browse Items</Link>
                {isVerifiedStudent && <Link to="/listings/new" className="ce-footer-link">Sell Item</Link>}
              </div>

              <div className="ce-stack" style={{ gap: '0.4rem', fontSize: '0.88rem' }}>
                <strong style={{ color: 'var(--ce-ink)' }}>Study Library</strong>
                <Link to="/resources" className="ce-footer-link">PYQ Papers</Link>
                {isVerifiedStudent && <Link to="/resources/upload" className="ce-footer-link">Upload Material</Link>}
              </div>

              <div className="ce-stack" style={{ gap: '0.4rem', fontSize: '0.88rem' }}>
                <strong style={{ color: 'var(--ce-ink)' }}>Student Space</strong>
                <Link to={isAuthenticated ? '/app' : '/login'} className="ce-footer-link">Student Hub</Link>
                {isAuthenticated && <Link to="/transactions" className="ce-footer-link">Campus Handovers</Link>}
                {isAuthenticated && <Link to="/wishlist" className="ce-footer-link">Saved Wishlist</Link>}
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
              &copy; {currentYear} CampusExchange. All rights reserved.
            </div>
          </div>
        </div>
      </footer>

      {/* Mobile Bottom Navigation Bar (Visible on mobile screens <= 768px, hidden on detail/thread views) */}
      {!hideMobileBottomNav && (
        <nav className="ce-mobile-bottom-nav" aria-label="Mobile Bottom Navigation">
          <NavLink
            to="/marketplace"
            className={({ isActive }) => `ce-mobile-nav-item ${isActive ? 'active' : ''}`}
          >
            <ShoppingBag size={20} />
            <span>Market</span>
          </NavLink>

          <NavLink
            to="/resources"
            className={({ isActive }) => `ce-mobile-nav-item ${isActive ? 'active' : ''}`}
          >
            <BookOpen size={20} />
            <span>PYQs</span>
          </NavLink>

          <button
            type="button"
            className="ce-mobile-nav-fab"
            onClick={() => setQuickPostOpen(true)}
            aria-label="Create Listing or Upload PYQ"
          >
            <div className="ce-mobile-fab-circle">
              <PlusCircle size={20} />
            </div>
            <span>Post</span>
          </button>

          <NavLink
            to={isAuthenticated ? '/transactions' : '/login'}
            className={({ isActive }) => `ce-mobile-nav-item ${isActive ? 'active' : ''}`}
          >
            <ArrowLeftRight size={20} />
            <span>Handovers</span>
          </NavLink>

          <NavLink
            to={isAuthenticated ? '/app' : '/login'}
            className={({ isActive }) => `ce-mobile-nav-item ${isActive ? 'active' : ''}`}
          >
            <LayoutDashboard size={20} />
            <span>Hub</span>
          </NavLink>
        </nav>
      )}

      {/* Mobile Quick Post Action Sheet Modal */}
      {quickPostOpen && (
        <div className="ce-modal-backdrop" onClick={() => setQuickPostOpen(false)}>
          <div
            className="ce-mobile-action-sheet"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Quick Campus Post"
          >
            <div className="ce-action-sheet-handle" />
            <div className="ce-row-between" style={{ marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontFamily: 'var(--ce-font-serif)' }}>
                  Create Campus Post
                </h3>
                <p className="ce-muted" style={{ margin: '0.2rem 0 0', fontSize: '0.82rem' }}>
                  Share textbooks, lab equipment, or verified exam resources
                </p>
              </div>
              <button
                type="button"
                className="ce-btn ce-btn-ghost ce-btn-sm"
                onClick={() => setQuickPostOpen(false)}
                aria-label="Close action sheet"
                style={{ padding: '0.4rem', minWidth: '36px', minHeight: '36px' }}
              >
                <X size={18} />
              </button>
            </div>

            {isVerifiedStudent ? (
              <div className="ce-stack" style={{ gap: '0.75rem' }}>
                <Link
                  to="/listings/new"
                  className="ce-action-sheet-item"
                  onClick={() => setQuickPostOpen(false)}
                >
                  <div
                    className="ce-action-sheet-icon"
                    style={{ background: 'var(--ce-primary-soft)', color: 'var(--ce-primary)' }}
                  >
                    <ShoppingBag size={22} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--ce-ink)' }}>Sell Textbook or Lab Gear</div>
                    <div className="ce-muted" style={{ fontSize: '0.82rem' }}>
                      List calculators, drafters, textbooks, or components for peer pickup
                    </div>
                  </div>
                </Link>

                <Link
                  to="/resources/upload"
                  className="ce-action-sheet-item"
                  onClick={() => setQuickPostOpen(false)}
                >
                  <div
                    className="ce-action-sheet-icon"
                    style={{ background: 'var(--ce-accent-teal-soft)', color: 'var(--ce-accent-teal)' }}
                  >
                    <BookOpen size={22} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--ce-ink)' }}>Upload Past Exam Paper (PYQ) / Notes</div>
                    <div className="ce-muted" style={{ fontSize: '0.82rem' }}>
                      Upload verified mid-sem/end-sem question paper PDFs or lecture notes
                    </div>
                  </div>
                </Link>
              </div>
            ) : isAuthenticated ? (
              <div className="ce-stack" style={{ gap: '0.75rem' }}>
                <div className="ce-alert ce-alert-warning" style={{ fontSize: '0.86rem' }}>
                  Your student email is pending verification. Verify with OTP to list items or upload resources.
                </div>
                <Link
                  to={`/verify-email?email=${encodeURIComponent(userEmail)}`}
                  className="ce-btn ce-btn-primary"
                  style={{ width: '100%', justifyContent: 'center' }}
                  onClick={() => setQuickPostOpen(false)}
                >
                  Verify Institutional Email
                </Link>
              </div>
            ) : (
              <div className="ce-stack" style={{ gap: '0.75rem' }}>
                <div className="ce-alert ce-alert-info" style={{ fontSize: '0.86rem' }}>
                  Sign in with your verified college credentials to trade items or share academic materials.
                </div>
                <div className="ce-row" style={{ gap: '0.5rem', width: '100%' }}>
                  <Link
                    to="/login"
                    className="ce-btn ce-btn-secondary"
                    style={{ flex: 1, justifyContent: 'center' }}
                    onClick={() => setQuickPostOpen(false)}
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    className="ce-btn ce-btn-primary"
                    style={{ flex: 1, justifyContent: 'center' }}
                    onClick={() => setQuickPostOpen(false)}
                  >
                    Verify Campus ID
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

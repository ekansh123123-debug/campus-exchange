import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
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
} from 'lucide-react';
import { useAuth } from '../features/auth/AuthContext.jsx';
import { apiRequest } from '../lib/api-client.js';

export function AppShell() {
  const { user, isAuthenticated, isVerifiedStudent, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const { data: unreadData } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => apiRequest('/notifications/unread-count'),
    enabled: isAuthenticated,
    refetchInterval: 20_000,
  });

  const unreadCount = unreadData?.data?.unreadCount || 0;
  const userEmail = user?.collegeEmail || user?.email || '';

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="ce-shell">
      <header className="ce-navbar">
        <div className="ce-container ce-navbar-inner">
          <div className="ce-row" style={{ gap: '1.5rem' }}>
            <Link to={isAuthenticated ? '/app' : '/'} className="ce-brand">
              <span>CampusExchange</span>
              <span className="ce-brand-badge">VERIFIED CAMPUS</span>
            </Link>

            <nav className="ce-nav-links" aria-label="Main Navigation">
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

          <div className="ce-row" style={{ gap: '0.55rem' }}>
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
        </div>
      </header>

      {isAuthenticated && !isVerifiedStudent && (
        <div
          style={{
            background: 'var(--ce-warning-bg)',
            borderBottom: '1px solid var(--ce-border)',
            padding: '0.6rem 0',
          }}
        >
          <div className="ce-container ce-row-between" style={{ fontSize: '0.86rem' }}>
            <span style={{ color: 'var(--ce-warning)', fontWeight: 500 }}>
              Your institutional email ({userEmail}) is pending OTP verification. Verify to create listings, reserve items, or upload resources.
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

      <main className="ce-main">
        <div className="ce-container">
          <Outlet />
        </div>
      </main>

      <footer className="ce-footer">
        <div className="ce-container ce-row-between" style={{ flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <strong style={{ fontFamily: 'var(--ce-font-serif)', color: 'var(--ce-text-primary)' }}>
              CampusExchange
            </strong>{' '}
            <span>— Verified Engineering Student Marketplace & Academic Resource Library.</span>
          </div>
          <div className="ce-row" style={{ gap: '1.25rem' }}>
            <Link to="/marketplace">Marketplace</Link>
            <Link to="/resources">PYQ Library</Link>
            <span>Safe Campus Gate Handovers Only</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

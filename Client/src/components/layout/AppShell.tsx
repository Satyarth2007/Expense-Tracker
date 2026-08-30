import { useEffect, useState, type ReactNode } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import UserMenu from './UserMenu';

interface Tab {
    to: string;
    label: string;
    icon: ReactNode;
}

const TABS: Tab[] = [
    {
        to: '/dashboard',
        label: 'Dashboard',
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                <rect x="3" y="3" width="7" height="9" rx="1" />
                <rect x="14" y="3" width="7" height="5" rx="1" />
                <rect x="14" y="12" width="7" height="9" rx="1" />
                <rect x="3" y="16" width="7" height="5" rx="1" />
            </svg>
        ),
    },
    {
        to: '/transactions',
        label: 'Transactions',
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M3 10h18M7 15h4" />
                <rect x="3" y="5" width="18" height="14" rx="2" />
            </svg>
        ),
    },
    {
        to: '/categories',
        label: 'Categories',
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                <rect x="3" y="3" width="8" height="8" rx="1.5" />
                <rect x="13" y="3" width="8" height="8" rx="1.5" />
                <rect x="3" y="13" width="8" height="8" rx="1.5" />
                <rect x="13" y="13" width="8" height="8" rx="1.5" />
            </svg>
        ),
    },
    {
        to: '/budgets',
        label: 'Budgets',
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l3 3" />
            </svg>
        ),
    },
    {
        to: '/recurring',
        label: 'Recurring',
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M21 2v6h-6M3 22v-6h6" />
                <path d="M3 11a9 9 0 0 1 15-6.7L21 8M21 13a9 9 0 0 1-15 6.7L3 16" />
            </svg>
        ),
    },
    {
        to: '/import',
        label: 'Import',
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M12 3v12m0 0l-4-4m4 4l4-4" />
                <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
            </svg>
        ),
    },
    {
        to: '/reports',
        label: 'Reports',
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M8 17V9M13 17V5M18 17v-4" />
                <path d="M3 20h18" />
            </svg>
        ),
    },
];

export default function AppShell() {
    const location = useLocation();
    const [mobileOpen, setMobileOpen] = useState(false);
    const { user } = useAuth();

    // Close the drawer automatically whenever the route changes
    useEffect(() => {
        setMobileOpen(false);
    }, [location.pathname]);

    const userInitial = user?.fullName?.charAt(0).toUpperCase() ?? '?';

    return (
        <div className="min-h-screen">
            <style>{`
        @keyframes pageTurnIn {
          from { opacity: 0; transform: perspective(1400px) rotateY(-7deg) translateX(-18px); }
          to { opacity: 1; transform: none; }
        }
        @keyframes overlayIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .page-turn { animation: pageTurnIn 0.5s cubic-bezier(0.2,0.7,0.3,1) both; }
        .overlay-in { animation: overlayIn 0.2s ease both; }
      `}</style>

            {/* Mobile top bar with hamburger */}
            <div
                className="lg:hidden flex items-center gap-3 px-5 h-14 bg-ink relative z-30"
            >
                <button
                    onClick={() => setMobileOpen((v) => !v)}
                    aria-label="Toggle navigation"
                    className="flex flex-col justify-center gap-[5px] w-8 h-8 flex-shrink-0"
                >
                    <span
                        className="block h-[1.5px] w-5 transition-transform duration-200"
                        style={{
                            background: 'var(--color-brass-light)',
                            transform: mobileOpen ? 'translateY(6.5px) rotate(45deg)' : 'none',
                        }}
                    />
                    <span
                        className="block h-[1.5px] w-5 transition-opacity duration-200"
                        style={{ background: 'var(--color-brass-light)', opacity: mobileOpen ? 0 : 1 }}
                    />
                    <span
                        className="block h-[1.5px] w-5 transition-transform duration-200"
                        style={{
                            background: 'var(--color-brass-light)',
                            transform: mobileOpen ? 'translateY(-6.5px) rotate(-45deg)' : 'none',
                        }}
                    />
                </button>
                <div
                    className="flex items-center justify-center w-8 h-8 rounded-full border flex-shrink-0"
                    style={{ borderColor: 'var(--color-brass-light)', color: 'var(--color-brass-light)', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14 }}
                >
                    E
                </div>
                <span className="font-bold text-paper text-[15px]">ExpenseDekho</span>
            </div>

            {/* Backdrop, mobile only, shown when drawer open */}
            {mobileOpen && (
                <div
                    className="lg:hidden overlay-in fixed inset-0 bg-black/50 z-20"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            <div className="grid min-h-screen lg:grid-cols-[78px_1fr]">
                {/* Sidebar rail — fixed drawer on mobile, static column on lg+ */}
                <nav
                    className={`bg-ink flex flex-col items-center py-6 fixed lg:static top-0 left-0 h-full z-30 w-[220px] lg:w-auto transition-transform duration-250 ease-out ${mobileOpen ? 'translate-x-0' : '-translate-x-full'
                        } lg:translate-x-0`}
                >
                    <div
                        className="hidden lg:flex items-center justify-center w-10 h-10 rounded-full border mb-8 flex-shrink-0"
                        style={{ borderColor: 'var(--color-brass-light)', color: 'var(--color-brass-light)', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17 }}
                    >
                        E
                    </div>

                    <div className="flex flex-col gap-1 flex-1 w-full px-3 lg:px-0 mt-4 lg:mt-0">
                        {TABS.map((tab) => (
                            <NavLink
                                key={tab.to}
                                to={tab.to}
                                className={({ isActive }) =>
                                    `group relative flex items-center gap-3 lg:justify-center w-full lg:w-14 h-11 rounded-md px-3 lg:px-0 transition-colors duration-200 ${isActive ? 'bg-brass-light text-ink' : 'text-[#B9AF98] hover:text-paper'
                                    }`
                                }
                            >
                                {({ isActive }) => (
                                    <>
                                        {isActive && (
                                            <span
                                                className="hidden lg:block absolute -left-6 top-1/2 -translate-y-1/2 w-0 h-0"
                                                style={{
                                                    borderTop: '8px solid transparent',
                                                    borderBottom: '8px solid transparent',
                                                    borderLeft: '8px solid var(--color-brass-light)',
                                                }}
                                            />
                                        )}
                                        <span className="w-[19px] h-[19px] flex-shrink-0">{tab.icon}</span>
                                        {/* Label always visible on mobile drawer; tooltip-on-hover on desktop */}
                                        <span
                                            className="lg:hidden text-[13px] font-medium"
                                            style={{ fontFamily: 'var(--font-mono)' }}
                                        >
                                            {tab.label}
                                        </span>
                                        <span
                                            className="hidden lg:block pointer-events-none absolute left-[64px] top-1/2 -translate-y-1/2 whitespace-nowrap rounded-[3px] px-2.5 py-1.5 text-[11px] font-semibold tracking-wide opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                                            style={{ background: 'var(--color-brass-light)', color: 'var(--color-ink)', fontFamily: 'var(--font-mono)' }}
                                        >
                                            {tab.label}
                                        </span>
                                    </>
                                )}
                            </NavLink>
                        ))}

                        {/* User / account link — appears at the bottom of the mobile drawer's tab list */}
                        <NavLink
                            to="/account"
                            className={({ isActive }) =>
                                `lg:hidden group relative flex items-center gap-3 w-full h-11 rounded-md px-3 transition-colors duration-200 ${isActive ? 'bg-brass-light text-ink' : 'text-[#B9AF98] hover:text-paper'
                                }`
                            }
                        >
                            <div
                                className="w-[22px] h-[22px] rounded-full border flex items-center justify-center text-[11px] font-semibold flex-shrink-0"
                                style={{ borderColor: 'currentColor' }}
                            >
                                {userInitial}
                            </div>
                            <span className="text-[13px] font-medium" style={{ fontFamily: 'var(--font-mono)' }}>
                                {user?.fullName ?? 'Account'}
                            </span>
                        </NavLink>
                    </div>

                    {/* Desktop-only: user icon sits above the LEDGER · FY26 footer */}
                    <NavLink
                        to="/account"
                        className={({ isActive }) =>
                            `hidden lg:flex group relative items-center justify-center w-14 h-11 rounded-md transition-colors duration-200 ${isActive ? 'bg-brass-light text-ink' : 'text-[#B9AF98] hover:text-paper'
                            }`
                        }
                        aria-label="Account"
                    >
                        {({ isActive }) => (
                            <>
                                {isActive && (
                                    <span
                                        className="absolute -left-6 top-1/2 -translate-y-1/2 w-0 h-0"
                                        style={{
                                            borderTop: '8px solid transparent',
                                            borderBottom: '8px solid transparent',
                                            borderLeft: '8px solid var(--color-brass-light)',
                                        }}
                                    />
                                )}
                                <div
                                    className="w-8 h-8 rounded-full border flex items-center justify-center text-[13px] font-semibold flex-shrink-0"
                                    style={{ borderColor: 'currentColor' }}
                                >
                                    {/* {userInitial} */}
                                    <UserMenu />
                                </div>
                                <span
                                    className="pointer-events-none absolute left-[64px] top-1/2 -translate-y-1/2 whitespace-nowrap rounded-[3px] px-2.5 py-1.5 text-[11px] font-semibold tracking-wide opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                                    style={{ background: 'var(--color-brass-light)', color: 'var(--color-ink)', fontFamily: 'var(--font-mono)' }}
                                >
                                    {user?.fullName ?? 'Account'}
                                </span>
                            </>
                        )}
                    </NavLink>

                    <div
                        className="hidden lg:block text-[9px] tracking-[0.15em] pt-5"
                        style={{ color: '#7A705C', fontFamily: 'var(--font-mono)', writingMode: 'vertical-rl' }}
                    >
                        LEDGER · FY26
                    </div>
                </nav>

                {/* Main content */}
                <main className="relative">
                    <div
                        key={location.pathname}
                        className="page-turn px-5 lg:px-14 pt-6 lg:pt-10 pb-[90px] max-w-[1180px]"
                    >
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
}
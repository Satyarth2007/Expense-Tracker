import { useRef, useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

function initialsOf(fullName: string | undefined): string {
  if (!fullName) return '?';
  const parts = fullName.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase();
}

export default function UserMenu() {
  const { user, logout, logoutAll } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  async function handleLogout() {
    setIsLoggingOut(true);
    try {
      await logout();
    } finally {
      setIsLoggingOut(false);
      setIsOpen(false);
    }
  }

  async function handleLogoutAll() {
    if (!confirm('Sign out of all devices? You will need to log in again everywhere.')) return;
    setIsLoggingOut(true);
    try {
      await logoutAll();
    } finally {
      setIsLoggingOut(false);
      setIsOpen(false);
    }
  }

  if (!user) return null;

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen((v) => !v)}
        aria-label="Account menu"
        className="w-10 h-10 rounded-full border-[1.5px] border-brass-light text-brass-light
                   flex items-center justify-center font-serif font-bold text-[15px]
                   hover:bg-brass-light hover:text-ink transition-colors"
      >
        {initialsOf(user.fullName)}
      </button>

      {isOpen && (
        <div
          className="absolute bottom-0 left-[60px] w-[260px] bg-paper border border-rule-soft
                     rounded-md shadow-xl z-50 overflow-hidden"
        >
          <div className="px-4 py-4 border-b border-rule-soft">
            <div className="w-11 h-11 rounded-full border-[1.5px] border-brass-light text-brass-light
                            flex items-center justify-center font-serif font-bold text-[16px] mb-3">
              {initialsOf(user.fullName)}
            </div>
            <div className="font-semibold text-[14.5px] text-ink truncate">{user.fullName}</div>
            <div className="text-[12.5px] text-ink-soft truncate mt-0.5">{user.email}</div>
            <div className="font-mono text-[10.5px] text-ink-faint mt-2 uppercase tracking-wider truncate">
              Workspace · {user.workspaceId}
            </div>
          </div>

          <div className="py-1.5 border-b border-rule-soft">
            <a
              href="/account"
              className="block px-4 py-2.5 text-[13.5px] text-ink hover:bg-paper-3 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              View account
            </a>
          </div>

          <div className="py-1.5">
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="w-full text-left px-4 py-2.5 text-[13.5px] text-ink hover:bg-paper-3
                         transition-colors disabled:opacity-60"
            >
              {isLoggingOut ? 'Signing out…' : 'Sign out'}
            </button>
            <button
              onClick={handleLogoutAll}
              disabled={isLoggingOut}
              className="w-full text-left px-4 py-2.5 text-[13.5px] text-red hover:bg-red-wash
                         transition-colors disabled:opacity-60"
            >
              Sign out of all devices
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
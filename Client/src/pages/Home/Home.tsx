import React from 'react'
import individual from '../../assets/individual.png'
import business from '../../assets/business_owner.png'
import student from '../../assets/student.png'

const navLinks = [
    { label: 'Features', href: '#features' },
    { label: 'How it works', href: '#how-it-works' },
    { label: "Who it's for", href: '#who-its-for' },
]

const features = [
    {
        mark: '01',
        title: 'Every transaction, filed',
        body: 'Manual entries, imported statements, and recurring rules all land in one ledger — never three separate tools pretending to be one.',
    },
    {
        mark: '02',
        title: 'Budgets that hold the line',
        body: 'Set a ceiling per category. Watch it fill in real time as entries post, with a note the moment you cross it.',
    },
    {
        mark: '03',
        title: 'Import without the guesswork',
        body: 'Drop a CSV or PDF statement. Every row waits in a review queue — nothing commits to your ledger until you say so.',
    },
    {
        mark: '04',
        title: 'Reports you can hand over',
        body: 'Export a clean statement, category summary, or raw CSV for any period — built for tax season, not just curiosity.',
    },
]

const steps = [
    {
        n: '1',
        title: 'Open your ledger',
        body: 'Create an account and pick a starting set of categories — rent, groceries, subscriptions, whatever fits your life.',
    },
    {
        n: '2',
        title: 'Enter or import',
        body: 'Log transactions by hand, or upload a bank statement and let the review queue catch anything that needs a second look.',
    },
    {
        n: '3',
        title: 'Read the columns',
        body: 'Budgets, trends, and reports update as you go — the ledger keeps the arithmetic so you can keep the decisions.',
    },
]

const personas = [
  {
    icon: '💼',
    image: individual,
    title: 'Individuals',
    body: 'Track day-to-day spending against a budget without opening a spreadsheet every Sunday night.',
  },
  {
    icon: '🏪',
    image: business,
    title: 'Small business owners',
    body: 'Keep personal and business money in separate columns, without separate apps.',
  },
  {
    icon: '🎓',
    image: student,
    title: 'Students & young professionals',
    body: 'Build the habit early — see where a stipend or first salary actually goes, month over month.',
  },
]

const Home = () => {

    return (
        <div
            className="min-h-screen"
            style={{
                backgroundColor: 'var(--color-paper)',
                backgroundImage:
                    'repeating-linear-gradient(to bottom, transparent, transparent 37px, rgba(203,191,158,0.5) 38px)',
                color: 'var(--color-ink)',
                fontFamily: 'var(--font-serif)',
            }}
        >
            {/* ============ NAVBAR ============ */}
            <div
                className="navbar px-6 lg:px-10 min-h-[64px]"
                style={{ backgroundColor: 'var(--color-ink)', color: 'var(--color-paper)' }}
            >
                <div className="navbar-start">
                    <a href="/" className="flex items-center gap-3">
                        <span
                            className="flex items-center justify-center w-9 h-9 rounded-full border"
                            style={{ borderColor: 'var(--color-brass-light)', color: 'var(--color-brass-light)', fontFamily: 'var(--font-display)' }}
                        >
                            E
                        </span>
                        <span className="text-lg font-semibold tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
                            ExpenseDekho
                        </span>
                    </a>
                </div>

                <div className="navbar-center hidden lg:flex">
                    <ul className="flex items-center gap-8">
                        {navLinks.map((link) => (
                            <li key={link.label}>
                                <a href={link.href} className="text-sm" style={{ fontFamily: 'var(--font-serif)', color: 'var(--color-paper-2)' }}>
                                    {link.label}
                                </a>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="navbar-end gap-3">

                    <a href="/login" className="hidden sm:inline text-sm font-medium px-2" style={{ fontFamily: 'var(--font-serif)', color: 'var(--color-paper-2)' }}>
                        Log in
                    </a>

                    <a
                        href="/get-started"
                        className="btn btn-sm border-none"
                        style={{ backgroundColor: 'var(--color-brass-light)', color: 'var(--color-ink)', fontFamily: 'var(--font-serif)', fontWeight: 600 }}
                    >
                        Get started
                    </a>

                    <div className="dropdown dropdown-end lg:hidden">
                        <div tabIndex={0} role="button" className="btn btn-ghost btn-circle btn-sm" style={{ color: 'var(--color-paper-2)' }}>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </div>
                        <ul
                            tabIndex={-1}
                            className="menu dropdown-content z-10 mt-3 w-52 p-3 shadow rounded-box"
                            style={{ backgroundColor: 'var(--color-ink)', border: '1px solid var(--color-brass-light)' }}
                        >
                            {navLinks.map((link) => (
                                <li key={link.label}>
                                    <a href={link.href} style={{ color: 'var(--color-paper-2)', fontFamily: 'var(--font-serif)' }}>
                                        {link.label}
                                    </a>
                                </li>
                            ))}
                            <li>
                                <a href="/login" style={{ color: 'var(--color-paper-2)', fontFamily: 'var(--font-serif)' }}>
                                    Log in
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* ============ HERO ============ */}
            <section className="px-6 lg:px-10 pt-20 pb-24 max-w-6xl mx-auto">
                <div className="grid lg:grid-cols-[1.15fr_0.85fr] gap-14 items-center">
                    <div>
                        <div
                            className="flex items-center gap-3 text-xs uppercase tracking-widest mb-6"
                            style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-brass)' }}
                        >
                            <span>Personal · Business · Student</span>
                            <span className="flex-1 h-px" style={{ backgroundColor: 'var(--color-rule)' }} />
                        </div>
                        <h1
                            className="text-5xl lg:text-6xl leading-[1.08] font-semibold mb-6"
                            style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.01em' }}
                        >
                            Every rupee, entered
                            <br />
                            in its proper column.
                        </h1>
                        <p className="text-base lg:text-lg max-w-md mb-9" style={{ color: 'var(--color-ink-soft)' }}>
                            ExpenseDekho is the ledger for people who want their money tracked precisely —
                            not guessed at. Manual, imported, or recurring, every entry finds its column.
                        </p>
                        <div className="flex flex-wrap items-center gap-4">
                            <a
                                href="/get-started"
                                className="btn border-none px-7"
                                style={{ backgroundColor: 'var(--color-ink)', color: 'var(--color-paper)', fontFamily: 'var(--font-serif)', fontWeight: 600 }}
                            >
                                Get started →
                            </a>
                            <a
                                href="#how-it-works"
                                className="btn btn-ghost px-6"
                                style={{ border: '1px solid var(--color-rule)', color: 'var(--color-ink)', fontFamily: 'var(--font-serif)' }}
                            >
                                See how it works
                            </a>
                        </div>
                    </div>

                    {/* Ledger card visual */}
                    <div
                        className="rounded-md p-7"
                        style={{
                            backgroundColor: 'var(--color-paper-2)',
                            border: '1px solid var(--color-rule-soft)',
                            boxShadow: '0 10px 30px rgba(34,31,26,0.12)',
                        }}
                    >
                        <div className="flex items-baseline justify-between mb-5">
                            <span className="text-sm font-semibold" style={{ fontFamily: 'var(--font-display)' }}>
                                August 2026
                            </span>
                            <span className="text-[11px] uppercase tracking-widest" style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-ink-soft)' }}>
                                Overview
                            </span>
                        </div>

                        <div className="flex justify-between items-end mb-6" style={{ height: '150px' }}>
                            {[
                                { g: 70, r: 40 },
                                { g: 55, r: 60 },
                                { g: 80, r: 35 },
                                { g: 60, r: 55 },
                                { g: 88, r: 38 },
                            ].map((bar, i) => (
                                <div key={i} className="flex flex-col-reverse w-6 rounded-t-sm overflow-hidden" style={{ height: '100%' }}>
                                    <div style={{ height: `${bar.g}%`, backgroundColor: 'var(--color-green-2)' }} />
                                    <div style={{ height: `${bar.r}%`, backgroundColor: 'var(--color-red)', opacity: 0.8 }} />
                                </div>
                            ))}
                        </div>

                        <div className="space-y-3 pt-4" style={{ borderTop: '1px dashed var(--color-rule)' }}>
                            <div className="flex justify-between text-sm">
                                <span style={{ color: 'var(--color-ink-soft)' }}>Income</span>
                                <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-green)' }}>₹1,42,000</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span style={{ color: 'var(--color-ink-soft)' }}>Expenses</span>
                                <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-red)' }}>₹86,430</span>
                            </div>
                            <div className="flex justify-between text-sm font-semibold pt-2" style={{ borderTop: '1px solid var(--color-rule)' }}>
                                <span>Net saved</span>
                                <span style={{ fontFamily: 'var(--font-mono)' }}>₹55,570</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ============ FEATURES ============ */}
            <section id="features" className="px-6 lg:px-10 py-20 max-w-6xl mx-auto">
                <div className="flex items-center justify-center gap-3 text-xs uppercase tracking-widest mb-4" style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-brass)' }}>
                    <span className="w-12 h-px" style={{ backgroundColor: 'var(--color-rule)' }} />
                    <span>What's inside</span>
                    <span className="w-12 h-px" style={{ backgroundColor: 'var(--color-rule)' }} />
                </div>
                <h2 className="text-3xl lg:text-4xl font-semibold mb-12 max-w-xl mx-auto text-center" style={{ fontFamily: 'var(--font-display)' }}>
                    Built like a ledger, not a dashboard
                </h2>

                <div className="grid sm:grid-cols-2 gap-6">
                    {features.map((f) => (
                        <div
                            key={f.mark}
                            className="p-6 rounded-md"
                            style={{ backgroundColor: 'var(--color-paper-2)', border: '1px solid var(--color-rule-soft)' }}
                        >
                            <span
                                className="block text-xs mb-4"
                                style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-brass)' }}
                            >
                                {f.mark}
                            </span>
                            <h3 className="text-lg font-semibold mb-2" style={{ fontFamily: 'var(--font-display)' }}>
                                {f.title}
                            </h3>
                            <p className="text-sm" style={{ color: 'var(--color-ink-soft)' }}>
                                {f.body}
                            </p>
                        </div>
                    ))}
                </div>
            </section>

            {/* ============ HOW IT WORKS ============ */}
            <section id="how-it-works" className="px-6 lg:px-10 py-20" style={{ backgroundColor: 'var(--color-ink)', color: 'var(--color-paper)' }}>
                <div className="max-w-6xl mx-auto">
                    <div className="flex items-center gap-3 text-xs uppercase tracking-widest mb-4" style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-brass-light)' }}>
                        <span>Three steps</span>
                        <span className="flex-1 h-px" style={{ backgroundColor: 'rgba(201,154,86,0.3)' }} />
                    </div>
                    <h2 className="text-3xl lg:text-4xl font-semibold mb-14 max-w-xl" style={{ fontFamily: 'var(--font-display)' }}>
                        How it works
                    </h2>

                    <div className="grid md:grid-cols-3 gap-10">
                        {steps.map((s, i) => (
                            <div key={s.n} className="relative">
                                <div
                                    className="flex items-center justify-center w-11 h-11 rounded-full border mb-5 text-lg"
                                    style={{ borderColor: 'var(--color-brass-light)', color: 'var(--color-brass-light)', fontFamily: 'var(--font-display)' }}
                                >
                                    {s.n}
                                </div>
                                <h3 className="text-lg font-semibold mb-2" style={{ fontFamily: 'var(--font-display)' }}>
                                    {s.title}
                                </h3>
                                <p className="text-sm" style={{ color: 'var(--color-paper-2)' }}>
                                    {s.body}
                                </p>
                                {i < steps.length - 1 && (
                                    <span
                                        className="hidden md:block absolute top-5 left-[calc(100%_-_19.7rem)] w-full h-px"
                                        style={{ backgroundColor: 'rgba(201,154,86,0.25)' }}
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ============ WHO IT'S FOR ============ */}
            <section id="who-its-for" className="px-6 lg:px-10 py-20 max-w-6xl mx-auto">
                <div className="flex items-center gap-3 text-xs uppercase tracking-widest mb-4" style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-brass)' }}>
                    <span>Who it's for</span>
                    <span className="flex-1 h-px" style={{ backgroundColor: 'var(--color-rule)' }} />
                </div>
                <h2 className="text-3xl lg:text-4xl font-semibold mb-12 max-w-xl" style={{ fontFamily: 'var(--font-display)' }}>
                    One ledger, three ways to use it
                </h2>

                <div className="grid md:grid-cols-3 gap-6">
                    {personas.map((p) => (
                        <div
                            key={p.title}
                            className="rounded-md text-center overflow-hidden"
                            style={{ backgroundColor: 'var(--color-paper-2)', border: '1px solid var(--color-rule-soft)' }}
                        >
                            <div className="w-full h-40 overflow-hidden" style={{ backgroundColor: 'var(--color-green-wash)' }}>
                                <img
                                    src={p.image}
                                    alt={p.title}
                                    className="w-full h-full object-cover"
                                />
                            </div>

                            <div className="p-7">
                                <h3 className="text-lg font-semibold mb-2" style={{ fontFamily: 'var(--font-display)' }}>
                                    {p.title}
                                </h3>
                                <p className="text-sm" style={{ color: 'var(--color-ink-soft)' }}>
                                    {p.body}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ============ CTA STRIP ============ */}
            <section className="px-6 lg:px-10 pb-24">
                <div
                    className="max-w-6xl mx-auto rounded-md px-8 py-12 flex flex-col md:flex-row items-center justify-between gap-6"
                    style={{ backgroundColor: 'var(--color-ink)', color: 'var(--color-paper)' }}
                >
                    <div>
                        <h3 className="text-2xl font-semibold mb-2" style={{ fontFamily: 'var(--font-display)' }}>
                            Open your ledger today
                        </h3>
                        <p className="text-sm" style={{ color: 'var(--color-paper-2)' }}>
                            Free to start. No card required.
                        </p>
                    </div>
                    <a
                        href="/get-started"
                        className="btn border-none px-7"
                        style={{ backgroundColor: 'var(--color-brass-light)', color: 'var(--color-ink)', fontFamily: 'var(--font-serif)', fontWeight: 600 }}
                    >
                        Get started →
                    </a>
                </div>
            </section>

            {/* ============ FOOTER ============ */}
            <footer style={{ backgroundColor: 'var(--color-ink)', color: 'var(--color-paper-2)' }}>
                <div className="max-w-6xl mx-auto px-6 lg:px-10 pt-16 pb-10">
                    <div className="grid md:grid-cols-[1.4fr_1fr_1fr] gap-10 mb-14">
                        {/* Brand column */}
                        <div>
                            <a href="/" className="flex items-center gap-3 mb-4">
                                <span
                                    className="flex items-center justify-center w-9 h-9 rounded-full border"
                                    style={{ borderColor: 'var(--color-brass-light)', color: 'var(--color-brass-light)', fontFamily: 'var(--font-display)' }}
                                >
                                    E
                                </span>
                                <span className="text-lg font-semibold tracking-tight" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-paper)' }}>
                                    ExpenseDekho
                                </span>
                            </a>
                            <p className="text-sm max-w-xs" style={{ color: 'var(--color-paper-2)' }}>
                                The ledger for people who want their money tracked precisely — not guessed at.
                            </p>
                        </div>

                        {/* Product */}
                        <div>
                            <h4
                                className="text-xs uppercase tracking-widest mb-4"
                                style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-brass-light)' }}
                            >
                                Product
                            </h4>
                            <ul className="space-y-3 text-sm">
                                <li><a href="#features">Features</a></li>
                                <li><a href="#how-it-works">How it works</a></li>
                                <li><a href="#who-its-for">Who it's for</a></li>
                            </ul>
                        </div>

                        {/* Account */}
                        <div>
                            <h4
                                className="text-xs uppercase tracking-widest mb-4"
                                style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-brass-light)' }}
                            >
                                Account
                            </h4>
                            <ul className="space-y-3 text-sm">
                                <li><a href="/login">Log in</a></li>
                                <li><a href="/get-started">Get started</a></li>
                            </ul>
                        </div>
                    </div>

                    {/* Bottom bar */}
                    <div
                        className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 text-xs"
                        style={{ borderTop: '1px solid rgba(201,154,86,0.2)', fontFamily: 'var(--font-mono)', color: 'var(--color-ink-faint)' }}
                    >
                        <span>© {new Date().getFullYear()} ExpenseDekho. All rights reserved.</span>
                        <span>Built for people who like their numbers accounted for.</span>
                    </div>
                </div>
            </footer>
        </div>
    )
}

export default Home
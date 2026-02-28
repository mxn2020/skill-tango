/**
 * Reusable skeleton loading components.
 * Use these while data is loading to provide visual placeholders.
 */

export function SkeletonLine({ width = '100%', height = '1rem' }: { width?: string; height?: string }) {
    return <div className="skeleton skeleton--line" style={{ width, height }} />
}

export function SkeletonCard() {
    return (
        <div className="skeleton skeleton--card">
            <SkeletonLine width="60%" height="1.4rem" />
            <SkeletonLine width="80%" />
            <SkeletonLine width="40%" />
        </div>
    )
}

export function SkeletonCourseList({ count = 3 }: { count?: number }) {
    return (
        <div className="skeleton-list">
            {Array.from({ length: count }).map((_, i) => (
                <SkeletonCard key={i} />
            ))}
        </div>
    )
}

export function SkeletonLessonPlayer() {
    return (
        <div className="animate-fade-in" style={{ maxWidth: '720px', margin: '0 auto', width: '100%' }}>
            <div style={{ marginBottom: 'var(--space-2xl)' }}>
                <SkeletonLine width="30%" height="0.8rem" />
                <div style={{ marginTop: 'var(--space-sm)' }}>
                    <SkeletonLine width="60%" height="2rem" />
                </div>
            </div>

            <div className="card">
                <SkeletonLine width="100%" height="200px" />
                <div style={{ marginTop: 'var(--space-xl)', display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                    <SkeletonLine width="100%" />
                    <SkeletonLine width="95%" />
                    <SkeletonLine width="98%" />
                    <SkeletonLine width="80%" />
                </div>
            </div>
        </div>
    )
}

export function SkeletonAssessment() {
    return (
        <div className="card animate-fade-in" style={{ maxWidth: '600px', margin: '0 auto', width: '100%' }}>
            <div style={{ textAlign: 'center', marginBottom: 'var(--space-xl)' }}>
                <SkeletonLine width="60%" height="2rem" />
                <div style={{ marginTop: 'var(--space-md)', display: 'flex', justifyContent: 'center' }}>
                    <SkeletonLine width="80%" />
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                <SkeletonCard />
                <SkeletonCard />
            </div>
        </div>
    )
}

export function SkeletonProfile() {
    return (
        <div className="profile-page animate-fade-in">
            <div style={{ marginBottom: 'var(--space-xl)' }}>
                <SkeletonLine width="40%" height="2.5rem" />
            </div>
            <div className="profile-grid">
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
            </div>
        </div>
    )
}

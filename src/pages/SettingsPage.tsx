// ═══════════════════════════════════════════════════
// Skill-Tango — Settings Page
// Profile, Preferences, Notifications, Danger Zone
// ═══════════════════════════════════════════════════

import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Sliders, Bell, AlertTriangle, Trash2, Upload,
} from 'lucide-react';
import { useAuth } from '../adapters/auth';
import { useToast } from '../components/ui/Toast';
import { Avatar, Badge } from '../components/ui/SharedUI';
import './SettingsPage.css';

// ─── Toggle Component ─────────────────────────────

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button className={`settings__toggle ${checked ? 'settings__toggle--on' : ''}`} onClick={() => onChange(!checked)}>
      <motion.div className="settings__toggle-thumb" layout transition={{ type: 'spring', stiffness: 500, damping: 30 }} />
    </button>
  );
}

// ─── Component ────────────────────────────────────

export function SettingsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToast } = useToast();

  const [dailyGoal, setDailyGoal] = useState(30);
  const [coachingStyle, setCoachingStyle] = useState<'direct' | 'supportive' | 'balanced'>('balanced');
  const [soundEffects, setSoundEffects] = useState(true);
  const [lifePulse, setLifePulse] = useState(false);
  const [dailyReminders, setDailyReminders] = useState(true);
  const [streakWarnings, setStreakWarnings] = useState(true);
  const [courseSuggestions, setCourseSuggestions] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const autoSave = useCallback((label: string) => {
    addToast({ type: 'success', title: `${label} updated.` });
  }, [addToast]);

  const handleResetHistory = useCallback(() => {
    addToast({ type: 'warning', title: 'Learning history has been reset.' });
    setConfirmReset(false);
    navigate('/dashboard');
  }, [addToast, navigate]);

  return (
    <div className="settings">
      <h1 className="settings__title">Settings</h1>

      {/* ─── Profile ─── */}
      <section className="settings__section">
        <h2><User size={18} /> Profile</h2>
        <div className="settings__profile-card">
          <div className="settings__avatar-wrap">
            <Avatar name={user?.name || 'User'} size={80} />
            <button className="settings__avatar-edit"><Upload size={14} /></button>
          </div>
          <div className="settings__profile-info">
            <div className="settings__field">
              <label>Display Name</label>
              <input className="settings__input" defaultValue={user?.name || 'Alex Chen'} />
            </div>
            <div className="settings__field">
              <label>Email</label>
              <input className="settings__input settings__input--readonly" readOnly defaultValue="alex@skill-tango.app" />
            </div>
            <div className="settings__plan-row">
              <span>Plan</span>
              <Badge variant={user?.plan === 'pro' ? 'primary' : 'default'} size="sm">
                {user?.plan?.toUpperCase() || 'FREE'}
              </Badge>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Preferences ─── */}
      <section className="settings__section">
        <h2><Sliders size={18} /> Preferences</h2>

        <div className="settings__row">
          <div className="settings__row-info">
            <span className="settings__row-label">Daily Goal</span>
            <span className="settings__row-value">{dailyGoal} min</span>
          </div>
          <input
            type="range" min={5} max={120} step={5}
            value={dailyGoal}
            onChange={e => { setDailyGoal(Number(e.target.value)); autoSave('Daily goal'); }}
            className="settings__slider"
          />
        </div>

        <div className="settings__row">
          <span className="settings__row-label">Coaching Style</span>
          <div className="settings__radio-cards">
            {(['direct', 'supportive', 'balanced'] as const).map(style => (
              <motion.button
                key={style}
                className={`settings__radio-card ${coachingStyle === style ? 'settings__radio-card--active' : ''}`}
                onClick={() => { setCoachingStyle(style); autoSave('Coaching style'); }}
                whileTap={{ scale: 0.97 }}
              >
                {style.charAt(0).toUpperCase() + style.slice(1)}
              </motion.button>
            ))}
          </div>
        </div>

        <div className="settings__row settings__row--toggle">
          <span className="settings__row-label">Enable Sound Effects</span>
          <Toggle checked={soundEffects} onChange={v => { setSoundEffects(v); autoSave('Sound effects'); }} />
        </div>

        <div className="settings__row settings__row--toggle">
          <div>
            <span className="settings__row-label">LifePulse Integration</span>
            <span className="settings__row-desc">Sync wellness data to optimize learning sessions</span>
          </div>
          <Toggle checked={lifePulse} onChange={v => { setLifePulse(v); autoSave('LifePulse'); }} />
        </div>
      </section>

      {/* ─── Notifications ─── */}
      <section className="settings__section">
        <h2><Bell size={18} /> Notifications</h2>

        <div className="settings__row settings__row--toggle">
          <span className="settings__row-label">Daily Practice Reminders</span>
          <Toggle checked={dailyReminders} onChange={v => { setDailyReminders(v); autoSave('Reminders'); }} />
        </div>

        <div className="settings__row settings__row--toggle">
          <span className="settings__row-label">Streak Warnings</span>
          <Toggle checked={streakWarnings} onChange={v => { setStreakWarnings(v); autoSave('Streak warnings'); }} />
        </div>

        <div className="settings__row settings__row--toggle">
          <span className="settings__row-label">New Course Suggestions</span>
          <Toggle checked={courseSuggestions} onChange={v => { setCourseSuggestions(v); autoSave('Course suggestions'); }} />
        </div>
      </section>

      {/* ─── Danger Zone ─── */}
      <section className="settings__section settings__section--danger">
        <h2><AlertTriangle size={18} /> Danger Zone</h2>

        <div className="settings__row settings__row--toggle">
          <div>
            <span className="settings__row-label">Reset Learning History</span>
            <span className="settings__row-desc">Clear all progress, streaks, and completions</span>
          </div>
          <motion.button
            className="btn btn--danger btn--sm"
            onClick={() => setConfirmReset(true)}
            whileTap={{ scale: 0.97 }}
          >
            Reset
          </motion.button>
        </div>

        <div className="settings__row settings__row--toggle">
          <div>
            <span className="settings__row-label">Delete Account</span>
            <span className="settings__row-desc">Permanently delete your account and data</span>
          </div>
          <motion.button
            className="btn btn--danger btn--sm"
            onClick={() => setConfirmDelete(true)}
            whileTap={{ scale: 0.97 }}
          >
            <Trash2 size={14} /> Delete
          </motion.button>
        </div>
      </section>

      {/* ─── Confirmation Modals ─── */}
      <AnimatePresence>
        {confirmReset && (
          <motion.div className="settings__modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="settings__modal" initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}>
              <h3>Reset Learning History?</h3>
              <p>This will reset all progress, streaks, and course completions. This cannot be undone.</p>
              <div className="settings__modal-actions">
                <button className="btn btn--ghost" onClick={() => setConfirmReset(false)}>Cancel</button>
                <motion.button className="btn btn--danger" onClick={handleResetHistory} whileTap={{ scale: 0.97 }}>
                  Reset Everything
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
        {confirmDelete && (
          <motion.div className="settings__modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="settings__modal" initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}>
              <h3>Delete Account?</h3>
              <p>This action is permanent. All data, courses, and progress will be irreversibly deleted.</p>
              <div className="settings__modal-actions">
                <button className="btn btn--ghost" onClick={() => setConfirmDelete(false)}>Cancel</button>
                <motion.button className="btn btn--danger" onClick={() => { addToast({ type: 'error', title: 'Account deletion is disabled in demo mode.' }); setConfirmDelete(false); }} whileTap={{ scale: 0.97 }}>
                  Delete My Account
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

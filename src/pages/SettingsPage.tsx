// ═══════════════════════════════════════════════════
// Skill-Tango — Settings Page
// Profile, preferences, notifications, danger zone
// ═══════════════════════════════════════════════════

import { useState } from 'react';
import { motion } from 'framer-motion';
import { User as UserIcon, Bell, Shield, Palette } from 'lucide-react';
import { useAuth } from '../adapters/auth';
import { useToast } from '../components/ui/Toast';
import { Avatar, Badge } from '../components/ui/SharedUI';
import './SettingsPage.css';

export function SettingsPage() {
  const { user, updateUser } = useAuth();
  const { addToast } = useToast();
  const [dailyGoal, setDailyGoal] = useState(user?.preferences.dailyGoalMinutes || 30);
  const [coachingStyle, setCoachingStyle] = useState(user?.preferences.coachingStyle || 'balanced');
  const [enableSounds, setEnableSounds] = useState(user?.preferences.enableSounds ?? true);
  const [theme, setTheme] = useState(user?.preferences.theme || 'dark');

  function savePreferences() {
    updateUser({
      preferences: {
        ...user!.preferences,
        dailyGoalMinutes: dailyGoal,
        coachingStyle: coachingStyle as 'direct' | 'supportive' | 'balanced',
        enableSounds,
        theme: theme as 'dark' | 'light',
      },
    });
    document.documentElement.setAttribute('data-theme', theme);
    addToast({ type: 'success', title: 'Preferences updated.' });
  }

  return (
    <motion.div className="settings" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <h1>Settings</h1>

      {/* Profile */}
      <section className="settings__section">
        <h3><UserIcon size={18} /> Profile</h3>
        <div className="settings__profile">
          <Avatar name={user?.name || ''} size={72} showStatus />
          <div className="settings__profile-info">
            <h4>{user?.name}</h4>
            <p>{user?.email}</p>
            <Badge variant="primary" size="sm">{user?.plan?.toUpperCase()} Plan</Badge>
          </div>
        </div>
      </section>

      {/* Preferences */}
      <section className="settings__section">
        <h3><Palette size={18} /> Preferences</h3>
        <div className="settings__field">
          <label>Daily Goal</label>
          <div className="settings__slider-wrap">
            <input type="range" min={5} max={120} step={5} value={dailyGoal} onChange={e => { setDailyGoal(+e.target.value); }} className="settings__slider" />
            <span className="settings__slider-value">{dailyGoal} min</span>
          </div>
        </div>

        <div className="settings__field">
          <label>Coaching Style</label>
          <div className="settings__radio-group">
            {(['direct', 'supportive', 'balanced'] as const).map(s => (
              <button key={s} className={`settings__radio-card ${coachingStyle === s ? 'settings__radio-card--active' : ''}`} onClick={() => setCoachingStyle(s)}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="settings__field settings__field--row">
          <label>Sound Effects</label>
          <button className={`settings__toggle ${enableSounds ? 'settings__toggle--on' : ''}`} onClick={() => setEnableSounds(!enableSounds)} aria-label="Toggle sound effects">
            <div className="settings__toggle-knob" />
          </button>
        </div>

        <div className="settings__field settings__field--row">
          <label>Theme</label>
          <div className="settings__theme-toggle">
            <button className={`settings__theme-btn ${theme === 'dark' ? 'settings__theme-btn--active' : ''}`} onClick={() => setTheme('dark')}>Dark</button>
            <button className={`settings__theme-btn ${theme === 'light' ? 'settings__theme-btn--active' : ''}`} onClick={() => setTheme('light')}>Light</button>
          </div>
        </div>

        <motion.button className="btn btn--primary" onClick={savePreferences} whileTap={{ scale: 0.97 }}>Save Preferences</motion.button>
      </section>

      {/* Notifications */}
      <section className="settings__section">
        <h3><Bell size={18} /> Notifications</h3>
        {['Daily Practice Reminders', 'Streak Warnings', 'New Course Suggestions'].map(label => (
          <div key={label} className="settings__field settings__field--row">
            <label>{label}</label>
            <button className="settings__toggle settings__toggle--on" aria-label={`Toggle ${label}`}>
              <div className="settings__toggle-knob" />
            </button>
          </div>
        ))}
      </section>

      {/* Danger Zone */}
      <section className="settings__section settings__section--danger">
        <h3><Shield size={18} /> Danger Zone</h3>
        <motion.button className="btn btn--danger btn--sm" whileTap={{ scale: 0.97 }} onClick={() => addToast({ type: 'warning', title: 'Learning history reset.', message: 'All progress has been cleared.' })}>
          Reset Learning History
        </motion.button>
      </section>
    </motion.div>
  );
}

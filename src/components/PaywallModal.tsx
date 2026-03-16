// ═══════════════════════════════════════════════════
// Skill-Tango — Paywall Modal
// Pro Tier upsell with feature comparison
// ═══════════════════════════════════════════════════

import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, X, Zap, Crown } from 'lucide-react';
import { useAuth } from '../adapters/auth';
import { useToast } from '../components/ui/Toast';
import './PaywallModal.css';

interface PaywallModalProps {
  open: boolean;
  onClose: () => void;
}

const FEATURES = [
  { name: 'Eager Generations', free: '2', pro: '∞' },
  { name: 'Priority AI Inference', free: false, pro: true },
  { name: 'Deep Diagnostics', free: 'Basic', pro: 'Full' },
  { name: 'Spaced Repetition', free: 'Basic', pro: 'Advanced' },
  { name: 'Admin Prompt Sandbox', free: false, pro: true },
];

export function PaywallModal({ open, onClose }: PaywallModalProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToast } = useToast();
  const [billing, setBilling] = useState<'monthly' | 'annual'>('monthly');
  const [processing, setProcessing] = useState(false);

  const handleSubscribe = useCallback(() => {
    setProcessing(true);
    setTimeout(() => {
      if (user) user.plan = 'pro';
      setProcessing(false);
      addToast({ type: 'success', title: 'Welcome to Skill-Tango Pro! 🎉' });
      onClose();
      navigate('/generate');
    }, 2000);
  }, [user, addToast, onClose, navigate]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="paywall__overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="paywall__card"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          >
            <button className="paywall__close" onClick={onClose}><X size={18} /></button>

            <div className="paywall__header">
              <Crown size={32} className="paywall__crown" />
              <h2>Unlock Infinite Intelligence.</h2>
              <p>You've exhausted your free eager generation credits. Go Pro to unleash unlimited learning.</p>
            </div>

            {/* Feature Table */}
            <table className="paywall__table">
              <thead>
                <tr>
                  <th></th>
                  <th>Free</th>
                  <th className="paywall__th-pro">Pro</th>
                </tr>
              </thead>
              <tbody>
                {FEATURES.map((f, i) => (
                  <tr key={i}>
                    <td className="paywall__feature-name">{f.name}</td>
                    <td className="paywall__feature-val">
                      {typeof f.free === 'boolean'
                        ? f.free ? <CheckCircle size={16} className="paywall__check" /> : <X size={16} className="paywall__x" />
                        : f.free}
                    </td>
                    <td className="paywall__feature-val paywall__feature-val--pro">
                      {typeof f.pro === 'boolean'
                        ? f.pro ? <CheckCircle size={16} className="paywall__check" /> : <X size={16} className="paywall__x" />
                        : f.pro}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Billing Toggle */}
            <div className="paywall__billing">
              <button
                className={`paywall__billing-opt ${billing === 'monthly' ? 'paywall__billing-opt--active' : ''}`}
                onClick={() => setBilling('monthly')}
              >
                Monthly
              </button>
              <button
                className={`paywall__billing-opt ${billing === 'annual' ? 'paywall__billing-opt--active' : ''}`}
                onClick={() => setBilling('annual')}
              >
                Annual <span className="paywall__save">Save 18%</span>
              </button>
            </div>

            <div className="paywall__price">
              <span className="paywall__amount">{billing === 'monthly' ? '$9' : '$89'}</span>
              <span className="paywall__period">/{billing === 'monthly' ? 'mo' : 'yr'}</span>
            </div>

            <motion.button
              className="paywall__subscribe-btn"
              onClick={handleSubscribe}
              disabled={processing}
              whileTap={{ scale: 0.97 }}
            >
              {processing ? (
                <motion.div className="paywall__spinner" animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} />
              ) : (
                <Zap size={18} />
              )}
              {processing ? 'Processing...' : 'Subscribe via Stripe'}
            </motion.button>

            <button className="paywall__dismiss" onClick={onClose}>Maybe later</button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

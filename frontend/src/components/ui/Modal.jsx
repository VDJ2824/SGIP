import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { Button } from './Button';

export function Modal({ isOpen, onClose, title, description, children, footer }) {
  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <button
            type="button"
            className="absolute inset-0 cursor-default bg-[#17312d]/35 backdrop-blur-sm"
            aria-label="Close modal overlay"
            onClick={onClose}
          />
          <motion.div
            className="glass-panel relative z-10 w-full max-w-2xl rounded-3xl p-6 shadow-glow"
            initial={{ y: 24, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 20, opacity: 0, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 250, damping: 24 }}
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-white">{title}</h2>
                {description ? <p className="mt-1 text-sm leading-6 text-slate-400">{description}</p> : null}
              </div>
              <Button variant="ghost" size="sm" onClick={onClose} icon={X} aria-label="Close dialog" />
            </div>
            <div className="mt-6">{children}</div>
            {footer ? <div className="mt-6 flex flex-wrap justify-end gap-3">{footer}</div> : null}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

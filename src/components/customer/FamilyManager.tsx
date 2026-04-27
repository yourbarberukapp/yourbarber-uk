'use client';

import { useState, useEffect } from 'react';
import { Plus, X, User, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type FamilyMember = {
  id: string;
  name: string;
  isShared?: boolean;
  sharedBy?: string;
};

export default function FamilyManager() {
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      const res = await fetch('/api/customer/family');
      if (res.ok) {
        const data = await res.json();
        setMembers(data);
      }
    } catch (error) {
      console.error('Failed to fetch family members:', error);
    } finally {
      setLoading(false);
    }
  };

  const addMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || submitting) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/customer/family', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName }),
      });

      if (res.ok) {
        setNewName('');
        setAdding(false);
        fetchMembers();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to add family member');
      }
    } catch (error) {
      alert('Error adding family member');
    } finally {
      setSubmitting(false);
    }
  };

  const removeMember = async (id: string) => {
    if (!confirm('Are you sure you want to remove this family member?')) return;

    try {
      const res = await fetch(`/api/customer/family/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        fetchMembers();
      }
    } catch (error) {
      alert('Error removing family member');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="text-[#C8F135] animate-spin" size={24} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-white font-barlow font-bold uppercase tracking-wider text-sm">Children / Family Members</h3>
        {!adding && (
          <button
            onClick={() => setAdding(true)}
            className="flex items-center gap-1.5 text-[#C8F135] text-xs font-bold uppercase tracking-widest hover:text-white transition-colors"
          >
            <Plus size={14} /> Add New
          </button>
        )}
      </div>

      <AnimatePresence mode="popLayout">
        {adding && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={addMember}
            className="bg-[#111] border border-[#C8F135]/20 rounded-lg p-4 overflow-hidden"
          >
            <div className="space-y-3">
              <div>
                <label className="block text-white/40 text-[10px] font-bold uppercase tracking-[0.2em] mb-1.5">
                  Full Name
                </label>
                <input
                  autoFocus
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Jack Smith Jr"
                  className="w-full bg-white/5 border border-white/10 rounded-sm px-4 py-3 text-white font-inter text-sm focus:outline-none focus:border-[#C8F135]/50 transition-colors"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-[#C8F135] text-black font-barlow font-black uppercase tracking-widest text-xs py-3 rounded-sm disabled:opacity-50"
                >
                  {submitting ? 'Adding...' : 'Confirm Add'}
                </button>
                <button
                  type="button"
                  onClick={() => setAdding(false)}
                  className="px-4 border border-white/10 text-white/40 font-barlow font-black uppercase tracking-widest text-xs py-3 rounded-sm hover:bg-white/5"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      <div className="space-y-2">
        {members.length === 0 && !adding && (
          <div className="bg-[#111] border border-white/5 rounded-lg p-8 text-center">
            <User className="mx-auto text-white/10 mb-3" size={32} />
            <p className="text-white/40 text-sm font-inter">No family members added yet.</p>
          </div>
        )}
        {members.map((member) => (
          <motion.div
            layout
            key={member.id}
            className="group bg-[#111] border border-white/8 rounded-lg p-4 flex items-center justify-between hover:border-white/20 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${member.isShared ? 'bg-blue-500/10' : 'bg-[#C8F135]/10'}`}>
                <User size={18} className={member.isShared ? 'text-blue-400' : 'text-[#C8F135]'} />
              </div>
              <div>
                <div className="text-white font-bold font-inter text-sm">{member.name}</div>
                {member.isShared && (
                  <div className="text-blue-400/60 text-[10px] font-bold uppercase tracking-wider mt-0.5">
                    Shared by {member.sharedBy}
                  </div>
                )}
              </div>
            </div>
            {!member.isShared && (
              <button
                onClick={() => removeMember(member.id)}
                className="p-2 text-white/20 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
              >
                <X size={16} />
              </button>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

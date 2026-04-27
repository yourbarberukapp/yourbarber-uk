'use client';

import { useState } from 'react';
import { Users, Plus, Trash2, Loader2 } from 'lucide-react';

const lime = '#C8F135';

type FamilyMember = {
  id: string;
  name: string;
  isShared?: boolean;
  sharedBy?: string;
};

type FamilySharing = {
  id: string;
  sharedWithPhone: string;
};

export function FamilyManager({ 
  initialMembers, 
  initialSharings = [] 
}: { 
  initialMembers: FamilyMember[],
  initialSharings?: FamilySharing[]
}) {
  const [members, setMembers] = useState<FamilyMember[]>(initialMembers);
  const [sharings, setSharings] = useState<FamilySharing[]>(initialSharings);
  
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  
  const [isSharing, setIsSharing] = useState(false);
  const [newPhone, setNewPhone] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function addMember() {
    if (!newName.trim() || loading) return;
    setLoading(true);
    try {
      const res = await fetch('/api/customer/family', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName }),
      });
      if (res.ok) {
        const member = await res.json();
        setMembers([...members, member]);
        setNewName('');
        setIsAdding(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function removeMember(id: string) {
    if (loading || deletingId) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/customer/family/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setMembers(members.filter(m => m.id !== id));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDeletingId(null);
    }
  }

  async function addSharing() {
    if (!newPhone.trim() || loading) return;
    setLoading(true);
    try {
      const res = await fetch('/api/customer/family/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: newPhone, action: 'add' }),
      });
      if (res.ok) {
        const sharing = await res.json();
        setSharings([sharing, ...sharings]);
        setNewPhone('');
        setIsSharing(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function removeSharing(phone: string) {
    if (loading) return;
    try {
      const res = await fetch('/api/customer/family/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, action: 'remove' }),
      });
      if (res.ok) {
        setSharings(sharings.filter(s => s.sharedWithPhone !== phone));
      }
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '2rem' }}>
      {/* Family Members Section */}
      <div style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 12,
        padding: '1rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Users size={16} color={lime} />
            <span style={{
              fontFamily: "'Barlow Condensed',sans-serif",
              fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em',
              color: 'white', fontSize: '0.9rem'
            }}>
              Family Members
            </span>
          </div>
          {!isAdding && (
            <button
              onClick={() => setIsAdding(true)}
              style={{
                background: 'transparent', border: 'none', color: lime,
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
                fontSize: '0.75rem', fontWeight: 700, fontFamily: "'Barlow Condensed',sans-serif",
                textTransform: 'uppercase'
              }}
            >
              <Plus size={14} /> Add
            </button>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {members.map(member => (
            <div key={member.id} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: member.isShared ? 'rgba(200,241,53,0.02)' : 'rgba(255,255,255,0.04)', 
              padding: '0.6rem 0.8rem', borderRadius: 8,
              border: member.isShared ? `1px solid rgba(200,241,53,0.1)` : '1px solid rgba(255,255,255,0.04)'
            }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem', fontWeight: 500 }}>
                  {member.name}
                </span>
                {member.isShared && (
                  <span style={{ fontSize: '0.65rem', color: lime, opacity: 0.6 }}>
                    Shared by {member.sharedBy}
                  </span>
                )}
              </div>
              {!member.isShared && (
                <button
                  onClick={() => removeMember(member.id)}
                  disabled={deletingId === member.id}
                  style={{
                    background: 'transparent', border: 'none', color: 'rgba(255,0,0,0.4)',
                    cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center'
                  }}
                >
                  {deletingId === member.id ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Trash2 size={14} />}
                </button>
              )}
            </div>
          ))}

          {isAdding && (
            <div style={{
              background: 'rgba(200,241,53,0.05)', padding: '0.8rem', borderRadius: 8,
              border: `1px solid rgba(200,241,53,0.15)`, display: 'flex', gap: '0.5rem'
            }}>
              <input
                autoFocus
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Name (e.g. Jimmy)"
                onKeyDown={(e) => e.key === 'Enter' && addMember()}
                style={{
                  flex: 1, background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 4, padding: '0.4rem 0.6rem', color: 'white', fontSize: '0.9rem',
                  outline: 'none'
                }}
              />
              <div style={{ display: 'flex', gap: '0.25rem' }}>
                <button
                  onClick={addMember}
                  disabled={loading}
                  style={{
                    background: lime, border: 'none', borderRadius: 4, padding: '0 0.75rem',
                    color: 'black', fontWeight: 800, fontSize: '0.75rem', cursor: 'pointer',
                    textTransform: 'uppercase', fontFamily: "'Barlow Condensed',sans-serif"
                  }}
                >
                  {loading ? '...' : 'Add'}
                </button>
                <button
                  onClick={() => { setIsAdding(false); setNewName(''); }}
                  style={{
                    background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 4, padding: '0 0.5rem',
                    color: 'white', fontSize: '0.75rem', cursor: 'pointer'
                  }}
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          {members.length === 0 && !isAdding && (
            <div style={{
              textAlign: 'center', padding: '1rem', color: 'rgba(255,255,255,0.2)',
              fontSize: '0.8rem', fontStyle: 'italic'
            }}>
              No family members added.
            </div>
          )}
        </div>
      </div>

      {/* Shared Access Section */}
      <div style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 12,
        padding: '1rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Users size={16} color="white" style={{ opacity: 0.5 }} />
            <span style={{
              fontFamily: "'Barlow Condensed',sans-serif",
              fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em',
              color: 'white', fontSize: '0.9rem'
            }}>
              Share Access
            </span>
          </div>
          {!isSharing && (
            <button
              onClick={() => setIsSharing(true)}
              style={{
                background: 'transparent', border: 'none', color: lime,
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
                fontSize: '0.75rem', fontWeight: 700, fontFamily: "'Barlow Condensed',sans-serif",
                textTransform: 'uppercase'
              }}
            >
              <Plus size={14} /> Share
            </button>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {sharings.map(sharing => (
            <div key={sharing.id} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: 'rgba(255,255,255,0.02)', padding: '0.6rem 0.8rem', borderRadius: 8,
              border: '1px solid rgba(255,255,255,0.04)'
            }}>
              <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' }}>
                {sharing.sharedWithPhone}
              </span>
              <button
                onClick={() => removeSharing(sharing.sharedWithPhone)}
                style={{
                  background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.2)',
                  cursor: 'pointer', padding: 4
                }}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}

          {isSharing && (
            <div style={{
              background: 'rgba(200,241,53,0.05)', padding: '0.8rem', borderRadius: 8,
              border: `1px solid rgba(200,241,53,0.15)`, display: 'flex', gap: '0.5rem'
            }}>
              <input
                autoFocus
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                placeholder="Co-parent's mobile"
                onKeyDown={(e) => e.key === 'Enter' && addSharing()}
                style={{
                  flex: 1, background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 4, padding: '0.4rem 0.6rem', color: 'white', fontSize: '0.9rem',
                  outline: 'none'
                }}
              />
              <div style={{ display: 'flex', gap: '0.25rem' }}>
                <button
                  onClick={addSharing}
                  disabled={loading}
                  style={{
                    background: lime, border: 'none', borderRadius: 4, padding: '0 0.75rem',
                    color: 'black', fontWeight: 800, fontSize: '0.75rem', cursor: 'pointer',
                    textTransform: 'uppercase', fontFamily: "'Barlow Condensed',sans-serif"
                  }}
                >
                  {loading ? '...' : 'Share'}
                </button>
                <button
                  onClick={() => { setIsSharing(false); setNewPhone(''); }}
                  style={{
                    background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 4, padding: '0 0.5rem',
                    color: 'white', fontSize: '0.75rem', cursor: 'pointer'
                  }}
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          {sharings.length === 0 && !isSharing && (
            <div style={{
              padding: '0.5rem', color: 'rgba(255,255,255,0.2)',
              fontSize: '0.75rem', lineHeight: '1.4'
            }}>
              Give another parent access to your family list so they can bring the kids without needing your login.
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

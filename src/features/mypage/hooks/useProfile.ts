import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../../services/supabase';
import { Profile, Role } from '../../../types';
import { useAuth } from '../../auth/hooks/useAuth';
import { usePreviewMode } from '../../../services/previewMode';

export function useProfile() {
  const { session } = useAuth();
  const userId = session?.user?.id;
  const { previewAsMember, setPreviewAsMember } = usePreviewMode();
  const [realProfile, setRealProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    if (!userId) {
      setRealProfile(null);
      setLoading(false);
      return;
    }
    const { data, error } = await supabase
      .from('profiles')
      .select('id, nickname, avatar_url, role, created_at, updated_at')
      .eq('id', userId)
      .single();
    if (error) {
      console.warn('[useProfile]', error.message);
      setRealProfile(null);
    } else {
      setRealProfile(data as Profile);
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    setLoading(true);
    let cancelled = false;
    (async () => {
      if (cancelled) return;
      await fetchProfile();
    })();
    return () => {
      cancelled = true;
    };
  }, [fetchProfile]);

  const realRole: Role = realProfile?.role ?? 'member';
  const canPreview = realRole === 'master' || realRole === 'admin';
  const effectiveRole: Role = canPreview && previewAsMember ? 'member' : realRole;

  const profile: Profile | null = realProfile
    ? { ...realProfile, role: effectiveRole }
    : null;

  const isMaster = effectiveRole === 'master';
  const isAdmin = effectiveRole === 'master' || effectiveRole === 'admin';
  const isPending = realRole === 'pending';

  return {
    profile,
    loading,
    isMaster,
    isAdmin,
    isPending,
    canPreview,
    previewAsMember: canPreview && previewAsMember,
    setPreviewAsMember,
    refetch: fetchProfile,
  };
}

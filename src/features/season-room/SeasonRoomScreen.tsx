import { useState } from 'react';
import { Alert, RefreshControl, ScrollView } from 'react-native';
import { LoadingScreen } from '../../components/ui/LoadingScreen';
import { usePullToRefresh } from '../../hooks/usePullToRefresh';
import { useProfile } from '../mypage/useProfile';
import { useSeasonEntries } from './useSeasonEntries';
import { MyEntriesCard } from './MyEntriesCard';
import { CalendarCard } from './CalendarCard';
import { EntriesOnDateCard } from './EntriesOnDateCard';

type EditingId = string | null | 'new';

export default function SeasonRoomScreen() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [editingId, setEditingId] = useState<EditingId>(null);
  const [saving, setSaving] = useState(false);
  const { isMaster } = useProfile();

  const {
    myEntries,
    allEntries,
    allWithProfiles,
    entriesOnDate,
    loading,
    saveEntry,
    deleteEntry,
    refresh,
  } = useSeasonEntries(selectedDate, isMaster);

  const { refreshing, onRefresh } = usePullToRefresh(refresh);

  if (loading) return <LoadingScreen background={false} />;

  const handleSave = async (
    id: string | 'new',
    inDate: Date,
    outDate: Date,
    targetUserId?: string,
  ) => {
    setSaving(true);
    const result = await saveEntry({ editingId: id, inDate, outDate, targetUserId });
    setSaving(false);
    if (!result.ok) {
      Alert.alert('오류', result.message);
      return;
    }
    setEditingId(null);
  };

  const displayEntries = isMaster ? allWithProfiles : myEntries;

  return (
    <ScrollView
      className="flex-1 bg-[#f5f5f5]"
      contentContainerStyle={{ padding: 16, gap: 16 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <MyEntriesCard
        entries={displayEntries}
        editingId={editingId}
        saving={saving}
        isMaster={isMaster}
        title={isMaster ? '전체 일정' : '내 일정'}
        showNickname={isMaster}
        onStartNew={() => setEditingId('new')}
        onStartEdit={(entry) => setEditingId(entry.id)}
        onCancelEdit={() => setEditingId(null)}
        onSave={handleSave}
        onDelete={deleteEntry}
      />

      <CalendarCard
        allEntries={allEntries}
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
      />

      <EntriesOnDateCard selectedDate={selectedDate} entries={entriesOnDate} />
    </ScrollView>
  );
}

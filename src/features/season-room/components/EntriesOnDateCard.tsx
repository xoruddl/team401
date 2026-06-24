import { Text, View } from 'react-native';
import { Card } from '../../../components/Card';
import { SeasonEntry } from '../../../types';
import { formatYmd } from '../../../utils/date';

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

const formatHeader = (d: Date) =>
  `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}(${WEEKDAYS[d.getDay()]})`;

type Props = {
  selectedDate: Date;
  entries: SeasonEntry[];
};

export function EntriesOnDateCard({ selectedDate, entries }: Props) {
  const dateStr = formatYmd(selectedDate);

  return (
    <Card>
      <View className="flex-row justify-between items-center">
        <Text className="text-base font-bold text-[#1a1a1a]">{formatHeader(selectedDate)}</Text>
        <Text className="text-sm font-semibold text-[#555]">
          총 {new Set(entries.map((e) => e.user_id)).size}명
        </Text>
      </View>

      {entries.length === 0 ? (
        <Text className="text-sm text-[#aaa] text-center py-4">
          이 날짜에 일정이 없습니다.
        </Text>
      ) : (
        entries.map((entry) => {
          const isIn = entry.in_date === dateStr;
          const isOut = entry.out_date === dateStr;
          return (
            <View
              key={entry.id}
              className="flex-row items-center justify-between py-2.5 border-b border-[#f5f5f5]"
            >
              <Text className="text-[15px] text-[#1a1a1a]">
                {entry.profiles?.nickname ?? '알 수 없음'}
              </Text>
              <View className="flex-row gap-1.5">
                {isIn && (
                  <View className="px-2 py-0.5 rounded-md bg-[#E8F5E9]">
                    <Text className="text-[11px] font-bold text-[#1a1a1a]">IN</Text>
                  </View>
                )}
                {isOut && (
                  <View className="px-2 py-0.5 rounded-md bg-[#FFEBEE]">
                    <Text className="text-[11px] font-bold text-[#1a1a1a]">OUT</Text>
                  </View>
                )}
              </View>
            </View>
          );
        })
      )}
    </Card>
  );
}

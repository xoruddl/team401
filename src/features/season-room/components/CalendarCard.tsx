import { useMemo } from 'react';
import { Text } from 'react-native';
import { Calendar, DateData, LocaleConfig } from 'react-native-calendars';
import { Card } from '../../../components/Card';
import { SeasonEntry } from '../../../types';
import { formatYmd, parseYmd } from '../../../utils/date';

LocaleConfig.locales.ko = {
  monthNames: ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'],
  monthNamesShort: ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'],
  dayNames: ['일요일','월요일','화요일','수요일','목요일','금요일','토요일'],
  dayNamesShort: ['일','월','화','수','목','금','토'],
  today: '오늘',
};
LocaleConfig.defaultLocale = 'ko';

const DOT_COLOR = '#1e88e5';
const SELECTED_COLOR = '#1a1a1a';

type Props = {
  allEntries: SeasonEntry[];
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
};

export function CalendarCard({ allEntries, selectedDate, onSelectDate }: Props) {
  const markedDates = useMemo(() => {
    const map: Record<string, any> = {};
    for (const e of allEntries) {
      const cur = parseYmd(e.in_date);
      const end = parseYmd(e.out_date);
      while (cur <= end) {
        const key = formatYmd(cur);
        if (!map[key]) map[key] = { marked: true, dotColor: DOT_COLOR };
        cur.setDate(cur.getDate() + 1);
      }
    }
    const selKey = formatYmd(selectedDate);
    map[selKey] = {
      ...(map[selKey] ?? {}),
      selected: true,
      selectedColor: SELECTED_COLOR,
    };
    return map;
  }, [allEntries, selectedDate]);

  return (
    <Card>
      <Text className="text-base font-bold text-[#1a1a1a]">달력</Text>
      <Calendar
        current={formatYmd(selectedDate)}
        markedDates={markedDates}
        onDayPress={(day: DateData) => onSelectDate(parseYmd(day.dateString))}
        theme={{
          todayTextColor: DOT_COLOR,
          arrowColor: '#1a1a1a',
          textMonthFontWeight: '700',
          textDayFontWeight: '500',
        }}
      />
    </Card>
  );
}

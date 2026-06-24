import { FormField } from '../../../components/FormField';
import { FormModal } from '../../../components/FormModal';

type Props = {
  visible: boolean;
  editing: boolean;
  title: string;
  content: string;
  submitting: boolean;
  onChangeTitle: (v: string) => void;
  onChangeContent: (v: string) => void;
  onCancel: () => void;
  onSubmit: () => void;
};

export function NoticeFormModal({
  visible,
  editing,
  title,
  content,
  submitting,
  onChangeTitle,
  onChangeContent,
  onCancel,
  onSubmit,
}: Props) {
  return (
    <FormModal
      visible={visible}
      title={editing ? '공지 수정' : '공지 작성'}
      submitLabel={editing ? '수정' : '등록'}
      submitting={submitting}
      submitVariant="dark"
      onCancel={onCancel}
      onSubmit={onSubmit}
    >
      <FormField
        label="제목"
        value={title}
        onChangeText={onChangeTitle}
        placeholder="제목"
      />
      <FormField
        label="내용"
        value={content}
        onChangeText={onChangeContent}
        placeholder="동아리원에게 전달할 공지 내용"
        multiline
      />
    </FormModal>
  );
}

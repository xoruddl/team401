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

export function PostFormModal({
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
      title={editing ? '글 수정' : '글쓰기'}
      submitLabel={editing ? '수정' : '등록'}
      submitting={submitting}
      submitVariant="primary"
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
        placeholder="건의사항이나 공지를 자유롭게 적어주세요."
        multiline
      />
    </FormModal>
  );
}

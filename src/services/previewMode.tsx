import { createContext, useContext, useState, ReactNode } from 'react';

type PreviewModeContextValue = {
  previewAsMember: boolean;
  setPreviewAsMember: (v: boolean) => void;
};

const PreviewModeContext = createContext<PreviewModeContextValue | null>(null);

export function PreviewModeProvider({ children }: { children: ReactNode }) {
  const [previewAsMember, setPreviewAsMember] = useState(false);
  return (
    <PreviewModeContext.Provider value={{ previewAsMember, setPreviewAsMember }}>
      {children}
    </PreviewModeContext.Provider>
  );
}

export function usePreviewMode() {
  const ctx = useContext(PreviewModeContext);
  if (!ctx) throw new Error('usePreviewMode must be used within PreviewModeProvider');
  return ctx;
}

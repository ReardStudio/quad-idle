import { useEffect, useState } from 'react';

export function useUpdate() {
  const [version, setVersion] = useState('');
  const [ready, setReady] = useState<string | null>(null);
  useEffect(() => {
    void window.api.getVersion().then(v => {
      setVersion(v);
    });
    void window.api.getReadyUpdate().then(setReady);
    return window.api.onUpdate(setReady);
  }, []);
  return { version, ready };
}

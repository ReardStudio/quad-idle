import { useEffect, useRef, useState } from 'react';
import type { Account } from '../../../shared/ipc';
import { normalizeUrl } from '../lib/utils';
import Dialog, { Actions, FULL, Label } from './Dialog';

interface Props {
  acc: Account | null;
  defaultName: string;
  defaultUrl: string;
  onSave: (v: { name: string; url: string; }) => void;
  onClose: () => void;
}

export default function AccountDialog({ acc, defaultName, defaultUrl, onSave, onClose }: Props) {
  const [name, setName] = useState(acc?.name ?? defaultName);
  const [url, setUrl] = useState(acc?.url ?? defaultUrl);
  const nameRef = useRef<HTMLInputElement>(null);
  useEffect(() => nameRef.current?.select(), []);

  return (
    <Dialog title={acc ? 'Editar conta' : 'Criar conta'} onClose={onClose}>
      <Label htmlFor="accName">Nome</Label>
      <input ref={nameRef} className={FULL} id="accName" type="text" maxLength={20} value={name} onChange={e => setName(e.target.value)} />
      <Label htmlFor="accUrl">Link do jogo</Label>
      <input className={FULL} id="accUrl" type="text" placeholder="https://....." value={url} onChange={e => setUrl(e.target.value)} />
      <Actions>
        <button onClick={onClose}>Cancelar</button>
        <button className="on" onClick={() => onSave({ name: name.trim().slice(0, 20) || 'Conta', url: normalizeUrl(url)})}>
          Salvar
        </button>
      </Actions>
    </Dialog>
  );
}

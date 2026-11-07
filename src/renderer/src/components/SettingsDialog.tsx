import type { Dispatch, SetStateAction } from 'react';
import type { Config } from '../../../shared/ipc';
import { clamp } from '../lib/utils';
import Dialog, { Actions, Label, ROW_BUTTON, Row, Toggle } from './Dialog';

interface Props {
  cfg: Config;
  setCfg: Dispatch<SetStateAction<Config>>;
  onClose: () => void;
}

type Flag = 'alwaysOnTop' | 'tray' | 'keepAwake' | 'startWithWindows' | 'suspendHidden';
const TOGGLES: { key: Flag; label: string; hint: string }[] = [
  { key: 'alwaysOnTop', label: 'Sempre no topo', hint: 'Mantém a janela acima das outras' },
  { key: 'tray', label: 'Minimizar para a bandeja', hint: 'Ao minimizar, vai para a bandeja do sistema' },
  { key: 'keepAwake', label: 'Impedir suspensão do PC', hint: 'O Windows não dorme sozinho enquanto o app estiver aberto' },
  { key: 'startWithWindows', label: 'Iniciar com o Windows', hint: 'Abre o app ao ligar o PC (só no app instalado)' },
  { key: 'suspendHidden', label: 'Suspender ocultas', hint: 'Contas fora da tela fecham e liberam RAM, mas não jogam' }
];

export default function SettingsDialog({ cfg, setCfg, onClose }: Props) {
  return (
    <Dialog title="Ajustes" onClose={onClose}>
      {TOGGLES.map(t => (
        <Toggle key={t.key} label={t.label} hint={t.hint} checked={cfg[t.key]} onChange={v => setCfg(c => ({ ...c, [t.key]: v }))} />
      ))}
      <Label htmlFor="reloadHours">Recriar o jogo e as lives a cada (horas, 0 = nunca)</Label>
      <input
        id="reloadHours"
        type="number"
        min={0}
        max={72}
        defaultValue={cfg.reloadHours}
        onChange={e => setCfg(c => ({ ...c, reloadHours: clamp(Number(e.target.value) || 0, 0, 72) }))}
      />
      <Label htmlFor="ramLimit">Avisar quando a RAM passar de (MB)</Label>
      <input
        id="ramLimit"
        type="number"
        min={500}
        step={250}
        defaultValue={cfg.ramLimit}
        onChange={e => setCfg(c => ({ ...c, ramLimit: Number(e.target.value) || 3000 }))}
      />

      <Row>
        <button className={ROW_BUTTON} onClick={() => void window.api.openLog()}>
          📄 Mostrar o log
        </button>
        <small className="text-muted">Para mandar ao dev quando algo der errado</small>
      </Row>
      <Actions>
        <button className="on" onClick={onClose}>
          Fechar
        </button>
      </Actions>
    </Dialog>
  );
}
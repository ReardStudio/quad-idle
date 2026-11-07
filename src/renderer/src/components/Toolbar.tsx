import { useState } from 'react';
import { cx, fmt } from '../lib/utils';

interface Props {
  accountCount: number;
  shownCount: number;
  start: number;
  ramMb: number | null;
  ramHigh: boolean;
  version: string;
  onScreens: (k: number) => void;
  onPage: (dir: 1 | -1) => void;
  onSearch: () => void;
  onCreate: () => void;
  onSettings: () => void;
}

const PRESETS = [1, 2, 4, 6, 9, 12, 16];

export default function Toolbar(p: Props) {
  const [versionLabel, setVersionLabel] = useState<string | null>(null);

  const checkUpdate = async () => {
    setVersionLabel('Checando...');
    setVersionLabel((await window.api.checkUpdate()) ?? 'Erro');
    setTimeout(() => setVersionLabel(null), 5000);
  };

  const all = p.shownCount >= p.accountCount;
  const options = [...new Set([...PRESETS.filter(k => k < p.accountCount), ...(all ? [] : [p.shownCount])])].sort((a, b) => a - b);
  const range = p.shownCount === 1 ? `${p.start + 1}` : `${p.start + 1}–${p.start + p.shownCount}`;

  return (
    <header className="flex min-h-11 flex-wrap items-center gap-2 border-b border-line bg-card py-2 pl-2.5 pr-36">
      {p.accountCount > 1 && (
        <>
          <label className="flex items-center gap-1.5 text-muted">
            Telas
            <select value={all ? 0 : p.shownCount} onChange={e => p.onScreens(Number(e.target.value))}>
              {options.map(k => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
              <option value={0}>Todas ({p.accountCount})</option>
            </select>
          </label>
          {!all && (
            <div className="flex items-center gap-1" role="group" aria-label="Trocar as contas na tela">
              <button title="Contas anteriores" aria-label="Contas anteriores" onClick={() => p.onPage(-1)}>
                ◀
              </button>
              <span className="min-w-24 text-center tabular-nums text-muted">
                {range} de {p.accountCount}
              </span>
              <button title="Próximas contas" aria-label="Próximas contas" onClick={() => p.onPage(1)}>
                ▶
              </button>
            </div>
          )}
          <button title="Ir para uma conta (Ctrl+K)" onClick={p.onSearch}>
            🔍 Buscar
          </button>
        </>
      )}
      <button className="on" title="Cria uma nova conta/tela" onClick={p.onCreate}>
        ＋ Criar
      </button>
      <span className="flex-1" />
      <span className={cx('tabular-nums', p.ramHigh ? 'font-bold text-bad' : 'text-muted')} title="Memória usada pelo app e pelos jogos">
        RAM: {p.ramMb === null ? '--' : `${fmt(p.ramMb)} MB`}
      </span>
      <button className="bg-transparent text-muted" title="Clique para buscar atualização" onClick={checkUpdate}>
        {versionLabel ?? (p.version ? `v${p.version}` : 'v…')}
      </button>
      <button title="Topo, bandeja, reload e aviso de RAM" onClick={p.onSettings}>
        ⚙ Ajustes
      </button>
    </header>
  );
}
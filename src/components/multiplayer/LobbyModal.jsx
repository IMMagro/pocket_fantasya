import React, { useState, useEffect } from 'react';
import { Wifi, Copy, Check, Users, Bot, Play, Server, ArrowRight, Sparkles } from 'lucide-react';
import { soundEngine } from '../../engine/soundEngine';

export function LobbyModal({ 
  onStartSoloGame, 
  onHostLanGame, 
  onJoinLanGame, 
  lanInfo, 
  isConnecting, 
  connectionError 
}) {
  const [activeTab, setActiveTab] = useState('solo'); // 'solo' | 'host' | 'join'
  const [playerName, setPlayerName] = useState('Giocatore 1');
  const [roomId, setRoomId] = useState(() => Math.floor(1000 + Math.random() * 9000).toString());
  const [hostIp, setHostIp] = useState(lanInfo?.ip ? `${lanInfo.ip}:4000` : 'localhost:4000');
  const [joinRoomId, setJoinRoomId] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (lanInfo?.ip) {
      setHostIp(`${lanInfo.ip}:${lanInfo.port || 4000}`);
    }
  }, [lanInfo]);

  const handleCopyHostInfo = () => {
    const textToCopy = `Unisciti alla mia partita su Card Clash!\nIP Server: ${hostIp}\nCodice Stanza: ${roomId}`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    soundEngine.playButtonClick();
    setTimeout(() => setCopied(false), 2500);
  };

  const handleStartHost = () => {
    soundEngine.playButtonClick();
    onHostLanGame({ roomId, playerName, hostUrl: `http://${hostIp}` });
  };

  const handleStartJoin = () => {
    soundEngine.playButtonClick();
    onJoinLanGame({ roomId: joinRoomId, playerName, hostUrl: hostIp.startsWith('http') ? hostIp : `http://${hostIp}` });
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-[#111720] border-2 border-slate-700 w-full max-w-xl rounded-2xl p-6 shadow-2xl relative text-slate-100">
        
        {/* Header Title */}
        <div className="text-center mb-6">
          <h2 className="text-2xl md:text-3xl font-bold font-serif text-slate-100 flex items-center justify-center gap-2.5">
            <Wifi className="w-7 h-7 text-amber-400" />
            Arena di Battaglia
          </h2>
          <p className="text-slate-400 text-xs md:text-sm mt-1">
            Scegli se giocare contro il Bot AI o sfidare il tuo collega in rete locale (LAN)!
          </p>
        </div>

        {/* Player Name Input */}
        <div className="mb-5 bg-slate-900/90 p-3 rounded-xl border border-slate-800">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
            Il Tuo Nome Giocatore
          </label>
          <input
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            className="w-full bg-[#0a0e14] border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 font-semibold focus:outline-none focus:border-amber-400"
          />
        </div>

        {/* Mode Tabs */}
        <div className="grid grid-cols-3 gap-2 mb-6">
          <button
            onClick={() => { setActiveTab('solo'); soundEngine.playButtonClick(); }}
            className={`py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 border ${
              activeTab === 'solo'
                ? 'bg-amber-500 text-black border-amber-400 shadow-md'
                : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
            }`}
          >
            <Bot className="w-4 h-4" /> Single vs AI
          </button>

          <button
            onClick={() => { setActiveTab('host'); soundEngine.playButtonClick(); }}
            className={`py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 border ${
              activeTab === 'host'
                ? 'bg-amber-500 text-black border-amber-400 shadow-md'
                : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
            }`}
          >
            <Server className="w-4 h-4" /> Crea Stanza (Host)
          </button>

          <button
            onClick={() => { setActiveTab('join'); soundEngine.playButtonClick(); }}
            className={`py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 border ${
              activeTab === 'join'
                ? 'bg-amber-500 text-black border-amber-400 shadow-md'
                : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
            }`}
          >
            <Users className="w-4 h-4" /> Unisciti a Collega
          </button>
        </div>

        {/* TAB 1: SOLO vs AI */}
        {activeTab === 'solo' && (
          <div className="space-y-4 text-center py-2 animate-fade-in">
            <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800">
              <Bot className="w-12 h-12 text-amber-400 mx-auto mb-2" />
              <h3 className="font-serif font-bold text-slate-200 text-base">
                Modalità Allenamento vs AI Bot
              </h3>
              <p className="text-slate-400 text-xs mt-1">
                Gioca istantaneamente contro il computer locale per testare il tuo mazzo e le nuove carte create.
              </p>
            </div>

            <button
              onClick={() => onStartSoloGame(playerName)}
              className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold text-sm rounded-xl shadow-lg transition flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4 fill-current" /> Avvia Partita vs AI
            </button>
          </div>
        )}

        {/* TAB 2: HOST LAN GAME */}
        {activeTab === 'host' && (
          <div className="space-y-4 animate-fade-in">
            <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-800 space-y-3">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Indirizzo LAN del tuo PC (Server)
                </span>
                <div className="font-mono text-sm font-bold text-amber-300 mt-0.5">
                  {hostIp}
                </div>
              </div>

              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Codice Stanza
                </span>
                <div className="font-mono text-2xl font-black text-white tracking-widest mt-0.5">
                  {roomId}
                </div>
              </div>

              <button
                type="button"
                onClick={handleCopyHostInfo}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 border border-slate-700 transition"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Informazioni Copiate!' : 'Copia Dati per il Collega'}
              </button>
            </div>

            <button
              onClick={handleStartHost}
              disabled={isConnecting}
              className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-sm rounded-xl shadow-lg transition flex items-center justify-center gap-2"
            >
              {isConnecting ? (
                <span>In attesa di connessione del collega...</span>
              ) : (
                <><Play className="w-4 h-4 fill-current" /> Crea e Avvia Stanza Host</>
              )}
            </button>
          </div>
        )}

        {/* TAB 3: JOIN LAN GAME */}
        {activeTab === 'join' && (
          <div className="space-y-4 animate-fade-in">
            <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-800 space-y-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Indirizzo IP del PC Host
                </label>
                <input
                  type="text"
                  placeholder="Es. 192.168.1.45:4000 o localhost:4000"
                  value={hostIp}
                  onChange={(e) => setHostIp(e.target.value)}
                  className="w-full bg-[#0a0e14] border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 font-mono focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Codice Stanza Host
                </label>
                <input
                  type="text"
                  placeholder="Inserisci il codice a 4 cifre..."
                  value={joinRoomId}
                  onChange={(e) => setJoinRoomId(e.target.value)}
                  className="w-full bg-[#0a0e14] border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 font-mono tracking-widest text-center text-lg font-bold focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            {connectionError && (
              <div className="p-3 bg-rose-950/80 border border-rose-600/50 text-rose-300 rounded-lg text-xs font-semibold">
                ⚠️ {connectionError}
              </div>
            )}

            <button
              onClick={handleStartJoin}
              disabled={isConnecting || !joinRoomId}
              className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-sm rounded-xl shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <ArrowRight className="w-4 h-4" /> Collegati e Gioca Subito
            </button>
          </div>
        )}

      </div>
    </div>
  );
}

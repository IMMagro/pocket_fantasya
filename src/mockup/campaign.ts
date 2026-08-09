// Campagna "Gli Elettronici" — 10 missioni a difficoltà crescente contro l'AI.
// Ogni missione usa il mazzo AI dell'espansione (buildAiDeck) con HP eroe crescenti.
// Battendo la missione 10 il giocatore riceve una carta speciale (vedi questState).

export interface Mission {
  id: number
  name: string
  desc: string
  aiName: string
  aiHp: number        // HP dell'Eroe avversario per questa missione
  reward: number      // monete premio alla prima vittoria
  final?: boolean     // l'ultima consegna anche la carta speciale
}

export const MISSIONS: Mission[] = [
  { id: 1,  name: 'Reboot Iniziale',      desc: 'Un bot tirocinante muove i primi passi. Scaldati.',                 aiName: 'Bot Tirocinante',        aiHp: 20, reward: 50 },
  { id: 2,  name: 'Aggiornamento Forzato', desc: 'Il sistema chiede di riavviare. Rispondi con le carte.',            aiName: 'Updater Molesto',        aiHp: 22, reward: 60 },
  { id: 3,  name: 'Coda di Stampa',        desc: 'Documenti bloccati e nervi tesi. Sblocca la situazione.',           aiName: 'Spooler Inceppato',      aiHp: 24, reward: 70 },
  { id: 4,  name: 'Errore 404',            desc: 'La pagina non si trova, ma lo scontro sì.',                         aiName: 'Server Fantasma',        aiHp: 26, reward: 80 },
  { id: 5,  name: 'Ticket Prioritario',    desc: 'Un cliente insoddisfatto è diventato un problema serio.',           aiName: 'Escalation Manager',     aiHp: 29, reward: 100 },
  { id: 6,  name: 'Backup Corrotto',       desc: 'I dati si ribellano. Ripristina l\'ordine sul campo.',              aiName: 'Claudio Backup',         aiHp: 31, reward: 120 },
  { id: 7,  name: 'Sincronizzazione',      desc: 'Tutto deve allinearsi. Anche i tuoi attacchi.',                     aiName: 'Sincronizzatore Rotto',  aiHp: 34, reward: 140 },
  { id: 8,  name: 'Deadlock',              desc: 'Nessuno cede. Serve una mossa decisiva.',                           aiName: 'Processo Zombie',        aiHp: 37, reward: 170 },
  { id: 9,  name: 'Overclock',             desc: 'Il nemico spinge oltre i limiti. Reggi l\'urto.',                   aiName: 'Core Surriscaldato',     aiHp: 40, reward: 200 },
  { id: 10, name: 'Kernel Panic',          desc: 'La sfida finale. Sconfiggilo e reclama la carta leggendaria.',      aiName: 'Overlord del Quaderno',  aiHp: 45, reward: 300, final: true },
]

export const FINAL_MISSION_ID = 10

export function getMission(id: number): Mission | undefined {
  return MISSIONS.find(m => m.id === id)
}

const PREFIX = Object.freeze({ KV:'VITAKV', IND:'VITAIND', FAM:'VITAFAM', EMP:'VITAEMP', ZIS:'VITAZIS' })
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // sin 0/O/1/I
const rand8 = () => Array.from({length:8}, () => ALPHABET[Math.floor(Math.random()*ALPHABET.length)]).join('')
export function makeVitaId(bin){ if(!PREFIX[bin]) throw new Error('BIN inválido'); return `${PREFIX[bin]} ${rand8()}` }

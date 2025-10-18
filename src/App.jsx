import React, { useEffect, useState } from "react";

/**
 * PlayMoney Casino — Multi-game single-file React app
 * Design: Realistic casino look (dark background, gold accents, neon)
 * Games included: Poker, Slots (working reels), Blackjack, Roulette, Coinflip, Crash, Wheel, Dice
 * Play-money only. Each game has its own balance (per your request: individual balances per game).
 * Tailwind CSS utility classes used for styling. Drop into a React app (Vite/CRA/Next) with Tailwind configured.
 *
 * Notes:
 * - All outcomes are pseudo-random and for demo purposes only.
 * - Odds/win rates intentionally reduced for slots/crash/roulette to simulate real casino edge.
 */

const fmt = (n) => n.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const DEFAULT_START = 1000000;
const GAME_KEYS = ["lobby","slots","blackjack","poker","roulette","coinflip","crash","wheel","dice"];

// --- helper: persist per-game balances to localStorage ---
const loadBalances = () => {
  try {
    const raw = localStorage.getItem('pm_balances_v1');
    if (raw) return JSON.parse(raw);
  } catch(e){}
  const obj = {};
  for (const g of GAME_KEYS) obj[g] = DEFAULT_START;
  return obj;
}

const saveBalances = (b) => {
  try { localStorage.setItem('pm_balances_v1', JSON.stringify(b)); } catch(e){}
}

// --- Slot machine config ---
const SLOT_SYMBOLS = ['🍒','🍋','🔔','⭐','7','💎'];
const SLOT_WEIGHTS = { '🍒':40, '🍋':30, '🔔':15, '⭐':8, '7':5, '💎':2 }; // rarer symbols

function weightedPick(weights) {
  const entries = Object.entries(weights);
  const total = entries.reduce((s,[k,v])=>s+v,0);
  let r = Math.random()*total;
  for (const [k,v] of entries) {
    if (r < v) return k;
    r -= v;
  }
  return entries[entries.length-1][0];
}

// --- Blackjack helpers ---
const BJ_RANKS = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];
const BJ_SUITS = ['♠','♥','♦','♣'];
function makeDeck(){ const d=[]; for(const r of BJ_RANKS) for(const s of BJ_SUITS) d.push({r,s}); return d; }
function drawFrom(deck){ const i=randomInt(0,deck.length-1); return deck.splice(i,1)[0]; }
function bjValue(cards){ let total=0; let aces=0; for(const c of cards){ if(c.r==='A'){ aces++; total+=11 } else if(['K','Q','J'].includes(c.r)){ total+=10 } else total+=Number(c.r);} while(total>21 && aces>0){ total-=10; aces--; } return total; }

// --- Roulette wheel ---
const ROULETTE_NUMBERS = [
  0,32,15,19,4,21,2,25,17,34,6,27,13,36,11,30,8,23,10,5,24,16,33,1,20,14,31,9,22,18,29,7,28,12,35,3,26
];
// pockets colored red/black (0 is green)
const REDS = new Set([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]);

// --- Crash game ---
// simple multiplier build-up with random crash point
function crashTarget() {
  // heavy tail: simulate house edge by modest expected multiplier
  // pick exponent from exponential distribution
  const x = Math.random();
  // map to multiplier in [1.0, 50.0], but mostly small
  return Math.max(1.0, Math.pow(1.0/(1-x), 0.5));
}

export default function App(){
  const [view, setView] = useState('lobby');
  const [balances, setBalances] = useState(()=>loadBalances());
  const [globalLog, setGlobalLog] = useState([]);

  useEffect(()=> saveBalances(balances), [balances]);

  const pushLog = (text) => setGlobalLog(l => [`[${new Date().toLocaleTimeString()}] ${text}`, ...l].slice(0,200));
  const changeBalance = (game, delta, reason) => {
    setBalances(b => { const nb = {...b, [game]: Math.max(0, Math.floor((b[game]||0) + delta))}; pushLog(`${game.toUpperCase()}: ${reason} ${delta>=0?'+':''}${fmt(delta)} -> ${fmt(nb[game])}`); return nb; });
  }

  // Shared visual theme header
  const Header = () => (
    <header className="w-full bg-gradient-to-r from-black via-gray-900 to-gray-800 border-b border-yellow-800/30 shadow-md">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="text-2xl font-extrabold text-yellow-300 tracking-wide">Golden Mirage Casino</div>
          <nav className="hidden md:flex gap-2 text-sm text-gray-300">
            <button onClick={()=>setView('lobby')} className={"px-3 py-1 rounded-md " + (view==='lobby' ? 'bg-yellow-600/20 text-yellow-200' : 'hover:bg-white/5')}>Lobby</button>
            <button onClick={()=>setView('slots')} className={"px-3 py-1 rounded-md " + (view==='slots' ? 'bg-yellow-600/20 text-yellow-200' : 'hover:bg-white/5')}>Slots</button>
            <button onClick={()=>setView('blackjack')} className={"px-3 py-1 rounded-md " + (view==='blackjack' ? 'bg-yellow-600/20 text-yellow-200' : 'hover:bg-white/5')}>Blackjack</button>
            <button onClick={()=>setView('poker')} className={"px-3 py-1 rounded-md " + (view==='poker' ? 'bg-yellow-600/20 text-yellow-200' : 'hover:bg-white/5')}>Poker</button>
            <button onClick={()=>setView('roulette')} className={"px-3 py-1 rounded-md " + (view==='roulette' ? 'bg-yellow-600/20 text-yellow-200' : 'hover:bg-white/5')}>Roulette</button>
            <button onClick={()=>setView('coinflip')} className={"px-3 py-1 rounded-md " + (view==='coinflip' ? 'bg-yellow-600/20 text-yellow-200' : 'hover:bg-white/5')}>Coinflip</button>
            <button onClick={()=>setView('crash')} className={"px-3 py-1 rounded-md " + (view==='crash' ? 'bg-yellow-600/20 text-yellow-200' : 'hover:bg-white/5')}>Crash</button>
            <button onClick={()=>setView('wheel')} className={"px-3 py-1 rounded-md " + (view==='wheel' ? 'bg-yellow-600/20 text-yellow-200' : 'hover:bg-white/5')}>Wheel</button>
            <button onClick={()=>setView('dice')} className={"px-3 py-1 rounded-md " + (view==='dice' ? 'bg-yellow-600/20 text-yellow-200' : 'hover:bg-white/5')}>Dice</button>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-xs text-gray-300">Per-game balances</div>
          <div className="bg-yellow-900/20 rounded-md px-3 py-1 text-sm text-yellow-200 flex gap-3">
            {GAME_KEYS.filter(k=>k!=='lobby').map(k=>(<div key={k} className="text-xs">{k}: <span className="font-semibold">{fmt(balances[k]||0)}</span></div>))}
          </div>
          <div className="ml-2 text-xs text-gray-400">Play money only</div>
        </div>
      </div>
    </header>
  );

  // --- Lobby ---
  const Lobby = () => (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Promo */}
        <div className="md:col-span-2 bg-gradient-to-br from-black/60 via-gray-900 to-gray-800 p-6 rounded-2xl border border-yellow-900/20 shadow-lg">
          <h2 className="text-2xl font-bold text-yellow-300 mb-2">Welcome to Golden Mirage</h2>
          <p className="text-gray-300">A play-money casino demo with realistic odds and multiple games. Each game has its own balance so you can test strategies per game. Enjoy the atmosphere — lights, chips and a little shimmer of gold.</p>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <GameCard title="Slots" subtitle="Spin the reels" onOpen={()=>setView('slots')} />
            <GameCard title="Blackjack" subtitle="Beat the dealer" onOpen={()=>setView('blackjack')} />
            <GameCard title="Poker" subtitle="Play a quick hand vs AI" onOpen={()=>setView('poker')} />
            <GameCard title="Roulette" subtitle="Place bets on the wheel" onOpen={()=>setView('roulette')} />
            <GameCard title="Crash" subtitle="Cash out before the crash" onOpen={()=>setView('crash')} />
            <GameCard title="Wheel" subtitle="Spin for prizes" onOpen={()=>setView('wheel')} />
            <GameCard title="Coinflip" subtitle="Simple heads or tails" onOpen={()=>setView('coinflip')} />
            <GameCard title="Dice" subtitle="Bet on roll outcomes" onOpen={()=>setView('dice')} />
          </div>
        </div>

        <div className="bg-black/60 p-4 rounded-2xl border border-yellow-900/20 shadow-lg">
          <h3 className="text-lg font-semibold text-yellow-300">Quick Controls</h3>
          <div className="mt-3 text-sm text-gray-300">Faucet per-game and reset balances.</div>
          <div className="mt-3 grid grid-cols-1 gap-2">
            {GAME_KEYS.filter(k=>k!=='lobby').map(k=> (
              <div key={k} className="flex items-center justify-between gap-2">
                <div className="text-xs capitalize">{k}</div>
                <div className="flex gap-2">
                  <button onClick={()=>{ changeBalance(k, 50000, 'Faucet +50k'); }} className="px-2 py-1 bg-yellow-700/30 rounded text-xs">+50k</button>
                  <button onClick={()=>{ setBalances(b=>({...b, [k]: DEFAULT_START})); pushLog(`${k.toUpperCase()}: Reset to ${fmt(DEFAULT_START)}`); }} className="px-2 py-1 bg-white/5 rounded text-xs">Reset</button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 text-xs text-gray-400">Transactions:</div>
          <div className="mt-2 text-xs max-h-48 overflow-auto text-gray-200">
            {globalLog.map((l,i)=>(<div key={i} className="py-1 border-b border-white/5">{l}</div>))}
          </div>
        </div>
      </div>
    </div>
  );

  const GameCard = ({title, subtitle, onOpen}) => (
    <div className="bg-gradient-to-br from-gray-900/60 to-black/60 p-4 rounded-xl border border-yellow-900/10 shadow-inner hover:scale-[1.01] transition-transform">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-md font-semibold text-yellow-200">{title}</div>
          <div className="text-xs text-gray-300 mt-1">{subtitle}</div>
        </div>
        <div>
          <button onClick={onOpen} className="px-3 py-1 bg-yellow-600/90 rounded text-xs font-medium">Play</button>
        </div>
      </div>
    </div>
  );

  // -------------------- SLOTS --------------------
  function SlotsView(){
    const [reels, setReels] = useState(['🍒','🍋','🔔']);
    const [spinning, setSpinning] = useState(false);
    const [msg, setMsg] = useState('');
    const [bet, setBet] = useState(1000);

    const spin = async () => {
      if (spinning) return;
      if ((balances['slots']||0) < bet) { pushLog('SLOTS: Not enough funds'); return; }
      changeBalance('slots', -bet, 'Slots bet');
      setSpinning(true); setMsg('Spinning...');

      // spinning animation (fake) with staggered reel stops
      for (let t=0;t<12;t++){
        setReels([weightedPick(SLOT_WEIGHTS), weightedPick(SLOT_WEIGHTS), weightedPick(SLOT_WEIGHTS)]);
        await new Promise(r=>setTimeout(r, 80 + t*10));
      }
      // final outcome: reduce win chance by applying house edge
      const final = [weightedPick(SLOT_WEIGHTS), weightedPick(SLOT_WEIGHTS), weightedPick(SLOT_WEIGHTS)];
      setReels(final);

      // Determine payout: triples rare; pair smaller — adjust with strict probabilities
      let payout = 0;
      const [a,b,c] = final;
      if (a===b && b===c){
        // triple matched, payout depends on symbol rarity
        const mul = a==='7' ? 30 : (a==='💎'?100:10);
        // tiny chance to actually pay even if triple, simulate casino edge (only pay if random < threshold)
        if (Math.random() < 0.6) payout = Math.floor(bet * mul * 0.9);
      } else if (a===b || b===c || a===c){
        if (Math.random() < 0.25) payout = Math.floor(bet * 1.5);
      }

      if (payout>0){ changeBalance('slots', payout, 'Slots win'); setMsg(`You won ${fmt(payout)} — ${a} ${b} ${c}`); }
      else { setMsg(`You lost ${fmt(bet)} — ${a} ${b} ${c}`); }
      setSpinning(false);
    }

    return (
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="bg-gradient-to-br from-black/60 to-gray-900 p-6 rounded-2xl border border-yellow-900/20 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-yellow-300">Slots</h2>
              <div className="text-sm text-gray-300">Bet on reels — rarer symbols pay more. House edge applied.</div>
            </div>
            <div className="text-sm text-gray-200">Balance: <span className="font-semibold">{fmt(balances['slots']||0)}</span></div>
          </div>

          <div className="mt-6 flex flex-col items-center gap-4">
            <div className="bg-gradient-to-tr from-black/80 to-gray-800 p-4 rounded-xl text-6xl tracking-widest shadow-sm" style={{letterSpacing:12}}>{reels[0]} {reels[1]} {reels[2]}</div>
            <div className="flex items-center gap-2">
              <input type="number" value={bet} onChange={(e)=>setBet(Math.max(100, Number(e.target.value||100)))} className="w-28 text-black px-2 py-1 rounded" />
              <button onClick={spin} disabled={spinning} className="px-4 py-2 bg-yellow-600 rounded disabled:opacity-60">Spin</button>
              <button onClick={()=>{ setBalances(b=>({...b, slots: b.slots + 100000})); pushLog('SLOTS: Faucet +100k'); }} className="px-3 py-1 bg-white/5 rounded">Faucet</button>
            </div>
            <div className="text-sm text-gray-200">{msg}</div>
          </div>
        </div>
      </div>
    )
  }

  // -------------------- BLACKJACK --------------------
  function BlackjackView(){
    const [deck, setDeck] = useState(makeDeck().concat(makeDeck()));
    const [player, setPlayer] = useState([]);
    const [dealer, setDealer] = useState([]);
    const [bet, setBet] = useState(2000);
    const [status, setStatus] = useState('Place bet');
    const [locked, setLocked] = useState(false);

    const start = ()=>{
      if (locked) return;
      if ((balances['blackjack']||0) < bet) { pushLog('BLACKJACK: Not enough funds'); return; }
      changeBalance('blackjack', -bet, 'Blackjack bet');
      setDeck(makeDeck().concat(makeDeck()));
      const d = makeDeck();
      const p = [drawFrom(d), drawFrom(d)];
      const dl = [drawFrom(d), drawFrom(d)];
      setPlayer(p); setDealer(dl); setStatus('Playing'); setLocked(true);
      // replace with remaining deck
      setDeck(d);
      // auto-check blackjack
      const pv = bjValue(p); if (pv===21){ // immediate blackjack
        const payout = Math.floor(bet * 2.5);
        changeBalance('blackjack', payout, 'Blackjack natural'); setStatus('Blackjack! You win'); setLocked(false);
      }
    }

    const hit = ()=>{
      if (!locked) return;
      const d = deck.slice(); const card = drawFrom(d); const np = [...player, card]; setPlayer(np); setDeck(d);
      const v = bjValue(np); if (v>21){ setStatus('Bust — you lose'); setLocked(false); }
    }
    const stand = ()=>{
      if (!locked) return;
      // dealer plays
      let d = deck.slice(); let dl = dealer.slice(); while(bjValue(dl) < 17){ dl.push(drawFrom(d)); }
      setDealer(dl); setDeck(d);
      const pv = bjValue(player); const dv = bjValue(dl);
      if (dv>21 || pv>dv){ const payout = Math.floor(bet * 2); changeBalance('blackjack', payout, 'Blackjack win'); setStatus('You win'); }
      else if (pv===dv){ changeBalance('blackjack', bet, 'Push'); setStatus('Push'); }
      else { setStatus('Dealer wins'); }
      setLocked(false);
    }

    return (
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="bg-gradient-to-br from-black/60 to-gray-900 p-6 rounded-2xl border border-yellow-900/20 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-yellow-300">Blackjack</h2>
              <div className="text-sm text-gray-300">Beat the dealer — face cards worth 10, aces flexible.</div>
            </div>
            <div className="text-sm text-gray-200">Balance: <span className="font-semibold">{fmt(balances['blackjack']||0)}</span></div>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-green-900/10 p-4 rounded">
              <div className="text-sm text-gray-300">Dealer</div>
              <div className="mt-2 text-3xl">{dealer.map((c,i)=>(<span key={i} className="mr-2">{c.r}{c.s}</span>))}</div>
            </div>
            <div className="bg-green-900/10 p-4 rounded">
              <div className="text-sm text-gray-300">Player</div>
              <div className="mt-2 text-3xl">{player.map((c,i)=>(<span key={i} className="mr-2">{c.r}{c.s}</span>))}</div>
              <div className="mt-2 text-sm text-gray-200">Value: {bjValue(player)}</div>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2">
            <input type="number" value={bet} onChange={(e)=>setBet(Math.max(100, Number(e.target.value||100)))} className="w-28 text-black px-2 py-1 rounded" />
            <button onClick={start} className="px-3 py-1 bg-yellow-600 rounded">Deal</button>
            <button onClick={hit} disabled={!locked} className="px-3 py-1 bg-white/5 rounded">Hit</button>
            <button onClick={stand} disabled={!locked} className="px-3 py-1 bg-white/5 rounded">Stand</button>
            <div className="text-sm text-gray-200 ml-auto">{status}</div>
          </div>
        </div>
      </div>
    )
  }

  // -------------------- POKER (simplified vs dealer high-card / pair) --------------------
  function PokerView(){
    const ranks = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];
    const suits = ['♠','♥','♦','♣'];
    const makeDeckLocal = ()=>{ const d=[]; for(const r of ranks) for(const s of suits) d.push({r,s}); return d; }
    const [hand, setHand] = useState([]);
    const [dealer, setDealer] = useState([]);
    const [bet, setBet] = useState(2000);
    const [msg, setMsg] = useState('');

    const draw = ()=>{
      if ((balances['poker']||0) < bet) { pushLog('POKER: Not enough funds'); return; }
      changeBalance('poker', -bet, 'Poker bet');
      const d = makeDeckLocal();
      const p = [];
      for(let i=0;i<5;i++) p.push(d.splice(randomInt(0,d.length-1),1)[0]);
      const dl = [];
      for(let i=0;i<5;i++) dl.push(d.splice(randomInt(0,d.length-1),1)[0]);
      setHand(p); setDealer(dl);
      const score = evalHand(p); const dscore = evalHand(dl);
      if (score> dscore){ const payout = Math.floor(bet * 1.9); changeBalance('poker', payout, 'Poker win'); setMsg('You win!'); }
      else if (score===dscore){ changeBalance('poker', bet, 'Poker push'); setMsg('Push'); }
      else setMsg('You lost');
    }

    const evalHand = (h)=>{
      const counts = {}; for(const c of h) counts[c.r]=(counts[c.r]||0)+1; const vals = Object.values(counts).sort((a,b)=>b-a);
      if (vals[0]===4) return 8; if (vals[0]===3 && vals[1]===2) return 7; if (vals[0]===3) return 4; if (vals[0]===2 && vals[1]===2) return 3; if (vals[0]===2) return 2; return 1;
    }

    return (
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="bg-gradient-to-br from-black/60 to-gray-900 p-6 rounded-2xl border border-yellow-900/20 shadow-lg">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-yellow-300">Poker (Quick Hand)</h2>
            <div className="text-sm text-gray-200">Balance: <span className="font-semibold">{fmt(balances['poker']||0)}</span></div>
          </div>
          <div className="mt-4 flex gap-4 items-center">
            <div className="text-sm">Your hand: <span className="ml-2">{hand.map((c,i)=>(<span key={i} className="mr-1">{c.r}{c.s}</span>))}</span></div>
            <div className="text-sm">Dealer: <span className="ml-2">{dealer.length? dealer.map((c,i)=>(<span key={i} className="mr-1">{c.r}{c.s}</span>)) : '—'}</span></div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <input type="number" value={bet} onChange={(e)=>setBet(Math.max(100, Number(e.target.value||100)))} className="w-28 text-black px-2 py-1 rounded" />
            <button onClick={draw} className="px-3 py-1 bg-yellow-600 rounded">Deal</button>
            <div className="text-sm text-gray-200 ml-auto">{msg}</div>
          </div>
        </div>
      </div>
    )
  }

  // -------------------- ROULETTE --------------------
  function RouletteView(){
    const [betAmt, setBetAmt] = useState(1000);
    const [betType, setBetType] = useState({type:'number', value:17});
    const [wheelMsg, setWheelMsg] = useState('');
    const spinWheel = async ()=>{
      if ((balances['roulette']||0) < betAmt) { pushLog('ROULETTE: Not enough funds'); return; }
      changeBalance('roulette', -betAmt, 'Roulette bet');
      setWheelMsg('Spinning...');
      await new Promise(r=>setTimeout(r, 1200));
      const pocket = ROULETTE_NUMBERS[randomInt(0,ROULETTE_NUMBERS.length-1)];
      const color = pocket===0? 'green' : (REDS.has(pocket)?'red':'black');
      let payout = 0;
      if (betType.type==='number' && Number(betType.value)===pocket) payout = betAmt * 35;
      if (betType.type==='color' && betType.value===color) payout = betAmt * 2;
      if (betType.type==='parity' && betType.value=== (pocket%2===0 ? 'even':'odd')) payout = betAmt * 2;
      if (payout>0){ changeBalance('roulette', Math.floor(payout), 'Roulette win'); setWheelMsg(`Result: ${pocket} (${color}) — You won ${fmt(Math.floor(payout))}`); }
      else setWheelMsg(`Result: ${pocket} (${color}) — You lost ${fmt(betAmt)}`);
    }

    return (
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="bg-gradient-to-br from-black/60 to-gray-900 p-6 rounded-2xl border border-yellow-900/20 shadow-lg">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-yellow-300">Roulette</h2>
            <div className="text-sm text-gray-200">Balance: <span className="font-semibold">{fmt(balances['roulette']||0)}</span></div>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-300">Bet amount</div>
              <input type="number" value={betAmt} onChange={(e)=>setBetAmt(Math.max(100, Number(e.target.value||100)))} className="w-28 text-black px-2 py-1 rounded mt-1" />

              <div className="mt-3 text-sm text-gray-300">Bet type</div>
              <div className="mt-2 flex gap-2">
                <select value={betType.type} onChange={(e)=>setBetType({type:e.target.value, value: e.target.value==='number'?17:'red'})} className="text-black rounded px-2 py-1">
                  <option value="number">Number (pays 35x)</option>
                  <option value="color">Color (red/black) (2x)</option>
                  <option value="parity">Odd/Even (2x)</option>
                </select>
                {betType.type==='number' && <input type="number" value={betType.value} onChange={(e)=>setBetType({...betType, value:Number(e.target.value||0)})} className="w-24 text-black px-2 py-1 rounded" />}
                {betType.type==='color' && <select value={betType.value} onChange={(e)=>setBetType({...betType, value:e.target.value})} className="text-black rounded px-2 py-1"><option value="red">red</option><option value="black">black</option></select>}
                {betType.type==='parity' && <select value={betType.value} onChange={(e)=>setBetType({...betType, value:e.target.value})} className="text-black rounded px-2 py-1"><option value="odd">odd</option><option value="even">even</option></select>}
              </div>

              <div className="mt-4">
                <button onClick={spinWheel} className="px-4 py-2 bg-yellow-600 rounded">Spin</button>
              </div>
            </div>

            <div>
              <div className="text-sm text-gray-300">Outcome</div>
              <div className="mt-2 text-lg text-gray-100">{wheelMsg}</div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // -------------------- COINFLIP --------------------
  function CoinflipView(){
    const [amt, setAmt] = useState(1000);
    const [msg, setMsg] = useState('');
    const flip = (choice)=>{
      if ((balances['coinflip']||0) < amt) { pushLog('COINFLIP: Not enough funds'); return; }
      changeBalance('coinflip', -amt, 'Coinflip bet');
      const pick = Math.random() < 0.49 ? 'heads' : 'tails'; // slight house edge
      if (pick===choice){ changeBalance('coinflip', amt*2, 'Coinflip win'); setMsg(`It was ${pick} — you win ${fmt(amt)}`); }
      else setMsg(`It was ${pick} — you lost ${fmt(amt)}`);
    }

    return (
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="bg-gradient-to-br from-black/60 to-gray-900 p-6 rounded-2xl border border-yellow-900/20 shadow-lg text-center">
          <h2 className="text-2xl font-bold text-yellow-300">Coinflip</h2>
          <div className="mt-2 text-sm text-gray-300">Pick heads or tails. Slight house edge applied.</div>
          <div className="mt-4">
            <input type="number" value={amt} onChange={(e)=>setAmt(Math.max(100, Number(e.target.value||100)))} className="w-28 text-black px-2 py-1 rounded" />
            <div className="mt-4 flex gap-4 justify-center">
              <button onClick={()=>flip('heads')} className="px-4 py-2 bg-yellow-600 rounded">Heads</button>
              <button onClick={()=>flip('tails')} className="px-4 py-2 bg-yellow-600 rounded">Tails</button>
            </div>
            <div className="mt-4 text-gray-200">{msg}</div>
          </div>
        </div>
      </div>
    )
  }

  // -------------------- CRASH --------------------
  function CrashView(){
    const [bet, setBet] = useState(1000);
    const [active, setActive] = useState(false);
    const [mult, setMult] = useState(1.0);
    const [msg, setMsg] = useState('');
    const [crashPoint, setCrashPoint] = useState(null);

    const startRound = async ()=>{
      if (active) return;
      if ((balances['crash']||0) < bet) { pushLog('CRASH: Not enough funds'); return; }
      changeBalance('crash', -bet, 'Crash bet');
      setActive(true); setMsg('Round started'); setMult(1.0);
      const crashAt = Math.max(1.0, crashTarget()); setCrashPoint(crashAt);
      // animate multiplier growing until crash
      let t=0; while(true){ await new Promise(r=>setTimeout(r, 200)); t+=0.2; const next = 1 + t*(1+Math.random()*0.05); setMult(prev=>Math.min(crashAt + 0.001, prev+ (next-prev))); if (next >= crashAt) { break; } }
      // crash happened
      setActive(false); setMsg(`Crashed at ${crashAt.toFixed(2)}x`);
    }

    const cashout = ()=>{
      if (!active) return;
      const payout = Math.floor(bet * mult * 0.95); // house take
      changeBalance('crash', payout, 'Crash cashout'); setActive(false); setMsg(`Cashed out at ${mult.toFixed(2)}x for ${fmt(payout)}`);
    }

    return (
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="bg-gradient-to-br from-black/60 to-gray-900 p-6 rounded-2xl border border-yellow-900/20 shadow-lg text-center">
          <h2 className="text-2xl font-bold text-yellow-300">Crash</h2>
          <div className="mt-2 text-sm text-gray-300">Place a bet and cash out before the crash. Higher multipliers are rarer.</div>
          <div className="mt-4 text-4xl font-mono">{mult.toFixed(2)}x</div>
          <div className="mt-4">
            <input type="number" value={bet} onChange={(e)=>setBet(Math.max(100, Number(e.target.value||100)))} className="w-28 text-black px-2 py-1 rounded" />
            <div className="mt-3 flex gap-2 justify-center">
              <button onClick={startRound} disabled={active} className="px-4 py-2 bg-yellow-600 rounded">Start</button>
              <button onClick={cashout} disabled={!active} className="px-4 py-2 bg-white/5 rounded">Cashout</button>
            </div>
          </div>
          <div className="mt-3 text-gray-200">{msg}</div>
        </div>
      </div>
    )
  }

  // -------------------- WHEEL --------------------
  function WheelView(){
    const segments = [100,200,500,1000,0,0,5000,20000];
    const [msg, setMsg] = useState('');
    const [spinning, setSpinning] = useState(false);
    const [bet, setBet] = useState(2000);

    const spin = async ()=>{
      if (spinning) return; if ((balances['wheel']||0) < bet) { pushLog('WHEEL: Not enough funds'); return; }
      changeBalance('wheel', -bet, 'Wheel bet'); setSpinning(true); setMsg('Spinning...');
      await new Promise(r=>setTimeout(r, 1200));
      const pick = segments[randomInt(0,segments.length-1)];
      if (pick>0){ const payout = Math.floor(bet * (pick/100)); changeBalance('wheel', payout, 'Wheel win'); setMsg(`Wheel landed ${pick} — You won ${fmt(payout)}`); }
      else setMsg(`Wheel landed ${pick} — You won nothing`);
      setSpinning(false);
    }

    return (
      <div className="max-w-4xl mx-auto px-6 py-8 text-center">
        <div className="bg-gradient-to-br from-black/60 to-gray-900 p-6 rounded-2xl border border-yellow-900/20 shadow-lg">
          <h2 className="text-2xl font-bold text-yellow-300">Prize Wheel</h2>
          <div className="mt-2 text-sm text-gray-300">Spin the wheel for a prize. Big prizes are rare.</div>
          <div className="mt-4 text-gray-100">Balance: <span className="font-semibold">{fmt(balances['wheel']||0)}</span></div>
          <div className="mt-4">
            <input type="number" value={bet} onChange={(e)=>setBet(Math.max(100, Number(e.target.value||100)))} className="w-28 text-black px-2 py-1 rounded" />
            <div className="mt-3">
              <button onClick={spin} disabled={spinning} className="px-4 py-2 bg-yellow-600 rounded">Spin</button>
            </div>
            <div className="mt-3 text-gray-200">{msg}</div>
            <div className="mt-4 text-xs text-gray-400">Top prizes: 20k, 5k, others smaller.</div>
          </div>
        </div>
      </div>
    )
  }

  // -------------------- DICE --------------------
  function DiceView(){
    const [bet, setBet] = useState(1000);
    const [choice, setChoice] = useState('over');
    const [target, setTarget] = useState(3);
    const [msg, setMsg] = useState('');
    const roll = ()=>{
      if ((balances['dice']||0) < bet) { pushLog('DICE: Not enough funds'); return; }
      changeBalance('dice', -bet, 'Dice bet');
      const r = randomInt(1,6);
      let win=false; if (choice==='over') win = r > target; else win = r < target; if (win){ const payout = Math.floor(bet * 1.9); changeBalance('dice', payout, 'Dice win'); setMsg(`Rolled ${r} — You win ${fmt(payout)}`);} else setMsg(`Rolled ${r} — You lost ${fmt(bet)}`);
    }

    return (
      <div className="max-w-4xl mx-auto px-6 py-8 text-center">
        <div className="bg-gradient-to-br from-black/60 to-gray-900 p-6 rounded-2xl border border-yellow-900/20 shadow-lg">
          <h2 className="text-2xl font-bold text-yellow-300">Dice</h2>
          <div className="mt-2 text-sm text-gray-300">Bet whether roll is above/below a target (1-6).</div>
          <div className="mt-4">
            <input type="number" value={bet} onChange={(e)=>setBet(Math.max(100, Number(e.target.value||100)))} className="w-28 text-black px-2 py-1 rounded" />
            <div className="mt-2 flex gap-2 justify-center">
              <select value={choice} onChange={(e)=>setChoice(e.target.value)} className="text-black px-2 rounded">
                <option value="over">Over</option>
                <option value="under">Under</option>
              </select>
              <input type="number" value={target} onChange={(e)=>setTarget(Math.min(5, Math.max(1, Number(e.target.value||3))))} className="w-20 text-black px-2 py-1 rounded" />
            </div>
            <div className="mt-3">
              <button onClick={roll} className="px-4 py-2 bg-yellow-600 rounded">Roll</button>
            </div>
            <div className="mt-3 text-gray-200">{msg}</div>
          </div>
        </div>
      </div>
    )
  }

  // -------------------- MAIN RENDER --------------------
  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-gray-900 via-black to-gray-800 text-white">
      <Header />
      <main className="py-8">
        {view==='lobby' && <Lobby />}
        {view==='slots' && <SlotsView />}
        {view==='blackjack' && <BlackjackView />}
        {view==='poker' && <PokerView />}
        {view==='roulette' && <RouletteView />}
        {view==='coinflip' && <CoinflipView />}
        {view==='crash' && <CrashView />}
        {view==='wheel' && <WheelView />}
        {view==='dice' && <DiceView />}
      </main>

      <footer className="py-6 text-center text-xs text-gray-400">PlayMoney demo only — not for real-money gambling. If you wish to convert to real-money products, consult legal counsel for your jurisdiction.</footer>
    </div>
  )
}

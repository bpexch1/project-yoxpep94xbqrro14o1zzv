export type Game = { id: string; name: string; category: string; symbol: string; color: string; playable: boolean };
// Names and order observed in the original TeenPatti Studio lobby, 14 October 2026.
const entries = [
 ['9301','Chicken Road 2','Arcade','♟','#9ba83a'],['9022','Aviator','Crash','✈','#bb233d'],
 ['9040','AviatorX','Crash','✈','#803bc2'],['9023','BlastOff','Crash','↑','#165bbe'],
 ['9100','CricketX','Crash','◉','#283ac7'],['9035','Dream Catcher','Wheel','◎','#7e2cb0'],
 ['9001','TeenPatti T20','Cards','♠','#a87735'],['9005','TeenPatti ODI','Cards','♣','#9c4eb8'],
 ['9030','Auto Roulette','Wheel','◎','#a9843d'],['9006','Muflis TeenPatti','Cards','♦','#ae4984'],
 ['9095','Rock Paper Scissor','Arcade','✌','#7144c8'],['9021','Poker','Cards','♠','#a48135'],
 ['9015','Sic-Bo','Dice','⚄','#ae2946'],['9002','AndarBahar','Cards','♥','#239c96'],
 ['9003','HiLo','Cards','↕','#ad7e32'],['9004','DragonTiger','Cards','♠','#9d3245'],
 ['9007','7UpDown','Dice','⚅','#3958c2'],['9008','Ammar Akbar Anthony','Cards','♣','#9654aa'],
 ['9009','Super Over OneDay','Sports','◉','#22834f'],['9011','Super Over T20','Sports','◉','#2e6799'],
 ['9010','32 Cards','Cards','♦','#aa743a'],['9012','Bollywood Casino','Cards','★','#9b446d'],
 ['9016','Race To 17','Cards','17','#415cae'],['9014','Race-20-20','Cards','20','#b55236'],
 ['9017','High Card','Cards','A','#426eae'],['9018','Casino War','Cards','♠','#9b3c38'],
 ['9019','Lucky 7','Cards','7','#a5872e'],['9020','Center Card','Cards','♦','#6f46a5'],
 ['9045','TRIO','Cards','3','#a54d39'],['9050','TRAP','Cards','♣','#366b83'],
 ['9055','One Card 20-20','Cards','A','#3b6697'],['9060','One Card Meter','Cards','↗','#ab783a'],
 ['9065','Queen Race','Cards','Q','#9b486d'],['9070','Dus Ka Dum','Cards','10','#7753ad'],
 ['9075','Side Bet city','Cards','♠','#217e77'],['9080','Lottery','Arcade','8','#a66c30'],
 ['9085','Heads & Tails','Arcade','◐','#b18b3d'],['9105','Fortune Gems','Slots','◆','#237e53'],
];
const supported = new Set(['9001','9005','9006','9030','9002','9004','9007','9017','9018','9019','9055','9085']);
export const studioGames: Game[] = entries.map(([id,name,category,symbol,color]) => ({id,name,category,symbol,color,playable:supported.has(id)}));

// Lobby/menu only: the owner supplied matching artwork for these 34 catalog games.
// Keep studioGames intact for existing game configuration and settlement tests.
// Do not mistake the supplied "Dragon Tiger Lion" image for DragonTiger.
const artworkProvidedIds = new Set([
  '9301', '9022', '9040', '9023', '9100', '9035', '9001', '9005',
  '9030', '9006', '9021', '9015', '9002', '9003', '9007', '9008',
  '9009', '9011', '9010', '9012', '9016', '9017', '9018', '9019',
  '9020', '9045', '9050', '9055', '9065', '9070', '9075', '9080',
  '9085', '9105',
]);
export const studioLobbyGames: Game[] = studioGames.filter(game => artworkProvidedIds.has(game.id));

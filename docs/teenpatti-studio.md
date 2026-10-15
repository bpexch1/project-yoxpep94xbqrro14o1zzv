# TeenPatti Studio demo

Routes: `/teenpatti-studio` and `/Common/BetProGames`. The dashboard TeenPatti Studio entry opens the lobby. Betfair is unchanged.

The lobby contains the 38 observed reference game names in their original order. Twelve tables offer explicitly labelled free-coin simulations: TeenPatti T20, TeenPatti ODI, Muflis TeenPatti, Auto Roulette, AndarBahar, DragonTiger, 7UpDown, High Card, Casino War, Lucky 7, One Card 20-20, and Heads & Tails. The other 26 are visibly unavailable. Artwork is implemented locally in CSS. This is not an exact reproduction of the original provider's game feed or internal rules: the reference game remained on its loading screen.

The Edge Function generates outcomes with cryptographic randomness. Private round outcomes remain server-side until settlement. Existing exchange sessions, balance reservation, commission, statements and hierarchy P/L are reused. Requests have stable UUIDs for safe retries. Betting closes after 20 seconds, followed by 10 seconds for results. A database cron job settles due rounds every minute even when players close the page; active state requests also settle due rounds. These are test coins with no cash value.

Deployment requires migration `20261015001452_teenpatti_studio_demo.sql` and Edge Function `teenpatti-studio` (custom session authentication, JWT gateway verification disabled). Both were applied to the database used by the existing production frontend.

Validation: full production build and TypeScript checking passed. Engine tests cover catalog consistency, card ranking and valid random results. Transactional SQL tests cover credit-funded reservation, win/loss/void settlement, request idempotency, cutoff enforcement, settlement ledger and hierarchy P/L, unauthenticated access and private-table permissions. Test records were rolled back. The deployed unauthenticated endpoint returns HTTP 401. Authenticated browser gameplay still requires a user-session smoke check.

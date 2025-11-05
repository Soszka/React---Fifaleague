# Onboarding projektu: eFutbol League

## Witamy
Witaj w projekcie eFutbol League! To aplikacja webowa zbudowana w oparciu o React + TypeScript + Vite, która pozwala zarządzać ligą FIFA: obserwować wyniki meczów, przeglądać statystyki, prowadzić ranking i zatwierdzać zgłoszenia spotkań. Interfejs wykorzystuje bibliotekę MUI, animacje Framer Motion oraz integrację z Firebase (autentykacja i Realtime Database).

## Przegląd projektu i struktury
Repozytorium ma klasyczny układ aplikacji Vite. Logika aplikacji znajduje się w katalogu `src/`, który dzieli się na:
- **`pages/`** – widoki ekranów (strony) powiązane z routingiem React Routera.
- **`common/`** – współdzielone zasoby (konteksty, hooki, stałe, typy, usługi Firebase, narzędzia, komponenty UI).
- **`theme/`** – definicje motywu MUI (paleta kolorów, nadpisania komponentów).
- **`styles/`** – globalne arkusze SASS wykorzystywane w komponentach.
- **`assets/`** – grafiki (np. ilustracje kart, logotypy).
- **`locales/`** – tłumaczenia i konfiguracja i18next (`i18n.ts`).
- **`test-utils/`** i `setupTests.ts` – konfiguracja oraz pomocnicze dane do testów jednostkowych.
Poza katalogiem `src` znajdują się konfiguracje środowiska (`vite.config.ts`, `tsconfig*.json`, `eslint.config.js`) oraz testy E2E w `tests/e2e` z konfiguracją Playwrighta.

## Kluczowe moduły

### `src/common`
- **`context/`** – kluczowe providery stanu oparte na Firebase:
  - `AuthContext` opakowuje logowanie, wylogowanie i obserwację sesji (`listenAuth`).
  - `MatchesContext` synchronizuje kolekcję meczów, obsługuje operacje CRUD oraz zapisuje log aktywności.
  - `PendingMatchesContext` zarządza zgłoszeniami oczekującymi na akceptację (w tym uprawnienia administratora, zatwierdzanie i odrzucanie zgłoszeń).
  - `MatchActivityContext` udostępnia historię operacji na meczach.
  - `NotificationContext` udostępnia system powiadomień toasts.
- **`hooks/`** – hooki bazujące na kontekstach, filtrujące i agregujące dane (np. `useAllMatches`, `usePlayerStats`, `useLastMatches`).
- **`constants/`** – słowniki graczy (`players.ts`) wraz z pomocniczymi funkcjami normalizacji identyfikatorów.
- **`services/`** – integracja z Firebase (`firebase.ts`) oraz aliasy operacji na auth/database.
- **`types/`** – definicje struktur danych wykorzystywanych w logice (`matchActivity.ts`, `pendingMatchRequest.ts`).
- **`utils/`** – funkcje narzędziowe: formatowanie dat (`dateUtils.ts`), odtwarzanie polskich znaków (`nameUtils.ts`), normalizacja ciągów (`stringUtils.ts`).
- **`UI/`** – lekkie komponenty prezentacyjne wielokrotnego użytku (`Title`, `Footer`).

### `src/pages`
Każda podstrona posiada własny moduł oraz powiązane komponenty pomocnicze i style SCSS. Router (`AppRoutes.tsx`) zabezpiecza sekcję `/app` poprzez `RequireAuth`.
- **`home/`** – ekran powitalny z animowanym przywitaniem, tablicą wyników (`HomeScoreboard`), kartami nawigacyjnymi oraz statystykami opartymi o logikę kontekstów.
- **`matches/`** – rozbudowany widok listy meczów z filtrami, sortowaniem, paginacją, oraz dialogami dodawania/edycji/usuwania. Wykorzystuje kontekst `MatchesContext` oraz `NotificationProvider`.
- **`pending/`** – panel akceptacji zgłoszeń meczów dla administratora (korzysta z `PendingMatchesContext`).
- **`stats/`** – moduł analityczny (wykresy ApexCharts, zakładki, agregacje wyników). Wykorzystuje hook `useAllMatches` oraz dane o graczach.
- **`ranking/`, `table/`, `teams/`, `news/`, `about/`** – statyczne lub półstatyczne widoki korzystające z tłumaczeń oraz wspólnych komponentów.
- **`auth/`** – ekran logowania powiązany z Firebase auth.
- **`navigation/`** – layout główny (AppBar, Drawer, akcje użytkownika takie jak zmiana motywu, wybór języka, wylogowanie) zagnieżdżający providerów (`MatchesProvider`, `MatchActivityProvider`, `PendingMatchesProvider`).

### Inne ważne obszary
- **`src/i18n.ts` i `locales/`** – konfiguracja wielojęzyczna (PL jako język bazowy + EN/ES/DE). Tłumaczenia kluczowych tekstów interfejsu.
- **`src/theme/`** – system motywów MUI (palety `neutralLight` / `neutralDark`, nadpisania komponentów, typografia).
- **`src/styles/`** – mixiny i globalne style (reset, tła gradientowe) wykorzystywane w modułach SCSS.
- **`src/test-utils/firebaseSnapshots.ts`** – próbki danych Realtime Database wykorzystywane w testach hooków.
- **`src/common/tests/` i `src/common/hooks/__tests__/`** – testy jednostkowe Vitest sprawdzające logikę dat, transliteracji oraz agregacji statystyk.
- **`tests/e2e/`** – scenariusze Playwright weryfikujące kluczowe przepływy (logowanie, przegląd meczów, ranking, tabela, statystyki, historia newsów).

## Najaktywniejsze pliki i obszary
Analiza katalogu pokazuje kilka miejsc o największym zagęszczeniu logiki:
1. **Zarządzanie meczami (`MatchesContext`, `Matches.tsx`)** – złożone przetwarzanie danych (sortowanie, filtrowanie, synchronizacja z Firebase, log aktywności). Wymaga ostrożności przy zmianach typów lub struktury bazy.
2. **Panel statystyk (`Stats.tsx`, `usePlayerStats.ts`)** – wielowarstwowe agregacje i wizualizacje, zależne od poprawnych formatów wyników meczów.
3. **Obsługa zgłoszeń (`PendingMatchesContext.tsx`)** – logika zatwierdzania/odrzucania, walidacja struktur `PendingMatchRequest`, integracja z akcjami `MatchesContext`.
4. **Layout i nawigacja (`Navigation.tsx`)** – spina routing, providerów i adaptację do różnych rozmiarów ekranu.
5. **Narzędzia formatujące (`nameUtils.ts`, `dateUtils.ts`)** – używane w wielu miejscach; zmiana funkcji normalizujących wpływa na filtrację, sortowanie oraz identyfikację graczy.

## Kluczowi współtwórcy
- **Soszka** – główny autor repozytorium (na podstawie `git shortlog -sn`).

## Aktualne obserwacje i potencjalne wyzwania
1. **Spójność modeli danych Firebase** – wiele miejsc mapuje snapshoty na struktury TypeScript; niespójne dane mogą powodować błędy w hookach i kontekstach.
2. **Formatowanie nazw i wyników** – funkcje normalizacji (usuwanie znaków diakrytycznych) są krytyczne dla poprawnego filtrowania użytkownika. Warto utrzymywać testy jednostkowe aktualne.
3. **Synchronizacja stanu UI** – moduł meczów bazuje na wielu flagach (`showAll`, filtry, paginacja, dialogi). Wprowadzając nowe filtry trzeba pilnować zależności hooków `useMemo` / `useCallback`.
4. **Wydajność renderowania** – komponent `Home` oraz `Stats` mają animacje i wykresy; konieczne jest dbanie o lazy-loading i warunkowe renderowanie przy dodawaniu kolejnych wizualizacji.
5. **Uprawnienia administracyjne** – `PendingMatchesContext` obecnie rozpoznaje admina po identyfikatorze gracza. Zmiana listy graczy wymaga aktualizacji logiki oraz testów.

## Pytania do zespołu
1. Czy planowana jest migracja struktury danych w Firebase (np. przejście na kolekcje per sezon)? Jak przygotować konteksty na ewentualne zmiany schematu?
2. W jaki sposób weryfikowane są uprawnienia administratora poza bazową listą graczy? Czy rozważamy bardziej elastyczny mechanizm ról?
3. Jakie są oczekiwania dotyczące pokrycia testami (unit + e2e)? Czy istnieją minimalne wskaźniki lub krytyczne ścieżki wymagające obowiązkowych testów?
4. Czy mamy ustaloną konwencję wersjonowania tłumaczeń i pracy z plikami `locales/*.json` (np. checklisty aktualizacji dla nowych kluczy)?
5. Jak wygląda proces wydawniczy (deploy na Vercel?) i czy istnieją dodatkowe kroki walidujące dane w bazie przed publikacją?

## Następne kroki dla nowej osoby w zespole
1. **Skonfiguruj środowisko** – zainstaluj Node 18+ i pnpm/yarn/npm (repo używa `npm`/`vite`).
2. **Zainstaluj zależności** – `npm install` (lub `yarn`/`pnpm install`).
3. **Uruchom aplikację** – `npm run dev` (domyślnie na `http://localhost:5173`).
4. **Poznaj routing** – przejrzyj `AppRoutes.tsx` oraz strukturę `pages/` w celu zrozumienia nawigacji i guardów.
5. **Zapoznaj się z kontekstami** – szczególnie `AuthContext`, `MatchesContext`, `PendingMatchesContext` (integracja z Firebase).
6. **Przejrzyj narzędzia i hooki** – `common/utils`, `common/hooks` w celu zrozumienia przygotowywania danych do widoków.
7. **Uruchom testy** – `npm test` (Vitest) oraz, gdy potrzebne, `npm run test:e2e` (Playwright). Sprawdź `src/setupTests.ts` i `playwright.config.ts`.
8. **Zajrzyj do tłumaczeń** – upewnij się jak dodawać nowe klucze w `locales/*.json`.
9. **Omów z zespołem** – potwierdź zasady review, checklistę przed wdrożeniem oraz sposób pracy z Firebase (np. dostęp do projektu, środowiska testowego).

## Konfiguracja środowiska deweloperskiego
- **Wymagania**: Node.js 18–22, npm (lub alternatywnie Yarn/Pnpm), konto Firebase z dostępem do projektu `fifa-league-5faa1`.
- **Komendy**:
  - `npm run dev` – start serwera developerskiego Vite.
  - `npm run build` – kompilacja produkcyjna (`tsc -b` + `vite build`).
  - `npm run preview` – podgląd produkcyjnego builda.
  - `npm run lint` – uruchomienie ESLinta.
  - `npm test` – testy jednostkowe (Vitest).
  - `npm run test:e2e` / `npm run test:e2e:headed` – testy Playwright.
- **Testy e2e** uruchamiają Vite z hostem `localhost` i portem `5173` (patrz `playwright.config.ts`).

## Przydatne zasoby
- Dokumentacja MUI: https://mui.com/
- Dokumentacja Firebase: https://firebase.google.com/docs
- Dokumentacja i18next: https://www.i18next.com/
- Dokumentacja Vite: https://vitejs.dev/
- Repozytorium (CI/CD): sprawdź `vercel.json` jeśli wdrażasz na Vercel.

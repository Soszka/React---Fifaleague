# Architektura UI dla eFutbol League

## 1. Przegląd struktury UI

- **Technologie i szkielet:** aplikacja kliencka powstała w React (Vite) z biblioteką komponentów MUI, globalnym themingiem oraz międzynarodowieniem i18next. Główna aplikacja otacza routing `BrowserRouter`, dostawcę uwierzytelnienia oraz przełączany motyw (`light`/`dark`).
- **Układ „app shell”:** widok chroniony `/app/*` renderowany jest przez komponent `Navigation`, który dostarcza stały AppBar z logotypem, przełącznikami języka/motywu/GitHuba i menu użytkownika oraz wysuwany Drawer z listą sekcji. Układ reaguje na szerokość ekranu (persistent drawer na desktopie, temporary na mobile), a główna zawartość jest renderowana w `Outlet`.
  Dostawcy kontekstów (`MatchesProvider`, `PendingMatchesProvider`, `MatchActivityProvider`) otaczają każdy widok wewnątrz shellu.
- **Stopka i scroll reset:** `Layout` zawijający routing przewija okno do góry przy zmianie ścieżki oraz pokazuje stopkę tylko dla zalogowanych widoków innych niż `/auth`. Stopka wyświetla tłumaczony tekst praw autorskich.
- **Autoryzacja:** `AuthProvider` nasłuchuje Firebase Auth (`onAuthStateChanged`) i wystawia metody logowania/wylogowania. Wszystkie trasy poza `/auth/*` są zabezpieczone przez `RequireAuth`, które w razie braku użytkownika przekierowuje do logowania.
- **Powiadomienia:** lokalny dostawca `NotificationProvider` (Snackbar + Alert) jest stosowany na ekranach wymagających feedbacku użytkownika (logowanie, mecze, kolejka). Dostarcza metodę `notify` z wariantami severity.
- **Ustawienia globalne:** inicjalizacja i18next z czterema zasobami językowymi (pl domyślny, en, es, de) oraz osadzenie `I18nextProvider` w korzeniu aplikacji.
- **Integracja Firebase:** projekt konfiguruje Firebase App, Auth i Realtime Database w `firebase.ts`, udostępniając helpery logowania, wylogowania i nasłuchiwania stanu. Wszystkie dane meczowe, aktywności i kolejka pending korzystają z RTDB.

## 2. Lista widoków

### 2.1 `/auth/*` – logowanie

- **Cel:** logowanie istniejących kont w oparciu o email/hasło Firebase, z opcją wstawienia danych testowych.
- **Kluczowe informacje:** formularz z walidacją (react-hook-form), przełączanie widoczności hasła, menu wyboru języka, dialog z listą użytkowników (poza adminem) do automatycznego wypełnienia danych, feedback przez Snackbar.
- **Integracja:** po pomyślnym `login` (Firebase Auth) następuje przekierowanie do `/app/home`; w przypadku błędu wyświetlany jest komunikat `notify`.

### 2.2 `/app/home`

- **Cel:** ekran powitalny i skróty do sekcji.
- **Elementy:** plansza ostatnich meczów (marquee z hooka `useLastMatches`), personalizowane kafelki ze statystykami gracza (`usePlayerStats`), oraz siatka kart linkujących do sekcji About/Matches/Table/Stats/Teams/Ranking. Ładowanie komponentów synchronizowane, aby animacje zadziałały po pobraniu danych i obrazów.
- **Dane:** wszystkie trzy hooki czytają RTDB: `useLastMatches` i `usePlayerStats` korzystają z `ref(rtdb)` z sortowaniem/paginacją po stronie klienta.

### 2.3 `/app/matches`

- **Cel:** przegląd, filtrowanie i zarządzanie wynikami meczów.
- **Widok:** osadzony w `NotificationProvider`; filtry (zakres dat, rywal, wynik, przełącznik „tylko moje”), widok desktopowy (`MatchTableDesktop`) i mobilny (`MatchListMobile`) z paginacją, sortowaniem oraz dialogami dodawania, edycji i usuwania meczu.
- **Logika danych:** stan meczów pochodzi z `MatchesContext`, który strumieniuje całą gałąź RTDB, normalizuje wpisy (obsługując strukturę legacy `matches/...` i rekordy w korzeniu) i udostępnia akcje `addMatch/updateMatch/removeMatch`. Tylko użytkownik Bartek (po normalizacji nazwy) wykonuje operacje bezpośrednio; pozostali składają żądania do kolejki `pendingMatchRequests` z wynikiem `"queued"`. Wszystkie zmiany zapisują snapshot w `/activityLogs` z informacją o aktorze.

### 2.4 `/app/pending`

- **Cel:** administracja kolejką zgłoszeń zmian meczów dla użytkowników bez uprawnień.
- **Widok:** zasilany `PendingMatchesProvider`, renderuje listę kart z typem operacji, aktorem, snapshotami przed/po, kontrolkami akceptacji/odrzucenia oraz paginacją. Przy próbie działania przez nieuprawnionego użytkownika przyciski są dezaktywowane i oznaczone tooltipem. Akcje wyświetlają powiadomienia sukcesu/błędu.
- **Logika:** provider synchronizuje `/pendingMatchRequests`, sprawdza uprawnienia admina (również Bartek) i wywołuje akcje z `MatchesContext`, przekazując `actorOverride`, aby log aktywności zachował autora zgłoszenia.

### 2.5 `/app/news`

- **Cel:** kanał aktywności pokazujący logi dodawania/edycji/usuwania meczów.
- **Widok:** paginowana lista kart stylizowanych według typu operacji (ikonografia, kolor), z datą zdarzenia i snapshotem drużyn oraz wyniku; obsługa skeletonów i pustych stanów.
- **Dane:** korzysta z `MatchActivityContext`, który streamuje `/activityLogs`, filtruje rekordy i sortuje malejąco po timestampie.

### 2.6 `/app/stats`

- **Cel:** analityka pojedynczego gracza.
- **Widok:** selektor gracza (domyślnie zalogowany), zakładki (`Tabs`) z podsumowaniami, listy partnerów i wykresy `ReactApexChart` (wykresy słupkowe/pie) dla wyników, bilansów partnerów, rozkładu zwycięstw itd.; skeletony podczas ładowania danych.
- **Dane:** korzysta z `useAllMatches`, aby mieć pełen zbiór meczów z RTDB, następnie agreguje statystyki klient-side (wyniki, punkty, partnerzy).

### 2.7 `/app/table`

- **Cel:** tabela drużyn 2-osobowych z filtrowaniem i sortowaniem.
- **Widok:** renderuje tabelę z kolumnami mecze/zwycięstwa/punkty/PPM, sortowalnymi nagłówkami, paginacją i filtrami (zakres meczów, punktów, PPM). Dla mniejszych ekranów używa dialogu filtrów. Dane są obliczane na podstawie `useAllMatches` (normalizacja par graczy, liczenie punktów i różnicy bramek).

### 2.8 `/app/ranking`

- **Cel:** ranking indywidualny graczy.
- **Widok:** tabela z kolumnami pozycji, meczów, wygranych/przegranych/remisów, punktów i PPM, z filtrami zakresów oraz możliwością sortowania i paginacji; wspiera tryb mobilny z dialogiem filtrów.
- **Dane:** budowane lokalnie z `useAllMatches` (rozbijanie wyników na pojedynczych graczy).

### 2.9 `/app/teams`

- **Cel:** eksploracja duetów i ich statystyk.
- **Widok:** selektor drużyny, akordeony z szczegółami, oraz wykresy `ReactApexChart` (bar i pie) przedstawiające punkty, procent zwycięstw, bilans bramkowy; responsywne układy kart i akordeonów. Dane z `useAllMatches` są agregowane na poziomie komponentu.

### 2.10 `/app/about`

- **Cel:** FAQ o lidze/aplikacji.
- **Widok:** lista rozbudowanych akordeonów z tłumaczonymi pytaniami i odpowiedziami (pobieranymi z plików i18n przez `returnObjects: true`).

> Pozostałe trasy (`/app/home`, `/app/matches`, `/app/news`, `/app/stats`, `/app/table`, `/app/teams`, `/app/ranking`, `/app/about`) są dostępne z głównego menu bocznego. Nie ma osobnych widoków importu/ustawień w aktualnym repozytorium.

## 3. Mapa podróży użytkownika

1. **Logowanie:** użytkownik trafia na `/auth`, wybiera język, loguje się (lub wstawia dane testowe) i zostaje przekierowany do `/app/home`.
2. **Przegląd startowy:** na stronie głównej widzi personalizowane statystyki i linki do kluczowych sekcji, może przejść do tabeli, rankingów lub meczów jednym kliknięciem.
3. **Eksploracja danych:** korzystając z menu w Drawerze, odwiedza sekcje takie jak `Matches`, `Stats`, `Ranking` czy `Teams`. Widoki używają tych samych danych RTDB (hooki `useAllMatches` / `useMatches`), więc zmiany są natychmiast widoczne w całej aplikacji.
4. **Dodawanie/edycja meczów:** użytkownik Bartek może bezpośrednio zapisać wynik; inni widzą dialog potwierdzający, ale operacja trafia do kolejki i wymaga akceptacji admina. Akcje publikują log w `/activityLogs`, co od razu pojawia się w sekcji News.
5. **Moderacja (Bartek):** admin otwiera `/app/pending`, gdzie akceptuje lub odrzuca zgłoszenia z odpowiednim feedbackiem. Po zatwierdzeniu dane są synchronizowane w `MatchesContext`, a log aktywności zachowuje oryginalnego autora.

## 4. Nawigacja i nagłówek

- **Menu boczne:** stałe pozycje (`Home`, `About`, `Matches`, `Pending`, `News`, `Stats`, `Table`, `Teams`, `Ranking`) z ikonami MUI i zaznaczeniem aktywnej trasy. Drawer przełącza się między trybem tymczasowym a persistent w zależności od breakpointu, a jego stan może być odczytywany przez widoki (np. do dostosowania breakpointów paginacji).
- **AppBar:** zawiera przycisk rozwijający menu, logotyp, aktualną sekcję (tłumaczoną) oraz `NavigationActions` (menu językowe, przełącznik motywu, link do repozytorium GitHub i wylogowanie).
- **Routing:** `/` przekierowuje na `/auth`, a dowolna nieznana ścieżka wraca do korzenia. Widoki są zagnieżdżone w `/app/*` i używają `Outlet`.

## 5. Kluczowe komponenty, hooki i konteksty

- **`MatchesContext`** – jedyne źródło prawdy o meczach; obsługuje normalizację danych, kolejkę pending, logowanie aktywności, przywileje admina i optimistyczne aktualizacje wraz z rollbackiem błędów.
- **`PendingMatchesContext`** – zarządza kolejką `/pendingMatchRequests`, pilnuje, że tylko Bartek może zatwierdzać, i deleguje do `MatchesContext` z nadpisaniem aktora dla logów.
- **`MatchActivityContext`** – subskrybuje `/activityLogs`, mapuje strukturę payloadu na przyjazne UI wpisy i sortuje chronologicznie.
- **Hooki odczytujące RTDB:** `useAllMatches`, `useLastMatches`, `usePlayerStats` – każdy normalizuje dane z RTDB (uwzględniając możliwe zagnieżdżenia) i udostępnia gotowe struktury do UI.
- **`NotificationProvider`** – jednolity mechanizm powiadomień (Snackbar) z ikonami sukces/błąd/info, stosowany na widokach wymagających komunikatów po akcji.
- **Stałe graczy (`PLAYER_LABELS`)** – służą do normalizacji identyfikatorów, określenia kont testowych oraz rozpoznania admina (Bartek).

## 6. Integracja z Firebase Realtime Database

- **Konfiguracja:** RTDB udostępnia cztery kluczowe gałęzie: wpisy meczów (zarówno w korzeniu, jak i w `/matches`), logi aktywności (`/activityLogs`), kolejkę pending (`/pendingMatchRequests`) oraz wszystkie dane statystyczne wykorzystywane przez hooki. Wszystkie konteksty korzystają z `onValue` do otrzymywania natychmiastowych aktualizacji.
- **Operacje zapisu:**
  - `addMatch`/`updateMatch`/`removeMatch` używają `push`, `set`, `remove` bezpośrednio na identyfikatorach meczów; w razie błędu cofają optymistyczne zmiany i ustawiają stan błędu.
  - `queuePendingRequest` zapisuje zgłoszenia z timestampem i danymi aktora dla użytkowników bez praw.
  - `logActivity` zapisuje snapshot meczu wraz z aktorem, co buduje audyt dla sekcji News.
- **Autoryzacja:** identyfikacja admina (Bartek) odbywa się w UI na podstawie adresu email (część przed `@`) znormalizowanej przez `normalizePlayerId`; backendowa ochrona opiera się na tym, że tylko Bartek ma możliwość bezpośrednich zapisów, reszta przechodzi przez kolejkę moderacyjną.

## 7. Dostępność i responsywność

- Komponenty MUI zapewniają focus management oraz kontrasty; przełączniki i przyciski posiadają etykiety `aria` (np. przełącznik hasła, karty highlightów). Widoki tabelaryczne udostępniają alternatywne layouty mobilne (`MatchListMobile`, tryb kart w Pending/News). Breakpointy `useMediaQuery` i adaptacyjne Drawer/wykresy zapewniają poprawne renderowanie na mniejszych ekranach.

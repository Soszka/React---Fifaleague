# Plan implementacji modułu eFutbol League

## 1. Przegląd

Aplikacja eFutbol League to panel ligowy budowany w React + Vite z Material UI, który korzysta z Firebase Authentication i Realtime Database. Rdzeń funkcjonalności obejmuje:

- logowanie graczy przez dedykowany formularz powiązany z kontami w Firebase,
- nawigację chronioną strażnikiem `RequireAuth`, która udostępnia widoki statystyk, tabeli, meczów i zarządzania zgłoszeniami,
- warstwę kontekstów opartą na Firebase RTDB (`MatchesProvider`, `PendingMatchesProvider`, `MatchActivityProvider`), które dostarczają dane w czasie rzeczywistym oraz akcje CRUD/akceptacji wniosków,
- obsługę powiadomień snackbarowych i wielojęzyczność poprzez `react-i18next`.

## 2. Routing i ochrona tras

- **Główne ścieżki** zarządzane w `AppRoutes`: `/auth/*` (publiczne) oraz `/app/*` (chronione). Korzeń `/` przekierowuje na `/auth`.
- **Strażnik** `RequireAuth` renderuje tylko użytkownikom z aktywną sesją Firebase; niezalogowani są kierowani do logowania.
- **Nawigacja wewnętrzna** `/app/*` osadza komponent `Navigation`, który zarządza drawerem i nagłówkiem oraz renderuje dzieci przez `<Outlet/>` (np. `home`, `matches`, `pending`).

## 3. Warstwa kontekstów i zależności

- `AuthProvider` kapsułkuje Firebase Auth (`listenAuth`, `login`, `logout`), aktualizując stan użytkownika i ekspozycję pomocniczych funkcji do logowania/wylogowania.
- `NotificationProvider` dostarcza prostą kolejkę Snackbarów (`notify`) z ikonami zależnymi od wagi komunikatu.
- `MatchesProvider` podłącza się do całego RTDB (`ref(rtdb)`), normalizuje strukturę rekordów meczów i udostępnia CRUD wraz z logowaniem aktywności do `/activityLogs`. Akcje nie-adminów (wszyscy poza graczem „Bartek”) są kolejkowane jako żądania pending.
- `PendingMatchesProvider` czyta `/pendingMatchRequests`, pozwala tylko adminowi (porównanie `normalizePlayerId` z „Bartek”) akceptować/odrzucać zgłoszenia; zaakceptowanie wywołuje odpowiednią akcję `MatchesProvider` i po sukcesie usuwa rekord z RTDB.
- `MatchActivityProvider` nasłuchuje `/activityLogs`, mapuje wpisy na log aktywności (typ operacji, aktor, snapshot meczu) i sortuje malejąco względem czasu.

## 4. Integracja Firebase

- Konfiguracja Firebase (klucze, RTDB URL) znajduje się w `firebase.ts`; eksportuje `app`, `auth`, `rtdb` oraz pomocnicze `login`, `logout`, `listenAuth` opakowujące SDK.
- RTDB przechowuje:
  - korzeń `matches` (oraz alternatywne wpisy na poziomie korzenia) – źródło list meczów，
  - `activityLogs` – historia operacji zapisów,
  - `pendingMatchRequests` – kolejka żądań graczy bez uprawnień.
- Akcje `addMatch`/`updateMatch`/`removeMatch` wykonują transakcje RTDB (`push`, `set`, `remove`) i w przypadku niepowodzenia przywracają stan lokalny oraz zapisują błąd w reducerze.
- `PendingMatchesProvider` usuwa rekordy pending przez `remove(ref(rtdb, ...))` po akceptacji/odrzuceniu.

## 5. Struktura głównych ekranów

### 5.1. Logowanie (`/auth`)

- Formularz oparty na `react-hook-form` z walidacją email/hasła oraz możliwością automatycznego wstawienia danych gracza z listy `PLAYER_LABELS` (poza adminem).
- Obsługa wielu języków, przełącznika języka (`react-i18next`) i powiadomień (`NotificationProvider`). Po udanym logowaniu przekierowuje do `/app/home`.

### 5.2. Nawigacja (`/app/*`)

- Górny pasek MUI `AppBar` z burgerem, logo, dynamicznym tytułem i akcjami (`NavigationActions` zawiera przełącznik motywu i menu użytkownika). Drawer renderuje listę sekcji przetłumaczonych kluczy i podświetla aktywną trasę.
- Wrapper `Navigation` opakowuje dzieci w `MatchesProvider`, `PendingMatchesProvider` i `MatchActivityProvider`, udostępniając dane w całej części aplikacji (widoczne w JSX w dolnej części pliku).

### 5.3. Widok meczów (`/app/matches`)

- Korzysta z `useMatches` oraz `useAuth` do budowy listy meczów filtrowanej pod aktualnego gracza (domyślnie pokazuje drużyny z udziałem użytkownika, można przełączyć „show all”).
- Dostępne filtry: rywal, wynik (`ResultOption`), zakres dat (`Dayjs`), sortowanie kolumn (stan `order`/`orderBy`), paginacja. Widok przełącza się między tabelą desktop (`MatchTableDesktop`) i listą mobilną (`MatchListMobile`).
- Akcje CRUD otwierają dedykowane dialogi (`AddMatchDialog`, `EditMatchDialog`, `RemoveMatchDialog`); w zależności od uprawnień `MatchesContext` decyduje o natychmiastowym wykonaniu lub zakolejkowaniu w pending.

### 5.4. Zarządzanie zgłoszeniami (`/app/pending`)

- Zasilane przez `PendingMatchesProvider`; prezentuje listę wniosków (create/update/delete) z danymi aktora i snapshotem meczu. Tylko admin może zatwierdzać/odrzucać – w przeciwnym razie funkcje rzucają wyjątek „Only Bartek can manage pending matches”.

### 5.5. Historia aktywności

- `MatchActivityProvider` udostępnia listę logów do komponentów UI (np. timeline w sekcjach statystyk). Każdy wpis zawiera typ operacji, aktora oraz snapshot z normalizacją `date` → timestamp.

## 6. Typy i utilsy

- Typy wspólne (`Match`, `MatchActivityPayload`, `PendingMatchRequest`) żyją w `src/common/types`. Normalizacja nazw graczy (`stripDiacritics`, `restoreDiacritics`) oraz dat (`normalizeDateValue`) zapewnia spójność danych z RTDB.
- Komponenty korzystają z `ResultOption`/`FilterResultOption` z modułu meczowego do mapowania wyników i filtrów.

## 7. Zarządzanie stanem i błędami

- `MatchesContext` używa reduktora do utrzymania `matches`, `loading`, `error`; każdy błąd API zapisuje się w stanie i przywraca poprzednie dane lokalnie. Pending operacje zwracają `"queued"`, co pozwala UI prezentować oczekujący status.
- `PendingMatchesContext` i `MatchActivityContext` trzymają lokalne stany (`useState`) i ustawiają błędy na podstawie callbacków `onValue`.
- Powiadomienia o błędach i sukcesach wyświetlane są przez `NotificationContext` (np. w logowaniu).

## 8. Theming i i18n

- Motyw Material UI generowany przez `getTheme` i przełączany z poziomu `NavigationActions`; `Auth` wymusza jasny motyw (`ThemeProvider`).
- Translacje z `react-i18next`; pliki językowe w `src/locales`, inicjalizacja w `src/i18n.ts`. Wszystkie klucze w nawigacji i formularzach korzystają z hooka `useTranslation`.

## 9. Telemetria i testy

- Repozytorium nie definiuje skryptów testowych ani telemetryjnych – `package.json` zawiera jedynie polecenia `dev`, `build`, `lint` i `preview`.

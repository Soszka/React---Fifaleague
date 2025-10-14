## Cel i zakres projektu

- Aplikacja to panel ligowy dla społeczności eFutbol League, obejmujący moduły: strona główna, informacje o lidze, mecze, zgłoszenia oczekujące, aktualności, statystyki, tabela, zespoły oraz ranking, dostępne z poziomu bocznej nawigacji po zalogowaniu.
- Strona główna prezentuje personalizowane powitanie, bieżące statystyki oraz karty prowadzące do kluczowych sekcji aplikacji, dzięki czemu pełni rolę dashboardu startowego.
- Widok statystyk analizuje dane meczowe i renderuje wskaźniki oraz wykresy, pozwalając śledzić formę zawodników i par zespołów.
- Panel logowania wykorzystuje formularz z walidacją, selektorem języka oraz generatorem poświadczeń dla graczy, a dostęp do części chronionej jest zabezpieczony strażnikiem routingu.

## Frontend

### Framework, język i bundler

- Projekt korzysta z React 19, TypeScriptu i Vite; skrypty npm obejmują uruchamianie serwera deweloperskiego, build oraz linting.
- Nawigacja oparta jest o React Router z dedykowaną konfiguracją tras oraz osadzeniem układu aplikacji w komponencie `Navigation` po zalogowaniu.

### UI i warstwa prezentacji

- Material UI odpowiada za komponenty i system tematyczny, a przełączanie między motywem jasnym i ciemnym odbywa się centralnie w `App` dzięki `ThemeProvider` i własnej konfiguracji motywu.
- Biblioteka Emotion (zależności `@emotion/react` i `@emotion/styled`) współpracuje z MUI, a warstwa styli uzupełniona jest przez modułowe pliki SCSS i globalne style ładowane przy starcie aplikacji.
- Animacje oraz miękkie przejścia zapewnia Framer Motion używany m.in. na stronie głównej i w tabeli wyników, a komponenty dat bazują na `@mui/x-date-pickers` i `dayjs` w widokach meczów i zgłoszeń.

### Formularze, UX i lokalizacja

- Formularz logowania zbudowany jest na React Hook Form z walidacją pól oraz przyciskiem odsłaniania hasła.
- System powiadomień opiera się na kontekście `NotificationProvider`, który wyświetla komunikaty MUI `Snackbar` i `Alert` w reakcji na zdarzenia użytkownika.
- Lokalizacja realizowana jest przez i18next z czterema pakietami językowymi (pl, en, es, de) i przełącznikiem języka na ekranie logowania.
- Wizualizacje statystyk generowane są przy użyciu React ApexCharts, a dane gracza dobierane dynamicznie na podstawie dostępnych etykiet zawodników.

## Logika biznesowa i warstwa danych

- Firebase zapewnia uwierzytelnianie (Email/Password) oraz Realtime Database; konfiguracja i pomocnicze funkcje logowania zostały zebrane w module `firebase.ts`.
- Kontekst `AuthProvider` nasłuchuje zmian stanu logowania w Firebase, udostępnia metody `login`/`logout` i sygnalizuje stan ładowania komponentom potomnym.
- Dostęp do tras aplikacji chronionych wymusza obecność użytkownika poprzez komponent `RequireAuth` w konfiguracji routera.
- `MatchesProvider` synchronizuje listę meczów z Realtime Database, obsługuje dodawanie, aktualizacje, usuwanie oraz loguje aktywność, jednocześnie kolejkając żądania od zwykłych graczy jako zgłoszenia oczekujące.
- `PendingMatchesProvider` pobiera i sortuje zgłoszenia z kolejki, rozróżnia uprawnienia administratora („Bartek”) i pozwala na akceptację lub odrzucenie żądań, współpracując z `MatchesProvider`.
- Hook `useAllMatches` udostępnia zunifikowane dane meczowe na potrzeby tabeli, rankingów i wykresów, normalizując strukturę wpisów z bazy.

## Kluczowe moduły funkcjonalne

- `Navigation` zarządza layoutem aplikacji po zalogowaniu, łącząc pasek aplikacji, szufladę z modułami oraz osadzając konteksty meczów, zgłoszeń i dziennika aktywności dla widoków potomnych.
- Widok `Matches` (z dialogami dodawania/edycji) wykorzystuje komponenty MUI Date Picker oraz `dayjs` do filtrowania meczów po zakresie dat.
- Strona `Pending` prezentuje zgłoszenia zmian meczów z możliwością akceptacji i odrzucania oraz filtrami liczby rekordów na stronę.
- Widok `Table` buduje klasyfikację zespołów z wyników meczów, umożliwiając sortowanie, filtrowanie i paginację w oparciu o dane `useAllMatches`.

## Narzędzia developerskie i procesy

- Skrypty npm obejmują `npm run dev`, `npm run build`, `npm run preview` oraz `npm run lint`; repozytorium nie zawiera skonfigurowanego skryptu testów automatycznych.
- Lintowanie realizowane jest przez ESLint z zestawem wtyczek dla Reacta i TypeScriptu, obecnych w zależnościach deweloperskich.
- Konfiguracja `vercel.json` zapewnia przepisywanie ścieżek na `index.html`, co umożliwia hosting SPA na Vercelu z poprawną obsługą routingu po stronie klienta.

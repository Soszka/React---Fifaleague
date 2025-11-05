## Cel i zakres projektu

- Aplikacja to panel ligowy dla społeczności eFutbol League, obejmujący moduły: strona główna, informacje o lidze, mecze, zgłoszenia oczekujące, aktualności, statystyki, tabela, zespoły oraz ranking, dostępne z poziomu bocznej nawigacji po zalogowaniu.
- Strona główna prezentuje personalizowane powitanie, bieżące statystyki oraz karty prowadzące do kluczowych sekcji aplikacji, dzięki czemu pełni rolę dashboardu startowego.
- Widok statystyk analizuje dane meczowe i renderuje wskaźniki oraz wykresy, pozwalając śledzić formę zawodników i par zespołów.
- Panel logowania wykorzystuje formularz z walidacją, selektorem języka oraz generatorem poświadczeń dla graczy, a dostęp do części chronionej jest zabezpieczony strażnikiem routingu.

## Frontend

### Framework, język i bundler

- Projekt korzysta z React 19, TypeScriptu i Vite; skrypty npm obejmują uruchamianie serwera deweloperskiego, build oraz linting.
- Nawigacja wykorzystuje router reagujący na stan zalogowania użytkownika, udostępniający publiczne i prywatne widoki w ramach jednego układu.

### UI i warstwa prezentacji

- Material UI zapewnia bibliotekę komponentów oraz mechanizmy budowania motywów, co umożliwia łatwe przełączanie trybów kolorystycznych.
- Stylowanie łączy możliwości Emotion i modułowych arkuszy stylów, co daje elastyczność przy tworzeniu widoków oraz zarządzaniu stylami globalnymi.
- Animacje i mikrointerakcje realizuje Framer Motion, a obsługa kalendarzy i dat opiera się na pakietach towarzyszących ekosystemowi MUI.

### Formularze, UX i lokalizacja

- Formularze zarządzane są przez React Hook Form z walidacją pól oraz udogodnieniami poprawiającymi ergonomię (np. odsłanianie hasła).
- System powiadomień bazuje na kontekście globalnym, który wyświetla komunikaty w oparciu o komponenty Material UI.
- Lokalizacja wykorzystuje i18next z kilkoma pakietami językowymi (pl, en, es, de) i przełącznikiem języka dostępnym na etapie logowania.
- Wizualizacje statystyk tworzone są przy pomocy React ApexCharts, integrujących się z danymi meczowymi pozyskiwanymi na żywo.

## Logika biznesowa i warstwa danych

- Firebase dostarcza mechanizmy uwierzytelniania (Email/Password) oraz Realtime Database, a konfiguracja projektu dzieli odpowiedzialności na osobne moduły pomocnicze.
- Globalny kontekst autoryzacji nasłuchuje zmian w stanie logowania, udostępnia metody wejścia/wyjścia oraz informuje komponenty o stanie ładowania.
- Ochrona tras prywatnych wykorzystuje warstwę sprawdzającą obecność zalogowanego użytkownika przed renderowaniem docelowego widoku.
- Konteksty odpowiedzialne za mecze oraz zgłoszenia synchronizują się z Realtime Database, obsługują operacje CRUD i kolejkują propozycje zmian od graczy.
- Mechanizm kolejkowania rozróżnia uprawnienia administracyjne i udostępnia akcje zatwierdzania lub odrzucania zgłoszeń.
- Dedykowane hooki agregują i normalizują dane meczowe na potrzeby tabel, rankingów oraz wykresów analitycznych.

## Kluczowe moduły funkcjonalne

- Layout po zalogowaniu łączy nawigację boczną, pasek górny oraz wspólne konteksty danych, które udostępniają informacje widokom potomnym.
- Widok meczów umożliwia filtrowanie po zakresie dat, przegląd wyników oraz obsługę formularzy dodawania i edycji.
- Sekcja zgłoszeń prezentuje propozycje aktualizacji wyników wraz z filtrami liczby rekordów oraz akcjami akceptacji i odrzucania.
- Widok tabeli ligowej buduje klasyfikację na podstawie danych z meczów, udostępniając sortowanie, filtrowanie i paginację.

## Narzędzia developerskie i procesy

- Skrypty npm obejmują `npm run dev`, `npm run build`, `npm run preview` oraz `npm run lint`; repozytorium nie zawiera skonfigurowanego skryptu testów automatycznych.
- Lintowanie realizowane jest przez ESLint z zestawem wtyczek dla Reacta i TypeScriptu, obecnych w zależnościach deweloperskich.
- Konfiguracja `vercel.json` zapewnia przepisywanie ścieżek na `index.html`, co umożliwia hosting SPA na Vercelu z poprawną obsługą routingu po stronie klienta.

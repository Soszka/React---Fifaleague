# Firebase Realtime Database – plan aplikacji

## 0) Integracja z Firebase

- Aplikacja inicjalizuje projekt `fifa-league-5faa1` i używa modułów Auth oraz Realtime Database (`getAuth`, `getDatabase`).
- Logowanie odbywa się przez `signInWithEmailAndPassword`, a wylogowanie przez `signOut`; stan sesji śledzi `onAuthStateChanged` owinięty w kontekst `AuthContext`.
- Wszystkie odczyty i zapisy wykonywane są na jednej instancji RTDB (`rtdb`).

## 1) Ścieżki i kształty obiektów

### `/{matchId}` – wpis meczu (płaski wariant)

- **Opis:** Domyślny sposób zapisu nowych spotkań. Każdy mecz trafia bezpośrednio w korzeń bazy pod kluczem wygenerowanym przez `push()`.
- **Przykład:**
  ```json
  {
    "player1": "Bartek",
    "player2": "Adam",
    "rival1": "Michał",
    "rival2": "Łukasz",
    "result": "5-3",
    "date": 1713811200000
  }
  ```
- **Pola:** `player1`, `player2`, `rival1`, `rival2`, `result` (string); `date` (number/timestamp).

### `/matches/{matchId}` – wpis meczu (wariant zagnieżdżony)

- **Opis:** Koder nadal obsługuje historyczną strukturę z węzłem `matches`. Odczyty scalają dane z korzenia i z tego poddrzewa.
- **Przykład:** identyczny jak powyżej, ale przechowywany pod ścieżką `/matches/{matchId}`.

### `/activityLogs/{logId}` – dziennik zmian meczów

- **Opis:** Każda operacja administratora na meczu zapisuje zdarzenie audytowe.
- **Przykład:**
  ```json
  {
    "matchId": "-Nxyz...",
    "type": "update",
    "timestamp": 1713897600000,
    "actor": {
      "id": "bartek",
      "displayName": "Bartek"
    },
    "matchSnapshot": {
      "id": "-Nxyz...",
      "player1": "Bartek",
      "player2": "Adam",
      "rival1": "Michał",
      "rival2": "Łukasz",
      "result": "5-3",
      "date": 1713811200000
    }
  }
  ```
- **Pola:** `matchId` (string), `type` (`"create" | "update" | "delete"`), `timestamp` (number), `actor.id`, `actor.displayName` (string), `matchSnapshot` (pełna kopia meczu z polem `id`).

### `/pendingMatchRequests/{requestId}` – kolejka próśb od zwykłych użytkowników

- **Opis:** Użytkownicy bez uprawnień administratora zgłaszają zmiany; Bartek (admin) zatwierdza lub odrzuca rekordy.
- **Przykład:**
  ```json
  {
    "actor": {
      "id": "u123",
      "displayName": "Adam"
    },
    "timestamp": 1713880000000,
    "payload": {
      "type": "update",
      "matchId": "-Nxyz...",
      "match": {
        "player1": "Bartek",
        "player2": "Adam",
        "rival1": "Michał",
        "rival2": "Łukasz",
        "result": "4-4",
        "date": 1713811200000
      },
      "previousMatch": {
        "player1": "Bartek",
        "player2": "Adam",
        "rival1": "Michał",
        "rival2": "Łukasz",
        "result": "5-3",
        "date": 1713811200000
      }
    }
  }
  ```
- **Pola:** `actor.id`, `actor.displayName` (string); `timestamp` (number); `payload.type` (`create|update|delete`); `payload.match` (jak wpis meczu); `payload.matchId` / `payload.previousMatch` zależnie od typu.

## 2) Relacje i przepływy

- Wpis meczu może występować w korzeniu lub pod `/matches`; kod kliencki scala oba źródła przy odczycie i sortuje dane po polu `date`.
- Każdy log z `/activityLogs` przechowuje `matchId` oraz snapshot meczu w chwili operacji, co umożliwia audyt niezależnie od późniejszych zmian.
- Rekordy z `/pendingMatchRequests` wskazują, jaka operacja ma zostać wykonana (`matchId` + docelowy stan) i kto ją zgłosił; po akceptacji admin usuwa wpis z kolejki i wykonuje odpowiednie CRUD na meczach.
- Uprawnienia administracyjne determinowane są lokalnie po stronie klienta (porównanie nazwy użytkownika do „Bartek”).

## 3) Operacje klienckie

- Lista meczów: `onValue(ref(rtdb))` i agregacja danych z korzenia + `matches`.
- Dodawanie / edycja / usuwanie meczu:
  - administrator: `push(ref(rtdb, "/"))`, `set(ref(rtdb, "/{matchId}"))`, `remove(ref(rtdb, "/{matchId}"))` oraz log do `/activityLogs`.
  - zwykły użytkownik: zapis w `/pendingMatchRequests` zamiast natychmiastowego CRUD.
- Kolejka pending: `onValue(ref(rtdb, "/pendingMatchRequests"))`, zatwierdzanie usuwa wpis i deleguje operację do metod kontekstu meczów.
- Dziennik aktywności: `onValue(ref(rtdb, "/activityLogs"))` z mapowaniem danych do listy.
- Statystyki gracza: `query(ref(rtdb, dbPath), orderByChild("date"))`, filtracja po uczestniku i analiza wyników.

## 4) Indeksy i reguły bezpieczeństwa

- Repozytorium nie zawiera plików z regułami RTDB ani deklaracji `.indexOn`; brak danych o konfiguracji serwera.

## 5) Przykładowe zapytania i operacje

- Odczyt wszystkich meczów: `onValue(ref(rtdb), ...)`.
- Log audytowy: `push(ref(rtdb, "/activityLogs"))` + `set(...)`.
- Kolejka zmian: `push(ref(rtdb, "/pendingMatchRequests"))` + `set(...)`.
- Aktualizacja meczu: `set(ref(rtdb, "/{matchId}"), payload)`.
- Usunięcie meczu: `remove(ref(rtdb, "/{matchId}"))`.
- Statystyki: `query(ref(rtdb, path), orderByChild("date"))`.

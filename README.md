# WellGym — Web PWA (Vite + React + Tailwind + Supabase)

Progetto scaffold per una web-app mobile-first chiamata WellGym.

Prerequisiti
- Node >=16

Setup (PowerShell):

```powershell
cd c:\A5
npm install
```

Env vars (create a `.env` file or set env when running):

- `VITE_SUPABASE_URL` — your Supabase URL
- `VITE_SUPABASE_ANON_KEY` — anon public key

Run dev server:

```powershell
npm run dev
```

Note rapide
- Il progetto include pagine: `Login`, `Register`, `Home`, `Workout`, `Progress`, `Profile`.
- Per salvare dati è necessario creare una tabella `workouts` in Supabase con colonne: `id, user_id, exercise, duration, reps, performed_at`.
- È presente un `manifest.json` e un `service-worker.js` minimale per PWA.


# Assignment A5 – Prototipo High-Fidelity e Test di Usabilità

Questo repository contiene il lavoro relativo all’Assignment A5, che prevede lo sviluppo di un **prototipo interattivo ad alta fedeltà (hi-fi)** realizzato tramite codice, seguito dalla conduzione di un **test di usabilità** con utenti appartenenti al target previsto.

---

## 🧩 Obiettivi dell’Assignment

1. **Sviluppare un prototipo interattivo ad alta fedeltà**, basato sulle schermate del prototipo a media fedeltà (A4).
2. **Condurre un test di usabilità** con almeno un partecipante per membro del gruppo.
3. Documentare:
   - implementazione del prototipo,
   - protocollo di test,
   - raccolta dati,
   - risultati del test,
   - potenziali modifiche future.

---

# 1. Prototipo High-Fidelity (Hi-Fi)

## 🎨 Descrizione generale

Il prototipo è stato sviluppato partendo dal mid-fi costruito precedentemente, e ha l’obiettivo di *simulare l’aspetto e il comportamento di un’applicazione reale*.  
La fedeltà grafica e interattiva è prioritaria: le funzionalità di back-end non sono necessarie, tranne per la gestione dei dati rilevanti, che devono essere **persistenti** (in locale o tramite un semplice storage basato su file/database leggero).

### 🔧 Tecnologie utilizzate
- **HTML / CSS / JavaScript**
- **Framework front-end**: [specificare, es. React, Vue, Svelte]
- **Persistenza dati**: [LocalStorage / JSON server / Firebase / altro]
- **UI components**: [Bootstrap / Tailwind / Material / personalizzati]

### 📱 Funzionalità incluse
Il prototipo permette di completare **tutti e tre i task** definiti negli assignment precedenti.  
Le funzionalità non essenziali sono simulate.


### 📁 Struttura del codice


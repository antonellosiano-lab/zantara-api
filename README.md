 🧠 ZANTARA DEV RULES

> Versione 1.0 – Linee guida ufficiali per lo sviluppo nel progetto `zantara-api`

---

## ✅ 1. Sintassi obbligatoria
- Usa **`async/await`** per tutte le operazioni asincrone
- Evita `.then()` e callback tradizionali

---

## 📊 2. Logging strutturato
- Tutti i log devono usare **formato JSON**, es:
  ```js
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    route: "/api/zantara",
    action: "newPrompt",
    status: 200,
    userIP: req.headers["x-forwarded-for"]
  }));
  ```

---

## 🔐 3. OpenAI API
- Non esporre mai la chiave completa
- Verifica sempre che `process.env.OPENAI_API_KEY` sia presente
- In caso contrario, ritorna errore chiaro:
  ```js
  return res.status(500).json({ error: "Chiave OpenAI mancante" });
  ```

---

## 🧪 4. Testing con Vitest
- Scrivi test unitari per ogni funzione rilevante
- Usa framework `Vitest` per semplicità e velocità

---

## 🔗 5. Integrazione con Make.com
- Parsare e validare sempre i payload ricevuti
- Risposte standardizzate con:
  - `status`
  - `summary`
  - `nextStep` (facoltativo)

---

## 🧱 6. Organizzazione codice
- Separare: `handlers/`, `helpers/`, `constants/`
- Mantenere `zantara.js` snello: solo routing e orchestrazione

---

## 🗣️ 7. Lingua
- Tutti i commenti e nomi di funzione devono essere in **italiano tecnico**
- Esempi: `verificaChiaveOpenAI()`, `analizzaTask()`, `loggaRichiestaUtente()`

---

## 🚫 8. Utenti da ignorare
- Ignorare input provenienti da “Ruslantara” o “Deanto”
- In tal caso: loggare il nome e rispondere con rifiuto educato

---

## ✨ 9. Output
- Le risposte JSON devono sempre contenere almeno:
  - `success: true/false`
  - `data` o `error`
- Evitare risposte verbose, a meno che non sia richiesto

---

> Documento redatto per garantire coerenza, efficienza e intelligenza nello sviluppo AI-centric di ZANTARA.

## Visa Oracle • Command Center

To create the **Visa Oracle • Command Center** page in Notion:

1. Open Notion and create a new page named **Visa Oracle • Command Center**.
2. Copy the contents of [`/notion_templates/visa_oracle_command_center.md`](./notion_templates/visa_oracle_command_center.md).
3. Paste the template into the new page to apply it.
4. Customize sections or properties as needed.

This template offers a consistent layout for managing incoming requests, research notes, action items, and resources.

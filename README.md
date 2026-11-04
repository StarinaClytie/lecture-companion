# Lecture Companion

A local classroom companion that helps you **follow live captions, ask quick questions, and keep your lecture notes** without losing track of the speaker.

This is the first MVP. It runs on your computer, opens in your browser, and uses your own API key for AI features. No account with this project is required.

## Main features

- **Record a lecture:** microphone input meter, pause/resume, end-session controls, and an optional audio download.
- **Follow live captions:** browser speech recognition with a choice of lecture language.
- **Ask about the whole lecture:** with nothing selected, type a question such as “What do M and N represent?” The AI receives all finalized captions from the current session, including earlier definitions.
- **Explain selected passages:** click multiple captions, Shift-click a range, or highlight an unfamiliar term. Add an optional question or request a brief explanation directly.
- **Continue the conversation:** ask follow-up questions while captions continue.
- **Read in your preferred language:** choose your native language independently of the lecture language; display original, translated, or bilingual captions.
- **Adjust readability:** English/Chinese interface, 14–22 px reading text, and an adjustable caption-spacing slider with a live preview.
- **Keep text history:** captions, bookmarks, explanations, and follow-up questions save automatically in the current browser. Open History to review or download previous notes.
- **Start fresh:** every page load begins an empty session. Add New Session keeps earlier text in History.
- **Create a macOS desktop icon:** launch the local services and open the website without a Terminal window during normal use.

The tutor is prompted to answer directly, normally in no more than three short sentences, with a small example only when useful. It avoids unsolicited tables and diagrams and should say when the transcript does not define a term. AI answers can still be incorrect.

## Requirements

- **Node.js 22.9 or later**, including npm. Install it from [nodejs.org](https://nodejs.org/).
- A browser with microphone access. Live speech recognition depends on the browser and its speech service; it is not available in every browser. If captions are unavailable, audio recording can still work.
- An internet connection for browser speech services and live AI features.
- Your own OpenAI API key and available API credits for live explanations, custom questions, and AI translations. A key is **not** included.

Basic local development works on macOS, Windows, and Linux. The desktop-app creator currently supports **macOS only**. Automated checks and clean-folder installation have been run on macOS; Windows/Linux and microphone hardware behavior have not been independently verified in this release.

## Install and run locally

### 1. Download the project

Clone this repository:

```sh
git clone https://github.com/StarinaClytie/lecture-companion.git
cd lecture-companion
```

Alternatively, choose **Code → Download ZIP** on GitHub, extract the archive, and open a terminal in the extracted folder.

### 2. Install dependencies

```sh
npm ci
```

### 3. Start the app

```sh
npm run dev
```

Open **[http://127.0.0.1:5173/](http://127.0.0.1:5173/)**. Leave the terminal running while you use the app. Press **Ctrl+C** in that terminal to stop it.

The frontend uses port **5173** and the local API uses **3001**. Both listen only on your computer. Keep the default ports for the desktop launcher.

### 4. Try the sample first

Click **Try sample**, select a caption, and click **Explain**. English/Chinese sample captions and curated explanations work without a microphone or API key. Suggested sample follow-ups work too.

The sample is demonstration text, not audio playback. Free-form questions, exact-term questions, other translation languages, and live AI responses require the API connection below. The sample lecture is in English regardless of the lecture-language setting.

## Connect your own OpenAI API key

1. Create an API key in your [OpenAI API account](https://platform.openai.com/api-keys). API usage requires available credits and is billed to that account.
2. Copy `.env.example` to a new file named `.env` in the project folder. You can do this in your file manager or run:

   ```sh
   node -e "require('node:fs').copyFileSync('.env.example', '.env', require('node:fs').constants.COPYFILE_EXCL)"
   ```

   This command refuses to overwrite an existing `.env`.
3. Open `.env` in a text editor and fill in the key:

   ```dotenv
   OPENAI_API_KEY=your_api_key_here
   OPENAI_MODEL=gpt-4.1-mini
   ```

4. Restart the local services, then open the page again. Settings should show that AI is connected.

The model is configurable through `OPENAI_MODEL`; it must be a model your account can access that supports the text Responses API. The default is `gpt-4.1-mini`.

**Never commit or share `.env`.** It is ignored by Git. The key is read only by the local backend, not included in the frontend build or desktop icon. Only the empty `.env.example` belongs in the repository.

Speech recognition currently uses the **browser's speech service**, not OpenAI transcription. The API key enables AI explanations and caption translation; it does not change the speech-recognition engine.

Enabling translated captions can make many API requests during a lecture. Whole-lecture questions send the current transcript again, so longer lectures use more input tokens. Start with **Original** display if you want to limit translation requests.

## Create a macOS desktop app

After installing dependencies, run this once from the project folder:

```sh
npm run desktop:mac
```

This creates **Lecture Companion.app** on your Desktop with the purple audio-wave icon. Double-click it to start the services in the background and open the app in your default browser. Normal launches do not open Terminal. An existing running instance is reused.

- This is a local launcher, not a bundled standalone browser. Keep Node, the project folder, and its dependencies installed.
- Each user must generate their own app. Do not distribute your machine's generated `.app`.
- If you move the project folder or change Node installations, run `npm run desktop:mac` again to refresh the paths.
- You can drag the app to the Dock.
- Closing the browser does **not** stop the background services. Restarting the computer stops them. For a run with an explicit stop control, use `npm run dev` in Terminal and press Ctrl+C when finished.
- If background services are already running when you change `.env`, restarting the computer and launching again will load the new settings.
- The generated app is locally signed, not notarized for public distribution. macOS may apply its normal security checks.

To choose another output location:

```sh
npm run desktop:mac -- "/path/to/Lecture Companion.app"
```

Windows/Linux users should use `npm run dev`; desktop shortcuts for those systems are not included yet.

## Windows and Linux setup

The browser-based app is not tied to macOS. On Windows, install Node.js, open **PowerShell** in the downloaded project folder, and run:

```powershell
npm ci
npm run dev
```

Then open **http://127.0.0.1:5173/** in your browser. The same commands work in a Linux terminal. The API-key file-copy command above uses Node rather than a Unix-only shell command, so it works in PowerShell too.

The `.app` file and `desktop:mac` command are macOS-specific; Windows does not run them. A Windows installer/desktop launcher is not included. Automated CI checks install, test, and build on Windows, macOS, and Linux; those checks do not verify microphone permissions, browser speech services, or audio quality on each platform. Actual Windows classroom recording still needs a hardware/browser test. Edge documents its Web Speech API support and policies [here](https://learn.microsoft.com/en-us/deployedge/microsoft-edge-policies/speechrecognitionenabled); school-managed devices may disable the service.

## AI providers and speech recognition are separate choices

**Version 0.1.0 currently integrates only OpenAI for text answers/translation and the browser for live transcription.** Changing `OPENAI_MODEL` or pasting a Claude/DeepSeek key does not switch API providers. Claude and DeepSeek adapters, a provider picker, and hosted speech transcription have not been implemented.

A provider API key identifies an account and its permissions. It is not a promise that every model accepts audio or that one endpoint can do both jobs.

| Provider | Text questions/answers | Direct speech-to-text in its documented API | Current integration in this app |
| --- | --- | --- | --- |
| OpenAI | Available through text models | Available through dedicated transcription workflows | Text answers/translation only; transcription still uses the browser |
| Anthropic Claude | Available | The reviewed general Claude model/API documentation specifies text/image input, not a dedicated audio-transcription workflow | Not integrated |
| DeepSeek | Available | The reviewed model metadata lists text/image inputs, not audio input or a dedicated speech-transcription workflow | Not integrated |

Provider capabilities were checked against [OpenAI transcription documentation](https://developers.openai.com/api/docs/guides/transcription), [Claude models](https://platform.claude.com/docs/en/models/overview), [Claude Messages](https://platform.claude.com/docs/en/api/messages), and [DeepSeek model metadata](https://api-docs.deepseek.com/api/list-models/) on November 4, 2026. Consumer apps' voice features should not be assumed to exist in the developer API. Capabilities can change.

For OpenAI, one appropriately permitted API key can authenticate both text and transcription requests, but the models/workflows and usage charges are separate. This app does not yet make those transcription requests. With a text provider that lacks transcription, an integration would need either the browser's recognition service (no additional user-supplied transcription key) or a separate speech provider/local transcription engine. A separate hosted provider generally needs its own credentials and billing.

The intended next step is **independent transcription and text-provider configuration**, so a user could pair one service's transcription with another's AI answers. This is a design direction, not an available feature in this release.

## Everyday use

1. Set **Native language**, **Lecture language**, and **Display language**.
2. Click **Start recording** and allow microphone access. Record only with appropriate permission.
3. Use **Pause** to pause the same session and **Resume** to continue it. **End session** releases the microphone and makes the recorded audio available to download.
4. Ask about the whole lecture in the right-hand box, or select captions first for a focused explanation. After an answer, use the same box for follow-ups.
5. Download text notes from the caption panel, and download audio before closing the page if you need it.
6. Use **History** to revisit text and questions, or **Add New Session** to begin another lecture.

Language choices include English, Chinese, Spanish, French, German, Japanese, Korean, Portuguese, Italian, Arabic, Hindi, and Russian. Actual speech-recognition language support depends on your browser's service.

## Data storage and privacy

| Data | Where it lives |
| --- | --- |
| API key | Your local `.env`; read by the backend |
| Captions, bookmarks, explanations, and follow-ups | Your browser's localStorage |
| Language and reading preferences | Your browser's localStorage |
| Recorded audio | Memory in the current page until you download it |
| Downloaded notes and audio | The download location chosen by your browser |

History is specific to the **browser profile and site address**. Clearing site data, switching browsers, or using a different port does not preserve the same history. There is no cloud sync or automatic cross-device backup. Download important notes.

This app does not upload the recorded audio file. Your browser's speech-recognition service may process microphone audio remotely. AI questions send their relevant text context to OpenAI: selected passages and preceding captions for focused questions, or the current session's full transcript for whole-lecture questions. Translated display sends finalized captions for translation. Requests use `store: false`; this does not replace the provider's own data-handling policies.

Each question uses a transcript snapshot taken when you send it. New captions are included in the next question, and previous sessions are not automatically included. This is request context, not permanent model memory.

## Limits of this MVP

- Browser speech recognition is not a dedicated professional transcription service. Distant microphones, background noise, accents, and specialist terminology can affect captions.
- Audio is not automatically saved. Long recordings consume browser memory.
- Whole-lecture questions accept up to **200,000 transcript characters**. Beyond that, the app asks you to select relevant passages instead of silently dropping early captions.
- Selected passages accept up to **24,000 characters**; individual questions and highlighted text accept up to **2,000 characters** each.
- A bounded recent conversation is included with follow-ups, rather than unlimited chat history.
- No accounts, hosted service, cloud database, cross-device sync, or packaged Windows/Linux application is included.
- This is intended for local use. Do not expose the development server or API publicly without adding authentication and deployment safeguards.

## Troubleshooting

| Problem | What to check |
| --- | --- |
| `node` or `npm` is not found | Install Node.js, reopen Terminal, and check `node --version`. |
| `npm ci` fails | Use Node.js 22.9+ and run the command in the folder containing `package.json`. |
| The page does not open | Keep `npm run dev` running, then visit `http://127.0.0.1:5173/`. |
| A port is already in use | Close the other development service using port 5173 or 3001. The desktop launcher intentionally refuses a partial/conflicting startup. |
| Microphone access is denied | Allow access in browser/site settings and operating-system privacy settings. Localhost or HTTPS is required. |
| Audio records but captions do not appear | The browser's speech service may be unsupported or unavailable. Check the lecture language, connection, and recognition error message. |
| AI is not connected | Check `.env` in the project folder and restart the services. |
| AI requests fail | Check your API credits, key, model access, and internet connection. |
| Translations are unavailable | Keep Original display enabled while checking the API connection; source captions are preserved. |
| History looks empty | Check that you are using the same browser profile and site address. New sessions deliberately open with empty captions. |
| Desktop icon stops working after moving files | Run `npm run desktop:mac` again from the new project location. |

## Build and test

```sh
npm test
npm run build
```

To serve the production build locally:

```sh
npm run build
npm start
```

Open **http://127.0.0.1:3001/** in production mode. This is a different browser origin from the development URL, so its history is separate. The desktop launcher starts the development server at port 5173.

The test suite covers recording lifecycle adapters, selection/context isolation, request validation, whole-lecture question context, and history persistence/migration. Selected live AI paths were manually verified against a real API account. Real microphone quality and recognition behavior require testing in your own classroom.

## Architecture

- **React + Vite frontend** — recording controls, caption selection, questions, language preferences, and responsive UI.
- **MediaRecorder + Web Audio** — browser audio capture and input metering.
- **Browser SpeechRecognition** — live transcription where supported.
- **Express backend** — localhost API, validation, request limits/timeouts, OpenAI Responses API calls, and server-side key handling.
- **Browser localStorage** — session text history and preferences; no database setup required.
- **Node/macOS utilities** — portable local desktop-app creation and background service startup.

The tutor's answer instructions are in [`server/tutor-prompt.js`](server/tutor-prompt.js). The app uses the [OpenAI text Responses API](https://developers.openai.com/api/docs/guides/text).

## Project status

Version **0.1.0** is an early local MVP. An open-source license has not yet been selected; making source available does not itself grant an open-source license.

The visual direction was inspired by the [Vaulta template preview](https://preview.yuanpu.cc/vaulta-website-template/); the implementation and interface were written for this project.

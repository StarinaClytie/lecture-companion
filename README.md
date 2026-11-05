# Lecture Companion

A local classroom companion that helps you **follow live captions, ask quick questions, and keep your lecture notes** without losing track of the speaker.

This is the first MVP. It runs on your computer, opens in your browser, and uses your own API key for AI features. No account with this project is required.

## Main features

- **Record a lecture:** microphone input meter, pause/resume, end-session controls, and an optional audio download.
- **Follow live captions:** OpenAI live transcription by default, with browser speech recognition available as a selectable fallback.
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
- A browser with microphone access, AudioWorklet/Web Audio, and WebSocket support for OpenAI transcription. The optional browser-recognition fallback additionally depends on its own speech service and is not available in every browser. If captions fail, the recording can still be downloaded.
- An internet connection for OpenAI transcription, browser speech services, and live AI features.
- Your own OpenAI API key and available API credits for OpenAI transcription, live explanations, custom questions, and AI translations. A key is **not** included. Browser recognition remains available without a transcription key where supported.

Basic local development works on macOS, Windows, and Linux. The desktop-app creator currently supports **macOS only**. GitHub CI has passed dependency installation, the test suite, and production builds on Windows, macOS, and Linux. macOS desktop-app creation also passed. These checks do not verify microphone hardware or browser speech services; classroom recording still needs a real-device test.

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
   OPENAI_TRANSCRIPTION_MODEL=gpt-live-transcribe
   ```

4. Restart the local services, then open the page again. Settings should show that AI is connected.

The answer model is configured through `OPENAI_MODEL` (default `gpt-4.1-mini`). The independent speech model is configured through `OPENAI_TRANSCRIPTION_MODEL` (default `gpt-live-transcribe`). Both require account access to their respective APIs. `OPENAI_TRANSCRIPTION_API_KEY` is optional: leave it blank to reuse `OPENAI_API_KEY`, or supply a separate key for transcription.

**Never commit or share `.env`.** It is ignored by Git. The key is read only by the local backend, not included in the frontend build or desktop icon. Only the empty `.env.example` belongs in the repository.

**OpenAI live transcription is now the default.** In Settings → Speech to text, choose OpenAI or Browser recognition. The selection is locked while recording or paused; end the session before changing engines. The OpenAI option streams microphone audio through the local backend to OpenAI; it incurs transcription usage charges in addition to any text-answer/translation charges. A network/API error is shown explicitly and does not silently switch providers. The original audio recording remains downloadable. Browser recognition is a manually selected fallback and depends on browser/service availability.

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

**The current version integrates OpenAI for text answers/translation and live speech transcription, plus an optional browser-recognition fallback.** Changing `OPENAI_MODEL` or pasting a Claude/DeepSeek key does not switch API providers. Claude and DeepSeek adapters have not been implemented.

A provider API key identifies an account and its permissions. It is not a promise that every model accepts audio or that one endpoint can do both jobs.

| Provider | Text questions/answers | Direct speech-to-text in its documented API | Current integration in this app |
| --- | --- | --- | --- |
| OpenAI | Available through text models | Available through dedicated transcription workflows | Text answers/translation and OpenAI live transcription; browser fallback optional |
| Anthropic Claude | Available | The reviewed general Claude model/API documentation specifies text/image input, not a dedicated audio-transcription workflow | Not integrated |
| DeepSeek | Available | The reviewed model metadata lists text/image inputs, not audio input or a dedicated speech-transcription workflow | Not integrated |

Provider capabilities were checked against [OpenAI transcription documentation](https://developers.openai.com/api/docs/guides/transcription), [Claude models](https://platform.claude.com/docs/en/models/overview), [Claude Messages](https://platform.claude.com/docs/en/api/messages), and [DeepSeek model metadata](https://api-docs.deepseek.com/api/list-models/) on November 4, 2026. Consumer apps' voice features should not be assumed to exist in the developer API. Capabilities can change.

For OpenAI, one appropriately permitted API key can authenticate both text and transcription requests, but the models/workflows and usage charges are separate. This app now uses the live-transcription workflow when OpenAI is selected in Settings. With a text provider that lacks transcription, an integration would need either the browser's recognition service (no additional user-supplied transcription key) or a separate speech provider/local transcription engine. A separate hosted provider generally needs its own credentials and billing.

Speech-engine selection and speech-model/key configuration are independent from the text-answer model. Mixing OpenAI transcription with Claude/DeepSeek text answers remains a future integration, not an available feature.

## Everyday use

1. Set **Native language**, **Lecture language**, and **Display language**.
2. Click **Start recording** and allow microphone access. Record only with appropriate permission.
3. Use **Pause** to pause the same session and **Resume** to continue it. **End session** releases the microphone and makes the recorded audio available to download.
4. Ask about the whole lecture in the right-hand box, or select captions first for a focused explanation. After an answer, use the same box for follow-ups.
5. Download text notes from the caption panel, and download audio before closing the page if you need it.
6. Use **History** to revisit text and questions, or **Add New Session** to begin another lecture.

Language choices include English, Chinese, Spanish, French, German, Japanese, Korean, Portuguese, Italian, Arabic, Hindi, and Russian. Actual recognition language support depends on the selected transcription engine and service.

## Classroom audio checks

For a distant lecturer, Settings defaults to **Lecture / distant speaker · Original sound**. This requests browser echo cancellation, noise suppression, and automatic gain control to be disabled. These communication-oriented filters can alter the signal before the transcription model receives it; operating-system voice isolation may still apply. A **Close microphone** mode remains available when that processing is desired. Provider-side noise reduction is disabled: a real classroom recording returned empty turns with far-field filtering but recognizable speech without it.

Select the intended **Microphone**, especially if a headset is connected. If the browser has not yet exposed device names, use the explicit microphone-access button in Settings; its temporary permission stream is stopped immediately after listing devices. Choosing a disconnected device produces an error rather than silently switching inputs.

While recording, expand **Recording check** to inspect the selected device, sent audio duration, provider-acknowledged turns, and received caption count. Connected means the provider session opened; it does not prove that useful speech is reaching the model. A watchdog distinguishes stalled audio processing from audio flowing without recent recognized text. These counters contain no audio or transcript content and are not saved in History.

OpenAI transcription and the downloadable recording share the selected stream. Browser-recognition fallback chooses its own input; the microphone selector controls recording but cannot force that browser service to use the same device.

If the meter moves but captions are missing, download a short real recording and listen to whether the lecturer is intelligible. Compare the actual recording before assuming a provider or model change will fix it. Synthetic speech tests establish connectivity and sequencing, not real-classroom accuracy.

## Data storage and privacy

| Data | Where it lives |
| --- | --- |
| API key | Your local `.env`; read by the backend |
| Captions, bookmarks, explanations, and follow-ups | Your browser's localStorage |
| Language and reading preferences | Your browser's localStorage |
| Recorded audio | Memory in the current page until you download it |
| Downloaded notes and audio | The download location chosen by your browser |

History is specific to the **browser profile and site address**. Clearing site data, switching browsers, or using a different port does not preserve the same history. There is no cloud sync or automatic cross-device backup. Download important notes.

With OpenAI selected, the app streams microphone audio through the local backend to OpenAI for transcription; it does not automatically upload the finished recording file. With Browser recognition selected, the browser's speech service may process microphone audio remotely. Neither engine causes audio to be stored in local History. Audio transmission stops when paused or ended; the connection briefly waits for final text before closing. AI questions send their relevant text context to OpenAI: selected passages and preceding captions for focused questions, or the current session's full transcript for whole-lecture questions. Translated display sends finalized captions for translation. Text-answer/translation requests use `store: false`; this does not replace the provider's own data-handling policies for text or streamed audio.

Each question uses a transcript snapshot taken when you send it. New captions are included in the next question, and previous sessions are not automatically included. This is request context, not permanent model memory.

## Limits of this MVP

- OpenAI transcription is not guaranteed to match the ChatGPT app. Distant microphones, background noise, accents, and specialist terminology can still cause missed or incorrect words; test in your real classroom. Browser recognition is a less configurable fallback.
- OpenAI uses streaming 24 kHz mono PCM, no provider-side noise reduction, and client-side turn boundaries. Audio is not discarded by the local speech detector. Caption timestamps are approximate turn-start times, not word-level alignment.
- A connection is closed after 55 minutes; if prompted, retry captions to continue in the same classroom. A disconnect is not automatically replayed, so keep the audio download for words missed during outages.
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
| Audio records but captions do not appear | For OpenAI, check the API key, credits/model access, connection and transcription error; retry captions. For Browser, check browser/service support and the lecture language. |
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
- **OpenAI Realtime WebSocket + AudioWorklet** — default live transcription, server-side keys, 24 kHz mono PCM, final-turn draining, bounded startup buffering, and ordered caption completion.
- **Browser SpeechRecognition** — manually selected fallback where supported.
- **Express backend** — localhost API, validation, request limits/timeouts, OpenAI Responses API calls, and server-side key handling.
- **Browser localStorage** — session text history and preferences; no database setup required.
- **Node/macOS utilities** — portable local desktop-app creation and background service startup.

The transcription relay is in `server/transcription.js`, the client lifecycle in `src/realtime-transcription.js`, and the audio processor in `public/pcm-worklet.js`. The implementation follows the [OpenAI realtime transcription guide](https://developers.openai.com/api/docs/guides/realtime-transcription).

The tutor's answer instructions are in [`server/tutor-prompt.js`](server/tutor-prompt.js). The app uses the [OpenAI text Responses API](https://developers.openai.com/api/docs/guides/text).

## Project status

The initial **0.1.0** release is an early local MVP; the working version adds OpenAI live transcription. An open-source license has not yet been selected; making source available does not itself grant an open-source license.

The visual direction was inspired by the [Vaulta template preview](https://preview.yuanpu.cc/vaulta-website-template/); the implementation and interface were written for this project.

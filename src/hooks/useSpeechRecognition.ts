import { useCallback, useEffect, useRef, useState } from "react";

type SpeechAlternativeLike = { transcript: string };
type SpeechResultLike = ArrayLike<SpeechAlternativeLike> & { isFinal: boolean };
type SpeechResultEventLike = Event & {
  resultIndex: number;
  results: ArrayLike<SpeechResultLike>;
};
type SpeechErrorEventLike = Event & { error: string };

type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  phrases?: unknown[];
  unspokenPunctuation?: boolean;
  onstart: (() => void) | null;
  onresult: ((event: SpeechResultEventLike) => void) | null;
  onerror: ((event: SpeechErrorEventLike) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;
type SpeechRecognitionPhraseConstructor = new (phrase: string, boost?: number) => unknown;

function getSpeechRecognitionConstructor() {
  const speechWindow = window as Window & {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };
  return speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;
}

function getSpeechErrorMessage(error: string) {
  switch (error) {
    case "not-allowed":
    case "service-not-allowed":
      return "마이크 권한을 허용해 주세요. 브라우저 사이트 설정에서 마이크를 확인할 수 있어요.";
    case "no-speech":
      return "음성이 들리지 않았어요. 마이크 가까이에서 다시 말해 주세요.";
    case "audio-capture":
      return "마이크를 찾을 수 없어요. 연결 상태와 다른 앱의 사용 여부를 확인해 주세요.";
    case "network":
      return "음성 인식 서비스에 연결할 수 없어요. 네트워크를 확인해 주세요.";
    default:
      return "음성을 인식하지 못했어요. 다시 시도하거나 직접 입력해 주세요.";
  }
}

export function useSpeechRecognition(onFinalResult: (text: string) => void, phraseHints: string[] = []) {
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState("");
  const [speechError, setSpeechError] = useState("");
  const supported = typeof window !== "undefined" && Boolean(getSpeechRecognitionConstructor());

  useEffect(() => () => {
    recognitionRef.current?.abort();
  }, []);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
  }, []);

  const startListening = useCallback(() => {
    const Recognition = getSpeechRecognitionConstructor();
    if (!Recognition) {
      setSpeechError("이 브라우저는 음성 인식을 지원하지 않아요. 직접 입력해 주세요.");
      return;
    }

    recognitionRef.current?.abort();
    setSpeechError("");
    setInterimTranscript("");

    const recognition = new Recognition();
    recognition.lang = "ko-KR";
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    if ("unspokenPunctuation" in recognition) recognition.unspokenPunctuation = true;
    const Phrase = (window as Window & { SpeechRecognitionPhrase?: SpeechRecognitionPhraseConstructor }).SpeechRecognitionPhrase;
    if (Phrase && "phrases" in recognition) {
      try {
        recognition.phrases = [...new Set(phraseHints)].slice(0, 40).map((phrase) => new Phrase(phrase, 2.5));
      } catch {
        // 문맥 힌트를 지원하지 않는 브라우저에서는 기본 인식을 사용합니다.
      }
    }
    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event) => {
      let finalText = "";
      let interimText = "";
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index];
        if (result.isFinal) finalText += result[0]?.transcript ?? "";
        else interimText += result[0]?.transcript ?? "";
      }
      setInterimTranscript(interimText.trim());
      if (finalText.trim()) onFinalResult(finalText.trim());
    };
    recognition.onerror = (event) => {
      if (recognitionRef.current !== recognition) return;
      setSpeechError(getSpeechErrorMessage(event.error));
      setIsListening(false);
    };
    recognition.onend = () => {
      if (recognitionRef.current === recognition) {
        setIsListening(false);
        setInterimTranscript("");
        recognitionRef.current = null;
      }
    };
    recognitionRef.current = recognition;

    try {
      recognition.start();
    } catch {
      setSpeechError("음성 인식을 시작하지 못했어요. 잠시 후 다시 시도해 주세요.");
      setIsListening(false);
      recognitionRef.current = null;
    }
  }, [onFinalResult, phraseHints]);

  return { supported, isListening, interimTranscript, speechError, startListening, stopListening };
}

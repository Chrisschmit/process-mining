import React, { createContext, useState, useRef, useCallback } from "react";
import { AutoProcessor, AutoModelForImageTextToText, RawImage, TextStreamer } from "@huggingface/transformers";
import type { LlavaProcessor, PreTrainedModel, Tensor } from "@huggingface/transformers";
import type { VLMContextValue } from "../types/vlm";

const VLMContext = createContext<VLMContextValue | null>(null);

const MODEL_ID = "onnx-community/FastVLM-0.5B-ONNX";
const MAX_NEW_TOKENS = 512;

export { VLMContext };

export const VLMProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processorRef = useRef<LlavaProcessor | null>(null);
  const modelRef = useRef<PreTrainedModel | null>(null);
  const loadPromiseRef = useRef<Promise<void> | null>(null);
  const inferenceLock = useRef(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const loadModel = useCallback(
    async (onProgress?: (msg: string) => void) => {
      if (isLoaded) {
        onProgress?.("Model already loaded!");
        return;
      }

      if (loadPromiseRef.current) {
        return loadPromiseRef.current;
      }

      setIsLoading(true);
      setError(null);

      loadPromiseRef.current = (async () => {
        const maxRetries = 3;
        let lastError: Error | null = null;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
          try {
            onProgress?.(`Loading processor... (attempt ${attempt}/${maxRetries})`);
            
            // Add timeout wrapper for processor loading
            const processorPromise = AutoProcessor.from_pretrained(MODEL_ID);
            const timeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error("Processor loading timeout")), 60000)
            );
            
            processorRef.current = await Promise.race([processorPromise, timeoutPromise]) as LlavaProcessor;
            onProgress?.("Processor loaded. Loading model...");
            
            // Add timeout wrapper for model loading
            const modelPromise = AutoModelForImageTextToText.from_pretrained(MODEL_ID, {
              dtype: {
                embed_tokens: "fp16",
                vision_encoder: "q4",
                decoder_model_merged: "q4",
              },
              device: "webgpu",
            });
            const modelTimeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error("Model loading timeout")), 120000)
            );
            
            modelRef.current = await Promise.race([modelPromise, modelTimeoutPromise]) as PreTrainedModel;
            onProgress?.("Model loaded successfully!");
            setIsLoaded(true);
            return; // Success, exit retry loop
            
          } catch (e) {
            lastError = e instanceof Error ? e : new Error(String(e));
            console.error(`Model loading attempt ${attempt} failed:`, lastError);
            
            if (attempt < maxRetries) {
              const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000); // Exponential backoff, max 5s
              onProgress?.(`Loading failed, retrying in ${delay/1000}s... (${lastError.message})`);
              await new Promise(resolve => setTimeout(resolve, delay));
            }
          }
        }

        // All retries failed
        const errorMessage = lastError?.message || "Failed to load model after multiple attempts";
        setError(errorMessage);
        console.error("All model loading attempts failed:", lastError);
        throw lastError || new Error(errorMessage);
        
      })().finally(() => {
        setIsLoading(false);
        loadPromiseRef.current = null;
      });

      return loadPromiseRef.current;
    },
    [isLoaded],
  );

  const runInference = useCallback(
    async (video: HTMLVideoElement, instruction: string, onTextUpdate?: (text: string) => void): Promise<string> => {
      if (inferenceLock.current) {
        console.log("Inference already running, skipping frame");
        return ""; // Return empty string to signal a skip
      }
      inferenceLock.current = true;

      if (!processorRef.current || !modelRef.current) {
        throw new Error("Model/processor not loaded");
      }

      if (!canvasRef.current) {
        canvasRef.current = document.createElement("canvas");
      }
      const canvas = canvasRef.current;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) throw new Error("Could not get canvas context");

      ctx.drawImage(video, 0, 0);

      const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const rawImg = new RawImage(frame.data, frame.width, frame.height, 4);
      const messages = [
        {
          role: "system",
          content: `You are a helpful visual AI assistant. Respond concisely and accurately to the user's query in one sentence.`,
        },
        { role: "user", content: `<image>${instruction}` },
      ];
      const prompt = processorRef.current.apply_chat_template(messages, {
        add_generation_prompt: true,
      });
      const inputs = await processorRef.current(rawImg, prompt, {
        add_special_tokens: false,
      });

      let streamed = "";
      const streamer = new TextStreamer(processorRef.current.tokenizer!, {
        skip_prompt: true,
        skip_special_tokens: true,
        callback_function: (t: string) => {
          streamed += t;
          onTextUpdate?.(streamed.trim());
        },
      });

      const outputs = (await modelRef.current.generate({
        ...inputs,
        max_new_tokens: MAX_NEW_TOKENS,
        do_sample: false,
        streamer,
        repetition_penalty: 1.2,
      })) as Tensor;

      const decoded = processorRef.current.batch_decode(outputs.slice(null, [inputs.input_ids.dims.at(-1), null]), {
        skip_special_tokens: true,
      });
      inferenceLock.current = false;
      return decoded[0].trim();
    },
    [],
  );

  return (
    <VLMContext.Provider
      value={{
        isLoaded,
        isLoading,
        error,
        loadModel,
        runInference,
      }}
    >
      {children}
    </VLMContext.Provider>
  );
};

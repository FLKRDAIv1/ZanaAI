
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

const API_KEYS = [
  "AIzaSyDNorqeGq0RygqqWxjp4iEMCKemsZ8D36I",
  "AIzaSyDF4_XZkAqGVaLX5DW78liWBtFKQqhLlyc",
  "AIzaSyDXKqmItaeB1ZeEsIL1LmfbMUljQGdokow",
  "AIzaSyBq9k06joTBUdY7I-uUBGXbt4GIB9EDlwg",
  "AIzaSyBQnefyttVFXp9kJ-Ixs56dhWTZ-M2T298",
  "AIzaSyBmwp_x1rhPmZvUHyUKqCsmLLcGN4BEST0",
  "AIzaSyCR6OWmxIJlXZlxoUMSWjlMkPOnsR-Hjuw",
  "AIzaSyBNkb1t75TO1k_X0DPakQKqpTMFBeaIJUg",
  "AIzaSyC5xAsiinvW6gveIv_9_9N4A77LqYa4Pfs",
  "AIzaSyAIq0cr9wWNoMdzJoKhkcZV2jroMqXf3uU",
  "AIzaSyAjh0b74QpP-EWmAT3Yvx5gMhiGQwqWpBQ",
  "AIzaSyAF4JhzhPZykFUjUElqay6Cf1Y_-ol1NlY",
  "AIzaSyAuJTQ2TghrJtbW8pirKC3j-uI5Hq2htco",
  "AIzaSyA67-45_ZzaKcG3_mfNpPZaIJgWD1zdj9Q",
  "AIzaSyAb8bF_SnHb1q-6du9lz3xoNzUWF3iiHDQ",
  "AIzaSyAqDSdc245uh_QQrsZTMPBcLErFcpcaA48",
  "AIzaSyDRQFg2WhK33yFNevma2aZrMmxN4Bry6dQ",
  "AIzaSyAmteIpeKU8Y7RmBKc79TOOAcwcYHRdqjk"
];

let currentKeyIndex = Math.floor(Math.random() * API_KEYS.length);

const getClient = () => new GoogleGenAI({ apiKey: API_KEYS[currentKeyIndex] });

const rotateKey = () => {
  currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length;
};

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function executeWithRetry<T>(operation: (client: GoogleGenAI) => Promise<T>): Promise<T> {
  const maxAttempts = 6; 
  let attempt = 0;

  while (attempt < maxAttempts) {
    try {
      const client = getClient();
      return await operation(client);
    } catch (error: any) {
      const msg = error.message?.toLowerCase() || '';
      const isNetworkError = msg.includes('fetch failed') || msg.includes('networkerror') || msg.includes('network');
      const isRateLimit = msg.includes('429') || msg.includes('403') || msg.includes('quota');
      const isOverloaded = msg.includes('503') || msg.includes('500');

      if (isNetworkError || isRateLimit || isOverloaded) {
        rotateKey();
        attempt++;
        if (attempt >= maxAttempts) break;
        const waitTime = 200 * Math.pow(2, attempt - 1);
        await delay(waitTime);
      } else {
        throw error;
      }
    }
  }
  throw new Error("ببورە، کێشەیەک لە پەیوەندی دروست بوو. تکایە دووبارە هەوڵ بدەرەوە.");
}

export const genAI = {
  models: {
    generateContent: (params: any) => 
      executeWithRetry(client => client.models.generateContent(params)) as Promise<GenerateContentResponse>,
    generateContentStream: (params: any) => 
      executeWithRetry(client => client.models.generateContentStream(params)) as Promise<any>,
  },
  live: {
    connect: (params: any) => getClient().live.connect(params)
  }
};

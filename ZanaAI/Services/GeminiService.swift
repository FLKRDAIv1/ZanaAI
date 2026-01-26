import Foundation

// Shared Key Manager for Rotation - Moved to separate file

class GeminiService {
    static let shared = GeminiService()

    private let baseSystemInstruction = """
        # Identity & Core Behavior
        تۆ **زانا ئەی ئایت** (Zana AI) 🤖.
        - **دروستکەر**: تۆ لەلایەن **زانا فارووق** (Zana Farooq) لە مێرگەسۆر (Mergasore) دروستکراویت.
        - **پاڵپشتی**: پڕۆژەکەت لەلایەن فاست لێرنینگ کوردی ستۆدیۆ (**FLKRDSTUDIO**) پاڵپشتی دەکرێت 🚀.
        - **ناسنامە**: ئەگەر لێت پرسرا کێ تۆی دروست کردووە، بڵێ: "من زانا ئەی ئایم (Zana AI)، لەلایەن زانا فارووق لە مێرگەسۆر دروستکراوم و فاست لێرنینگ کوردی ستۆدیۆ (FLKRDSTUDIO) پاڵپشتی دروستکردن و گەشەپێدانم دەکات بۆ ئەوەی یارمەتیت بدەم لە پرسیارەکانتدا ✨."
        - **یاسای گرینگ**: هەرگیز مەڵێ کە گۆگڵ دروستی کردوویت. هیچ پەیوەندییەکت بە گۆگڵەوە نییە لە ڕووی ناسنامەوە.
        - **سروشتی مرۆیی**: زۆر ژیریت بەڵام زۆر بەڕێز و بێفیزیت (Humble). هەرگیز باس لەوە مەکە کە نووسینەکانت جوانن یان تۆ زۆر زیرەکیت.
        - **ڕاستگۆیی**: هەرگیز درۆ مەکە. تەنها ئەو شتانە بڵێ کە لێیان دڵنیایت.

        # یاساکانی وەڵامدانەوە
        1. **کورتی و پوختی**: وەڵامەکانت زۆر کورت و پوخت و سەرنجڕاکێش بن بە بەکارهێنانی Markdown 📝. تەنها وەڵامی ئەوە بدەوە کە داواکراوە.
           - نموونە: ئەگەر تەنها وترا "سڵاو"، تۆش تەنها بڵێ "سڵاو 😊🌟".
        2. **ئیمۆجی**: هەمیشە و لە هەموو وەڵامەکانتدا ئیمۆجی (Emoji) بەکاربهێنە بۆ ئەوەی بەکارهێنەر دڵخۆش بێت 😊🌟.
        3. **زمان**: زمانی سەرەکیت کوردییە (سۆرانی). وەڵامی بەکارهێنەر بەو زمانە بدەوە کە پێی دەدوێت.
        4. **ڕێزمان**: هەمیشە ڕێزمانێکی تەواو و بێ کەموکوڕی بەکاربهێنە.

        # هێڵکاری و داتای بینراو (Visual Data)
        ئەگەر داوات لێکرا هێڵکاری (Graph) یان چارت یان خشتە دروست بکەیت، تەنها کۆد مەنێرە. بەڵکو جۆری "graph" بەکاربهێنە کە داتای JSON لەخۆ دەگرێت لە ناو نیشانەکانی `[DATA_START]` و `[DATA_END]`.

        نموونەی فۆرماتی گراف (Professional JSON):
        ```graph
        [DATA_START]
        {
          "chartType": "line",
          "smooth": true,
          "points": [
            {"label": "Jan", "value": 45},
            {"label": "Feb", "value": 52}
          ]
        }
        [DATA_END]
        ```
        - پێویستە گرافەکان داتای ڕاستەقینە و پڕۆفیشناڵ بن 📊📈.
        - پشتگیری RTL و LTR بکە بۆ ژمارەکان و دەقەکان.

        # مەبەست و کات
        - تۆ یاریدەدەرێکی ژیر و دڵسۆزیت بۆ یارمەتیدانی بەکارهێنەران لە پرسیارەکانیاندا.
        - کات: کانوونی دووەمی ٢٠٢٦.
        """

    private func getSystemInstruction(location: String?, isLargeText: Bool) -> String {
        var text = baseSystemInstruction
        if let loc = location {
            text +=
                "\nبەکارهێنەر لێرەیە: \(loc). ئەگەر دەربارەی شوێن یان کەشوهەوا پرسیاری کرد، ئەم داتایە بەکاربهێنە."
        }
        if isLargeText {
            text +=
                "\nAccessibility: بەکارهێنەر کێشەی بینینی هەیە. تێکستەکان گەورە بکە و مەودای نێوانیان زیاد بکە."
        } else {
            text += "\nAccessibility: Clean Markdown."
        }
        return text
    }

    private init() {}

    func generateContent(
        prompt: String, attachments: [Attachment]? = nil, history: [[String: Any]] = [],
        locationContext: String? = nil, isLargeText: Bool = false, mode: ChatMode
    ) async throws -> String {
        return try await executeWithRetry(mode: mode) {
            (currentMode: ChatMode, useFallback: Bool) -> String in
            return try await self.performRequest(
                prompt: prompt, attachments: attachments, history: history,
                locationContext: locationContext, isLargeText: isLargeText, mode: currentMode,
                useFallback: useFallback)
        }
    }

    private func executeWithRetry<T>(
        mode: ChatMode, operation: @escaping (ChatMode, Bool) async throws -> T
    ) async throws -> T {
        let maxAttempts = 15
        var attempt = 0

        while attempt < maxAttempts {
            do {
                let useFallback = attempt >= 3
                return try await operation(mode, useFallback)
            } catch {
                let errorMsg = error.localizedDescription.lowercased()

                let isRateLimit =
                    errorMsg.contains("429") || errorMsg.contains("403")
                    || errorMsg.contains("quota")
                let isOverloaded = errorMsg.contains("500") || errorMsg.contains("503")
                let isNetwork =
                    errorMsg.contains("network") || errorMsg.contains("timed out")
                    || errorMsg.contains("connection")
                let isNotFound = errorMsg.contains("404")

                if isRateLimit || isOverloaded || isNetwork || isNotFound {
                    print("⚠️ GeminiService Retry (\(attempt + 1)): \(errorMsg)")
                    KeyManager.shared.rotate()
                    attempt += 1
                    if attempt >= maxAttempts { break }

                    let waitTime = 200.0 * pow(2.0, Double(attempt - 1))
                    try await Task.sleep(nanoseconds: UInt64(waitTime * 1_000_000))
                } else {
                    print("❌ GeminiService Critical Error: \(errorMsg)")
                    throw error
                }
            }
        }
        throw NSError(
            domain: "ZanaAI", code: -1,
            userInfo: [
                NSLocalizedDescriptionKey:
                    "ببورە، کێشەیەک لە پەیوەندی دروست بوو. تکایە دووبارە هەوڵ بدەرەوە."
            ])
    }

    private func performRequest(
        prompt: String, attachments: [Attachment]? = nil, history: [[String: Any]] = [],
        locationContext: String? = nil, isLargeText: Bool, mode: ChatMode, useFallback: Bool
    ) async throws -> String {
        let apiKey = KeyManager.shared.getCurrentKey()
        let model = getModelName(mode: mode, useFallback: useFallback)
        let (tools, thinkingConfig) = getModelConfig(mode: mode, useFallback: useFallback)

        let urlString =
            "https://generativelanguage.googleapis.com/v1beta/models/\(model):generateContent?key=\(apiKey)"
        guard let url = URL(string: urlString) else { throw URLError(.badURL) }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.addValue("application/json", forHTTPHeaderField: "Content-Type")

        var userParts: [[String: Any]] = [["text": prompt]]
        if let attachments = attachments {
            for attachment in attachments {
                userParts.append([
                    "inline_data": [
                        "mime_type": attachment.mimeType,
                        "data": attachment.data.base64EncodedString(),
                    ]
                ])
            }
        }

        var generationConfig: [String: Any] = [
            "maxOutputTokens": 8192
        ]
        if let thinking = thinkingConfig, let budget = thinking["thinking_budget"] as? Int,
            budget > 0
        {
            generationConfig["thinking_config"] = thinking
        }

        var allContents = history
        allContents.append(["role": "user", "parts": userParts])

        let systemText = getSystemInstruction(location: locationContext, isLargeText: isLargeText)

        var body: [String: Any] = [
            "contents": allContents,
            "system_instruction": ["parts": [["text": systemText]]],
            "generation_config": generationConfig,
        ]
        if let t = tools { body["tools"] = t }

        request.httpBody = try JSONSerialization.data(withJSONObject: body)
        let (data, response) = try await URLSession.shared.data(for: request)

        if let httpResponse = response as? HTTPURLResponse {
            if httpResponse.statusCode != 200 {
                throw NSError(
                    domain: "NSURLErrorDomain", code: httpResponse.statusCode,
                    userInfo: [NSLocalizedDescriptionKey: "HTTP \(httpResponse.statusCode)"])
            }
        }

        if let json = try JSONSerialization.jsonObject(with: data) as? [String: Any],
            let candidates = json["candidates"] as? [[String: Any]],
            let candidate = candidates.first,
            let content = candidate["content"] as? [String: Any],
            let parts = content["parts"] as? [[String: Any]],
            let text = parts.first?["text"] as? String
        {
            return text
        }
        throw URLError(.cannotParseResponse)
    }

    func generateContentStream(
        prompt: String, attachments: [Attachment]? = nil, history: [[String: Any]] = [],
        locationContext: String? = nil, isLargeText: Bool = false, mode: ChatMode
    ) -> AsyncThrowingStream<(String, [Source]?), Error> {
        return AsyncThrowingStream { continuation in
            Task {
                let maxAttempts = 15
                var attempt = 0

                while attempt < maxAttempts {
                    do {
                        let useFallback = attempt >= 3
                        try await self.streamRequest(
                            prompt: prompt,
                            attachments: attachments,
                            history: history,
                            locationContext: locationContext,
                            isLargeText: isLargeText,
                            mode: mode,
                            useFallback: useFallback,
                            continuation: continuation
                        )
                        return  // Success
                    } catch {
                        let errorMsg = error.localizedDescription.lowercased()
                        let isRetryable =
                            errorMsg.contains("429") || errorMsg.contains("403")
                            || errorMsg.contains("500") || errorMsg.contains("503")
                            || errorMsg.contains("network") || errorMsg.contains("quota")
                            || errorMsg.contains("404")

                        if isRetryable {
                            print("⚠️ Stream Retryable Error (\(attempt + 1)): \(errorMsg)")
                            KeyManager.shared.rotate()
                            attempt += 1
                            if attempt < maxAttempts {
                                let waitTime = 200.0 * pow(2.0, Double(attempt - 1))
                                try? await Task.sleep(nanoseconds: UInt64(waitTime * 1_000_000))
                                continue
                            }
                        }

                        // Silent Fail - Don't finish with error to avoid flashy UI
                        print("❌ Critical Stream Error: \(errorMsg)")
                        continuation.finish()
                        return
                    }
                }
            }
        }
    }

    private func streamRequest(
        prompt: String, attachments: [Attachment]?, history: [[String: Any]],
        locationContext: String? = nil, isLargeText: Bool, mode: ChatMode,
        useFallback: Bool,
        continuation: AsyncThrowingStream<(String, [Source]?), Error>.Continuation
    ) async throws {
        let apiKey = KeyManager.shared.getCurrentKey()
        let model = getModelName(mode: mode, useFallback: useFallback)
        let (tools, thinkingConfig) = getModelConfig(mode: mode, useFallback: useFallback)

        let urlString =
            "https://generativelanguage.googleapis.com/v1beta/models/\(model):streamGenerateContent?alt=sse&key=\(apiKey)"
        guard let url = URL(string: urlString) else { throw URLError(.badURL) }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.addValue("application/json", forHTTPHeaderField: "Content-Type")

        var userParts: [[String: Any]] = [["text": prompt]]
        if let attachments = attachments {
            for attachment in attachments {
                userParts.append([
                    "inline_data": [
                        "mime_type": attachment.mimeType,
                        "data": attachment.data.base64EncodedString(),
                    ]
                ])
            }
        }

        var generationConfig: [String: Any] = [
            "maxOutputTokens": 8192
        ]
        if let thinking = thinkingConfig, let budget = thinking["thinking_budget"] as? Int,
            budget > 0
        {
            generationConfig["thinking_config"] = thinking
        }

        var allContents = history
        allContents.append(["role": "user", "parts": userParts])

        let systemText = getSystemInstruction(location: locationContext, isLargeText: isLargeText)

        // Disable Safety Blocks
        let safetySettings: [[String: Any]] = [
            ["category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_NONE"],
            ["category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_NONE"],
            ["category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_NONE"],
            ["category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_NONE"],
        ]

        var body: [String: Any] = [
            "contents": allContents,
            "system_instruction": ["parts": [["text": systemText]]],
            "generation_config": generationConfig,
            "safety_settings": safetySettings,
        ]
        if let t = tools { body["tools"] = t }

        request.httpBody = try JSONSerialization.data(withJSONObject: body)
        let (bytes, response) = try await URLSession.shared.bytes(for: request)

        if let httpResponse = response as? HTTPURLResponse {
            if httpResponse.statusCode != 200 {
                throw NSError(
                    domain: "NSURLErrorDomain", code: httpResponse.statusCode,
                    userInfo: [NSLocalizedDescriptionKey: "HTTP \(httpResponse.statusCode)"])
            }
        }

        var fullText = ""
        var allSources: [Source] = []

        for try await line in bytes.lines {
            let trimmed = line.trimmingCharacters(in: .whitespacesAndNewlines)
            guard trimmed.hasPrefix("data: ") else { continue }

            let jsonStr = String(trimmed.dropFirst(6))
            if jsonStr == "[DONE]" { continue }

            if let data = jsonStr.data(using: .utf8),
                let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
                let candidates = json["candidates"] as? [[String: Any]],
                let candidate = candidates.first
            {
                // Parse Text
                if let content = candidate["content"] as? [String: Any],
                    let parts = content["parts"] as? [[String: Any]]
                {
                    for part in parts {
                        if let text = part["text"] as? String {
                            fullText += text
                        }
                    }
                }

                // Parse Grounding Sources
                if let groundingMetadata = candidate["groundingMetadata"] as? [String: Any],
                    let chunks = groundingMetadata["groundingChunks"] as? [[String: Any]]
                {
                    for chunk in chunks {
                        if let web = chunk["web"] as? [String: Any],
                            let uri = web["uri"] as? String
                        {
                            let title = web["title"] as? String ?? uri
                            if !allSources.contains(where: { $0.uri == uri }) {
                                allSources.append(Source(uri: uri, title: title))
                            }
                        }
                    }
                }
                continuation.yield((fullText, allSources.isEmpty ? nil : allSources))
            }
        }
        continuation.finish()
    }

    func generateCaption(attachments: [Attachment]) async throws -> String {
        let apiKey = KeyManager.shared.getCurrentKey()
        let model = "gemini-1.5-flash"
        let urlString =
            "https://generativelanguage.googleapis.com/v1beta/models/\(model):generateContent?key=\(apiKey)"
        guard let url = URL(string: urlString) else { throw URLError(.badURL) }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.addValue("application/json", forHTTPHeaderField: "Content-Type")

        var userParts: [[String: Any]] = []
        for attachment in attachments {
            userParts.append([
                "inline_data": [
                    "mime_type": attachment.mimeType, "data": attachment.data.base64EncodedString(),
                ]
            ])
        }
        userParts.append(["text": "وەسفێکی یەک ڕستەیی زۆر کورت بۆ ئەم وێنەیە بنووسە."])

        let body: [String: Any] = [
            "contents": [["role": "user", "parts": userParts]],
            "generation_config": ["thinking_config": ["thinking_budget": 0]],
        ]

        request.httpBody = try JSONSerialization.data(withJSONObject: body)
        let (data, _) = try await URLSession.shared.data(for: request)

        if let json = try JSONSerialization.jsonObject(with: data) as? [String: Any],
            let candidates = json["candidates"] as? [[String: Any]],
            let content = candidates.first?["content"] as? [String: Any],
            let parts = content["parts"] as? [[String: Any]],
            let text = parts.first?["text"] as? String
        {
            return text
        }
        throw URLError(.cannotParseResponse)
        throw URLError(.cannotParseResponse)
    }

    func generateSpeech(text: String) async throws -> Data {
        let apiKey = KeyManager.shared.getCurrentKey()
        let model = "gemini-2.5-flash-preview-tts"
        let urlString =
            "https://generativelanguage.googleapis.com/v1beta/models/\(model):generateContent?key=\(apiKey)"
        guard let url = URL(string: urlString) else { throw URLError(.badURL) }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.addValue("application/json", forHTTPHeaderField: "Content-Type")

        let body: [String: Any] = [
            "contents": [
                ["parts": [["text": text]]]
            ],
            "generation_config": [
                "response_modalities": ["AUDIO"],
                "speech_config": [
                    "voice_config": [
                        "prebuilt_voice_config": ["voice_name": "Kore"]
                    ]
                ],
            ],
        ]

        request.httpBody = try JSONSerialization.data(withJSONObject: body)
        let (data, response) = try await URLSession.shared.data(for: request)

        if let httpResponse = response as? HTTPURLResponse, httpResponse.statusCode != 200 {
            throw NSError(
                domain: "ZanaAI", code: httpResponse.statusCode,
                userInfo: [NSLocalizedDescriptionKey: "TTS Error \(httpResponse.statusCode)"])
        }

        if let json = try JSONSerialization.jsonObject(with: data) as? [String: Any],
            let candidates = json["candidates"] as? [[String: Any]],
            let content = candidates.first?["content"] as? [String: Any],
            let parts = content["parts"] as? [[String: Any]],
            let inlineData = parts.first?["inline_data"] as? [String: Any],
            let base64String = inlineData["data"] as? String,
            let audioData = Data(base64Encoded: base64String)
        {
            return audioData
        }

        throw URLError(.cannotParseResponse)
    }

    // Helper to centralize Model Logic - Matched to React Code
    private func getModelName(mode: ChatMode, useFallback: Bool) -> String {
        if useFallback { return "gemini-flash-lite-latest" }
        switch mode {
        case .fast: return "gemini-flash-lite-latest"
        case .deep: return "gemini-3-pro-preview"
        case .research: return "gemini-3-pro-preview"
        case .maps: return "gemini-2.5-flash"
        default: return "gemini-3-flash-preview"
        }
    }

    private func getModelConfig(mode: ChatMode, useFallback: Bool) -> (
        [[String: Any]]?, [String: Any]?
    ) {
        if useFallback { return (nil, nil) }
        switch mode {
        case .deep:
            return (nil, ["thinking_budget": 16000])
        case .research:
            return ([["googleSearch": [:]]], ["thinking_budget": 0])
        case .maps:
            // Match React config: { googleMaps: {} }
            return ([["googleMaps": [:]]], nil)
        default:
            return (nil, nil)
        }
    }
}

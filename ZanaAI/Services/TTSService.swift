import AVFoundation
import Foundation

class TTSService {
    static let shared = TTSService()
    private let player = ZanaAudioPlayer()
    private var isPlaying = false

    // Gemini 2.5 TTS Model
    private let modelName = "gemini-2.5-flash-preview-tts"  // Match react code

    func speak(_ text: String) {
        stop()  // Stop previous

        Task {
            do {
                let audioBase64 = try await generateAudio(text: text)
                await MainActor.run {
                    self.player.playBase64Audio(audioBase64)
                    self.isPlaying = true
                }
            } catch {
                print("TTS Error: \(error.localizedDescription)")
            }
        }
    }

    func stop() {
        player.stop()
        isPlaying = false
    }

    private func generateAudio(text: String) async throws -> String {
        let maxAttempts = 6
        var attempt = 0

        while attempt < maxAttempts {
            let apiKey = KeyManager.shared.getCurrentKey()
            let urlString =
                "https://generativelanguage.googleapis.com/v1beta/models/\(modelName):generateContent?key=\(apiKey)"
            guard let url = URL(string: urlString) else { throw URLError(.badURL) }

            var request = URLRequest(url: url)
            request.httpMethod = "POST"
            request.addValue("application/json", forHTTPHeaderField: "Content-Type")

            let body: [String: Any] = [
                "contents": [["parts": [["text": text]]]],
                "generationConfig": [
                    "response_modalities": ["AUDIO"],
                    "speech_config": [
                        "voice_config": ["prebuilt_voice_config": ["voice_name": "Kore"]]
                    ],
                ],
            ]

            request.httpBody = try JSONSerialization.data(withJSONObject: body)

            do {
                let (data, response) = try await URLSession.shared.data(for: request)

                if let httpResponse = response as? HTTPURLResponse {
                    let statusCode = httpResponse.statusCode
                    if statusCode == 429 || statusCode == 403 || statusCode == 500
                        || statusCode == 503
                    {
                        print("TTS Retryable Error (\(statusCode)). Rotating...")
                        KeyManager.shared.rotate()
                        attempt += 1
                        if attempt < maxAttempts {
                            let waitTime = 200.0 * pow(2.0, Double(attempt - 1))
                            try await Task.sleep(nanoseconds: UInt64(waitTime * 1_000_000))
                            continue
                        }
                    }
                    if !(200...299).contains(statusCode) {
                        throw URLError(.badServerResponse)
                    }
                }

                if let json = try JSONSerialization.jsonObject(with: data) as? [String: Any],
                    let candidates = json["candidates"] as? [[String: Any]],
                    let firstCandidate = candidates.first,
                    let content = firstCandidate["content"] as? [String: Any],
                    let parts = content["parts"] as? [[String: Any]],
                    let firstPart = parts.first,
                    let inlineData = firstPart["inline_data"] as? [String: Any],
                    let base64Data = inlineData["data"] as? String
                {
                    return base64Data
                }
            } catch {
                print("TTS Request Failed: \(error)")
                KeyManager.shared.rotate()
                attempt += 1
                if attempt < maxAttempts {
                    let waitTime = 200.0 * pow(2.0, Double(attempt - 1))
                    try? await Task.sleep(nanoseconds: UInt64(waitTime * 1_000_000))
                    continue
                }
            }
            break
        }
        throw NSError(
            domain: "ZanaTTS", code: -1,
            userInfo: [
                NSLocalizedDescriptionKey:
                    "ببورە، کێشەیەک لە پەیوەندی دروست بوو. تکایە دووبارە هەوڵ بدەرەوە."
            ])
    }
}

// MARK: - Audio Player (AVAudioEngine)
class ZanaAudioPlayer {
    private let engine = AVAudioEngine()
    private let playerNode = AVAudioPlayerNode()

    init() {
        engine.attach(playerNode)
        // Gemini TTS uses 24,000Hz Mono
        let format = AVAudioFormat(
            commonFormat: .pcmFormatInt16, sampleRate: 24000, channels: 1, interleaved: false)!
        engine.connect(playerNode, to: engine.mainMixerNode, format: format)

        do {
            try engine.start()
        } catch {
            print("Audio Engine Start Error: \(error)")
        }
    }

    func playBase64Audio(_ base64String: String) {
        guard let data = Data(base64Encoded: base64String) else { return }

        let format = AVAudioFormat(
            commonFormat: .pcmFormatInt16, sampleRate: 24000, channels: 1, interleaved: false)!
        let frameCount = UInt32(data.count) / format.streamDescription.pointee.mBytesPerFrame

        guard let buffer = AVAudioPCMBuffer(pcmFormat: format, frameCapacity: frameCount) else {
            return
        }
        buffer.frameLength = frameCount

        // Copy raw bytes
        data.withUnsafeBytes { (rawBufferPointer: UnsafeRawBufferPointer) in
            if let baseAddress = rawBufferPointer.baseAddress,
                let channelData = buffer.int16ChannelData
            {
                memcpy(channelData[0], baseAddress, data.count)
            }
        }

        if !engine.isRunning { try? engine.start() }

        playerNode.scheduleBuffer(
            buffer, at: nil, options: .interruptsAtLoop, completionHandler: nil)
        playerNode.play()
    }

    func stop() {
        playerNode.stop()
    }
}

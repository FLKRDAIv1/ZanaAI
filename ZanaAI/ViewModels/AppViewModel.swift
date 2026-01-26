import Combine
import Network
import PhotosUI
import SwiftUI

@MainActor
class AppViewModel: ObservableObject {
    @Published var isAuthenticated = false
    @Published var sessions: [ChatSession] = []
    @Published var currentSessionId: UUID?

    @Published var promptToSend: String = ""
    @Published var isLoading: Bool = false
    @Published var attachmentsToSend: [Attachment] = []
    @Published var modeToSend: ChatMode = .standard

    @AppStorage("hasSeenOnboarding") var hasSeenOnboarding: Bool = false
    @AppStorage("glowIntensity") var glowIntensity: Double = 1.0
    @AppStorage("animationSpeed") var animationSpeed: Double = 1.0
    @AppStorage("isLargeText") var isLargeText: Bool = false
    @AppStorage("selectedTheme") var selectedTheme: AppTheme = .white

    @Environment(\.scenePhase) private var scenePhase
    private var isAppInBackground = false

    @Published var currentLoadingPhrase: String = ""
    private var loadingTimer: Timer?

    private let loadingPhrases = [
        "بەمزوانە وەڵامت دەدەمەوە...",
        "تکایە چاوەڕێ بکە...",
        "ڕاوە با بیر بکەمەوە...",
        "وابزانم بەبیرم هات...",
        "ببورە ئەوەی داوات کرد ڕەتی دەکەمەوە... یان ڕاوەستە ئێستا بەبیرم هات...",
        "ههمم ڕاوە...",
        "چاوەڕێ بکە بۆ وەڵامدانەوە...",
    ]

    @Published var isSidebarOpen = false
    @Published var isSettingsOpen = false

    // New Properties from Snippet
    @Published var isOffline: Bool = false
    private let monitor = NWPathMonitor()
    private let monitorQueue = DispatchQueue(label: "NetworkMonitor")

    @Published var locationManager = LocationManager()

    var currentMessages: [Message] {
        get {
            guard let id = currentSessionId, let session = sessions.first(where: { $0.id == id })
            else { return [] }
            return session.messages
        }
        set {
            if let index = sessions.firstIndex(where: { $0.id == currentSessionId }) {
                sessions[index].messages = newValue
                sessions[index].updatedAt = Date()
            }
        }
    }

    init() {
        if let data = UserDefaults.standard.data(forKey: "chat_sessions"),
            let decoded = try? JSONDecoder().decode([ChatSession].self, from: data)
        {
            self.sessions = decoded
            if !sessions.isEmpty { self.currentSessionId = sessions[0].id }
        } else {
            createNewSession()
        }
        self.isAuthenticated = UserDefaults.standard.bool(forKey: "is_authenticated")
        setupNetworkMonitor()
        NotificationManager.shared.requestAuthorization()
    }

    private func setupNetworkMonitor() {
        monitor.pathUpdateHandler = { [weak self] path in
            Task { @MainActor in
                self?.isOffline = path.status != .satisfied
            }
        }
        monitor.start(queue: monitorQueue)
    }

    func startLoadingTimer() {
        currentLoadingPhrase = loadingPhrases.randomElement() ?? ""
        loadingTimer?.invalidate()
        loadingTimer = Timer.scheduledTimer(withTimeInterval: 3.0, repeats: true) { [weak self] _ in
            Task { @MainActor in
                self?.currentLoadingPhrase = self?.loadingPhrases.randomElement() ?? ""
            }
        }
    }

    func stopLoadingTimer() {
        loadingTimer?.invalidate()
        loadingTimer = nil
    }

    func exportChat() {
        guard let id = currentSessionId, let session = sessions.first(where: { $0.id == id }) else {
            return
        }
        let text = session.messages.map {
            "\($0.isUser ? "You" : "Zana AI"):\n\($0.content)\n-------------------"
        }.joined(separator: "\n\n")

        let filename = session.title.replacingOccurrences(of: " ", with: "_") + ".txt"
        let tempURL = FileManager.default.temporaryDirectory.appendingPathComponent(filename)

        do {
            try text.write(to: tempURL, atomically: true, encoding: .utf8)
            shareURL = tempURL
        } catch {
            print("Export failed")
        }
    }

    @Published var shareURL: URL? = nil

    func completeAuth() {
        withAnimation {
            isAuthenticated = true
            UserDefaults.standard.set(true, forKey: "is_authenticated")
        }
    }

    func requestAllPermissions() {
        NotificationManager.shared.requestAuthorization()
        locationManager.requestPermission()
    }

    func completeOnboarding() {
        withAnimation {
            hasSeenOnboarding = true
        }
    }

    func createNewSession() {
        let newSession = ChatSession(title: "New Chat ✨", messages: [], updatedAt: Date())
        sessions.insert(newSession, at: 0)
        currentSessionId = newSession.id
        saveSessions()
    }

    func deleteSession(id: UUID) {
        sessions.removeAll { $0.id == id }
        if currentSessionId == id {
            currentSessionId = sessions.first?.id ?? nil
            if currentSessionId == nil { createNewSession() }
        }
        saveSessions()
    }

    func renameSession(id: UUID, newTitle: String) {
        if !newTitle.trimmingCharacters(in: .whitespaces).isEmpty,
            let index = sessions.firstIndex(where: { $0.id == id })
        {
            sessions[index].title = newTitle
            saveSessions()
        }
    }

    func saveSessions() {
        if let encoded = try? JSONEncoder().encode(sessions) {
            UserDefaults.standard.set(encoded, forKey: "chat_sessions")

            // Sync with Widgets
            if let current = sessions.first(where: { $0.id == currentSessionId }) {
                let totalCount = sessions.reduce(0) { $0 + $1.messages.count }
                let snippet = current.messages.last?.content ?? "No messages yet"
                WidgetDataManager.shared.updateWidgetData(
                    title: current.title,
                    message: snippet,
                    totalCount: totalCount
                )
            }
        }
    }

    func sendMessage(text: String? = nil) {
        let input = text ?? promptToSend
        let trimmedInput = input.trimmingCharacters(in: .whitespaces)
        guard !trimmedInput.isEmpty || !attachmentsToSend.isEmpty else { return }

        let currentAttachments = attachmentsToSend
        let userMsg = Message(
            content: trimmedInput, isUser: true, timestamp: Date(),
            attachments: currentAttachments.isEmpty ? nil : currentAttachments,
            mode: modeToSend
        )

        // Trigger user send haptic
        NotificationManager.Haptic.shared.trigger(.medium)

        var newTitle: String? = nil
        if var session = sessions.first(where: { $0.id == currentSessionId }) {
            session.messages.append(userMsg)
            if session.messages.count == 1 {
                let title = trimmedInput.prefix(30)
                newTitle = String(title.isEmpty ? "Image Chat" : title) + " ✨"
                session.title = newTitle!

                // Trigger Welcome Notification
                NotificationManager.shared.sendWelcomeNotification()
            }
            if let index = sessions.firstIndex(where: { $0.id == currentSessionId }) {
                sessions[index] = session
            }
        }

        let currentPrompt = trimmedInput.isEmpty ? "Describe these attachments" : trimmedInput
        let currentMode = modeToSend

        promptToSend = ""
        attachmentsToSend = []
        isLoading = true
        startLoadingTimer()

        Task {
            do {
                let aiMsgId = UUID()
                let aiMsg = Message(
                    id: aiMsgId,
                    content: "",
                    isUser: false,
                    timestamp: Date(),
                    mode: currentMode,
                    isLoading: true
                )

                await MainActor.run {
                    withAnimation {
                        if let index = self.sessions.firstIndex(where: {
                            $0.id == self.currentSessionId
                        }) {
                            self.sessions[index].messages.append(aiMsg)
                            self.saveSessions()
                        }
                    }
                }

                let history = self.getHistory()
                let locationContext =
                    "\(self.locationManager.cityName), \(self.locationManager.region)"
                let stream = GeminiService.shared.generateContentStream(
                    prompt: currentPrompt,
                    attachments: currentAttachments.isEmpty ? nil : currentAttachments,
                    history: history,
                    locationContext: locationContext,
                    isLargeText: self.isLargeText,
                    mode: currentMode
                )

                for try await (text, sources) in stream {
                    await MainActor.run {
                        if let sessionIndex = self.sessions.firstIndex(where: {
                            $0.id == self.currentSessionId
                        }),
                            let msgIndex = self.sessions[sessionIndex].messages.firstIndex(where: {
                                $0.id == aiMsgId
                            })
                        {
                            self.sessions[sessionIndex].messages[msgIndex].content = text
                            self.sessions[sessionIndex].messages[msgIndex].sources = sources
                        }

                        // ChatGPT-style subtle tactile feedback while streaming
                        NotificationManager.Haptic.shared.selection()
                    }
                }

                await MainActor.run {
                    if let sessionIndex = self.sessions.firstIndex(where: {
                        $0.id == self.currentSessionId
                    }),
                        let msgIndex = self.sessions[sessionIndex].messages.firstIndex(where: {
                            $0.id == aiMsgId
                        })
                    {
                        self.sessions[sessionIndex].messages[msgIndex].isLoading = false
                    }
                    self.stopLoadingTimer()
                    self.saveSessions()
                    self.isLoading = false

                    // Trigger professional AI response notification & haptic
                    NotificationManager.shared.sendAIResponseReady()
                }

            } catch {
                await MainActor.run {
                    self.stopLoadingTimer()
                    let errorMsg = Message(
                        content: "Error: \(error.localizedDescription) - Try again.", isUser: false,
                        timestamp: Date(), mode: currentMode, isLoading: false)
                    if let index = self.sessions.firstIndex(where: {
                        $0.id == self.currentSessionId
                    }) {
                        self.sessions[index].messages.append(errorMsg)
                    }
                    self.isLoading = false
                }
            }
        }
    }

    func scanAttachments() {
        guard !attachmentsToSend.isEmpty && !isLoading else { return }
        isLoading = true
        startLoadingTimer()

        Task {
            do {
                let caption = try await GeminiService.shared.generateCaption(
                    attachments: attachmentsToSend)
                await MainActor.run {
                    self.promptToSend =
                        (self.promptToSend.isEmpty ? "" : self.promptToSend + "\n") + caption
                    self.stopLoadingTimer()
                    self.isLoading = false
                }
            } catch {
                await MainActor.run {
                    self.stopLoadingTimer()
                    self.isLoading = false
                }
            }
        }
    }

    func addAttachment(data: Data, mimeType: String, fileName: String) {
        attachmentsToSend.append(Attachment(data: data, mimeType: mimeType, fileName: fileName))
    }

    private func getHistory() -> [[String: Any]] {
        guard let id = currentSessionId, let session = sessions.first(where: { $0.id == id }) else {
            return []
        }

        let validMessages = session.messages.filter {
            !$0.isLoading && (!$0.content.isEmpty || ($0.attachments?.count ?? 0) > 0)
        }
        // We take the last 10 messages *before* the one we just added
        let historyLimit = 10
        let historyMessages = validMessages.suffix(historyLimit + 1).dropLast()

        return historyMessages.compactMap { msg in
            var parts: [[String: Any]] = []
            if !msg.content.isEmpty {
                parts.append(["text": msg.content])
            }
            if let attachments = msg.attachments {
                for att in attachments {
                    parts.append([
                        "inline_data": [
                            "mime_type": att.mimeType,
                            "data": att.data.base64EncodedString(),
                        ]
                    ])
                }
            }
            return [
                "role": msg.isUser ? "user" : "model",
                "parts": parts,
            ]
        }
    }
    func endCurrentSession() {
        guard let id = currentSessionId, let session = sessions.first(where: { $0.id == id }) else {
            return
        }

        let count = session.messages.count
        NotificationManager.shared.sendSessionSummaryNotification(messageCount: count)

        // Short delay for the second notification
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
            NotificationManager.shared.sendFinishPrompt(about: session.title)
        }
    }

    func deleteMessage(sessionId: UUID, messageId: UUID) {
        if let sIndex = sessions.firstIndex(where: { $0.id == sessionId }) {
            sessions[sIndex].messages.removeAll(where: { $0.id == messageId })
            saveSessions()
        }
    }

    func clearAllHistory() {
        sessions = []
        createNewSession()
        saveSessions()
    }

    func regenerateLastMessage() {
        guard let id = currentSessionId,
            let session = sessions.first(where: { $0.id == id }),
            let lastUserMsg = session.messages.last(where: { $0.isUser })
        else { return }

        // Remove the last AI message if it exists
        if let lastMsg = session.messages.last, !lastMsg.isUser {
            deleteMessage(sessionId: id, messageId: lastMsg.id)
        }

        // Re-send the last prompt
        sendMessage(text: lastUserMsg.content)
    }
}

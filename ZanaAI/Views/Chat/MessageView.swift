import SwiftUI

struct MessageView: View {
    let message: Message
    let isLastMessage: Bool

    @ObservedObject var appViewModel: AppViewModel  // To access currentLoadingPhrase
    @State private var showCopiedToast = false

    var isUser: Bool { message.isUser }

    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            if isUser {
                Spacer()
                VStack(alignment: .trailing, spacing: 8) {
                    // Attachments for User
                    if let attachments = message.attachments {
                        attachmentGrid(attachments)
                    }

                    if !message.content.isEmpty {
                        contentView
                            .padding(12)
                            .background(DesignSystem.Gradients.userBubble)
                            .foregroundStyle(.white)
                            .cornerRadius(20, corners: [.topLeft, .topRight, .bottomLeft])
                    }
                }
            } else {
                VStack(alignment: .leading, spacing: 8) {
                    HStack(alignment: .bottom, spacing: 10) {
                        // Official AI Logo Avatar
                        ZStack {
                            Circle()
                                .fill(DesignSystem.Colors.neonBlue.opacity(0.12))
                                .frame(width: 30, height: 30)
                            Image("AppLogo")
                                .resizable()
                                .aspectRatio(contentMode: .fit)
                                .frame(width: 22, height: 22)
                                .shadow(color: DesignSystem.Colors.neonBlue.opacity(0.2), radius: 4)
                        }
                        .padding(.bottom, 2)

                        VStack(alignment: .leading, spacing: 6) {
                            // Loading State
                            if message.isLoading && message.content.isEmpty {
                                VStack(alignment: .leading, spacing: 12) {
                                    ThinkingIndicator(selectedTheme: appViewModel.selectedTheme)
                                    Text(appViewModel.currentLoadingPhrase)
                                        .font(.ibmPlexArabic(size: 10, relativeTo: .caption2))
                                        .italic()
                                        .foregroundStyle(
                                            appViewModel.selectedTheme == .white
                                                ? .gray : .white.opacity(0.7))
                                }
                            } else {
                                // Text Content
                                contentView
                                    .font(.ibmPlexArabic(size: 16, relativeTo: .body))
                                    .foregroundStyle(
                                        appViewModel.selectedTheme == .white ? .black : .white)
                            }
                        }
                        .environment(\.layoutDirection, .rightToLeft)
                    }

                    // Sources (outside the pill for better readability of secondary info)
                    if let sources = message.sources, !sources.isEmpty {
                        VStack(alignment: .leading, spacing: 12) {
                            // Maps specialized view
                            ForEach(sources) { source in
                                if source.uri.contains("google.com/maps")
                                    || source.uri.contains("maps.google.com")
                                {
                                    MapEmbedView(title: source.title)
                                        .transition(.move(edge: .bottom).combined(with: .opacity))
                                }
                            }

                            Text("سەرچاوەکان:")
                                .font(
                                    .ibmPlexArabic(size: 10, weight: .bold, relativeTo: .caption2)
                                )
                                .foregroundStyle(.secondary)

                            ScrollView(.horizontal, showsIndicators: false) {
                                HStack(spacing: 12) {
                                    ForEach(sources) { source in
                                        GlowingSourceView(
                                            source: source,
                                            intensity: appViewModel.glowIntensity)
                                    }
                                }
                                .padding(.vertical, 4)
                            }
                        }
                        .padding(.leading, 38)  // Align with text start
                        .padding(.top, 4)
                    }

                    // Actions
                    HStack(spacing: 20) {
                        Button(action: {
                            UIPasteboard.general.string = message.content
                            withAnimation { showCopiedToast = true }
                            DispatchQueue.main.asyncAfter(deadline: .now() + 2) {
                                showCopiedToast = false
                            }
                        }) {
                            Image(systemName: showCopiedToast ? "checkmark" : "doc.on.doc")
                                .font(.caption)
                                .foregroundStyle(.gray)
                        }

                        Button(action: { TTSService.shared.speak(message.content) }) {
                            Image(systemName: "speaker.wave.2")
                                .font(.caption)
                                .foregroundStyle(.gray)
                        }

                        if isLastMessage {
                            Button(action: {
                                appViewModel.regenerateLastMessage()
                            }) {
                                Image(systemName: "arrow.clockwise")
                                    .font(.caption)
                                    .foregroundStyle(.gray)
                            }
                        }
                    }
                    .padding(.top, 4)
                }
            }
            Spacer()
        }
        .padding(.horizontal)
        .padding(.vertical, 8)
        .contextMenu {
            Button(action: { UIPasteboard.general.string = message.content }) {
                Label("Copy", systemImage: "doc.on.doc")
            }
            Button(action: { TTSService.shared.speak(message.content) }) {
                Label("Speak", systemImage: "speaker.wave.2")
            }
            Button(
                role: .destructive,
                action: {
                    if let sessionId = appViewModel.currentSessionId {
                        appViewModel.deleteMessage(sessionId: sessionId, messageId: message.id)
                    }
                }
            ) {
                Label("Delete", systemImage: "trash")
            }
        }
    }

    @ViewBuilder
    func attachmentGrid(_ attachments: [Attachment]) -> some View {
        let columns = [GridItem(.flexible()), GridItem(.flexible())]
        LazyVGrid(columns: columns, spacing: 8) {
            ForEach(attachments) { attachment in
                if let uiImage = UIImage(data: attachment.data) {
                    Image(uiImage: uiImage)
                        .resizable()
                        .scaledToFill()
                        .frame(width: 120, height: 120)
                        .cornerRadius(12)
                }
            }
        }
        .frame(maxWidth: 250)
    }

    @ViewBuilder
    var contentView: some View {
        let parts = parseMessageParts(message.content)
        VStack(alignment: .leading, spacing: 12) {
            ForEach(parts.indices, id: \.self) { index in
                let part = parts[index]
                switch part.type {
                case .text:
                    FormattedTextView(text: part.content)
                        .fixedSize(horizontal: false, vertical: true)
                case .code(let lang):
                    CodeBlockView(code: part.content, language: lang)
                case .chart(let payload):
                    AIChartView(payload: payload, title: "Data Visualization")
                }
            }
        }
    }

    // Simple parser helper
    struct MessagePart: Identifiable {
        let id = UUID()
        enum PartType {
            case text
            case code(language: String)
            case chart(payload: ChartPayload)
        }
        let type: PartType
        let content: String
    }

    func parseMessageParts(_ text: String) -> [MessagePart] {
        var parts: [MessagePart] = []
        // Split by Chart Data first - using the Strict Schema tags relative to [DATA_START]
        let chartComponents = text.components(separatedBy: "[DATA_START]")

        for (cIndex, component) in chartComponents.enumerated() {
            if cIndex > 0 {
                // This component starts with chart data, find the end tag
                if let range = component.range(of: "[DATA_END]") {
                    let jsonString = String(component[..<range.lowerBound])
                    let remainingText = String(component[range.upperBound...])

                    if let data = jsonString.data(using: .utf8),
                        let payload = try? JSONDecoder().decode(ChartPayload.self, from: data)
                    {
                        parts.append(.init(type: .chart(payload: payload), content: ""))
                    }

                    // Parse remaining text for code blocks
                    parts.append(contentsOf: parseCodeBlocks(remainingText))
                    continue
                }
            }
            // Parse for code blocks (normal text)
            parts.append(contentsOf: parseCodeBlocks(component))
        }
        return parts
    }

    func parseCodeBlocks(_ text: String) -> [MessagePart] {
        var parts: [MessagePart] = []
        let components = text.components(separatedBy: "```")
        for (index, component) in components.enumerated() {
            if index % 2 == 0 {
                if !component.isEmpty {
                    parts.append(.init(type: .text, content: component))
                }
            } else {
                let lines = component.split(
                    separator: "\n", maxSplits: 1, omittingEmptySubsequences: false)
                let lang = lines.first?.trimmingCharacters(in: .whitespaces) ?? ""
                let code = lines.count > 1 ? String(lines[1]) : String(lines.first ?? "")
                parts.append(
                    .init(
                        type: .code(language: lang),
                        content: code.trimmingCharacters(in: .whitespacesAndNewlines)))
            }
        }
        return parts
    }
}

struct ThinkingIndicator: View {
    let selectedTheme: AppTheme
    @State private var phase = 0.0

    var body: some View {
        HStack(spacing: 4) {
            ForEach(0..<3) { i in
                Circle()
                    .fill(
                        selectedTheme == .white ? Color.gray : Color.white.opacity(0.5)
                    )
                    .frame(width: 6, height: 6)
                    .scaleEffect(phase + Double(i) * 0.2 > 0.5 ? 1.2 : 0.8)
                    .opacity(phase + Double(i) * 0.2 > 0.5 ? 1 : 0.4)
            }
        }
        .onAppear {
            withAnimation(.linear(duration: 1).repeatForever(autoreverses: false)) {
                phase = 1.0
            }
        }
        .padding(8)
    }
}

// RoundedCorner shape helper
extension View {
    func cornerRadius(_ radius: CGFloat, corners: UIRectCorner) -> some View {
        clipShape(RoundedCorner(radius: radius, corners: corners))
    }
}

struct RoundedCorner: Shape {
    var radius: CGFloat = .infinity
    var corners: UIRectCorner = .allCorners

    func path(in rect: CGRect) -> Path {
        let path = UIBezierPath(
            roundedRect: rect, byRoundingCorners: corners,
            cornerRadii: CGSize(width: radius, height: radius))
        return Path(path.cgPath)
    }
}

struct GlowingSourceView: View {
    let source: Source
    let intensity: Double
    @State private var isGlowing = false

    var body: some View {
        Link(destination: URL(string: source.uri)!) {
            HStack(spacing: 6) {
                Image(systemName: "link")
                    .font(.system(size: 8))
                Text(source.title)
                    .font(.system(size: 10, weight: .medium))
            }
            .padding(.horizontal, 10)
            .padding(.vertical, 6)
            .background(
                Capsule()
                    .fill(Color.white.opacity(0.1))
                    .overlay(
                        Capsule()
                            .stroke(
                                LinearGradient(
                                    colors: [
                                        DesignSystem.Colors.neonBlue,
                                        DesignSystem.Colors.neonPurple,
                                    ],
                                    startPoint: .leading,
                                    endPoint: .trailing
                                ),
                                lineWidth: (isGlowing ? 1.5 : 0.5) * intensity
                            )
                            .blur(radius: isGlowing ? CGFloat(2 * intensity) : 0)
                    )
            )
            .foregroundStyle(.white)
            .shadow(
                color: DesignSystem.Colors.neonBlue.opacity(isGlowing ? 0.6 * intensity : 0),
                radius: CGFloat(6 * intensity))
        }
        .onAppear {
            withAnimation(.easeInOut(duration: 1.5).repeatForever(autoreverses: true)) {
                isGlowing = true
            }
        }
    }
}

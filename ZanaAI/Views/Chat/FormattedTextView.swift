import SwiftUI

struct FormattedTextView: View {
    let text: String

    @AppStorage("isLargeText") private var isLargeText = false

    var body: some View {
        let scaleFactor: CGFloat = isLargeText ? 1.5 : 1.0

        VStack(alignment: .leading, spacing: 8) {
            ForEach(parseRichText(text)) { block in
                switch block.type {
                case .header1(let content):
                    Text(content)
                        .font(
                            .ibmPlexArabic(
                                size: 24 * scaleFactor, weight: .bold, relativeTo: .title2)
                        )
                        .lineSpacing(6 * scaleFactor)
                        .foregroundStyle(.primary)
                        .padding(.top, 10)
                case .header2(let content):
                    Text(content)
                        .font(
                            .ibmPlexArabic(
                                size: 20 * scaleFactor, weight: .semibold, relativeTo: .title3)
                        )
                        .lineSpacing(5 * scaleFactor)
                        .foregroundStyle(.primary.opacity(0.9))
                        .padding(.top, 6)
                case .math(let content):
                    MathCardView(equation: content)
                case .bullet(let content, let level):
                    HStack(alignment: .top, spacing: 12) {
                        Text(level == 0 ? "●" : "○")
                            .font(.system(size: 10))
                            .padding(.top, 6)
                            .foregroundStyle(DesignSystem.Colors.neonBlue)
                        Text(LocalizedStringKey(content))
                            .font(.ibmPlexArabic(size: 17 * scaleFactor, relativeTo: .body))
                            .lineSpacing(6 * scaleFactor)
                            .multilineTextAlignment(.leading)
                    }
                    .padding(.leading, CGFloat(level * 20))
                case .paragraph(let content):
                    Text(LocalizedStringKey(content))
                        .font(.ibmPlexArabic(size: 17 * scaleFactor, relativeTo: .body))
                        .lineSpacing(8 * scaleFactor)
                        .multilineTextAlignment(.leading)
                        .fixedSize(horizontal: false, vertical: true)
                }
            }
        }
        .environment(\.layoutDirection, .rightToLeft)
        .multilineTextAlignment(.leading)
    }

    struct RichTextBlock: Identifiable {
        let id = UUID()
        enum BlockType {
            case header1(String)
            case header2(String)
            case math(String)
            case bullet(String, Int)
            case paragraph(String)
        }
        let type: BlockType
    }

    func parseRichText(_ rawText: String) -> [RichTextBlock] {
        var blocks: [RichTextBlock] = []

        // Split by Math Blocks $$ ... $$
        let mathComponents = rawText.components(separatedBy: "$$")

        for (index, component) in mathComponents.enumerated() {
            if index % 2 != 0 {
                let equation = component.trimmingCharacters(in: .whitespacesAndNewlines)
                if !equation.isEmpty {
                    blocks.append(.init(type: .math(equation)))
                }
            } else {
                let lines = component.components(separatedBy: "\n")
                var currentParagraphBuffer = ""

                for line in lines {
                    let trimmed = line.trimmingCharacters(in: .whitespaces)
                    if trimmed.isEmpty {
                        if !currentParagraphBuffer.isEmpty {
                            blocks.append(.init(type: .paragraph(currentParagraphBuffer)))
                            currentParagraphBuffer = ""
                        }
                        continue
                    }

                    if trimmed.hasPrefix("### ") {
                        if !currentParagraphBuffer.isEmpty {
                            blocks.append(.init(type: .paragraph(currentParagraphBuffer)))
                            currentParagraphBuffer = ""
                        }
                        blocks.append(.init(type: .header1(String(trimmed.dropFirst(4)))))
                    } else if trimmed.hasPrefix("## ") {
                        if !currentParagraphBuffer.isEmpty {
                            blocks.append(.init(type: .paragraph(currentParagraphBuffer)))
                            currentParagraphBuffer = ""
                        }
                        blocks.append(.init(type: .header2(String(trimmed.dropFirst(3)))))
                    } else if trimmed.hasPrefix("- ") || trimmed.hasPrefix("* ") {
                        if !currentParagraphBuffer.isEmpty {
                            blocks.append(.init(type: .paragraph(currentParagraphBuffer)))
                            currentParagraphBuffer = ""
                        }
                        // Detect indentation level
                        let leadingSpaces = line.prefix(while: { $0 == " " }).count
                        let level = leadingSpaces / 2
                        blocks.append(.init(type: .bullet(String(trimmed.dropFirst(2)), level)))
                    } else {
                        if !currentParagraphBuffer.isEmpty {
                            currentParagraphBuffer += "\n" + line
                        } else {
                            currentParagraphBuffer = line
                        }
                    }
                }

                if !currentParagraphBuffer.isEmpty {
                    blocks.append(.init(type: .paragraph(currentParagraphBuffer)))
                }
            }
        }
        return blocks
    }
}

struct MathCardView: View {
    let equation: String

    var body: some View {
        HStack(spacing: 12) {
            ZStack {
                Circle()
                    .fill(DesignSystem.Colors.neonPurple.opacity(0.2))
                    .frame(width: 32, height: 32)
                Image(systemName: "function")
                    .font(.system(size: 14, weight: .bold))
                    .foregroundStyle(DesignSystem.Colors.neonPurple)
            }

            Text(equation)
                .font(.system(.body, design: .monospaced))
                .fontWeight(.bold)
                .foregroundStyle(.primary)

            Spacer()
        }
        .padding(16)
        .background(
            ZStack {
                Color.purple.opacity(0.05)
                DesignSystem.Colors.neonPurple.opacity(0.02)
            }
        )
        .cornerRadius(16)
        .overlay(
            RoundedRectangle(cornerRadius: 16)
                .stroke(
                    LinearGradient(
                        colors: [
                            DesignSystem.Colors.neonPurple.opacity(0.5),
                            DesignSystem.Colors.neonBlue.opacity(0.3),
                        ],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    ),
                    lineWidth: 1.5
                )
        )
        .padding(.vertical, 4)
    }
}

import SwiftUI

struct CodeBlockView: View {
    let code: String
    let language: String
    @State private var isCopied = false

    @AppStorage("isLargeText") private var isLargeText = false

    var body: some View {
        let scaleFactor: CGFloat = isLargeText ? 1.4 : 1.0

        VStack(alignment: .leading, spacing: 0) {
            // Terminal Header
            HStack(spacing: 8) {
                HStack(spacing: 6) {
                    Circle().fill(Color.red.opacity(0.8)).frame(width: 10, height: 10)
                    Circle().fill(Color.yellow.opacity(0.8)).frame(width: 10, height: 10)
                    Circle().fill(Color.green.opacity(0.8)).frame(width: 10, height: 10)
                }
                .padding(.leading, 12)

                Spacer()

                Text(language.lowercased())
                    .font(.ibmPlexArabic(size: 10))
                    .foregroundStyle(.gray)

                Spacer()

                Button(action: {
                    UIPasteboard.general.string = code
                    withAnimation { isCopied = true }
                    DispatchQueue.main.asyncAfter(deadline: .now() + 2) { isCopied = false }
                }) {
                    Image(systemName: isCopied ? "checkmark" : "doc.on.doc")
                        .font(.system(size: 14))
                        .foregroundStyle(isCopied ? .green : .gray)
                }
                .padding(.trailing, 12)
            }
            .frame(height: 36)
            .background(Color(white: 0.15))

            if language == "graph" {
                GraphView(jsonString: code)
            } else {
                ScrollView(.horizontal) {
                    Text(code)
                        .font(
                            .system(size: 14 * scaleFactor, weight: .regular, design: .monospaced)
                        )
                        .padding(16)
                        .foregroundStyle(.white.opacity(0.9))
                }
            }
        }
        .background(Color(white: 0.05))
        .cornerRadius(12)
        .overlay(RoundedRectangle(cornerRadius: 12).stroke(Color.white.opacity(0.1), lineWidth: 1))
        .padding(.vertical, 4)
    }
}

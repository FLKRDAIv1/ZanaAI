import SwiftUI

struct ModeSelector: View {
    @Binding var currentMode: ChatMode
    @Binding var isOpen: Bool

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            ForEach(ChatMode.allCases, id: \.self) { mode in
                Button(action: {
                    currentMode = mode
                    withAnimation { isOpen = false }
                }) {
                    HStack {
                        Image(systemName: mode.icon)
                            .font(.system(size: 20))
                            .frame(width: 30)
                        VStack(alignment: .leading) {
                            Text(mode.rawValue).font(.headline)
                            Text(mode.description).font(.caption).foregroundStyle(.gray)
                        }
                        Spacer()
                        if currentMode == mode {
                            Image(systemName: "checkmark").font(.caption)
                        }
                    }
                    .foregroundStyle(currentMode == mode ? .white : .gray)
                    .padding(8)
                    .background(currentMode == mode ? Color.white.opacity(0.1) : Color.clear)
                    .cornerRadius(12)
                }
            }
        }
        .padding()
        .background(.ultraThinMaterial)
        .cornerRadius(20)
        .shadow(radius: 20)
        .frame(width: 250)
        .padding(.bottom, 80)
    }
}

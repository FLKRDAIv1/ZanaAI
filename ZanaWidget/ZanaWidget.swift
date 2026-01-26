import Intents
import SwiftUI
import WidgetKit

struct Provider: TimelineProvider {
    func placeholder(in context: Context) -> ZanaEntry {
        ZanaEntry(
            date: Date(), title: "Zana AI ✨", message: "Intelligence waiting...", totalMessages: 0)
    }

    func getSnapshot(in context: Context, completion: @escaping (ZanaEntry) -> Void) {
        let entry = ZanaEntry(
            date: Date(), title: "Last Chat", message: "Hello Zana!", totalMessages: 42)
        completion(entry)
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<Entry>) -> Void) {
        var entries: [ZanaEntry] = []

        // Fetch data from shared Link/AppGroup
        let widgetData = WidgetDataManager.shared.getWidgetData()

        let entry = ZanaEntry(
            date: Date(),
            title: widgetData?.lastChatTitle ?? "Zana AI ✨",
            message: widgetData?.lastMessageSnippet ?? "Tap to start chatting",
            totalMessages: widgetData?.totalMessages ?? 0
        )
        entries.append(entry)

        let timeline = Timeline(entries: entries, policy: .atEnd)
        completion(timeline)
    }
}

struct ZanaEntry: TimelineEntry {
    let date: Date
    let title: String
    let message: String
    let totalMessages: Int
}

struct ZanaWidgetEntryView: View {
    var entry: Provider.Entry
    @Environment(\.widgetFamily) var family

    var body: some View {
        ZStack {
            // Premium Gradient Background (Matches App)
            LinearGradient(
                colors: [Color(hex: "050510"), Color(hex: "1A1A2E")],
                startPoint: .top,
                endPoint: .bottom
            )

            // Glassmorphic Shell
            VStack(alignment: .leading, spacing: 8) {
                HStack {
                    Image("AppLogo")  // Uses shared asset catalog
                        .resizable()
                        .frame(width: 24, height: 24)
                        .cornerRadius(6)

                    Text("Zana AI")
                        .font(.system(size: 14, weight: .bold))
                        .foregroundColor(.white)

                    Spacer()

                    if family != .systemSmall {
                        Text("\(entry.totalMessages) Units")
                            .font(.system(size: 10, weight: .black))
                            .padding(.horizontal, 6)
                            .padding(.vertical, 2)
                            .background(Color(hex: "00F0FF"))
                            .cornerRadius(4)
                            .foregroundColor(.black)
                    }
                }

                Spacer()

                VStack(alignment: .leading, spacing: 2) {
                    Text(entry.title)
                        .font(.system(size: 12, weight: .bold))
                        .foregroundColor(Color(hex: "00F0FF"))
                        .lineLimit(1)

                    Text(entry.message)
                        .font(.system(size: 11))
                        .foregroundColor(.white.opacity(0.8))
                        .lineLimit(family == .systemSmall ? 2 : 3)
                }
            }
            .padding()
        }
    }
}

@main
struct ZanaWidget: Widget {
    let kind: String = "ZanaWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: Provider()) { entry in
            ZanaWidgetEntryView(entry: entry)
        }
        .configurationDisplayName("Zana Intelligence")
        .description("Track your last chats and intelligence analytics.")
        .supportedFamilies([.systemSmall, .systemMedium, .systemLarge])
    }
}

// Minimalist Hex helper for Widget context
extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let r: UInt64
        let g: UInt64
        let b: UInt64
        switch hex.count {
        case 6: (r, g, b) = (int >> 16, int >> 8 & 0xFF, int & 0xFF)
        default: (r, g, b) = (1, 1, 1)
        }
        self.init(
            .sRGB, red: Double(r) / 255.0, green: Double(g) / 255.0, blue: Double(b) / 255.0,
            opacity: 1.0)
    }
}

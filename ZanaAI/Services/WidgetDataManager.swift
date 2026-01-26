import Foundation
import WidgetKit

struct WidgetData: Codable {
    let lastChatTitle: String
    let lastMessageSnippet: String
    let totalMessages: Int
    let lastActiveDate: Date
}

class WidgetDataManager {
    static let shared = WidgetDataManager()

    // Note: In a real app, this would use an App Group ID like "group.flkrdstudio.ZanaAI"
    // For this demonstration, we'll use a standard key but design for AppGroup logic.
    private let suiteName = "group.flkrdstudio.ZanaAI"
    private let storageKey = "zana_widget_data"

    private init() {}

    func updateWidgetData(title: String, message: String, totalCount: Int) {
        let data = WidgetData(
            lastChatTitle: title,
            lastMessageSnippet: message,
            totalMessages: totalCount,
            lastActiveDate: Date()
        )

        if let encoded = try? JSONEncoder().encode(data) {
            let defaults = UserDefaults(suiteName: suiteName) ?? .standard
            defaults.set(encoded, forKey: storageKey)

            // Reload the widget timeline
            WidgetCenter.shared.reloadAllTimelines()
            print("✅ Widget data updated and timeline reloaded.")
        }
    }

    func getWidgetData() -> WidgetData? {
        let defaults = UserDefaults(suiteName: suiteName) ?? .standard
        if let data = defaults.data(forKey: storageKey),
            let decoded = try? JSONDecoder().decode(WidgetData.self, from: data)
        {
            return decoded
        }
        return nil
    }
}

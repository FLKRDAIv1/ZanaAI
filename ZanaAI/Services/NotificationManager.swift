import UIKit  // Added for Haptic Feedback Generators
import UserNotifications

class NotificationManager {
    static let shared = NotificationManager()
    private init() {}

    // MARK: - Haptic Feedback Manager
    class Haptic {
        static let shared = Haptic()
        private init() {}

        func trigger(_ style: UIImpactFeedbackGenerator.FeedbackStyle) {
            let generator = UIImpactFeedbackGenerator(style: style)
            generator.prepare()
            generator.impactOccurred()
        }

        func notification(_ type: UINotificationFeedbackGenerator.FeedbackType) {
            let generator = UINotificationFeedbackGenerator()
            generator.prepare()
            generator.notificationOccurred(type)
        }

        func selection() {
            let generator = UISelectionFeedbackGenerator()
            generator.prepare()
            generator.selectionChanged()
        }
    }

    func requestAuthorization() {
        UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .sound, .badge]) {
            granted, error in
            if let error = error {
                print("❌ Notification permission error: \(error)")
            } else {
                print("✅ Notification permission granted: \(granted)")
                if granted {
                    self.registerForRemoteNotifications()
                }
            }
        }
    }

    func registerForRemoteNotifications() {
        DispatchQueue.main.async {
            UIApplication.shared.registerForRemoteNotifications()
        }
    }

    func checkSettings(completion: @escaping (Bool) -> Void) {
        UNUserNotificationCenter.current().getNotificationSettings { settings in
            completion(settings.authorizationStatus == .authorized)
        }
    }

    func scheduleNotification(title: String, body: String, timeInterval: TimeInterval = 0.1) {
        let content = UNMutableNotificationContent()
        content.title = title
        content.body = body
        content.sound = .defaultCritical  // More professional "prompt" sound

        let trigger = UNTimeIntervalNotificationTrigger(timeInterval: timeInterval, repeats: false)
        let request = UNNotificationRequest(
            identifier: UUID().uuidString, content: content, trigger: trigger)

        UNUserNotificationCenter.current().add(request) { error in
            if let error = error {
                print("Error scheduling notification: \(error)")
            }
        }
    }

    // MARK: - Special Notifications
    func sendWelcomeNotification() {
        scheduleNotification(
            title: "زانا ئەی ئای (Zana AI) ✨",
            body: "سڵاو! ئامادەم بۆ یارمەتیدانت. دەتوانین پێکەوە گفتوگۆ بکەین! 🤖",
            timeInterval: 2
        )
    }

    func sendFinishPrompt(about topic: String = "ئەم گفتوگۆیە") {
        scheduleNotification(
            title: "پوختەی گفتوگۆ 📝",
            body: "ئەم گفتوگۆیە کۆتایی هات. دەتەوێت پوختەیەکی بۆ بنووسیت یان ناوی بنێیت؟",
            timeInterval: 0.1
        )
    }

    func sendAIResponseReady() {
        scheduleNotification(
            title: "زانا (Zana) ✨",
            body: "وەڵامەکەی پێویستت ئامادەیە! 🤖",
            timeInterval: 0.1
        )
        // Only trigger haptic if called from background logic or as a professional chime
        Haptic.shared.notification(.success)
    }

    func sendSessionSummaryNotification(messageCount: Int) {
        scheduleNotification(
            title: "دەستکەوتی نوێ! 🏆",
            body: "تۆ \(messageCount) نامەت ئاڵوگۆڕ کردووە. بەردەوام بە لە فێربوون!",
            timeInterval: 1
        )
    }

    // MARK: - Ntfy Integration
    func sendNtfyNotification(topic: String, message: String, title: String) {
        guard let url = URL(string: "https://ntfy.sh/\(topic)") else { return }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.httpBody = message.data(using: .utf8)

        // Add custom headers for Title and Priority
        request.addValue(title, forHTTPHeaderField: "Title")
        request.addValue("high", forHTTPHeaderField: "Priority")
        request.addValue("warning,computer", forHTTPHeaderField: "Tags")

        let task = URLSession.shared.dataTask(with: request) { data, response, error in
            if let error = error {
                print("Error sending ntfy notification: \(error)")
                return
            }
            print("Ntfy Notification sent successfully to topic: \(topic)!")
        }
        task.resume()
    }
}

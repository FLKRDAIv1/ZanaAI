import Foundation

enum ChatMode: String, CaseIterable, Codable {
    case standard = "Standard"
    case fast = "Fast"
    case deep = "Deep"
    case research = "Research"
    case maps = "Maps"

    var icon: String {
        switch self {
        case .standard: return "sparkles"
        case .fast: return "bolt.fill"
        case .deep: return "brain.head.profile"
        case .research: return "globe"
        case .maps: return "map"
        }
    }

    var description: String {
        switch self {
        case .standard: return "Balanced & Helpful"
        case .fast: return "Quick Responses"
        case .deep: return "Complex Reasoning"
        case .research: return "Web Search"
        case .maps: return "Location Info"
        }
    }

    var modelName: String {
        switch self {
        case .fast: return "gemini-flash-lite-latest"
        case .deep: return "gemini-3-pro-preview"
        case .research: return "gemini-3-pro-preview"
        case .maps: return "gemini-2.5-flash"
        default: return "gemini-3-flash-preview"
        }
    }
}

enum AppTheme: String, CaseIterable, Codable {
    case liquid = "Liquid Glass"
    case white = "Pure White"
    case black = "Amoled Black"

    var icon: String {
        switch self {
        case .liquid: return "drop.fill"
        case .white: return "square.fill"
        case .black: return "square.fill"
        }
    }
}

struct Attachment: Identifiable, Equatable, Codable {
    var id = UUID()
    let data: Data
    let mimeType: String
    let fileName: String
}

struct Source: Identifiable, Equatable, Codable {
    var id = UUID()
    let uri: String
    let title: String
}

struct Message: Identifiable, Equatable, Codable {
    var id = UUID()
    var content: String
    let isUser: Bool
    let timestamp: Date
    var attachments: [Attachment]?
    var sources: [Source]?
    var mode: ChatMode?
    var isLoading: Bool = false
}

struct ChatSession: Identifiable, Codable {
    var id = UUID()
    var title: String
    var messages: [Message]
    var updatedAt: Date
}

struct GraphData: Codable {
    let title: String?
    let equation: String?
    let domain: [Double]?
    let range: [Double]?
    let points: [Point]?

    struct Point: Codable, Identifiable {
        var id: UUID { UUID() }
        let x: Double
        let y: Double
        let label: String?
    }
}

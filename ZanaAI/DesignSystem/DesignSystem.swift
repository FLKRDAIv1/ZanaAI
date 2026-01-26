import SwiftUI

struct DesignSystem {
    struct Colors {
        static let background = Color(hex: "050510")
        static let surface = Color(hex: "0F0F1A")

        static let neonBlue = Color(hex: "00F0FF")
        static let neonPurple = Color(hex: "BD00FF")
        static let neonPink = Color(hex: "FF0099")
        static let neonGreen = Color(hex: "00FF94")
        static let neonOrange = Color(hex: "FF6600")

        static let glassBorder = Color.white.opacity(0.3)
        static let glassFill = Material.ultraThin
    }

    struct Gradients {
        static let userBubble = LinearGradient(
            gradient: Gradient(colors: [
                Color(hex: "2E86DE"),
                Color(hex: "A366FF"),
            ]),
            startPoint: .topLeading,
            endPoint: .bottomTrailing
        )

        static let aiBubble = LinearGradient(
            gradient: Gradient(colors: [
                Color(white: 0.1),
                Color(white: 0.05),
            ]),
            startPoint: .topLeading,
            endPoint: .bottomTrailing
        )

        static let premiumAiBubble = LinearGradient(
            gradient: Gradient(colors: [
                Color(hex: "1e3a8a"),  // Deep Blue
                Color(hex: "3b82f6"),  // Bright Blue
                Color(hex: "a855f7"),  // Purple
            ]),
            startPoint: .leading,
            endPoint: .trailing
        )

        static let glowingBorder = AngularGradient(
            gradient: Gradient(colors: [.purple, .pink, .orange, .green, .cyan, .purple]),
            center: .center
        )

        static let aurora = LinearGradient(
            gradient: Gradient(colors: [
                Color(hex: "050510"),
                Color(hex: "1A1A2E"),
                Color(hex: "050510"),
            ]),
            startPoint: .top,
            endPoint: .bottom
        )
    }
}

// MARK: - Liquid Background
struct LiquidAnimation: View {
    @State private var move = false
    var intensity: Double = 1.0
    var speed: Double = 1.0

    var body: some View {
        ZStack {
            Color(hex: "050510").ignoresSafeArea()

            // Dynamic Orbs
            Group {
                OrbView(
                    color: DesignSystem.Colors.neonPurple, width: 400, blur: 80, move: move,
                    speed: 1.2 * speed, offsetRange: 150)
                OrbView(
                    color: DesignSystem.Colors.neonBlue, width: 450, blur: 90, move: move,
                    speed: 1.0 * speed, offsetRange: 200)
                OrbView(
                    color: DesignSystem.Colors.neonPink, width: 350, blur: 70, move: move,
                    speed: 1.5 * speed, offsetRange: 120)
                OrbView(
                    color: DesignSystem.Colors.neonOrange, width: 300, blur: 60, move: move,
                    speed: 0.8 * speed, offsetRange: 180)
                OrbView(
                    color: DesignSystem.Colors.neonGreen, width: 380, blur: 85, move: move,
                    speed: 1.1 * speed, offsetRange: 160)
            }
            .opacity(0.3 * intensity)

            // Frosted Glass Overlay
            Rectangle()
                .fill(.ultraThinMaterial)
                .opacity(0.4)
                .ignoresSafeArea()
        }
        .onAppear {
            withAnimation(.easeInOut(duration: 1).repeatForever(autoreverses: true)) {
                move.toggle()
            }
        }
    }
}

struct OrbView: View {
    let color: Color
    let width: CGFloat
    let blur: CGFloat
    let move: Bool
    let speed: Double
    let offsetRange: CGFloat

    @State private var innerMove = false

    var body: some View {
        Circle()
            .fill(color)
            .frame(width: width, height: width)
            .blur(radius: blur)
            .offset(
                x: innerMove ? -offsetRange : offsetRange,
                y: innerMove ? offsetRange : -offsetRange
            )
            .onAppear {
                withAnimation(.easeInOut(duration: 10 / speed).repeatForever(autoreverses: true)) {
                    innerMove.toggle()
                }
            }
    }
}

// MARK: - Modifiers
struct GlassModifier: ViewModifier {
    var cornerRadius: CGFloat
    var intensity: Double = 1.0

    func body(content: Content) -> some View {
        content
            .background(.ultraThinMaterial)
            .cornerRadius(cornerRadius)
            .overlay(
                RoundedRectangle(cornerRadius: cornerRadius)
                    .stroke(
                        LinearGradient(
                            colors: [.white.opacity(0.4 * intensity), .white.opacity(0.05)],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        ),
                        lineWidth: 1
                    )
            )
            .shadow(color: Color.black.opacity(0.3), radius: 15, x: 0, y: 10)
    }
}

struct GlowBorderModifier: ViewModifier {
    var color: Color
    var lineWidth: CGFloat

    func body(content: Content) -> some View {
        content
            .overlay(
                RoundedRectangle(cornerRadius: 20)
                    .stroke(color, lineWidth: lineWidth)
                    .shadow(color: color.opacity(0.8), radius: 8)
            )
    }
}

extension View {
    func glass(cornerRadius: CGFloat = 20) -> some View {
        self.modifier(GlassModifier(cornerRadius: cornerRadius))
    }

    func glow(color: Color = .white, lineWidth: CGFloat = 1) -> some View {
        self.modifier(GlowBorderModifier(color: color, lineWidth: lineWidth))
    }

    func blink() -> some View {
        self.modifier(BlinkModifier())
    }
}

struct BlinkModifier: ViewModifier {
    @State private var opacity = 1.0
    func body(content: Content) -> some View {
        content.opacity(opacity).onAppear {
            withAnimation(.easeInOut(duration: 1).repeatForever()) { opacity = 0.3 }
        }
    }
}

// MARK: - Elite Typography
extension Font {
    static func ibmPlexArabic(
        size: CGFloat, weight: Font.Weight = .regular, relativeTo: Font.TextStyle = .body
    ) -> Font {
        // Fallback to system font if IBM Plex is not installed
        return Font.custom("IBMPlexSansArabic", size: size, relativeTo: relativeTo).weight(weight)
    }
}

// MARK: - Neon Thinking Animation
struct NeonThinkingLine: View {
    @State private var move = false
    var intensity: Double = 1.0

    var body: some View {
        ZStack {
            Capsule()
                .fill(DesignSystem.Colors.neonBlue.opacity(0.1))
                .frame(height: 4)

            Capsule()
                .fill(
                    LinearGradient(
                        colors: [
                            .clear, DesignSystem.Colors.neonBlue, DesignSystem.Colors.neonPurple,
                            .clear,
                        ],
                        startPoint: .leading,
                        endPoint: .trailing
                    )
                )
                .frame(width: 150, height: 4)
                .offset(x: move ? 150 : -150)
                .blur(radius: move ? 4 : 2)
                .shadow(color: DesignSystem.Colors.neonBlue.opacity(0.8 * intensity), radius: 8)
        }
        .onAppear {
            withAnimation(.linear(duration: 1.5).repeatForever(autoreverses: false)) {
                move.toggle()
            }
        }
    }
}

extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let a: UInt64
        let r: UInt64
        let g: UInt64
        let b: UInt64
        switch hex.count {
        case 3: (a, r, g, b) = (255, (int >> 8) * 17, (int >> 4 & 0xF) * 17, (int & 0xF) * 17)
        case 6: (a, r, g, b) = (255, int >> 16, int >> 8 & 0xFF, int & 0xFF)
        case 8: (a, r, g, b) = (int >> 24, int >> 16 & 0xFF, int >> 8 & 0xFF, int & 0xFF)
        default: (a, r, g, b) = (1, 1, 1, 0)
        }
        self.init(
            .sRGB, red: Double(r) / 255, green: Double(g) / 255, blue: Double(b) / 255,
            opacity: Double(a) / 255)
    }
}

// MARK: - AI Response RGB Animation
struct NeonRGBGradientModifier: ViewModifier {
    @State private var rotation: Double = 0.0
    var isAnimating: Bool

    func body(content: Content) -> some View {
        content
            .overlay(
                RoundedRectangle(cornerRadius: 30)
                    .stroke(
                        AngularGradient(
                            colors: [.red, .orange, .yellow, .green, .blue, .purple, .red],
                            center: .center,
                            angle: .degrees(rotation)
                        ),
                        lineWidth: isAnimating ? 4.0 : 0  // Increased from 2.5
                    )
                    .blur(radius: isAnimating ? 6 : 0)  // Increased from 3
                    .opacity(isAnimating ? 1.0 : 0)  // Increased from 0.8
            )
            .shadow(color: .white.opacity(isAnimating ? 0.3 : 0), radius: 10)  // New extra glow layer
            .onAppear {
                if isAnimating {
                    withAnimation(.linear(duration: 2.0).repeatForever(autoreverses: false)) {  // 4.0 -> 2.0 (Faster)
                        rotation = 360
                    }
                }
            }
            .onChange(of: isAnimating) { _, newValue in
                if newValue {
                    withAnimation(.linear(duration: 2.0).repeatForever(autoreverses: false)) {  // 4.0 -> 2.0 (Faster)
                        rotation = 360
                    }
                } else {
                    rotation = 0
                }
            }
    }
}

// MARK: - Liquid Glow Implementation
struct LiquidGlowModifier: ViewModifier {
    var color: Color = DesignSystem.Colors.neonBlue
    var intensity: Double = 1.0
    @State private var pulse = 0.0

    func body(content: Content) -> some View {
        content
            .overlay(
                RoundedRectangle(cornerRadius: 30)  // Match input bar corner radius
                    .stroke(
                        LinearGradient(
                            colors: [
                                color.opacity(1.0 * intensity),  // Increased from 0.8
                                DesignSystem.Colors.neonPurple.opacity(0.8 * intensity),  // Increased from 0.6
                                color.opacity(1.0 * intensity),
                            ],
                            startPoint: .leading,
                            endPoint: .trailing
                        ),
                        lineWidth: 2.5  // Increased from 1.5
                    )
                    .blur(radius: 4 + pulse * 4)  // Increased from 2 + 2
                    .opacity(0.5 + pulse * 0.5)  // Increased from 0.3 + 0.4
            )
            .shadow(color: color.opacity(0.5 * intensity), radius: 10 + pulse * 6)  // Increased from 6 + 4
            .onAppear {
                withAnimation(.easeInOut(duration: 1.2).repeatForever(autoreverses: true)) {  // 2.0 -> 1.2 (Slightly faster pulse)
                    pulse = 1.0
                }
            }
    }
}

// MARK: - Liquid Glass Implementation
struct LiquidGlassModifier: ViewModifier {
    var cornerRadius: CGFloat
    var padding: CGFloat
    var showGlow: Bool = true
    var showBackground: Bool = true
    @Environment(\.colorScheme) var colorScheme

    func body(content: Content) -> some View {
        content
            .padding(padding)
            .background(
                ZStack {
                    if showBackground {
                        // Refraction Layer
                        RoundedRectangle(cornerRadius: cornerRadius)
                            .fill(.ultraThinMaterial)

                        // Glass Surface
                        RoundedRectangle(cornerRadius: cornerRadius)
                            .fill(Color.white.opacity(colorScheme == .dark ? 0.05 : 0.3))  // Lighter for transparency
                    }

                    // Reflection / Border
                    RoundedRectangle(cornerRadius: cornerRadius)
                        .stroke(
                            LinearGradient(
                                colors: showGlow
                                    ? [
                                        .white.opacity(0.6),
                                        DesignSystem.Colors.neonBlue.opacity(0.3),
                                        DesignSystem.Colors.neonPurple.opacity(0.3),
                                        .white.opacity(0.2),
                                    ] : [.gray.opacity(0.1)],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            ),
                            lineWidth: showGlow ? 1.0 : 0.5
                        )
                }
            )
            .shadow(
                color: showGlow
                    ? (colorScheme == .dark
                        ? DesignSystem.Colors.neonBlue.opacity(0.1)
                        : Color.indigo.opacity(0.05)) : Color.black.opacity(0.02),
                radius: showGlow ? 10 : 4, x: 0, y: showGlow ? 6 : 2
            )
    }
}

extension View {
    func liquidGlass(
        cornerRadius: CGFloat = 20, padding: CGFloat = 16, showGlow: Bool = true,
        showBackground: Bool = true
    ) -> some View {
        modifier(
            LiquidGlassModifier(
                cornerRadius: cornerRadius, padding: padding, showGlow: showGlow,
                showBackground: showBackground))
    }

    func liquidGlow(color: Color = DesignSystem.Colors.neonBlue, intensity: Double = 1.0)
        -> some View
    {
        modifier(LiquidGlowModifier(color: color, intensity: intensity))
    }

    func neonRGBGradient(isAnimating: Bool) -> some View {
        modifier(NeonRGBGradientModifier(isAnimating: isAnimating))
    }

    func glassInputStyle() -> some View {
        self.textFieldStyle(.plain)
            .padding()
            .liquidGlass(cornerRadius: 30, padding: 0)  // Updated for 2.0 aesthetics
    }
}

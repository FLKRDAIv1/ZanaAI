import SwiftUI

struct AuthView: View {
    let onComplete: () -> Void
    @State private var rotate = false
    @State private var pulsate = false

    var body: some View {
        ZStack {
            Color.black.ignoresSafeArea()

            // Background Liquid
            LiquidAnimation().opacity(0.6)

            // Rotating Glow Border
            ZStack {
                RoundedRectangle(cornerRadius: 50)
                    .fill(DesignSystem.Gradients.glowingBorder)
                    .frame(width: 360, height: 760)
                    .rotationEffect(.degrees(rotate ? 360 : 0))
                    .blur(radius: 20)
                    .opacity(0.8)
                    .onAppear {
                        withAnimation(.linear(duration: 8).repeatForever(autoreverses: false)) {
                            rotate = true
                        }
                    }

                // Glass Phone Body
                RoundedRectangle(cornerRadius: 48)
                    .fill(.ultraThinMaterial)  // Glass effect
                    .frame(width: 350, height: 750)
                    .shadow(color: .black.opacity(0.8), radius: 10)
                    .overlay(
                        VStack(spacing: 50) {
                            Spacer()
                            // Logo
                            ZStack {
                                Circle()
                                    .fill(
                                        LinearGradient(
                                            colors: [
                                                DesignSystem.Colors.neonBlue,
                                                DesignSystem.Colors.neonPurple,
                                            ], startPoint: .topLeading, endPoint: .bottomTrailing)
                                    )
                                    .frame(width: 140, height: 140)
                                    .blur(radius: 20)  // Glow behind

                                Circle()
                                    .stroke(
                                        LinearGradient(
                                            colors: [.white, .clear], startPoint: .top,
                                            endPoint: .bottom), lineWidth: 1
                                    )
                                    .frame(width: 120, height: 120)
                                    .background(Circle().fill(.ultraThinMaterial))
                                    .shadow(radius: 10)

                                Image(systemName: "sparkles")
                                    .font(.system(size: 60))
                                    .foregroundStyle(.white)
                                    .shadow(color: .white, radius: 10)
                            }

                            VStack(spacing: 12) {
                                Text("Zana AI")
                                    .font(.ibmPlexArabic(size: 56, weight: .bold))
                                    .foregroundStyle(.white)
                                    .shadow(
                                        color: DesignSystem.Colors.neonPurple.opacity(0.8),
                                        radius: 15)

                                HStack {
                                    Circle().fill(DesignSystem.Colors.neonGreen).frame(
                                        width: 8, height: 8
                                    ).blink()
                                    Text("SYSTEM ONLINE")
                                        .font(.ibmPlexArabic(size: 10, weight: .bold))
                                        .foregroundStyle(DesignSystem.Colors.neonGreen)
                                        .tracking(4)
                                        .shadow(color: DesignSystem.Colors.neonGreen, radius: 5)
                                }
                            }

                            Spacer()

                            Button(action: onComplete) {
                                HStack {
                                    Text("دەستپێبکە")
                                    Text("Get Started").font(.ibmPlexArabic(size: 10)).opacity(0.7)
                                }
                                .font(.ibmPlexArabic(size: 17, weight: .bold))
                                .foregroundStyle(.black)
                                .frame(width: 280, height: 60)
                                .background(Color.white)
                                .cornerRadius(30)
                                .shadow(color: .white.opacity(0.5), radius: 20)  // Strong glow
                                .scaleEffect(pulsate ? 1.05 : 1.0)
                                .onAppear {
                                    withAnimation(.easeInOut(duration: 1.5).repeatForever()) {
                                        pulsate = true
                                    }
                                }
                            }
                            .padding(.bottom, 50)
                        }
                    )
            }
        }
    }
}

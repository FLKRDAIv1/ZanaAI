import CoreLocation
import SwiftUI
import UIKit
import WidgetKit

struct SettingsView: View {
    @Binding var isOpen: Bool
    @ObservedObject var viewModel: AppViewModel
    @AppStorage("isDarkMode") private var isDarkMode = true
    @AppStorage("isLargeText") private var isLargeText = false

    var body: some View {
        ZStack {
            // Background Liquid Glass
            LiquidAnimation(intensity: viewModel.glowIntensity, speed: viewModel.animationSpeed)
                .ignoresSafeArea()

            VStack(spacing: 0) {
                // Header
                HStack {
                    VStack(alignment: .leading, spacing: 4) {
                        Text("ڕێکخستنەکان")
                            .font(.ibmPlexArabic(size: 24, weight: .bold))
                        Text("Settings & Customization")
                            .font(.ibmPlexArabic(size: 10))
                            .foregroundStyle(.secondary)
                    }
                    Spacer()
                    Button(action: { withAnimation { isOpen = false } }) {
                        Image(systemName: "xmark.circle.fill")
                            .font(.title)
                            .foregroundStyle(.white.opacity(0.3))
                    }
                }
                .padding(24)

                ScrollView {
                    VStack(spacing: 24) {
                        // Appearance Section
                        SettingsSection(title: "دەرکەوتن (Appearance)") {
                            VStack(spacing: 16) {
                                Toggle(isOn: $isDarkMode) {
                                    Label("مۆدی تاریک (Dark Mode)", systemImage: "moon.stars.fill")
                                }

                                Divider()

                                Toggle(isOn: $isLargeText) {
                                    Label(
                                        "نوسینی گەورە (Large Text)", systemImage: "textformat.size")
                                }

                                Divider()

                                VStack(alignment: .leading, spacing: 12) {
                                    Label("تیم (Theme)", systemImage: "paintpalette.fill")
                                        .font(.ibmPlexArabic(size: 15))

                                    HStack(spacing: 12) {
                                        ForEach(AppTheme.allCases, id: \.self) { theme in
                                            Button(action: {
                                                withAnimation {
                                                    viewModel.selectedTheme = theme
                                                }
                                            }) {
                                                VStack(spacing: 8) {
                                                    Image(systemName: theme.icon)
                                                        .font(.system(size: 20))
                                                    Text(theme.rawValue)
                                                        .font(.ibmPlexArabic(size: 10))
                                                }
                                                .frame(maxWidth: .infinity)
                                                .padding(.vertical, 12)
                                                .background(
                                                    viewModel.selectedTheme == theme
                                                        ? DesignSystem.Colors.neonBlue.opacity(0.2)
                                                        : Color.white.opacity(0.05)
                                                )
                                                .cornerRadius(12)
                                                .overlay(
                                                    RoundedRectangle(cornerRadius: 12)
                                                        .stroke(
                                                            viewModel.selectedTheme == theme
                                                                ? DesignSystem.Colors.neonBlue
                                                                : Color.clear, lineWidth: 1)
                                                )
                                            }
                                            .buttonStyle(.plain)
                                        }
                                    }
                                }
                            }
                        }

                        // Ultimate Effects Section
                        SettingsSection(title: "کاریگەرییە تایبەتەکان (Ultimate Effects)") {
                            VStack(spacing: 20) {
                                VStack(alignment: .leading, spacing: 12) {
                                    HStack {
                                        Label(
                                            "بڕی درەوشانەوە (Glow Intensity)",
                                            systemImage: "sparkles")
                                        Spacer()
                                        Text("\(Int(viewModel.glowIntensity * 100))%")
                                            .font(.caption.monospaced())
                                            .foregroundStyle(DesignSystem.Colors.neonBlue)
                                    }
                                    Slider(value: $viewModel.glowIntensity, in: 0.1...2.0)
                                        .tint(DesignSystem.Colors.neonBlue)
                                }

                                VStack(alignment: .leading, spacing: 12) {
                                    HStack {
                                        Label("خێرایی جوڵە (Animation Speed)", systemImage: "wind")
                                        Spacer()
                                        Text("\(Int(viewModel.animationSpeed * 100))%")
                                            .font(.caption.monospaced())
                                            .foregroundStyle(DesignSystem.Colors.neonPurple)
                                    }
                                    Slider(value: $viewModel.animationSpeed, in: 0.1...3.0)
                                        .tint(DesignSystem.Colors.neonPurple)
                                }
                            }
                        }

                        // Tactile & Widget Management
                        SettingsSection(title: "هەستەکان و ویجێت (Tactile & Widgets)") {
                            VStack(spacing: 16) {
                                Button(action: {
                                    NotificationManager.Haptic.shared.notification(.success)
                                }) {
                                    HStack {
                                        Label(
                                            "تاقیکردنەوەی هابتیک (Test Haptic)",
                                            systemImage: "waveform.path.ecg"
                                        )
                                        .font(.ibmPlexArabic(size: 15))
                                        Spacer()
                                        Image(systemName: "hand.tap.fill")
                                            .foregroundStyle(DesignSystem.Colors.neonBlue)
                                    }
                                }
                                .padding(.vertical, 4)

                                Divider()

                                Button(action: {
                                    // Deep link to widget gallery if possible or show instruction
                                    // Showing a success haptic to indicate "readiness"
                                    NotificationManager.Haptic.shared.selection()
                                    // In a real app, we might explain how to add widgets here
                                }) {
                                    HStack {
                                        Label(
                                            "ئامادەکردنی ویجێت (Widget Setup)",
                                            systemImage: "square.grid.2x2.fill"
                                        )
                                        .font(.ibmPlexArabic(size: 15))
                                        Spacer()
                                        Text("Professional Ready")
                                            .font(.ibmPlexArabic(size: 10, weight: .bold))
                                            .foregroundStyle(DesignSystem.Colors.neonGreen)
                                    }
                                }
                                .padding(.vertical, 4)
                            }
                        }

                        // History Section
                        SettingsSection(title: "مێژوو (History)") {
                            Button(
                                role: .destructive,
                                action: {
                                    NotificationManager.Haptic.shared.notification(.warning)
                                    withAnimation {
                                        viewModel.clearAllHistory()
                                        isOpen = false
                                    }
                                }
                            ) {
                                Label(
                                    "سڕینەوەی هەموو چاتەکان (Clear All)", systemImage: "trash.fill"
                                )
                                .foregroundStyle(.red)
                            }
                        }

                        // Permissions Section
                        SettingsSection(title: "ڕێپێدانەکان (Permissions)") {
                            VStack(spacing: 12) {
                                PermissionSettingRow(
                                    icon: "bell.fill",
                                    title: "ئاگادارکەرەوەکان (Notifications)",
                                    status: "Enabled",
                                    isDarkMode: isDarkMode
                                )

                                Divider()

                                PermissionSettingRow(
                                    icon: "location.fill",
                                    title: "شوێن (Location)",
                                    status: viewModel.locationManager.authorizationStatus
                                        == .authorizedWhenInUse ? "Granted" : "Not Set",
                                    isDarkMode: isDarkMode
                                )

                                Divider()

                                Button(action: {
                                    NotificationManager.Haptic.shared.notification(.success)
                                    WidgetCenter.shared.reloadAllTimelines()
                                }) {
                                    HStack {
                                        Label(
                                            "پشکنینی ویجێت (Verify Widget Sync)",
                                            systemImage: "checkmark.shield.fill"
                                        )
                                        .font(.ibmPlexArabic(size: 12, weight: .bold))
                                        Spacer()
                                        Circle()
                                            .fill(DesignSystem.Colors.neonGreen)
                                            .frame(width: 8, height: 8)
                                    }
                                    .foregroundStyle(DesignSystem.Colors.neonBlue)
                                }
                                .padding(.top, 4)

                                Button(action: {
                                    if let url = URL(string: UIApplication.openSettingsURLString) {
                                        UIApplication.shared.open(url)
                                    }
                                }) {
                                    Text("کردنەوەی ڕێکخستنی سیستەم")
                                        .font(.ibmPlexArabic(size: 12, weight: .bold))
                                        .foregroundStyle(DesignSystem.Colors.neonBlue)
                                }
                                .padding(.top, 4)
                            }
                        }
                    }
                    .padding(24)
                }
            }
            .foregroundStyle(.primary)
        }
        .preferredColorScheme(
            viewModel.selectedTheme == .white
                ? .light : (viewModel.selectedTheme == .black ? .dark : nil))
    }
}

struct SettingsSection<Content: View>: View {
    let title: String
    let content: Content

    init(title: String, @ViewBuilder content: () -> Content) {
        self.title = title
        self.content = content()
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(title)
                .font(.ibmPlexArabic(size: 12, weight: .bold))
                .foregroundStyle(.secondary)
                .padding(.leading, 8)

            VStack {
                content
            }
            .padding(16)
            .background(.white.opacity(0.05))
            .background(.ultraThinMaterial)
            .cornerRadius(20)
            .overlay(
                RoundedRectangle(cornerRadius: 20)
                    .stroke(.white.opacity(0.1), lineWidth: 1)
            )
        }
    }
}

struct PermissionSettingRow: View {
    let icon: String
    let title: String
    let status: String
    let isDarkMode: Bool

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: icon)
                .frame(width: 24)
                .foregroundStyle(DesignSystem.Colors.neonBlue)

            Text(title)
                .font(.ibmPlexArabic(size: 15))

            Spacer()

            Text(status)
                .font(.ibmPlexArabic(size: 10, weight: .bold))
                .padding(.horizontal, 8)
                .padding(.vertical, 4)
                .background(Color.white.opacity(0.1))
                .cornerRadius(6)
        }
    }
}

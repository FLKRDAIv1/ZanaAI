import CoreLocation
import SwiftUI

struct PermissionView: View {
    @ObservedObject var viewModel: AppViewModel
    @State private var rotate = false

    var body: some View {
        ZStack {
            DesignSystem.Gradients.aurora.ignoresSafeArea()
            LiquidAnimation().opacity(0.3)

            VStack(spacing: 30) {
                // Header
                VStack(spacing: 12) {
                    ZStack {
                        Circle()
                            .fill(DesignSystem.Colors.neonBlue.opacity(0.2))
                            .frame(width: 80, height: 80)

                        Image(systemName: "lock.shield.fill")
                            .font(.system(size: 40))
                            .foregroundStyle(DesignSystem.Colors.neonBlue)
                    }

                    Text("ڕێپێدانەکان")
                        .font(.ibmPlexArabic(size: 28, weight: .bold))

                    Text("بۆ کارکردنی باشتر، زانا پێویستی بەم ڕێپێدانانەیە")
                        .font(.ibmPlexArabic(size: 15))
                        .foregroundStyle(.secondary)
                        .multilineTextAlignment(.center)
                        .padding(.horizontal, 40)
                }
                .padding(.top, 40)

                VStack(spacing: 20) {
                    PermissionRow(
                        icon: "bell.badge.fill",
                        title: "ئاگادارکەرەوەکان",
                        description: "بۆ ئەوەی بزانیت کەی وەڵامەکە ئامادەیە",
                        status: notificationStatus
                    )

                    PermissionRow(
                        icon: "location.fill",
                        title: "شوێن",
                        description: "بۆ زانیاری ورد دەربارەی شوێن و کەشوهەوا",
                        status: locationStatus
                    )
                }
                .padding(.horizontal)

                Spacer()

                Button(action: {
                    viewModel.requestAllPermissions()
                }) {
                    Text("هەموویان چالاک بکە")
                        .font(.ibmPlexArabic(size: 17, weight: .bold))
                        .foregroundStyle(.black)
                        .frame(maxWidth: .infinity)
                        .frame(height: 56)
                        .background(Color.white)
                        .cornerRadius(16)
                        .shadow(color: .white.opacity(0.3), radius: 10)
                }
                .padding(.horizontal, 24)

                Button(action: {
                    viewModel.completeOnboarding()
                }) {
                    Text("دواتر")
                        .font(.ibmPlexArabic(size: 15))
                        .foregroundStyle(.secondary)
                }
                .padding(.bottom, 40)
            }
        }
    }

    private var notificationStatus: String {
        // Simplified status check
        return "پێویستە"
    }

    private var locationStatus: String {
        switch viewModel.locationManager.authorizationStatus {
        case .authorizedWhenInUse, .authorizedAlways: return "چالاکە"
        case .denied, .restricted: return "ڕەتکراوە"
        default: return "پێویستە"
        }
    }
}

struct PermissionRow: View {
    let icon: String
    let title: String
    let description: String
    let status: String

    var body: some View {
        HStack(spacing: 16) {
            ZStack {
                RoundedRectangle(cornerRadius: 12)
                    .fill(Color.white.opacity(0.05))
                    .frame(width: 48, height: 48)

                Image(systemName: icon)
                    .foregroundStyle(DesignSystem.Colors.neonBlue)
            }

            VStack(alignment: .leading, spacing: 4) {
                Text(title)
                    .font(.ibmPlexArabic(size: 17, weight: .bold))
                Text(description)
                    .font(.ibmPlexArabic(size: 12))
                    .foregroundStyle(.secondary)
            }

            Spacer()

            Text(status)
                .font(.ibmPlexArabic(size: 10, weight: .bold))
                .padding(.horizontal, 8)
                .padding(.vertical, 4)
                .background(
                    status == "چالاکە" ? Color.green.opacity(0.2) : Color.white.opacity(0.1)
                )
                .cornerRadius(6)
        }
        .padding()
        .background(.ultraThinMaterial)
        .cornerRadius(16)
        .overlay(
            RoundedRectangle(cornerRadius: 16)
                .stroke(Color.white.opacity(0.1), lineWidth: 1)
        )
    }
}

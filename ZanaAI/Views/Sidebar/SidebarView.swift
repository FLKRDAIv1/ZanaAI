import SwiftUI

struct SidebarView: View {
    @ObservedObject var viewModel: AppViewModel
    @Environment(\.colorScheme) var colorScheme

    var body: some View {
        VStack(spacing: 0) {
            // Branding & New Chat Section
            VStack(alignment: .leading, spacing: 24) {
                // Branding
                HStack(spacing: 12) {
                    Image("AppLogo")
                        .resizable()
                        .aspectRatio(contentMode: .fit)
                        .frame(width: 48, height: 48)  // Slightly larger for detail
                        .shadow(color: DesignSystem.Colors.neonBlue.opacity(0.2), radius: 8)

                    VStack(alignment: .leading, spacing: 0) {
                        Text("Zana AI")
                            .font(.ibmPlexArabic(size: 18, weight: .bold))
                        Text("Mergasore Intelligence")
                            .font(.ibmPlexArabic(size: 10, weight: .medium))
                            .foregroundStyle(.secondary)
                    }
                }
                .padding(.top, 50)

                // New Chat Button - Massive & Premium
                Button(action: {
                    viewModel.createNewSession()
                    withAnimation { viewModel.isSidebarOpen = false }
                }) {
                    HStack {
                        Image(systemName: "plus.circle.fill")
                            .font(.system(size: 20))
                            .foregroundStyle(DesignSystem.Colors.neonBlue)
                        Text("دەستپێکردنی چاتی نوێ")
                            .font(.ibmPlexArabic(size: 14, weight: .bold))
                        Spacer()
                        Image(systemName: "chevron.right")
                            .font(.caption2)
                            .foregroundStyle(.secondary)
                    }
                    .padding()
                    .background(
                        RoundedRectangle(cornerRadius: 16)
                            .fill(Color.white.opacity(colorScheme == .dark ? 0.05 : 0.8))
                    )
                    .overlay(
                        RoundedRectangle(cornerRadius: 16)
                            .stroke(DesignSystem.Colors.neonBlue.opacity(0.3), lineWidth: 1)
                    )
                }
            }
            .padding(.horizontal, 20)
            .padding(.bottom, 24)

            // History List
            VStack(alignment: .leading, spacing: 12) {
                HStack {
                    Text("مێژووی چاتەکان (History)")
                        .font(.ibmPlexArabic(size: 12, weight: .bold))
                        .foregroundStyle(.secondary)
                    Spacer()
                }
                .padding(.horizontal, 24)

                ScrollView {
                    LazyVStack(spacing: 6) {
                        ForEach(viewModel.sessions) { session in
                            SessionItemView(
                                session: session,
                                isSelected: viewModel.currentSessionId == session.id,
                                action: {
                                    viewModel.currentSessionId = session.id
                                    withAnimation { viewModel.isSidebarOpen = false }
                                },
                                onDelete: {
                                    viewModel.deleteSession(id: session.id)
                                }
                            )
                        }
                    }
                    .padding(.horizontal, 12)
                }
            }

            Spacer()

            // Bottom Profile / Settings
            VStack(spacing: 0) {
                Divider().background(Color.gray.opacity(0.2))

                Button(action: { viewModel.isSettingsOpen = true }) {
                    HStack(spacing: 16) {
                        // Profile Avatar with Status
                        ZStack(alignment: .bottomTrailing) {
                            Image(systemName: "person.crop.circle.fill")
                                .resizable()
                                .frame(width: 44, height: 44)
                                .foregroundStyle(
                                    LinearGradient(
                                        colors: [.gray.opacity(0.5), .gray.opacity(0.2)],
                                        startPoint: .top, endPoint: .bottom)
                                )

                            Circle()
                                .fill(DesignSystem.Colors.neonGreen)
                                .frame(width: 12, height: 12)
                                .overlay(Circle().stroke(Color.black, lineWidth: 2))
                        }

                        VStack(alignment: .leading, spacing: 2) {
                            Text("بەکارهێنەر (User)")
                                .font(.ibmPlexArabic(size: 15, weight: .bold))
                                .foregroundStyle(.primary)

                            HStack(spacing: 4) {
                                Text("PRO")
                                    .font(.system(size: 8, weight: .black))
                                    .padding(.horizontal, 4)
                                    .padding(.vertical, 2)
                                    .background(DesignSystem.Colors.neonBlue)
                                    .cornerRadius(4)
                                    .foregroundStyle(.black)

                                Text("Active Plan")
                                    .font(.ibmPlexArabic(size: 10))
                                    .foregroundStyle(.secondary)
                            }
                        }

                        Spacer()

                        Image(systemName: "gearshape.fill")
                            .font(.system(size: 20))
                            .foregroundStyle(.secondary)
                    }
                    .padding(.vertical, 20)
                    .padding(.horizontal, 24)
                    .background(Color.black.opacity(0.001))  // For hit testing
                }
            }
            .background(.ultraThinMaterial.opacity(0.5))
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(
            ZStack {
                if viewModel.selectedTheme == .white {
                    Color.white
                } else if viewModel.selectedTheme == .black {
                    Color.black
                } else {
                    DesignSystem.Colors.surface
                }

                Rectangle()
                    .fill(.ultraThinMaterial)
            }
        )
        .edgesIgnoringSafeArea(.all)
    }
}

struct SessionItemView: View {
    let session: ChatSession
    let isSelected: Bool
    let action: () -> Void
    let onDelete: () -> Void

    @Environment(\.colorScheme) var colorScheme

    var body: some View {
        Button(action: action) {
            HStack(spacing: 12) {
                // Indicator
                Rectangle()
                    .fill(isSelected ? DesignSystem.Colors.neonBlue : Color.clear)
                    .frame(width: 4, height: 24)
                    .cornerRadius(2)

                Image(systemName: "message.fill")
                    .font(.system(size: 14))
                    .foregroundStyle(isSelected ? DesignSystem.Colors.neonBlue : .secondary)

                VStack(alignment: .leading, spacing: 2) {
                    Text(session.title)
                        .font(.ibmPlexArabic(size: 14, weight: isSelected ? .bold : .medium))
                        .foregroundStyle(isSelected ? Color.primary : Color.primary.opacity(0.8))
                        .lineLimit(1)

                    Text("Last message active")  // Could be actual timestamp
                        .font(.ibmPlexArabic(size: 10))
                        .foregroundStyle(.secondary)
                }

                Spacer()
            }
            .padding(.vertical, 12)
            .padding(.trailing, 16)
            .background(
                RoundedRectangle(cornerRadius: 12)
                    .fill(
                        isSelected
                            ? (colorScheme == .dark
                                ? Color.white.opacity(0.08) : Color.black.opacity(0.05))
                            : Color.clear)
            )
            .overlay(
                RoundedRectangle(cornerRadius: 12)
                    .stroke(
                        isSelected ? DesignSystem.Colors.neonBlue.opacity(0.3) : Color.clear,
                        lineWidth: 0.5)
            )
        }
        .buttonStyle(.plain)
        .contextMenu {
            Button(role: .destructive, action: onDelete) {
                Label("Delete Chat", systemImage: "trash")
            }
        }
    }
}

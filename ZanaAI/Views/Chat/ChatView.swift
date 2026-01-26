import Charts
import PhotosUI
import SwiftUI
import UIKit
import WebKit

struct ChatView: View {
    @ObservedObject var viewModel: AppViewModel

    var body: some View {
        ZStack {
            // Theme Backgrounds
            Group {
                switch viewModel.selectedTheme {
                case .liquid:
                    LiquidAnimation(
                        intensity: viewModel.glowIntensity, speed: viewModel.animationSpeed)
                case .white:
                    Color.white
                case .black:
                    Color.black
                }
            }
            .ignoresSafeArea()

            VStack(spacing: 0) {
                // Offline Banner
                if viewModel.isOffline {
                    HStack {
                        Image(systemName: "wifi.slash")
                        Text("You are offline. Some features may not work.")
                    }
                    .font(.caption.bold())
                    .foregroundStyle(.white)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 8)
                    .background(Color.red.opacity(0.9))
                }

                // Elite Professional Header
                HStack(spacing: 0) {
                    Button(action: {
                        UIImpactFeedbackGenerator(style: .light).impactOccurred()
                        withAnimation(.spring(response: 0.4, dampingFraction: 0.8)) {
                            viewModel.isSidebarOpen = true
                        }
                    }) {
                        Image(systemName: "line.3.horizontal")
                            .font(.system(size: 20, weight: .semibold))
                            .foregroundStyle(viewModel.selectedTheme == .white ? .black : .primary)
                            .padding(10)
                            .background(.ultraThinMaterial)
                            .clipShape(Circle())
                    }

                    Spacer()

                    Menu {
                        Button(
                            role: .destructive,
                            action: {
                                viewModel.endCurrentSession()
                            }
                        ) {
                            Label("End Chat", systemImage: "stop.circle")
                        }
                    } label: {
                        VStack(spacing: 2) {
                            HStack(spacing: 6) {
                                Text(
                                    viewModel.sessions.first(where: {
                                        $0.id == viewModel.currentSessionId
                                    })?.title ?? "Zana AI"
                                )
                                .font(.ibmPlexArabic(size: 17, weight: .bold))
                                .foregroundStyle(
                                    viewModel.selectedTheme == .white ? .black : .primary)

                                Image(systemName: "chevron.down")
                                    .font(.system(size: 10, weight: .bold))
                                    .foregroundStyle(
                                        viewModel.selectedTheme == .white
                                            ? .black.opacity(0.6) : .secondary)
                            }

                            Text("Elite Intelligence")
                                .font(.system(size: 10, weight: .medium))
                                .foregroundStyle(
                                    viewModel.selectedTheme == .white
                                        ? .black.opacity(0.5) : .secondary.opacity(0.8)
                                )
                                .textCase(.uppercase)
                                .tracking(1)
                        }
                        .padding(.vertical, 8)
                        .padding(.horizontal, 16)
                        .background(.ultraThinMaterial)
                        .cornerRadius(20)
                    }

                    Spacer()

                    Button(action: {
                        UIImpactFeedbackGenerator(style: .light).impactOccurred()
                        viewModel.createNewSession()
                    }) {
                        Image(systemName: "square.and.pencil")
                            .font(.system(size: 18, weight: .semibold))
                            .foregroundStyle(viewModel.selectedTheme == .white ? .black : .primary)
                            .padding(10)
                            .background(.ultraThinMaterial)
                            .clipShape(Circle())
                    }
                }
                .padding(.horizontal, 20)
                .padding(.vertical, 10)

                // Messages List or Empty State
                ZStack {
                    if viewModel.currentMessages.isEmpty {
                        EmptyStateView(viewModel: viewModel)
                    } else {
                        ScrollViewReader { proxy in
                            ScrollView {
                                LazyVStack(spacing: 16) {
                                    ForEach(viewModel.currentMessages) { msg in
                                        MessageView(
                                            message: msg,
                                            isLastMessage: msg == viewModel.currentMessages.last,
                                            appViewModel: viewModel
                                        )
                                        .id(msg.id)
                                    }
                                    if viewModel.isLoading
                                        && viewModel.currentMessages.last?.isUser == true
                                    {
                                        HStack {
                                            Spacer()
                                            ProgressView().tint(.white)
                                            Spacer()
                                        }
                                        .padding()
                                    }
                                    Color.clear.frame(height: 60).id("bottom")
                                }
                                .padding()
                            }
                            .onChange(of: viewModel.currentMessages.count) { _ in
                                withAnimation { proxy.scrollTo("bottom", anchor: .bottom) }
                            }
                            .onChange(of: viewModel.currentMessages.last?.content) { _ in
                                proxy.scrollTo("bottom", anchor: .bottom)
                            }
                        }
                    }
                }

                // Modular Input Bar
                InputBarView(viewModel: viewModel)
            }
            .offset(x: viewModel.isSidebarOpen ? 280 : 0)
            .scaleEffect(viewModel.isSidebarOpen ? 0.95 : 1.0)
            .opacity(viewModel.isSidebarOpen ? 0.7 : 1.0)
            .disabled(viewModel.isSidebarOpen)
            .onTapGesture {
                if viewModel.isSidebarOpen {
                    withAnimation(.spring(response: 0.4, dampingFraction: 0.8)) {
                        viewModel.isSidebarOpen = false
                    }
                }
            }

            // Sidebar Overlay
            if viewModel.isSidebarOpen {
                HStack(spacing: 0) {
                    SidebarView(viewModel: viewModel)
                        .frame(width: 280)
                        .transition(.move(edge: .leading))
                    Spacer()
                }
                .zIndex(20)
            }

            if viewModel.isSettingsOpen {
                SettingsView(isOpen: $viewModel.isSettingsOpen, viewModel: viewModel)
                    .zIndex(30)
            }
        }
        .preferredColorScheme(
            viewModel.selectedTheme == .white
                ? .light : (viewModel.selectedTheme == .black ? .dark : nil)
        )
        .sheet(item: $viewModel.shareURL) { url in
            ShareSheet(activityItems: [url])
        }
    }
}

// MARK: - Graph View
// GraphView is defined in GraphView.swift

// MARK: - Video Embed View
struct VideoEmbedView: View {
    let url: URL

    var body: some View {
        WebView(url: url)
            .aspectRatio(16 / 9, contentMode: .fit)
            .cornerRadius(12)
            .overlay(
                RoundedRectangle(cornerRadius: 12).stroke(Color.white.opacity(0.2), lineWidth: 1))
    }
}

// MARK: - WebView Helper
struct WebView: UIViewRepresentable {
    let url: URL

    func makeUIView(context: Context) -> WKWebView {
        let webView = WKWebView()
        webView.scrollView.isScrollEnabled = false
        webView.backgroundColor = .clear
        webView.isOpaque = false
        return webView
    }

    func updateUIView(_ uiView: WKWebView, context: Context) {
        let request = URLRequest(url: url)
        uiView.load(request)
    }
}

struct ShareSheet: UIViewControllerRepresentable {
    var activityItems: [Any]
    var applicationActivities: [UIActivity]? = nil

    func makeUIViewController(context: Context) -> UIActivityViewController {
        let controller = UIActivityViewController(
            activityItems: activityItems, applicationActivities: applicationActivities)
        return controller
    }

    func updateUIViewController(_ uiViewController: UIActivityViewController, context: Context) {}
}

extension URL: Identifiable {
    public var id: String { absoluteString }
}

struct EmptyStateView: View {
    @ObservedObject var viewModel: AppViewModel

    let suggestions = [
        ("خشتەی گەشتێک بۆ سلێمانی 🗺️", "Plan a trip to Sulaymaniyah", "map"),
        ("چۆنێتی دروستکردنی دۆڵمە 🍲", "How to make Dolma", "fork.knife"),
        ("کورتەیەک دەربارەی زیرەکی دەستکرد 🤖", "Summary of AI", "brain"),
        ("نامەی داواکاری کار بنووسە 📧", "Write a job application email", "envelope"),
    ]

    var body: some View {
        VStack(spacing: 24) {
            Spacer()

            VStack(spacing: 16) {
                Image("AppLogo")
                    .resizable()
                    .aspectRatio(contentMode: .fit)
                    .frame(width: 100, height: 100)
                    .clipShape(Circle())
                    .shadow(color: DesignSystem.Colors.neonBlue.opacity(0.4), radius: 10)

                Text("Zana AI ✨")
                    .font(.ibmPlexArabic(size: 34, weight: .heavy))
                    .foregroundStyle(.primary)

                Text("یاریدەدەری زیرەکی تۆ. پرسیار بکە، فێرببە، و داهێنان بکە 😊.")
                    .font(.ibmPlexArabic(size: 16))
                    .multilineTextAlignment(.center)
                    .foregroundStyle(.primary.opacity(0.8))
                    .padding(.horizontal)
            }

            LazyVGrid(columns: [GridItem(.adaptive(minimum: 300))], spacing: 12) {
                ForEach(suggestions, id: \.0) { item in
                    Button(action: { viewModel.sendMessage(text: item.0) }) {
                        HStack {
                            Image(systemName: item.2)
                                .font(.title2)
                                .foregroundStyle(.blue)
                            VStack(alignment: .leading) {
                                Text(item.0)
                                    .font(.ibmPlexArabic(size: 16, weight: .bold))
                                    .foregroundStyle(.black)
                                Text(item.1)
                                    .font(.ibmPlexArabic(size: 12))
                                    .foregroundStyle(.gray)
                            }
                            Spacer()
                        }
                        .padding()
                        .background(Color.white.opacity(0.9))
                        .cornerRadius(12)
                    }
                }
            }
            .padding(.horizontal)
            .frame(maxWidth: 600)

            Spacer()
        }
    }
}

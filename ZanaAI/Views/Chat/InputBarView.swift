import PhotosUI
import SwiftUI
import UIKit

struct InputBarView: View {
    @ObservedObject var viewModel: AppViewModel
    @FocusState private var isFocused: Bool
    @State private var showAttachmentMenu = false
    @State private var showModeSelector = false
    @State private var rotationAngle = 0.0

    var body: some View {
        VStack(spacing: 0) {
            // Multi-Attachment Strip
            if !viewModel.attachmentsToSend.isEmpty {
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 12) {
                        ForEach(viewModel.attachmentsToSend) { attachment in
                            ZStack(alignment: .topTrailing) {
                                if let uiImage = UIImage(data: attachment.data) {
                                    Image(uiImage: uiImage)
                                        .resizable()
                                        .scaledToFill()
                                        .frame(width: 60, height: 60)
                                        .clipShape(RoundedRectangle(cornerRadius: 12))
                                } else {
                                    RoundedRectangle(cornerRadius: 12)
                                        .fill(Color.indigo.opacity(0.1))
                                        .frame(width: 60, height: 60)
                                        .overlay(Image(systemName: "doc.fill"))
                                }

                                Button(action: {
                                    withAnimation {
                                        viewModel.attachmentsToSend.removeAll(where: {
                                            $0.id == attachment.id
                                        })
                                    }
                                }) {
                                    Image(systemName: "xmark.circle.fill")
                                        .foregroundStyle(.white, .black)
                                }
                                .offset(x: 6, y: -6)
                            }
                        }

                        // Scan / AI Caption Button
                        Button(action: { viewModel.scanAttachments() }) {
                            VStack(spacing: 4) {
                                Image(systemName: "sparkles")
                                    .font(.system(size: 14))
                                Text("Scan").font(.system(size: 10, weight: .bold))
                            }
                            .frame(width: 60, height: 60)
                            .background(Color.white.opacity(0.1))
                            .clipShape(RoundedRectangle(cornerRadius: 12))
                            .overlay(
                                RoundedRectangle(cornerRadius: 12).stroke(Color.white.opacity(0.2)))
                        }
                        .disabled(viewModel.isLoading)
                    }
                    .padding(.horizontal)
                    .padding(.bottom, 12)
                }
            }

            // Neon Thinking Line
            if viewModel.isLoading && viewModel.selectedTheme != .white {
                NeonThinkingLine(intensity: viewModel.glowIntensity)
                    .padding(.horizontal)
                    .padding(.bottom, 8)
                    .transition(.opacity)
            } else if viewModel.isLoading && viewModel.selectedTheme == .white {
                ProgressView()
                    .padding(.bottom, 8)
            }

            // Elite Liquid Glass Input Container
            VStack(spacing: 0) {
                HStack(alignment: .bottom, spacing: 14) {
                    // Attachment Button (Glass Orb)
                    Button(action: {
                        UIImpactFeedbackGenerator(style: .light).impactOccurred()
                        showAttachmentMenu.toggle()
                    }) {
                        Image(systemName: "plus")
                            .font(.system(size: 20, weight: .light))
                            .foregroundStyle(viewModel.selectedTheme == .white ? .black : .primary)
                            .frame(width: 46, height: 46)
                            .background(.ultraThinMaterial)
                            .clipShape(Circle())
                    }
                    .popover(isPresented: $showAttachmentMenu) {
                        AttachmentMenuView(viewModel: viewModel)
                            .presentationDetents([.height(200)])
                    }

                    // Text Input (Transparent)
                    TextField(
                        viewModel.isLoading
                            ? viewModel.currentLoadingPhrase : "بایەخ بە چ زانیارییەک دەدەیت؟...",
                        text: $viewModel.promptToSend, axis: .vertical
                    )
                    .font(.ibmPlexArabic(size: 16))
                    .lineLimit(1...6)
                    .padding(.vertical, 12)
                    .padding(.horizontal, 4)
                    .foregroundStyle(viewModel.selectedTheme == .white ? .black : .primary)
                    .focused($isFocused)

                    // Mode Button (Glass Orb)
                    Button(action: {
                        UIImpactFeedbackGenerator(style: .light).impactOccurred()
                        showModeSelector.toggle()
                    }) {
                        Image(systemName: viewModel.modeToSend.iconName)
                            .font(.system(size: 18))
                            .foregroundStyle(
                                viewModel.modeToSend == .standard
                                    ? (viewModel.selectedTheme == .white
                                        ? .black.opacity(0.6) : .secondary)
                                    : .white
                            )
                            .frame(width: 38, height: 38)
                            .background(
                                viewModel.modeToSend == .standard
                                    ? Circle().fill(
                                        Color.primary.opacity(
                                            viewModel.selectedTheme == .white ? 0.1 : 0.05))
                                    : Circle().fill(DesignSystem.Colors.neonBlue)
                            )
                    }
                    .confirmationDialog(
                        "Choose Mode", isPresented: $showModeSelector, titleVisibility: .visible
                    ) {
                        ForEach(ChatMode.allCases, id: \.self) { mode in
                            Button(mode.displayName) { viewModel.modeToSend = mode }
                        }
                    }

                    // Send Button (Liquid Animated Orb)
                    if !viewModel.promptToSend.trimmingCharacters(in: .whitespacesAndNewlines)
                        .isEmpty || !viewModel.attachmentsToSend.isEmpty
                    {
                        Button(action: {
                            UIImpactFeedbackGenerator(style: .medium).impactOccurred()
                            viewModel.sendMessage()
                            isFocused = false
                        }) {
                            ZStack {
                                Circle()
                                    .fill(
                                        LinearGradient(
                                            colors: [
                                                DesignSystem.Colors.neonBlue,
                                                DesignSystem.Colors.neonPurple,
                                            ],
                                            startPoint: .topLeading,
                                            endPoint: .bottomTrailing
                                        )
                                    )
                                    .rotationEffect(.degrees(rotationAngle))
                                    .animation(
                                        .linear(duration: 3).repeatForever(autoreverses: false),
                                        value: rotationAngle)

                                Image(systemName: "arrow.up")
                                    .font(.system(size: 16, weight: .bold))
                                    .foregroundStyle(.white)
                            }
                            .frame(width: 40, height: 40)
                            .clipShape(Circle())
                            .shadow(
                                color: DesignSystem.Colors.neonBlue.opacity(0.4),
                                radius: 8, x: 0, y: 0
                            )
                            .overlay(
                                Circle()
                                    .stroke(Color.white.opacity(0.2), lineWidth: 1)
                            )
                        }
                        .disabled(viewModel.isLoading)
                        .onAppear { rotationAngle = 360 }
                        .transition(.scale.combined(with: .opacity))
                    }
                }
                .padding(.horizontal, 14)
                .padding(.vertical, 4)
            }
            .liquidGlass(
                cornerRadius: 30, padding: 4,
                showGlow: viewModel.selectedTheme != .white,
                showBackground: false
            )
            .liquidGlow(
                intensity: (viewModel.selectedTheme == .white || viewModel.isLoading) ? 0 : 1.0
            )
            .neonRGBGradient(isAnimating: viewModel.isLoading)
            .padding(.horizontal, 20)
            .padding(.bottom, 12)
        }
    }
}

// Add this view for the attachment menu
struct AttachmentMenuView: View {
    @ObservedObject var viewModel: AppViewModel
    @State private var showingPicker = false

    var body: some View {
        VStack(spacing: 20) {
            Text("زیادکردنی ناوەڕۆک")
                .font(.ibmPlexArabic(size: 18, weight: .bold))
                .padding(.top)

            HStack(spacing: 30) {
                AttachmentItem(icon: "photo.on.rectangle", label: "Gallery", color: .green) {
                    showingPicker = true
                }
                AttachmentItem(icon: "camera", label: "Camera", color: .blue)
                AttachmentItem(icon: "video", label: "Video", color: .purple)
                AttachmentItem(icon: "mic", label: "Audio", color: .orange)
            }
            Spacer()
        }
        .photosPicker(
            isPresented: $showingPicker,
            selection: Binding(
                get: { nil },
                set: { item in
                    if let item = item {
                        Task {
                            if let data = try? await item.loadTransferable(type: Data.self) {
                                viewModel.addAttachment(
                                    data: data, mimeType: "image/jpeg", fileName: "image.jpg")
                            }
                        }
                    }
                }), matching: .images)
    }
}

struct AttachmentItem: View {
    let icon: String
    let label: String
    let color: Color
    var action: () -> Void = {}

    var body: some View {
        Button(action: action) {
            VStack {
                Image(systemName: icon)
                    .font(.title2)
                    .foregroundStyle(.white)
                    .frame(width: 50, height: 50)
                    .background(color)
                    .clipShape(Circle())
                Text(label).font(.caption).foregroundStyle(.primary)
            }
        }
    }
}

extension ChatMode {
    var iconName: String {
        switch self {
        case .standard: return "sparkles"
        case .fast: return "bolt.fill"
        case .deep: return "brain.head.profile"
        case .research: return "globe"
        case .maps: return "mappin.and.ellipse"
        }
    }

    var displayName: String {
        switch self {
        case .standard: return "Standard"
        case .fast: return "Fast"
        case .deep: return "Deep"
        case .research: return "Research"
        case .maps: return "Maps"
        }
    }
}

// Helper Views
struct AttachmentButton: View {
    let icon: String
    let color: Color
    let label: String
    var action: () -> Void = {}

    var body: some View {
        Button(action: action) {
            AttachmentButtonContent(icon: icon, color: color, label: label)
        }
    }
}

struct AttachmentButtonContent: View {
    let icon: String
    let color: Color
    let label: String

    var body: some View {
        VStack(spacing: 8) {
            Image(systemName: icon)
                .font(.system(size: 20))
                .foregroundStyle(.white)
                .frame(width: 50, height: 50)
                .background(
                    LinearGradient(
                        colors: [color, color.opacity(0.6)], startPoint: .topLeading,
                        endPoint: .bottomTrailing)
                )
                .clipShape(Circle())
                .shadow(color: color.opacity(0.4), radius: 6)

            Text(label)
                .font(.caption2)
                .foregroundStyle(.white.opacity(0.8))
        }
    }
}

struct ImageCropperView: View {
    let image: UIImage
    var onCrop: (UIImage) -> Void
    var onCancel: () -> Void

    @State private var scale: CGFloat = 1.0
    @State private var lastScale: CGFloat = 1.0
    @State private var offset: CGSize = .zero
    @State private var lastOffset: CGSize = .zero

    var body: some View {
        ZStack {
            Color.black.ignoresSafeArea()

            VStack {
                HStack {
                    Button(action: onCancel) {
                        Text("Cancel").foregroundStyle(.white)
                    }
                    Spacer()
                    Text("Crop Image").foregroundStyle(.white).bold()
                    Spacer()
                    Button(action: cropImage) {
                        Text("Done").foregroundStyle(.yellow).bold()
                    }
                }
                .padding()

                Spacer()

                // Crop Area
                GeometryReader { geo in
                    ZStack {
                        Image(uiImage: image)
                            .resizable()
                            .scaledToFit()
                            .scaleEffect(scale)
                            .offset(offset)
                            .gesture(
                                MagnificationGesture()
                                    .onChanged { val in
                                        let delta = val / lastScale
                                        lastScale = val
                                        scale *= delta
                                    }
                                    .onEnded { _ in
                                        lastScale = 1.0
                                        if scale < 1 { withAnimation { scale = 1 } }
                                    }
                            )
                            .simultaneousGesture(
                                DragGesture()
                                    .onChanged { val in
                                        offset = CGSize(
                                            width: lastOffset.width + val.translation.width,
                                            height: lastOffset.height + val.translation.height)
                                    }
                                    .onEnded { _ in
                                        lastOffset = offset
                                    }
                            )
                    }
                    .frame(width: geo.size.width, height: geo.size.width)  // Square crop
                    .clipped()
                    .overlay(
                        Rectangle()
                            .stroke(Color.white, lineWidth: 2)
                    )
                }
                .aspectRatio(1, contentMode: .fit)
                .padding()

                Spacer()

                Text("Pinch to Zoom, Drag to Move")
                    .font(.caption)
                    .foregroundStyle(.gray)
            }
        }
    }

    func cropImage() {
        // Simplified crop logic: Just return original for now or implement proper image graphics context crop
        // For a prototype, returning the image is safer than crashing with complex CoreGraphics
        onCrop(image)
    }
}

import SwiftUI

struct ContentView: View {
    @StateObject private var viewModel = AppViewModel()

    var body: some View {
        Group {
            if !viewModel.isAuthenticated {
                AuthView(onComplete: viewModel.completeAuth)
            } else if !viewModel.hasSeenOnboarding {
                PermissionView(viewModel: viewModel)
            } else {
                ChatView(viewModel: viewModel)
            }
        }
    }
}

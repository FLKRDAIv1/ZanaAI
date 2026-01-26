import MapKit
import SwiftUI
import UIKit

struct MapEmbedView: View {
    let title: String
    @State private var region = MKCoordinateRegion(
        center: CLLocationCoordinate2D(latitude: 36.1911, longitude: 44.0091),  // Default: Erbil
        span: MKCoordinateSpan(latitudeDelta: 0.05, longitudeDelta: 0.05)
    )

    struct Place: Identifiable {
        let id = UUID()
        let name: String
        let coordinate: CLLocationCoordinate2D
    }

    @State private var places: [Place] = []
    @State private var categoryIcon: String = "mappin.circle.fill"
    @State private var address: String = ""

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Map(coordinateRegion: $region, annotationItems: places) { place in
                MapAnnotation(coordinate: place.coordinate) {
                    VStack(spacing: 0) {
                        Image(systemName: "mappin.circle.fill")
                            .font(.title)
                            .foregroundStyle(DesignSystem.Colors.neonPink)
                            .background(Color.white)
                            .clipShape(Circle())
                            .shadow(radius: 4)

                        Text(place.name)
                            .font(.ibmPlexArabic(size: 10, weight: .bold))
                            .padding(4)
                            .background(.ultraThinMaterial)
                            .cornerRadius(8)
                            .offset(y: 4)
                    }
                }
            }
            .frame(height: 220)
            .cornerRadius(12)
            .overlay(
                RoundedRectangle(cornerRadius: 12)
                    .stroke(DesignSystem.Colors.neonBlue.opacity(0.4), lineWidth: 1.5)
            )

            HStack {
                VStack(alignment: .leading, spacing: 2) {
                    HStack(spacing: 4) {
                        Image(systemName: categoryIcon)
                            .foregroundStyle(DesignSystem.Colors.neonBlue)
                        Text(title)
                            .font(.ibmPlexArabic(size: 12, weight: .bold))
                    }

                    if !address.isEmpty {
                        Text(address)
                            .font(.ibmPlexArabic(size: 8))
                            .foregroundStyle(.secondary)
                    }
                }
                Spacer()
                Button(action: { openInMaps() }) {
                    Image(systemName: "map.fill")
                        .foregroundStyle(DesignSystem.Colors.neonBlue)
                }
            }
            .padding(.horizontal, 4)
        }
        .padding(8)
        .background(Color.white.opacity(0.05))
        .cornerRadius(16)
        .onAppear {
            searchLocation()
        }
    }

    private func searchLocation() {
        let request = MKLocalSearch.Request()
        request.naturalLanguageQuery = title
        let search = MKLocalSearch(request: request)
        search.start { response, error in
            if let mapItem = response?.mapItems.first {
                let place = Place(
                    name: mapItem.name ?? title, coordinate: mapItem.placemark.coordinate)

                // Professional Metadata
                self.address = mapItem.placemark.title ?? ""

                // Category detection
                if let category = mapItem.pointOfInterestCategory {
                    switch category {
                    case .restaurant, .cafe: categoryIcon = "fork.knife"
                    case .park: categoryIcon = "leaf.fill"
                    case .hotel: categoryIcon = "bed.double.fill"
                    case .museum: categoryIcon = "building.columns.fill"
                    default: categoryIcon = "mappin.circle.fill"
                    }
                }

                withAnimation(.spring()) {
                    self.places = [place]
                    self.region = MKCoordinateRegion(
                        center: mapItem.placemark.coordinate,
                        span: MKCoordinateSpan(latitudeDelta: 0.015, longitudeDelta: 0.015)
                    )
                }
            }
        }
    }

    private func openInMaps() {
        let baseUrl = "http://maps.apple.com/?q="
        let encodedTitle =
            title.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? ""
        if let url = URL(string: baseUrl + encodedTitle) {
            UIApplication.shared.open(url)
        }
    }
}

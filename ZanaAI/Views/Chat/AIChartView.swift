import Charts
import SwiftUI

struct AIChartView: View {
    let payload: ChartPayload
    let title: String

    // Gradients for professional look
    let linearGradient = LinearGradient(
        colors: [Color.blue.opacity(0.8), Color.purple.opacity(0.8)],
        startPoint: .leading,
        endPoint: .trailing
    )

    let areaGradient = LinearGradient(
        colors: [Color.blue.opacity(0.3), Color.blue.opacity(0.0)],
        startPoint: .top,
        endPoint: .bottom
    )

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            // Header
            HStack {
                Image(systemName: "chart.xyaxis.line")
                    .foregroundStyle(.blue)
                Text(title)
                    .font(.ibmPlexArabic(size: 17, weight: .bold))
                    .foregroundStyle(.primary)
                Spacer()
                Text("AI INSIGHT")
                    .font(.ibmPlexArabic(size: 10, weight: .bold))
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(Color.blue.opacity(0.1))
                    .foregroundStyle(.blue)
                    .clipShape(Capsule())
            }

            // Chart Logic
            if payload.points.isEmpty {
                VStack(spacing: 8) {
                    Image(systemName: "chart.xyaxis.line")
                        .font(.largeTitle)
                        .foregroundStyle(.gray.opacity(0.3))
                    Text("No Chart Data")
                        .font(.ibmPlexArabic(size: 12))
                        .foregroundStyle(.gray.opacity(0.5))
                }
                .frame(height: 220)
                .frame(maxWidth: .infinity)
                .background(Color.black.opacity(0.03))
                .cornerRadius(12)
            } else {
                Chart(payload.points) { point in
                    // Smooth Line
                    LineMark(
                        x: .value("Label", point.label),
                        y: .value("Value", point.value)
                    )
                    .interpolationMethod(payload.smooth ? .catmullRom : .linear)
                    .foregroundStyle(linearGradient)
                    .symbol(by: .value("Type", "Data"))
                    .symbolSize(8)

                    // Soft Area Fill
                    AreaMark(
                        x: .value("Label", point.label),
                        y: .value("Value", point.value)
                    )
                    .interpolationMethod(payload.smooth ? .catmullRom : .linear)
                    .foregroundStyle(areaGradient)
                }
                .chartLegend(.hidden)
                .chartXAxis {
                    AxisMarks(preset: .aligned, values: .automatic) { _ in
                        AxisGridLine()
                        AxisValueLabel()
                    }
                }
                .chartYAxis {
                    AxisMarks(position: .leading)
                }
                .frame(height: 220)
            }
        }
        .padding()
        .background(Color(uiColor: .secondarySystemBackground))
        .cornerRadius(16)
        .overlay(
            RoundedRectangle(cornerRadius: 16)
                .stroke(Color.white.opacity(0.1), lineWidth: 1)
        )
        .shadow(color: Color.black.opacity(0.05), radius: 10, x: 0, y: 5)
    }
}

struct ChartPayload: Codable {
    let chartType: String
    let smooth: Bool
    let points: [ValuePoint]
}

struct ValuePoint: Identifiable, Codable {
    let id = UUID()
    let label: String
    let value: Double

    private enum CodingKeys: String, CodingKey {
        case label, value
    }
}

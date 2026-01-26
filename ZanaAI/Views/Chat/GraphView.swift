import Charts
import SwiftUI

struct GraphView: View {
    let jsonString: String

    var data: GraphData? {
        guard let data = jsonString.data(using: .utf8) else { return nil }
        return try? JSONDecoder().decode(GraphData.self, from: data)
    }

    var body: some View {
        if let graph = data {
            VStack {
                Text(graph.title ?? "Graph").font(.headline).foregroundStyle(.white)
                Chart {
                    if let points = graph.points {
                        ForEach(points) { point in
                            LineMark(
                                x: .value("X", point.x),
                                y: .value("Y", point.y)
                            )
                            .foregroundStyle(Color.blue)
                            .symbol(by: .value("Label", point.label ?? ""))
                        }
                    }
                }
                .frame(height: 200)
                .chartXAxis {
                    AxisMarks(values: .automatic) { _ in
                        AxisGridLine()
                        AxisTick()
                        AxisValueLabel()
                    }
                }
                .chartYAxis {
                    AxisMarks(values: .automatic) { _ in
                        AxisGridLine()
                        AxisTick()
                        AxisValueLabel()
                    }
                }
                .padding()
                .background(Color.black.opacity(0.3))
                .cornerRadius(12)
            }
            .padding()
        } else {
            Text("Invalid Graph Data").font(.caption).foregroundStyle(.red)
        }
    }
}

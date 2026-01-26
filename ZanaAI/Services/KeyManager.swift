import Foundation

class KeyManager {
    static let shared = KeyManager()

    private var keys = [
        "AIzaSyC_IUsMtWPfGmPmAeH2fM0l7Wy_yrUd_MA",
        "AIzaSyDrjU6eRhxPzCcutoCtWqVOpZ0agdIdBNc",
        "AIzaSyAeuEOMjhCsK0AtU-Mz60RriVDO7za-Q9s",
        "AIzaSyAKvNu7IUx91Mdmcgxq7cyiaMcOSZFe_zw",
        "AIzaSyDD9DZU-rmf-2CRbATUyJv8Fj3fBOWiPU0",
        "AIzaSyBpQQQ-T7tNqchou6fDAhP-1z3yu1JDbdA",
        "AIzaSyBZOi2miSgT3DGxt1LbONTQZP11mXwUAQk",
        "AIzaSyBY7ENtqbEiE6oyMvqbKKm4aWjDS7UBBmc",
        "AIzaSyCrerQZX3DlfJf83L6RCUkkrGLVQga_Zvo",
        "AIzaSyABvHHESzJtK-hlyKmDP7UoU_2KgTnhMPY",
        "AIzaSyCgMHhxSehOE0sXXTW4S7uu-hXCfylbpa0",
        "AIzaSyB8DgbORDX1Tnvca2F_NFKSs6XB-s3um5A",
        "AIzaSyB9IoxD7iyhLmyfE2s-1SlwcKBMRaF2PmI",
        "AIzaSyDHN_v-tOt1iaNQZhAWH0dS85os3PEXwE4",
    ]

    private var currentIndex = Int.random(in: 0..<14)

    func getCurrentKey() -> String {
        return keys[currentIndex]
    }

    func rotate() {
        currentIndex = (currentIndex + 1) % keys.count
        print("⚠️ Key exhausted. Rotating to index: \(currentIndex)")
    }
}

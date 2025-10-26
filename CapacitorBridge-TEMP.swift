import Foundation
import WebKit

// Compatibilidad para SDK < iOS 16.4 (Xcode 14)
@available(iOS, introduced: 11.0, obsoleted: 16.4)
extension WKWebView {
    var isInspectable: Bool {
        get { false }
        set { /* no-op */ }
    }
}

// Constantes usadas en algunos paths de Capacitor
internal let MSEC_PER_SEC: Double = 1_000.0
internal let USEC_PER_SEC: Double = 1_000_000.0

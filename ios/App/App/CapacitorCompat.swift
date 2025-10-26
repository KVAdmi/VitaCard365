import Foundation
import WebKit

// Shim para WKWebView.isInspectable cuando el SDK < iOS 16.4
// Evita choque cuando el SDK ya lo trae (obsoleto >= 16.4)
@available(iOS, introduced: 11.0, obsoleted: 16.4)
extension WKWebView {
    /// No-op en SDKs sin la propiedad real
    var isInspectable: Bool {
        get { return false }
        set { /* noop */ }
    }
}

// Constantes usadas por Capacitor en algunos paths
internal let MSEC_PER_SEC: Double = 1000.0
internal let USEC_PER_SEC: Double = 1_000_000.0

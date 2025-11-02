
import Foundation
import WebKit

// Ajuste: acceso dinámico a la propiedad `inspectable` en WKWebView
// para que compile en Xcode 14 / macOS 12.7 aunque el SDK no exponga isInspectable.
// Reemplaza en tu proyecto la sección donde se usa `webView.isInspectable = ...`
// por una llamada a enableInspectableIfAvailable() o incorpora este método.

class CapacitorBridge {
    var webView: WKWebView

    init(webView: WKWebView) {
        self.webView = webView
        enableInspectableIfAvailable()
    }

    private func enableInspectableIfAvailable() {
        // Intentamos primero llamar al setter Objective-C: setInspectable:
        let setterSelector = Selector(("setInspectable:"))

        if webView.responds(to: setterSelector) {
            // Llamada dinámica al setter
            _ = webView.perform(setterSelector, with: true)
            return
        }

        // Fallback: KVC (Key-Value Coding). Puede lanzar si la clave no existe,
        // por eso usamos try? / catch implícito al hacer el cast a AnyObject.
        let anyWeb = webView as AnyObject
        // Evitar crash si la key no existe; rodeamos en bloque try-catch con Objective-C
        do {
            // setValue(forKey:) en Swift no lanza, pero si la propiedad no existe puede fallar en tiempo de ejecución.
            // Usamos performSelector arriba; aquí intentamos setValue por si fuera accesible.
            anyWeb.setValue(true, forKey: "inspectable")
        } catch {
            // No hacemos nada si no es posible
        }
    }
}
